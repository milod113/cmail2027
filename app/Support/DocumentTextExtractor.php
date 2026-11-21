<?php

namespace App\Support;

use ZipArchive;

/**
 * Lecture du texte des documents bureautiques joints (sans OCR, sans dépendance externe) :
 * Word (.docx), Excel (.xlsx), PowerPoint (.pptx), LibreOffice (.odt .ods .odp),
 * texte (.txt .csv) et RTF.
 *
 * Les formats Office récents sont des archives ZIP contenant du XML : on lit ces XML
 * directement (aucun programme lancé, aucun XML « résolu » → pas d'entités externes).
 * Les anciens formats binaires (.doc, .xls, .ppt) ne sont pas pris en charge.
 */
class DocumentTextExtractor
{
    public const EXTENSIONS = ['docx', 'xlsx', 'pptx', 'odt', 'ods', 'odp', 'txt', 'csv', 'rtf'];

    /** Limites contre les fichiers piégés (« bombes » ZIP) ou démesurés. */
    private const MAX_ENTRY_BYTES = 30 * 1024 * 1024;

    private const MAX_PLAIN_BYTES = 5 * 1024 * 1024;

    private const MAX_CELLS = 50000;

    public static function supports(string $path): bool
    {
        return in_array(self::ext($path), self::EXTENSIONS, true);
    }

    /** Texte du document (brut, à nettoyer ensuite). */
    public static function extract(string $file): string
    {
        return match (self::ext($file)) {
            'docx' => self::docx($file),
            'xlsx' => self::xlsx($file),
            'pptx' => self::pptx($file),
            'odt', 'ods', 'odp' => self::odf($file),
            'txt', 'csv' => self::plain($file),
            'rtf' => self::rtf($file),
            default => throw new \RuntimeException('Format non pris en charge.'),
        };
    }

    private static function ext(string $path): string
    {
        return strtolower(pathinfo($path, PATHINFO_EXTENSION));
    }

    // ------------------------------------------------------------------ Word

    private static function docx(string $file): string
    {
        $zip = self::open($file);
        $parts = [];
        // Corps du document, puis en-têtes / pieds de page / notes
        $names = ['word/document.xml'];
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $n = (string) $zip->getNameIndex($i);
            if (preg_match('#^word/(header|footer|footnotes|endnotes)\d*\.xml$#', $n)) {
                $names[] = $n;
            }
        }
        foreach ($names as $n) {
            $xml = self::entry($zip, $n);
            if ($xml === null) {
                continue;
            }
            // Tableau : une ligne de tableau = une ligne de texte, cellules séparées par « | »
            $xml = preg_replace(['#</w:p>\s*</w:tc>#', '#<w:tab/>#', '#<w:(br|cr)[^>]*/>#', '#</w:p>#', '#</w:tc>#', '#</w:tr>#'], [' | ', "\t", "\n", "\n", ' | ', "\n"], $xml) ?? $xml;
            $parts[] = preg_replace('/[ \t]*\|[ \t]*$/m', '', self::stripTags($xml)) ?? '';
        }
        $zip->close();

        return implode("\n\n", $parts);
    }

    // ------------------------------------------------------------------ Excel

    private static function xlsx(string $file): string
    {
        $zip = self::open($file);

        // Textes partagés (la plupart des cellules texte y renvoient par numéro)
        $shared = [];
        if (($xml = self::entry($zip, 'xl/sharedStrings.xml')) !== null) {
            preg_match_all('#<si>(.*?)</si>#s', $xml, $m);
            foreach ($m[1] as $si) {
                preg_match_all('#<t[^>]*>(.*?)</t>#s', $si, $t);
                $shared[] = self::decode(implode('', $t[1]));
            }
        }

        // Noms des feuilles, dans l'ordre du classeur
        $sheetNames = [];
        if (($wb = self::entry($zip, 'xl/workbook.xml')) !== null) {
            preg_match_all('#<sheet\b[^>]*\bname="([^"]*)"#', $wb, $sn);
            $sheetNames = array_map([self::class, 'decode'], $sn[1]);
        }

        $sheets = [];
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $n = (string) $zip->getNameIndex($i);
            if (preg_match('#^xl/worksheets/sheet(\d+)\.xml$#', $n, $mm)) {
                $sheets[(int) $mm[1]] = $n;
            }
        }
        ksort($sheets);

        $out = [];
        $cells = 0;
        foreach (array_values($sheets) as $idx => $n) {
            $xml = self::entry($zip, $n);
            if ($xml === null) {
                continue;
            }
            $lines = [];
            preg_match_all('#<row\b[^>]*>(.*?)</row>#s', $xml, $rows);
            foreach ($rows[1] as $row) {
                $values = [];
                preg_match_all('#<c\b([^>]*?)(?:/>|>(.*?)</c>)#s', $row, $cs, PREG_SET_ORDER);
                foreach ($cs as $c) {
                    if (++$cells > self::MAX_CELLS) {
                        break 3;
                    }
                    $attrs = $c[1];
                    $body = $c[2] ?? '';
                    preg_match('#\bt="([^"]+)"#', $attrs, $type);
                    $type = $type[1] ?? 'n';
                    if ($type === 'inlineStr') {
                        preg_match_all('#<t[^>]*>(.*?)</t>#s', $body, $t);
                        $v = self::decode(implode('', $t[1]));
                    } else {
                        preg_match('#<v>(.*?)</v>#s', $body, $vv);
                        $raw = $vv[1] ?? '';
                        $v = $type === 's' ? ($shared[(int) $raw] ?? '') : self::decode($raw);
                    }
                    if (trim($v) !== '') {
                        $values[] = trim($v);
                    }
                }
                if ($values !== []) {
                    $lines[] = implode(' | ', $values);
                }
            }
            if ($lines !== []) {
                $out[] = 'Feuille : '.($sheetNames[$idx] ?? ('Feuille '.($idx + 1)))."\n".implode("\n", $lines);
            }
        }
        $zip->close();

        return implode("\n\n", $out);
    }

    // ------------------------------------------------------------------ PowerPoint

    private static function pptx(string $file): string
    {
        $zip = self::open($file);
        $slides = [];
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $n = (string) $zip->getNameIndex($i);
            if (preg_match('#^ppt/slides/slide(\d+)\.xml$#', $n, $m)) {
                $slides[(int) $m[1]] = $n;
            }
        }
        ksort($slides);
        $out = [];
        foreach ($slides as $num => $n) {
            $xml = self::entry($zip, $n);
            if ($xml === null) {
                continue;
            }
            $xml = preg_replace(['#</a:p>#', '#<a:br[^>]*/>#'], ["\n", "\n"], $xml) ?? $xml;
            $text = trim(self::stripTags($xml));
            if ($text !== '') {
                $out[] = "Diapositive {$num}\n{$text}";
            }
        }
        $zip->close();

        return implode("\n\n", $out);
    }

    // ------------------------------------------------------------------ LibreOffice

    private static function odf(string $file): string
    {
        $zip = self::open($file);
        $xml = self::entry($zip, 'content.xml') ?? '';
        $zip->close();
        $xml = preg_replace(
            ['#<text:tab/>#', '#<text:line-break/>#', '#</text:(p|h)>#', '#</table:table-cell>#', '#</table:table-row>#', '#<text:s(?: text:c="(\d+)")?/>#'],
            ["\t", "\n", "\n", ' | ', "\n", ' '],
            $xml
        ) ?? $xml;

        return self::stripTags($xml);
    }

    // ------------------------------------------------------------------ texte / RTF

    private static function plain(string $file): string
    {
        $data = (string) file_get_contents($file, false, null, 0, self::MAX_PLAIN_BYTES);
        $data = preg_replace('/^\xEF\xBB\xBF/', '', $data) ?? $data; // BOM UTF-8
        if (str_starts_with($data, "\xFF\xFE") || str_starts_with($data, "\xFE\xFF")) {
            return (string) mb_convert_encoding($data, 'UTF-8', 'UTF-16');
        }

        return mb_check_encoding($data, 'UTF-8') ? $data : (string) mb_convert_encoding($data, 'UTF-8', 'Windows-1252');
    }

    private static function rtf(string $file): string
    {
        $rtf = (string) file_get_contents($file, false, null, 0, self::MAX_PLAIN_BYTES);
        // Groupes non textuels (polices, couleurs, images, métadonnées)
        $rtf = preg_replace('#\{\\\\\*[^{}]*(?:\{[^{}]*\}[^{}]*)*\}#s', '', $rtf) ?? $rtf;
        $rtf = preg_replace('#\{\\\\(fonttbl|colortbl|stylesheet|info|pict)[^{}]*(?:\{[^{}]*\}[^{}]*)*\}#s', '', $rtf) ?? $rtf;
        // Caractères codés \'e9 (Windows-1252) et \uNNNN
        $rtf = preg_replace_callback("#\\\\'([0-9a-fA-F]{2})#", fn ($m) => mb_convert_encoding(chr(hexdec($m[1])), 'UTF-8', 'Windows-1252'), $rtf) ?? $rtf;
        $rtf = preg_replace_callback('#\\\\u(-?\d+)\??#', fn ($m) => mb_chr(((int) $m[1] + 65536) % 65536, 'UTF-8') ?: '', $rtf) ?? $rtf;
        $rtf = preg_replace(['#\\\\(par|line)\b ?#', '#\\\\tab\b ?#'], ["\n", "\t"], $rtf) ?? $rtf;
        $rtf = preg_replace('#\\\\[a-zA-Z]+-?\d* ?#', '', $rtf) ?? $rtf; // autres mots de contrôle

        return str_replace(['{', '}', '\\'], '', $rtf);
    }

    // ------------------------------------------------------------------ outils

    private static function open(string $file): ZipArchive
    {
        $zip = new ZipArchive;
        if ($zip->open($file, ZipArchive::RDONLY) !== true) {
            throw new \RuntimeException('Document illisible (archive Office invalide ou ancien format binaire).');
        }

        return $zip;
    }

    /** Contenu d'un fichier de l'archive, ou null s'il est absent / trop gros. */
    private static function entry(ZipArchive $zip, string $name): ?string
    {
        $stat = $zip->statName($name);
        if ($stat === false) {
            return null;
        }
        if (($stat['size'] ?? 0) > self::MAX_ENTRY_BYTES) {
            throw new \RuntimeException("Contenu trop volumineux ({$name}).");
        }
        $data = $zip->getFromName($name);

        return $data === false ? null : $data;
    }

    private static function stripTags(string $xml): string
    {
        return self::decode(strip_tags($xml));
    }

    private static function decode(string $s): string
    {
        return html_entity_decode($s, ENT_QUOTES | ENT_XML1, 'UTF-8');
    }
}
