<?php

namespace App\Jobs;

use App\Models\AttachmentText;
use App\Support\Attachments;
use App\Support\DocumentTextExtractor;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;
use thiagoalessio\TesseractOCR\TesseractOCR;

/**
 * Extraction du texte d'une pièce jointe (PDF scanné ou image), 100 % locale.
 *
 * 1. PDF « numérique » : texte natif lu avec pdftotext (rapide, exact) ;
 * 2. sinon : pdftoppm → une image PNG par page (300 DPI) → Tesseract (français + arabe) ;
 * 3. texte nettoyé enregistré dans attachment_texts, images temporaires supprimées.
 *
 * Exécuté en file d'attente (php artisan queue:work) : l'envoi du message n'attend jamais.
 */
class ProcessDocumentOcrJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;

    public int $timeout;

    public function __construct(public string $path)
    {
        $this->timeout = (int) config('ocr.timeout', 600) + 60;
    }

    public function handle(): void
    {
        $row = AttachmentText::query()->where('path', $this->path)->first();
        if (! $row || $row->ocr_status === 'completed') {
            return;
        }

        if (! DocumentTextExtractor::supports($this->path)
            && (! filled(config('ocr.tesseract_path')) || ! filled(config('ocr.pdftoppm_path')))) {
            // Worker démarré avant la configuration OCR : on remet en attente plutôt que d'échouer
            $this->release(60);

            return;
        }

        $row->forceFill(['ocr_status' => 'processing', 'error' => null])->save();
        $tmp = storage_path('app/ocr-tmp/'.Str::uuid());

        try {
            $disk = Attachments::diskOf($this->path);
            if ($disk === null) {
                throw new \RuntimeException('Fichier introuvable sur le serveur.');
            }
            $file = Storage::disk($disk)->path($this->path);
            File::ensureDirectoryExists($tmp);

            $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
            [$text, $method, $pages] = match (true) {
                $ext === 'pdf' => $this->fromPdf($file, $tmp),
                // Word, Excel, PowerPoint, LibreOffice, texte : lecture directe, sans OCR
                DocumentTextExtractor::supports($file) => [DocumentTextExtractor::extract($file), 'document', null],
                default => [$this->ocrImage($file), 'ocr', 1],
            };

            $text = self::clean($text);
            $row->forceFill([
                'ocr_status' => $text === '' ? 'skipped' : 'completed', // skipped = aucun texte lisible
                'ocr_text' => $text === '' ? null : $text,
                'method' => $method,
                'pages' => $pages,
                'error' => null,
                'processed_at' => now(),
            ])->save();
        } catch (\Throwable $e) {
            $row->forceFill(['ocr_status' => 'failed', 'error' => Str::limit($e->getMessage(), 1000), 'processed_at' => now()])->save();
            Log::warning('OCR : échec de l\'analyse d\'une pièce jointe.', ['path' => $this->path, 'error' => $e->getMessage()]);
        } finally {
            // Les images des pages (document médical) ne restent jamais sur le disque
            File::deleteDirectory($tmp);
        }
    }

    /** @return array{0: string, 1: string, 2: int} texte, méthode, nombre de pages */
    private function fromPdf(string $pdf, string $tmp): array
    {
        $max = max(1, (int) config('ocr.max_pages', 30));

        // 1. Texte natif (PDF créé par un logiciel, pas scanné)
        $native = $this->run([config('ocr.pdftotext_path'), '-layout', '-enc', 'UTF-8', '-l', (string) $max, $pdf, '-'], 120, false);
        if ($native !== null && mb_strlen(self::clean($native)) >= (int) config('ocr.text_layer_min_chars', 80)) {
            return [$native, 'text_layer', 0];
        }

        // 2. PDF scanné : une image par page, puis OCR
        $this->run([
            config('ocr.pdftoppm_path'), '-r', (string) config('ocr.dpi', 300), '-png', '-l', (string) $max, $pdf, $tmp.DIRECTORY_SEPARATOR.'page',
        ], (int) config('ocr.timeout', 600));

        $images = collect(File::files($tmp))
            ->filter(fn ($f) => strtolower($f->getExtension()) === 'png')
            ->sortBy(fn ($f) => (int) preg_replace('/\D/', '', $f->getFilename()))
            ->values();
        if ($images->isEmpty()) {
            throw new \RuntimeException('Aucune page n\'a pu être extraite du PDF.');
        }

        $parts = [];
        foreach ($images as $img) {
            $parts[] = $this->ocrImage($img->getPathname());
            File::delete($img->getPathname()); // libère la page dès qu'elle est lue
        }

        return [implode("\n\n", $parts), 'ocr', $images->count()];
    }

    private function ocrImage(string $image): string
    {
        $ocr = (new TesseractOCR($image))
            ->executable((string) config('ocr.tesseract_path'))
            ->lang(...(config('ocr.languages') ?: ['fra', 'ara']));
        if ($dir = config('ocr.tessdata_path')) {
            $ocr->tessdataDir($dir);
        }

        try {
            return (string) $ocr->run();
        } catch (\thiagoalessio\TesseractOCR\UnsuccessfulCommandException $e) {
            // Page blanche / sans texte : Tesseract renvoie une erreur « vide », ce n'est pas un échec
            if (str_contains(strtolower($e->getMessage()), 'empty')) {
                return '';
            }
            throw $e;
        }
    }

    /** Exécute une commande système ; renvoie la sortie, ou null si $strict = false et que la commande échoue. */
    private function run(array $cmd, int $timeout, bool $strict = true): ?string
    {
        $p = new Process($cmd, null, null, null, $timeout);
        $p->run();
        if (! $p->isSuccessful()) {
            if (! $strict) {
                return null;
            }
            throw new \RuntimeException(basename((string) $cmd[0]).' : '.trim($p->getErrorOutput() ?: $p->getOutput()));
        }

        return $p->getOutput();
    }

    /** Espaces, sauts de ligne et caractères invisibles superflus supprimés. */
    public static function clean(string $text): string
    {
        $text = str_replace(["\r\n", "\r", "\f"], "\n", $text);
        $text = preg_replace('/[^\P{C}\n\t]/u', '', $text) ?? $text; // caractères de contrôle
        $text = preg_replace('/[ \t\x{00A0}]+/u', ' ', $text) ?? $text;
        $text = preg_replace('/ *\n */', "\n", $text) ?? $text;
        $text = preg_replace('/\n{3,}/', "\n\n", $text) ?? $text;

        return trim($text);
    }
}
