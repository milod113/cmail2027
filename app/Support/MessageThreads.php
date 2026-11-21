<?php

namespace App\Support;

use App\Models\Message;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

/**
 * Fils de discussion et messages groupés pour l'API mobile.
 *
 * Reprend les règles du web (MessageController::resolveThreadRootMessage,
 * groupRecipientMessages, groupLegacyRepliesByMessageId) sans modifier le web.
 */
class MessageThreads
{
    /**
     * Racine d'un fil : on remonte les parents, puis, pour un message groupé,
     * on prend la première copie du groupe (même règle que le web).
     */
    public static function root(Message $message): Message
    {
        while ($message->parent_id !== null) {
            $parent = Message::query()->find($message->parent_id);
            if (! $parent) {
                break;
            }
            $message = $parent;
        }

        if (filled($message->message_group_uuid)) {
            return Message::query()
                ->where('message_group_uuid', $message->message_group_uuid)
                ->whereNull('parent_id')
                ->orderBy('id')
                ->first() ?? $message;
        }

        return $message;
    }

    /**
     * Copies d'un message groupé (une par destinataire).
     */
    public static function copies(Message $root): Collection
    {
        return Message::query()
            ->with('receiver:id,name,email,role_id', 'receiver.role:id,nom_role')
            ->when(
                filled($root->message_group_uuid),
                fn ($query) => $query->where('message_group_uuid', $root->message_group_uuid),
                fn ($query) => $query->whereKey($root->id),
            )
            ->whereNull('parent_id')
            ->orderBy('receiver_id')
            ->get();
    }

    /**
     * Le message est-il un envoi groupé dont l'utilisateur est l'expéditeur ?
     */
    public static function isGroupOwnedBy(Message $root, int $userId): bool
    {
        if ((int) $root->sender_id !== $userId) {
            return false;
        }

        $jsonCount = collect($root->receiver_ids ?? [])->filter()->unique()->count();

        return $jsonCount > 1 || static::copies($root)->count() > 1;
    }

    /**
     * Réponses (messages enfants) d'un ensemble de messages, toutes copies confondues.
     */
    public static function childReplies(array $parentIds): Collection
    {
        if (empty($parentIds)) {
            return collect();
        }

        return Message::query()
            ->with('sender:id,name,email')
            ->whereIn('parent_id', $parentIds)
            ->orderBy('id')
            ->get();
    }

    /**
     * Réponses « anciennes » de la table reponses (réponses faites depuis le web),
     * groupées par id de copie.
     */
    public static function legacyReplies(array $messageIds): Collection
    {
        if (empty($messageIds) || ! Schema::hasTable('reponses')) {
            return collect();
        }

        return DB::table('reponses')
            ->leftJoin('users', 'users.id', '=', 'reponses.user_id')
            ->whereIn('reponses.message_id', $messageIds)
            ->orderBy('reponses.created_at')
            ->get([
                'reponses.id',
                'reponses.message_id',
                'reponses.user_id',
                'reponses.contenu',
                'reponses.fichier',
                'reponses.created_at',
                'users.name as user_name',
                'users.email as user_email',
            ])
            ->groupBy('message_id');
    }

    /**
     * @deprecated Les pièces jointes sont privées : utiliser Attachments::signedUrl() / webUrl().
     */
    public static function fileUrl(?string $path): ?string
    {
        return null;
    }
}
