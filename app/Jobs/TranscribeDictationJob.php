<?php

namespace App\Jobs;

use App\Models\Dictation;
use App\Support\Attachments;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;

/**
 * Transcription d'une dictée vocale avec whisper.cpp, 100 % locale.
 *
 * Pour ne jamais ralentir Cmail :
 *  - une seule transcription à la fois (verrou), les autres attendent leur tour ;
 *  - nombre de cœurs limité (WHISPER_THREADS) et priorité « inférieure à la normale » ;
 *  - exécutée par la file d'attente, jamais pendant une requête web.
 * L'enregistrement audio est supprimé dès la fin, réussite ou échec.
 */
class TranscribeDictationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Remises en file autorisées en attendant son tour (verrou), mais 1 seule erreur. */
    public int $tries = 60;

    public int $maxExceptions = 1;

    public int $timeout;

    private const LOCK = 'cmail-whisper';

    public function __construct(public int $dictationId)
    {
        $this->timeout = (int) config('dictation.timeout', 300) + 60;
    }

    public function handle(): void
    {
        $d = Dictation::query()->find($this->dictationId);
        if (! $d || $d->status !== 'pending') {
            return;
        }

        // File d'attente démarrée avant la configuration : on laisse la tâche à une file à jour
        if (! filled(config('dictation.whisper_path')) || ! filled(config('dictation.model_path'))) {
            $this->release(10);

            return;
        }

        // Une dictée à la fois sur ce serveur : sinon, on repasse dans 3 s
        $lock = Cache::lock(self::LOCK, (int) config('dictation.timeout', 300) + 60);
        if (! $lock->get()) {
            $this->release(3);

            return;
        }

        $started = microtime(true);
        try {
            $d->forceFill(['status' => 'processing'])->save();
            $file = Storage::disk(Attachments::DISK)->path((string) $d->audio_path);
            if (! is_file($file)) {
                throw new \RuntimeException('Enregistrement introuvable.');
            }

            $text = self::clean($this->transcribe($file, $d->language));
            $d->forceFill([
                'status' => 'completed',
                'text' => $text,
                'processing_seconds' => round(microtime(true) - $started, 1),
            ])->save();
        } catch (\Throwable $e) {
            $d->forceFill(['status' => 'failed', 'error' => Str::limit($e->getMessage(), 480)])->save();
            Log::warning('Dictée : transcription impossible.', ['dictation_id' => $d->id, 'error' => $e->getMessage()]);
        } finally {
            // La voix (donnée personnelle) n'est jamais conservée
            if ($d->audio_path) {
                Storage::disk(Attachments::DISK)->delete($d->audio_path);
                $d->forceFill(['audio_path' => null])->save();
            }
            $lock->release();
        }
    }

    private function transcribe(string $file, string $language): string
    {
        $cmd = [
            (string) config('dictation.whisper_path'),
            '-m', (string) config('dictation.model_path'),
            '-f', $file,
            '-l', in_array($language, ['fr', 'ar'], true) ? $language : 'auto',
            '-t', (string) max(1, (int) config('dictation.threads', 3)),
            '-nt', // sans horodatage
            '-np', // sans messages techniques : seulement le texte
        ];
        if ($prompt = trim((string) config('dictation.prompt'))) {
            array_push($cmd, '--prompt', $prompt);
        }

        $p = new Process($cmd, null, null, null, (int) config('dictation.timeout', 300));
        $p->start();
        if (config('dictation.low_priority')) {
            $this->lowerPriority((int) $p->getPid());
        }
        $p->wait();

        if (! $p->isSuccessful()) {
            throw new \RuntimeException('whisper : '.trim($p->getErrorOutput() ?: $p->getOutput()));
        }

        return $p->getOutput();
    }

    /** Priorité « inférieure à la normale » pour le processus de transcription (et ses enfants). */
    private function lowerPriority(int $pid): void
    {
        if ($pid <= 0) {
            return;
        }
        try {
            if (PHP_OS_FAMILY === 'Windows') {
                $ps = '$ProgressPreference="SilentlyContinue"; '
                    ."\$ids=@({$pid})+@(Get-CimInstance Win32_Process -Filter \"ParentProcessId={$pid}\" | ForEach-Object ProcessId); "
                    .'foreach($i in $ids){ try { (Get-Process -Id $i -ErrorAction Stop).PriorityClass="BelowNormal" } catch {} }';
                // Commande encodée : évite tout problème de guillemets sous Windows
                (new Process(['powershell', '-NoProfile', '-NonInteractive', '-EncodedCommand', base64_encode(mb_convert_encoding($ps, 'UTF-16LE', 'UTF-8'))], null, null, null, 20))->run();
            } else {
                (new Process(['renice', '-n', '10', '-p', (string) $pid], null, null, null, 10))->run();
            }
        } catch (\Throwable) {
            // Priorité non modifiable : la transcription continue normalement
        }
    }

    /** Texte propre : sans marqueurs de silence / musique, espaces normalisés. */
    public static function clean(string $text): string
    {
        $text = preg_replace('/\[(BLANK_AUDIO|MUSIC|Musique|musique|Silence|silence)[^\]]*\]|\((musique|Musique|silence|rires?)\)/u', ' ', $text) ?? $text;
        $text = preg_replace('/[ \t]+/u', ' ', $text) ?? $text;
        $text = preg_replace('/ *\n */', "\n", $text) ?? $text;

        return trim($text);
    }

    public function failed(?\Throwable $e): void
    {
        $d = Dictation::query()->find($this->dictationId);
        if ($d && in_array($d->status, ['pending', 'processing'], true)) {
            $d->forceFill(['status' => 'failed', 'error' => 'Transcription interrompue.'])->save();
            if ($d->audio_path) {
                Storage::disk(Attachments::DISK)->delete($d->audio_path);
                $d->forceFill(['audio_path' => null])->save();
            }
        }
    }
}
