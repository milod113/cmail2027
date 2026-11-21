<?php

namespace App\Console\Commands;

use App\Models\AttachmentText;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Met en file d'analyse OCR les pièces jointes déjà présentes (messages existants).
 *
 *   php artisan ocr:backfill            (documents jamais analysés)
 *   php artisan ocr:backfill --failed   (+ ceux en échec)
 */
class OcrBackfill extends Command
{
    protected $signature = 'ocr:backfill {--failed : Relancer aussi les documents en échec}';

    protected $description = 'Analyse (OCR) les pièces jointes des messages existants';

    public function handle(): int
    {
        $paths = DB::table('messages')->whereNotNull('fichier')->where('fichier', '!=', '')->distinct()->pluck('fichier');
        $queued = 0;
        foreach ($paths as $path) {
            if (! AttachmentText::supports($path)) {
                continue;
            }
            $row = AttachmentText::query()->where('path', $path)->first();
            if ($row && ! ($this->option('failed') && $row->ocr_status === 'failed')) {
                continue;
            }
            AttachmentText::queueFor($path, force: (bool) $row);
            $queued++;
        }
        $this->info("{$queued} document(s) mis en file d'analyse. Lancez « php artisan queue:work » pour les traiter.");

        return self::SUCCESS;
    }
}
