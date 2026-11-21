<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Models\Message;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Envois programmés de l'utilisateur (équivalent mobile de la page web « Planifications »).
 *
 * Un envoi à plusieurs destinataires crée une copie par destinataire (même
 * message_group_uuid) : les actions s'appliquent à tout le groupe.
 * La livraison reste assurée par le job ProcessScheduledMessages (planificateur Laravel).
 */
class ScheduledMessageController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = (int) $request->user()->id;

        $data = $this->scheduledQuery($userId)
            ->with('receiver:id,name,email')
            ->orderBy('scheduled_at')
            ->orderBy('id')
            ->get()
            ->groupBy(fn (Message $m) => filled($m->message_group_uuid) ? 'g:'.$m->message_group_uuid : 'm:'.$m->id)
            ->map(function (Collection $copies) use ($userId) {
                /** @var Message $first */
                $first = $copies->first();

                return [
                    'id' => $first->id,
                    'subject' => $first->sujet,
                    'excerpt' => Str::limit(trim(preg_replace('/\s+/', ' ', (string) $first->contenu)), 140),
                    'scheduled_at' => optional($first->scheduled_at)?->toIso8601String(),
                    'created_at' => optional($first->created_at)?->toIso8601String(),
                    'is_important' => (bool) ($first->important || $first->is_important),
                    'requires_receipt' => (bool) $first->requires_receipt,
                    'has_attachment' => filled($first->fichier),
                    'attachment_name' => $first->fichier ? basename($first->fichier) : null,
                    'attachment_url' => \App\Support\Attachments::signedUrl('message', $first->id, $first->fichier, $userId),
                    'recipients' => $copies
                        ->filter(fn (Message $m) => $m->receiver !== null)
                        ->map(fn (Message $m) => [
                            'id' => $m->receiver->id,
                            'name' => $m->receiver->name,
                            'email' => $m->receiver->email,
                        ])
                        ->values(),
                ];
            })
            ->sortBy('scheduled_at')
            ->values();

        return response()->json(['data' => $data]);
    }

    /**
     * Modifier la date d'envoi (tout le groupe).
     */
    public function reschedule(Request $request, Message $message): JsonResponse
    {
        $copies = $this->ownedGroup($request, $message);

        $validated = $request->validate([
            'scheduled_at' => ['required', 'date', 'after:now'],
        ], [
            'scheduled_at.after' => "La date d'envoi doit être dans le futur.",
        ]);

        $at = Carbon::parse($validated['scheduled_at']);

        Message::query()->whereKey($copies->pluck('id'))->update([
            'scheduled_at' => $at,
            'status' => 'scheduled',
            'sent_at' => null,
            'is_delivered' => false,
            'envoye' => false,
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Date d\'envoi mise à jour.',
            'scheduled_at' => $at->toIso8601String(),
        ]);
    }

    /**
     * Envoyer immédiatement (tout le groupe) — même logique que le web.
     */
    public function sendNow(Request $request, Message $message): JsonResponse
    {
        $copies = $this->ownedGroup($request, $message);
        $now = now();

        DB::transaction(function () use ($copies, $now) {
            foreach ($copies as $copy) {
                $copy->update([
                    'scheduled_at' => null,
                    'status' => 'sent',
                    'sent_at' => $now,
                    'is_delivered' => true,
                    'envoye' => true,
                    'receipt_requested_at' => $copy->requires_receipt ? ($copy->receipt_requested_at ?? $now) : null,
                ]);
            }
        });

        return response()->json([
            'message' => $copies->count() > 1 ? 'Messages envoyés.' : 'Message envoyé.',
            'count' => $copies->count(),
        ]);
    }

    /**
     * Annuler l'envoi programmé (supprime toutes les copies, comme le web).
     */
    public function cancel(Request $request, Message $message): JsonResponse
    {
        $copies = $this->ownedGroup($request, $message);

        $paths = $copies->pluck('fichier')->filter()->unique();
        Message::query()->whereKey($copies->pluck('id'))->delete();

        // Supprime la pièce jointe si plus aucun message ne l'utilise.
        foreach ($paths as $path) {
            if (! Message::query()->where('fichier', $path)->exists()) {
                \App\Support\Attachments::delete($path);
            }
        }

        return response()->json(['message' => 'Envoi programmé annulé.']);
    }

    private function scheduledQuery(int $userId): Builder
    {
        return Message::query()
            ->where('sender_id', $userId)
            ->where('status', 'scheduled')
            ->whereNotNull('scheduled_at')
            ->whereNull('parent_id');
    }

    /**
     * Copies programmées du même envoi, appartenant à l'utilisateur.
     */
    private function ownedGroup(Request $request, Message $message): Collection
    {
        $userId = (int) $request->user()->id;

        abort_unless((int) $message->sender_id === $userId, 403);
        abort_unless($message->status === 'scheduled', 422, 'Ce message a déjà été envoyé.');

        return $this->scheduledQuery($userId)
            ->when(
                filled($message->message_group_uuid),
                fn ($q) => $q->where('message_group_uuid', $message->message_group_uuid),
                fn ($q) => $q->whereKey($message->id),
            )
            ->get();
    }
}
