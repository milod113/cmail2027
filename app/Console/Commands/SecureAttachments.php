<?php

namespace App\Console\Commands;

use App\Support\Attachments;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/**
 * Déplace les anciennes pièces jointes (dossier PUBLIC, accessibles par simple lien
 * /storage/...) vers le stockage PRIVÉ. Les chemins en base ne changent pas : les
 * messages existants continuent de s'ouvrir, mais uniquement via /attachments/...
 *
 *   php artisan attachments:secure --dry-run   (voir ce qui serait déplacé)
 *   php artisan attachments:secure             (déplacer)
 */
class SecureAttachments extends Command
{
    protected $signature = 'attachments:secure {--dry-run : Affiche les fichiers sans les déplacer}';

    protected $description = 'Déplace les pièces jointes des messages du dossier public vers le stockage privé';

    /** Dossiers du disque public qui contiennent des pièces jointes de messages. */
    private const DIRS = ['messages', 'reponses', 'message-drafts'];

    public function handle(): int
    {
        $public = Storage::disk(Attachments::LEGACY_DISK);
        $private = Storage::disk(Attachments::DISK);
        $dry = (bool) $this->option('dry-run');

        $moved = 0;
        $skipped = 0;
        $failed = 0;
        $bytes = 0;

        foreach (self::DIRS as $dir) {
            foreach ($public->allFiles($dir) as $path) {
                if ($private->exists($path)) {
                    // Déjà présent en privé : on retire seulement la copie publique
                    $skipped++;
                    if (! $dry) {
                        $public->delete($path);
                    }
                    $this->line("  = {$path} (déjà en privé, copie publique supprimée)");

                    continue;
                }

                $size = (int) $public->size($path);
                $this->line(($dry ? '  ? ' : '  → ').$path.'  ('.round($size / 1024).' Ko)');

                if ($dry) {
                    $moved++;
                    $bytes += $size;

                    continue;
                }

                $stream = $public->readStream($path);
                if (! is_resource($stream) || ! $private->writeStream($path, $stream)) {
                    $failed++;
                    $this->error("    échec : {$path}");
                    if (is_resource($stream)) {
                        fclose($stream);
                    }

                    continue;
                }
                fclose($stream);

                // Vérification avant suppression de l'original
                if ($private->size($path) !== $size) {
                    $failed++;
                    $private->delete($path);
                    $this->error("    taille différente, original conservé : {$path}");

                    continue;
                }

                $public->delete($path);
                $moved++;
                $bytes += $size;
            }
        }

        $this->newLine();
        $this->info(($dry ? 'À déplacer : ' : 'Déplacés : ').$moved.' fichier(s), '.round($bytes / 1024).' Ko'
            .($skipped ? " · {$skipped} doublon(s) public(s) retiré(s)" : '')
            .($failed ? " · {$failed} échec(s)" : ''));

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
