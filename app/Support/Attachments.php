<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

/**
 * Pièces jointes des messages (documents médicaux, scans…).
 *
 * Les NOUVEAUX fichiers sont écrits sur le disque privé `attachments`
 * (storage/app/attachments) : aucune URL directe, aucun lien public.
 * Ils ne sont distribués que par la route `attachments.show`, qui vérifie que
 * l'utilisateur fait partie des personnes concernées par le message.
 *
 * Les anciens fichiers restent lisibles tant qu'ils sont sur le disque public
 * (voir `php artisan attachments:secure` pour les déplacer).
 */
class Attachments
{
    public const DISK = 'attachments';
    public const LEGACY_DISK = 'public';

    /** Durée de validité d'un lien signé donné à l'application mobile. */
    public const SIGNED_TTL_HOURS = 6;

    /** Types de cibles : message (ligne de la table messages), legacy (table reponses), draft, chat (vocal du chat). */
    public const TYPES = ['message', 'legacy', 'draft', 'chat'];

    // ------------------------------------------------------------------ stockage

    /** Extensions jamais conservées (code exécutable côté serveur). */
    private const BLOCKED_EXTENSIONS = ['php', 'php3', 'php4', 'php5', 'php7', 'php8', 'phtml', 'phar', 'pht', 'htaccess', 'cgi', 'pl', 'asp', 'aspx', 'jsp'];

    /**
     * Enregistre un fichier envoyé (sur le disque privé) et renvoie son chemin relatif.
     *
     * Nom aléatoire, mais on garde l'EXTENSION D'ORIGINE : la détection automatique
     * de Windows reconnaît mal certains fichiers Office (.docx / .pptx devenaient « .bin »),
     * ce qui les rendait impossibles à ouvrir pour le destinataire.
     */
    public static function store(UploadedFile $file, string $dir): string
    {
        return $file->storeAs($dir, Str::random(40).'.'.self::extensionFor($file), self::DISK);
    }

    public static function extensionFor(UploadedFile $file): string
    {
        $original = strtolower((string) $file->getClientOriginalExtension());
        if (preg_match('/^[a-z0-9]{1,8}$/', $original) && ! in_array($original, self::BLOCKED_EXTENSIONS, true)) {
            return $original;
        }

        $guessed = strtolower((string) $file->guessExtension());

        return $guessed !== '' && ! in_array($guessed, self::BLOCKED_EXTENSIONS, true) ? $guessed : 'bin';
    }

    /** Disque où se trouve le fichier (privé en priorité, sinon ancien disque public), ou null. */
    public static function diskOf(?string $path): ?string
    {
        if (! filled($path)) {
            return null;
        }
        if (Storage::disk(self::DISK)->exists($path)) {
            return self::DISK;
        }
        if (Storage::disk(self::LEGACY_DISK)->exists($path)) {
            return self::LEGACY_DISK;
        }

        return null;
    }

    public static function exists(?string $path): bool
    {
        return self::diskOf($path) !== null;
    }

    /** Copie un fichier existant vers un nouveau chemin PRIVÉ (envoi d'un brouillon, transfert). */
    public static function copy(string $from, string $to): bool
    {
        $disk = self::diskOf($from);
        if ($disk === null) {
            return false;
        }
        $stream = Storage::disk($disk)->readStream($from);
        if (! is_resource($stream)) {
            return false;
        }
        $ok = Storage::disk(self::DISK)->writeStream($to, $stream);
        fclose($stream);

        return (bool) $ok;
    }

    /** Supprime le fichier, où qu'il soit. */
    public static function delete(?string $path): void
    {
        if (! filled($path)) {
            return;
        }
        foreach ([self::DISK, self::LEGACY_DISK] as $disk) {
            Storage::disk($disk)->delete($path);
        }
    }

    // ------------------------------------------------------------------ liens

    /**
     * Lien pour le site web : chemin relatif, protégé par la session de l'utilisateur connecté.
     * Le nom du fichier en fin d'adresse n'est qu'indicatif (affichage / nom de téléchargement).
     */
    public static function webUrl(string $type, int $id, ?string $path): ?string
    {
        if (! filled($path)) {
            return null;
        }

        return route('attachments.show', self::params($type, $id, $path), absolute: false);
    }

    /**
     * Lien pour l'application mobile : signé et temporaire (le navigateur du téléphone
     * n'envoie pas le jeton de connexion). Chemin relatif : valable quelle que soit
     * l'adresse IP du serveur.
     */
    public static function signedUrl(string $type, int $id, ?string $path, ?int $userId = null): ?string
    {
        if (! filled($path)) {
            return null;
        }
        $params = self::params($type, $id, $path);
        if ($userId !== null) {
            $params['u'] = $userId; // traçabilité : à qui le lien a été remis
        }

        return URL::temporarySignedRoute(
            'attachments.show',
            Carbon::now()->addHours(self::SIGNED_TTL_HOURS),
            $params,
            absolute: false,
        );
    }

    private static function params(string $type, int $id, string $path): array
    {
        return ['type' => $type, 'id' => $id, 'name' => basename($path)];
    }

    // ------------------------------------------------------------------ types de contenu

    /** Fichiers affichables dans le navigateur ; tout le reste est téléchargé. */
    public static function inlineMime(string $path): ?string
    {
        return match (strtolower(pathinfo($path, PATHINFO_EXTENSION))) {
            'pdf' => 'application/pdf',
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            // Messages vocaux du chat : lus directement par le lecteur audio
            'm4a', 'mp4', 'aac' => 'audio/mp4',
            'mp3' => 'audio/mpeg',
            'ogg', 'oga', 'opus' => 'audio/ogg',
            'webm' => 'audio/webm',
            'wav' => 'audio/wav',
            default => null, // jamais de HTML / SVG servis « en ligne » (risque de script)
        };
    }
}
