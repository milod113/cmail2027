<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Jobs\TranscribeDictationJob;
use App\Models\Dictation;
use App\Support\Attachments;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Dictée vocale (application mobile).
 *
 *   POST   /api/mobile/dictations          audio (WAV 16 kHz mono conseillé) + language → 202 {id}
 *   GET    /api/mobile/dictations/{id}     état ; texte quand « completed »
 *   DELETE /api/mobile/dictations/{id}     annuler
 *
 * Chaque utilisateur ne voit que ses propres dictées.
 */
class DictationController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        abort_unless(config('dictation.enabled'), 503, 'La dictée vocale est désactivée sur ce serveur.');

        $v = $request->validate([
            // 8 Mo ≈ 4 minutes de WAV 16 kHz mono : la durée réelle est contrôlée ensuite
            'audio' => ['required', 'file', 'max:8192'],
            'language' => ['nullable', 'in:'.implode(',', config('dictation.languages'))],
        ]);

        $file = $request->file('audio');
        $ext = strtolower($file->getClientOriginalExtension());
        abort_unless(in_array($ext, ['wav', 'mp3', 'ogg', 'flac'], true), 422, 'Format audio non pris en charge (WAV, MP3, OGG ou FLAC).');

        $duration = $ext === 'wav' ? self::wavSeconds($file->getRealPath()) : null;
        $max = (int) config('dictation.max_seconds', 120);
        abort_if($duration !== null && $duration > $max + 1, 422, "Dictée trop longue (maximum {$max} secondes).");
        abort_if($duration !== null && $duration < 0.5, 422, 'Enregistrement vide.');

        $path = $file->storeAs('dictations', Str::random(40).'.'.$ext, Attachments::DISK);
        $d = Dictation::query()->create([
            'user_id' => $request->user()->id,
            'status' => 'pending',
            'language' => $v['language'] ?? 'fr',
            'audio_path' => $path,
            'duration' => $duration !== null ? round($duration, 1) : null,
        ]);

        TranscribeDictationJob::dispatch($d->id);

        return response()->json($this->payload($d), 202);
    }

    public function show(Request $request, Dictation $dictation): JsonResponse
    {
        abort_unless((int) $dictation->user_id === (int) $request->user()->id, 404);

        return response()->json($this->payload($dictation));
    }

    public function destroy(Request $request, Dictation $dictation): JsonResponse
    {
        abort_unless((int) $dictation->user_id === (int) $request->user()->id, 404);
        if ($dictation->audio_path) {
            Storage::disk(Attachments::DISK)->delete($dictation->audio_path);
        }
        $dictation->delete();

        return response()->json(['message' => 'Dictée annulée.']);
    }

    private function payload(Dictation $d): array
    {
        return [
            'id' => $d->id,
            'status' => $d->status,
            'language' => $d->language,
            'duration' => $d->duration,
            'text' => $d->status === 'completed' ? (string) $d->text : null,
            'error' => $d->status === 'failed' ? ($d->error ?: 'Transcription impossible.') : null,
            // Dictées d'autres personnes à transcrire avant celle-ci
            'queue_position' => $d->status === 'pending'
                ? Dictation::query()->whereIn('status', ['pending', 'processing'])->where('id', '<', $d->id)->count()
                : 0,
        ];
    }

    /** Durée d'un fichier WAV PCM (en-tête RIFF), ou null si illisible. */
    private static function wavSeconds(string $file): ?float
    {
        $h = @fopen($file, 'rb');
        if (! $h) {
            return null;
        }
        $riff = fread($h, 12);
        if (strlen($riff) < 12 || substr($riff, 0, 4) !== 'RIFF' || substr($riff, 8, 4) !== 'WAVE') {
            fclose($h);

            return null;
        }
        $byteRate = null;
        $dataSize = null;
        while (! feof($h) && ($chunk = fread($h, 8)) !== false && strlen($chunk) === 8) {
            $id = substr($chunk, 0, 4);
            $size = unpack('V', substr($chunk, 4, 4))[1];
            if ($id === 'fmt ') {
                $fmt = fread($h, $size);
                $byteRate = unpack('V', substr($fmt, 8, 4))[1] ?? null;
            } elseif ($id === 'data') {
                $dataSize = $size;
                break;
            } else {
                fseek($h, $size + ($size % 2), SEEK_CUR);
            }
        }
        fclose($h);
        if (! $byteRate || ! $dataSize) {
            return null;
        }
        // Enregistrement en cours d'écriture : taille « data » parfois non renseignée
        if ($dataSize === 0 || $dataSize === 0xFFFFFFFF) {
            $dataSize = max(0, filesize($file) - 44);
        }

        return $dataSize / $byteRate;
    }
}
