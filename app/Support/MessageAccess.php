<?php

namespace App\Support;

use App\Models\Message;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Schema;

/**
 * Règles d'accès aux messages, partagées entre le web et l'API mobile.
 *
 * Réplique la logique de MessageController::authorizeMessageAccess afin que
 * l'API mobile applique exactement les mêmes autorisations sans toucher au web.
 */
class MessageAccess
{
    /**
     * Determine if the user may view the given message.
     *
     * Un utilisateur a accès s'il est l'expéditeur, le destinataire principal
     * ou présent dans la liste JSON des destinataires (receiver_ids).
     */
    public static function canAccess(int $userId, Message $message): bool
    {
        return $message->sender_id === $userId
            || $message->receiver_id === $userId
            || static::isJsonRecipient($userId, $message);
    }

    /**
     * Determine if the user is listed among the JSON recipients.
     */
    public static function isJsonRecipient(int $userId, Message $message): bool
    {
        return Schema::hasColumn('messages', 'receiver_ids')
            && in_array($userId, $message->receiver_ids ?? [], true);
    }

    /**
     * Base query for the authenticated user's inbox.
     *
     * Replique le périmètre de MessageController::inbox : messages reçus,
     * déjà délivrés et non archivés.
     */
    public static function inboxQuery(int $userId): Builder
    {
        return Message::query()
            ->where('receiver_id', $userId)
            ->where('is_delivered', true)
            ->where('archived', false)
            // Archivage / suppression personnels du destinataire
            ->whereNull('receiver_archived_at')
            ->whereNull('receiver_deleted_at');
    }
}
