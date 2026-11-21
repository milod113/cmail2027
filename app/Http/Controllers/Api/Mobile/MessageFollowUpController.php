<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Events\NotificationCreated;
use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\ReportedMessage;
use App\Models\User;
use App\Notifications\NewReportedMessageNotification;
use App\Support\MessageFollowUp;
use App\Support\MessageThreads;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

/**
 * Relancer un destinataire (accusé / réponse attendue) et signaler un message.
 */
class MessageFollowUpController extends Controller
{
    /**
     * Relancer le destinataire d'un message envoyé.
     */
    public function ping(Request $request, Message $message): JsonResponse
    {
        $userId = (int) $request->user()->id;
        abort_unless((int) $message->sender_id === $userId, 403, 'Seul l\'expéditeur peut relancer.');

        $kind = MessageFollowUp::kind($message);
        abort_if($kind === null, 422, 'Aucune relance nécessaire : le destinataire a déjà confirmé ou répondu.');

        $wait = MessageFollowUp::cooldownLeft($message);
        abort_if($wait > 0, 429, "Relance déjà envoyée récemment. Vous pourrez relancer dans {$wait} min.");

        MessageFollowUp::markPinged($message);
        $this->signalRecipient($message);

        return response()->json([
            'message' => 'Relance envoyée.',
            'pinged_at' => $message->last_pinged_at?->toIso8601String(),
            'ping_count' => (int) $message->ping_count,
        ]);
    }

    /**
     * Relancer les destinataires d'un message groupé qui n'ont pas confirmé / répondu.
     * Avec `recipient_id`, relance un seul destinataire.
     */
    public function groupPing(Request $request, Message $message): JsonResponse
    {
        $userId = (int) $request->user()->id;
        $root = MessageThreads::root($message);
        abort_unless(MessageThreads::isGroupOwnedBy($root, $userId), 403);

        $validated = $request->validate(['recipient_id' => ['nullable', 'integer']]);

        $copies = MessageThreads::copies($root)
            ->when(
                filled($validated['recipient_id'] ?? null),
                fn ($c) => $c->where('receiver_id', (int) $validated['recipient_id'])
            )
            ->filter(fn (Message $copy) => MessageFollowUp::kind($copy) !== null);

        abort_if($copies->isEmpty(), 422, 'Personne à relancer : tous les destinataires ont déjà confirmé ou répondu.');

        $sent = 0;
        $waiting = 0;
        foreach ($copies as $copy) {
            if (MessageFollowUp::cooldownLeft($copy) > 0) {
                $waiting++;

                continue;
            }
            MessageFollowUp::markPinged($copy);
            $this->signalRecipient($copy);
            $sent++;
        }

        abort_if($sent === 0, 429, 'Tous les destinataires ont été relancés récemment. Réessayez plus tard.');

        return response()->json([
            'message' => $sent > 1 ? "{$sent} destinataires relancés." : 'Destinataire relancé.',
            'count' => $sent,
            'skipped' => $waiting,
        ]);
    }

    /**
     * Signaler un message reçu (spam, harcèlement, problème technique, autre).
     * Mêmes règles et mêmes catégories que le web (ReportController).
     */
    public function report(Request $request, Message $message): JsonResponse
    {
        $user = $request->user();
        $userId = (int) $user->id;

        $isRecipient = (int) $message->receiver_id === $userId
            || collect($message->receiver_ids ?? [])->map(fn ($id) => (int) $id)->contains($userId);
        abort_unless($isRecipient && (int) $message->sender_id !== $userId, 403, 'Vous ne pouvez signaler que les messages que vous avez reçus.');

        $validated = $request->validate([
            'reason_category' => ['required', Rule::in(['spam', 'harassment', 'technical', 'other'])],
            'comment' => ['nullable', 'string', 'max:5000'],
        ]);

        $already = ReportedMessage::query()
            ->where('message_id', $message->id)
            ->where('reporter_id', $userId)
            ->exists();
        abort_if($already, 422, 'Vous avez déjà signalé ce message.');

        $report = ReportedMessage::query()->create([
            'message_id' => $message->id,
            'reporter_id' => $userId,
            'reason_category' => $validated['reason_category'],
            'comment' => filled($validated['comment'] ?? null) ? trim((string) $validated['comment']) : null,
            'status' => 'pending',
        ]);
        $report->loadMissing(['message:id,sujet,contenu,sender_id,receiver_id', 'reporter:id,name,email,role_id']);

        $support = User::query()
            ->where(function ($q) {
                $q->where('is_super_admin', true)->orWhereHas('role', fn ($r) => $r->whereIn('nom_role', [
                    'admin', 'Admin', 'superadmin', 'SuperAdmin', 'support', 'Support', 'support technique', 'Support Technique',
                ]));
            })
            ->whereKeyNot($userId)
            ->get();

        foreach ($support as $person) {
            try {
                $person->notify(new NewReportedMessageNotification($report));
                $this->broadcastNotification((int) $person->id, 'system', (int) $report->id);
            } catch (\Throwable $e) {
                Log::warning('Mobile: notification de signalement non envoyée.', ['report_id' => $report->id, 'error' => $e->getMessage()]);
            }
        }

        return response()->json([
            'message' => 'Votre signalement a été transmis au support technique.',
            'notified' => $support->count(),
        ], 201);
    }

    private function signalRecipient(Message $message): void
    {
        $this->broadcastNotification((int) $message->receiver_id, 'message', (int) $message->id);
    }

    /**
     * Signal temps réel pour les utilisateurs du web. Envoyé APRÈS la réponse : sans serveur
     * Reverb, la tentative attend ~2 s avant d'échouer, ce qui ne doit pas ralentir l'app mobile
     * (le téléphone du destinataire, lui, interroge le serveur et n'en dépend pas).
     */
    private function broadcastNotification(int $userId, string $type, int $id): void
    {
        dispatch(function () use ($userId, $type, $id) {
            try {
                broadcast(new NotificationCreated($userId, $type, $id));
            } catch (\Throwable $e) {
                // Pas de serveur temps réel : sans importance.
            }
        })->afterResponse();
    }
}
