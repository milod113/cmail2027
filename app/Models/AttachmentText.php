<?php

namespace App\Models;

use App\Jobs\ProcessDocumentOcrJob;
use Illuminate\Database\Eloquent\Model;

/**
 * Texte extrait d'une pièce jointe (OCR local Tesseract, ou texte natif d'un PDF).
 *
 * @property string $path
 * @property string $ocr_status pending|processing|completed|failed|skipped
 * @property string|null $ocr_text
 */
class AttachmentText extends Model
{
    /** PDF et images (OCR) + documents bureautiques (texte lu directement). */
    public const EXTENSIONS = [
        'pdf', 'png', 'jpg', 'jpeg', 'tif', 'tiff', 'bmp', 'webp',
        'docx', 'xlsx', 'pptx', 'odt', 'ods', 'odp', 'txt', 'csv', 'rtf',
    ];

    protected $fillable = ['path', 'ocr_status', 'ocr_text', 'method', 'pages', 'error', 'processed_at'];

    protected $casts = [
        'pages' => 'integer',
        'processed_at' => 'datetime',
    ];

    /** Le fichier peut-il être analysé (PDF ou image) ? */
    public static function supports(?string $path): bool
    {
        return filled($path) && in_array(strtolower(pathinfo((string) $path, PATHINFO_EXTENSION)), self::EXTENSIONS, true);
    }

    /**
     * Met le document en file d'analyse (une seule fois par fichier).
     * Appelé automatiquement à l'enregistrement d'un message avec pièce jointe.
     */
    public static function queueFor(?string $path, bool $force = false): void
    {
        if (! config('ocr.enabled') || ! self::supports($path)) {
            return;
        }

        $row = self::query()->firstOrCreate(['path' => $path], ['ocr_status' => 'pending']);

        if ($row->wasRecentlyCreated || $force || $row->ocr_status === 'failed') {
            if (! $row->wasRecentlyCreated) {
                $row->forceFill(['ocr_status' => 'pending', 'error' => null])->save();
            }
            // Après validation de l'envoi, jamais pendant (l'envoi n'attend pas l'OCR)
            ProcessDocumentOcrJob::dispatch($path)->afterCommit();
        }
    }
}
