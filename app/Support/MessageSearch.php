<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Recherche dans le texte des documents joints (OCR) + extraits contextuels.
 * Partagé par la Réception web et l'API mobile.
 */
class MessageSearch
{
    /** Taille minimale d'un mot pour l'index plein texte InnoDB (innodb_ft_min_token_size). */
    private const FT_MIN = 3;

    /** Mots de la recherche (opérateurs MySQL retirés), 8 au maximum. */
    public static function terms(string $q): array
    {
        $words = preg_split('/\s+/u', trim($q)) ?: [];
        $out = [];
        foreach ($words as $w) {
            $w = trim($w, " \t\"'+-<>()~*@,.;:!?«»");
            if ($w !== '' && ! in_array($w, $out, true)) {
                $out[] = $w;
            }
        }

        return array_slice($out, 0, 8);
    }

    /**
     * Ajoute à la requête : « la pièce jointe du message contient la recherche ».
     * Plein texte (MATCH … AGAINST, mode booléen, préfixes) ; LIKE si un mot fait moins de 3 caractères.
     */
    public static function whereDocumentMatches(EloquentBuilder|Builder $query, string $q, string $fileColumn = 'messages.fichier'): void
    {
        $terms = self::terms($q);
        if ($terms === []) {
            $query->whereRaw('1 = 0');

            return;
        }

        $query->whereExists(function (Builder $sub) use ($terms, $fileColumn) {
            $sub->selectRaw('1')
                ->from('attachment_texts')
                ->whereColumn('attachment_texts.path', $fileColumn)
                ->where('attachment_texts.ocr_status', 'completed');

            $fulltext = in_array(DB::getDriverName(), ['mysql', 'mariadb'], true)
                && collect($terms)->every(fn ($t) => mb_strlen(self::ftWord($t)) >= self::FT_MIN);

            if ($fulltext) {
                $boolean = collect($terms)->map(fn ($t) => '+'.self::ftWord($t).'*')->implode(' ');
                $sub->whereRaw('MATCH(attachment_texts.ocr_text) AGAINST (? IN BOOLEAN MODE)', [$boolean]);
            } else {
                foreach ($terms as $t) {
                    $sub->where('attachment_texts.ocr_text', 'like', '%'.addcslashes($t, '%_\\').'%');
                }
            }
        });
    }

    /** Mot compatible avec la syntaxe booléenne MySQL (lettres et chiffres uniquement). */
    private static function ftWord(string $t): string
    {
        return preg_replace('/[^\p{L}\p{N}]+/u', '', $t) ?? '';
    }

    /**
     * Extrait d'environ $length caractères centré sur le premier mot trouvé
     * (sans tenir compte des accents ni des majuscules). null si aucun mot n'est présent.
     */
    public static function snippet(?string $text, string $q, int $length = 120): ?string
    {
        if (! filled($text)) {
            return null;
        }
        $flat = trim(preg_replace('/\s+/u', ' ', $text) ?? $text);
        $chars = mb_str_split($flat);
        $folded = array_map([self::class, 'foldChar'], $chars); // même longueur que $chars
        $haystack = implode('', $folded);

        $pos = null;
        $len = 0;
        foreach (self::terms($q) as $t) {
            $needle = implode('', array_map([self::class, 'foldChar'], mb_str_split($t)));
            if ($needle === '') {
                continue;
            }
            $p = mb_strpos($haystack, $needle);
            if ($p !== false && ($pos === null || $p < $pos)) {
                $pos = $p;
                $len = mb_strlen($needle);
            }
        }
        if ($pos === null) {
            return null;
        }

        $half = max(10, intdiv($length - $len, 2));
        $start = max(0, $pos - $half);
        $end = min(count($chars), $pos + $len + $half);
        // ne pas couper un mot en deux
        while ($start > 0 && $chars[$start - 1] !== ' ' && $pos - $start < $half + 15) {
            $start--;
        }
        while ($end < count($chars) && $chars[$end] !== ' ' && $end - $pos < $len + $half + 15) {
            $end++;
        }

        return ($start > 0 ? '…' : '').trim(implode('', array_slice($chars, $start, $end - $start))).($end < count($chars) ? '…' : '');
    }

    /** Début du texte (quand le document correspond mais que le mot n'est pas localisable). */
    public static function head(?string $text, int $length = 120): ?string
    {
        if (! filled($text)) {
            return null;
        }
        $flat = trim(preg_replace('/\s+/u', ' ', $text) ?? $text);

        return mb_strlen($flat) > $length ? mb_substr($flat, 0, $length).'…' : $flat;
    }

    /** Le texte contient-il au moins un des mots (sans accents ni majuscules) ? */
    public static function contains(?string $text, string $q): bool
    {
        return self::snippet($text, $q, 20) !== null;
    }

    /** Un caractère en minuscule sans accent ni signe diacritique (arabe compris), en restant 1 caractère. */
    private static function foldChar(string $c): string
    {
        $l = mb_strtolower($c);
        if (class_exists(\Normalizer::class)) {
            $d = \Normalizer::normalize($l, \Normalizer::FORM_D);
            if ($d !== false) {
                $base = preg_replace('/\p{Mn}+/u', '', $d);
                if ($base !== null && mb_strlen($base) === 1) {
                    return $base;
                }
                if ($base === '') {
                    return $l; // signe diacritique isolé : gardé tel quel (longueur conservée)
                }
            }
        }

        return $l;
    }
}
