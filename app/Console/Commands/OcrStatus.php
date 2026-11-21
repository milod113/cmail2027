<?php

namespace App\Console\Commands;

use App\Models\AttachmentText;
use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

/**
 * Vérifie l'installation OCR (Tesseract, langues, Poppler) et affiche l'état des analyses.
 *
 *   php artisan ocr:status
 */
class OcrStatus extends Command
{
    protected $signature = 'ocr:status';

    protected $description = "Vérifie les outils OCR et affiche l'état des analyses de documents";

    public function handle(): int
    {
        $ok = true;
        $check = function (string $label, array $cmd) use (&$ok): ?string {
            $p = new Process($cmd, null, null, null, 20);
            $p->run();
            $out = trim($p->getOutput()."\n".$p->getErrorOutput());
            $first = strtok($out, "\n") ?: '';
            if ($p->isSuccessful() || str_contains(strtolower($out), 'version')) {
                $this->line("  <info>✔</info> {$label} : {$first}");

                return $out;
            }
            $ok = false;
            $this->line("  <error>✘</error> {$label} introuvable ({$cmd[0]})");

            return null;
        };

        $this->info('Outils');
        $check('Tesseract', [config('ocr.tesseract_path'), '--version']);
        $check('pdftoppm', [config('ocr.pdftoppm_path'), '-v']);
        $check('pdftotext', [config('ocr.pdftotext_path'), '-v']);

        $langsCmd = [config('ocr.tesseract_path'), '--list-langs'];
        if ($dir = config('ocr.tessdata_path')) {
            array_push($langsCmd, '--tessdata-dir', $dir);
        }
        $p = new Process($langsCmd, null, null, null, 20);
        $p->run();
        $available = preg_split('/\s+/', trim($p->getOutput().' '.$p->getErrorOutput()));
        foreach (config('ocr.languages') as $lang) {
            $has = in_array($lang, $available, true);
            $ok = $ok && $has;
            $this->line('  '.($has ? '<info>✔</info>' : '<error>✘</error>')." langue {$lang}".($has ? '' : ' manquante ('.$lang.'.traineddata)'));
        }

        $this->newLine();
        $this->info('Documents');
        foreach (['completed' => 'analysés', 'pending' => 'en attente', 'processing' => 'en cours', 'skipped' => 'sans texte', 'failed' => 'en échec'] as $s => $label) {
            $this->line(sprintf('  %-12s %d', $label, AttachmentText::query()->where('ocr_status', $s)->count()));
        }

        return $ok ? self::SUCCESS : self::FAILURE;
    }
}
