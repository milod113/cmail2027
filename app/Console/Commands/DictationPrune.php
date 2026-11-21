<?php

namespace App\Console\Commands;

use App\Models\Dictation;
use App\Support\Attachments;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/**
 * Efface les dictées anciennes (texte) et tout enregistrement audio resté sur le disque.
 * Lancée automatiquement chaque heure par le planificateur.
 */
class DictationPrune extends Command
{
    protected $signature = 'dictations:prune';

    protected $description = 'Efface les dictées vocales anciennes et les enregistrements audio orphelins';

    public function handle(): int
    {
        $limit = now()->subHours(max(1, (int) config('dictation.keep_hours', 24)));
        $old = Dictation::query()->where('created_at', '<', $limit)->get();
        foreach ($old as $d) {
            if ($d->audio_path) {
                Storage::disk(Attachments::DISK)->delete($d->audio_path);
            }
            $d->delete();
        }

        // Audio sans dictée correspondante (ex. arrêt brutal du serveur)
        $known = Dictation::query()->whereNotNull('audio_path')->pluck('audio_path')->all();
        $orphans = 0;
        foreach (Storage::disk(Attachments::DISK)->files('dictations') as $f) {
            if (! in_array($f, $known, true) && Storage::disk(Attachments::DISK)->lastModified($f) < now()->subHour()->getTimestamp()) {
                Storage::disk(Attachments::DISK)->delete($f);
                $orphans++;
            }
        }

        $this->info($old->count().' dictée(s) effacée(s), '.$orphans.' audio orphelin(s) supprimé(s).');

        return self::SUCCESS;
    }
}
