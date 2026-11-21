<?php

namespace App\Support;

use App\Models\Message;
use Illuminate\Support\Facades\DB;

/**
 * Suivi d'un message envoyé : faut-il relancer le destinataire ?
 *
 *  - 'receipt' : accusé de réception attendu (message important ou accusé demandé)
 *                et pas encore confirmé ;
 *  - 'reply'   : date limite de réponse fixée et le destinataire n'a pas répondu.
 */
class MessageFollowUp
{
    /** Délai minimum entre deux relances d'un même message (minutes). */
    public const COOLDOWN_MINUTES = 30;

    /** Le destinataire a répondu : fil du message ou du groupe, ou réponse « web ». */
    public const RECIPIENT_REPLIED_SQL = '(EXISTS (SELECT 1 FROM messages r WHERE r.sender_id = messages.receiver_id AND r.parent_id IS NOT NULL
            AND (r.parent_id = messages.id OR (messages.message_group_uuid IS NOT NULL AND r.message_group_uuid = messages.message_group_uuid)))
        OR EXISTS (SELECT 1 FROM reponses rp WHERE rp.message_id = messages.id AND rp.user_id = messages.receiver_id))';

    public static function recipientReplied(Message $message): bool
    {
        return (bool) DB::selectOne(
            'SELECT '.self::RECIPIENT_REPLIED_SQL.' AS v FROM messages WHERE messages.id = ?',
            [$message->id]
        )?->v;
    }

    /** 'receipt' | 'reply' | null. */
    public static function kind(Message $message, ?bool $recipientReplied = null): ?string
    {
        if (! $message->is_delivered || $message->parent_id !== null) {
            return null;
        }

        if (($message->requires_receipt || $message->important || $message->is_important) && $message->acknowledged_at === null) {
            return 'receipt';
        }

        if ($message->deadline_reponse !== null) {
            $replied = $recipientReplied ?? self::recipientReplied($message);

            return $replied ? null : 'reply';
        }

        return null;
    }

    /** Minutes à attendre avant de pouvoir relancer à nouveau (0 = possible). */
    public static function cooldownLeft(Message $message): int
    {
        if ($message->last_pinged_at === null) {
            return 0;
        }

        $next = $message->last_pinged_at->copy()->addMinutes(self::COOLDOWN_MINUTES);

        return $next->isFuture() ? (int) ceil(now()->diffInSeconds($next, false) / 60) : 0;
    }

    public static function markPinged(Message $message): void
    {
        $message->forceFill([
            'last_pinged_at' => now(),
            'ping_count' => ((int) $message->ping_count) + 1,
        ])->save();
    }
}
