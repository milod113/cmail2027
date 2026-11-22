<?php

namespace App\Support;

use App\Models\ChatMessage;

/**
 * Représentation d'un message du chat, commune au web, à l'API mobile et au temps réel.
 */
class ChatPayload
{
    /**
     * @param  bool  $signed  lien audio signé (application mobile) plutôt que lien de session (web)
     */
    public static function map(ChatMessage $message, int $viewerId, bool $signed = false): array
    {
        $isOutgoing = (int) $message->sender_id === $viewerId;
        $audio = filled($message->audio_path)
            ? ($signed
                ? Attachments::signedUrl('chat', (int) $message->id, $message->audio_path, $viewerId)
                : Attachments::webUrl('chat', (int) $message->id, $message->audio_path))
            : null;

        return [
            'id' => $message->id,
            'type' => $message->type ?: 'text',
            'body' => $message->body,
            'audio_url' => $audio,
            'duration_ms' => $message->duration_ms,
            'created_at' => optional($message->created_at)?->toIso8601String(),
            'read_at' => optional($message->read_at)?->toIso8601String(),
            'direction' => $isOutgoing ? 'outgoing' : 'incoming',
            'sender' => $message->sender
                ? ['id' => $message->sender->id, 'name' => $message->sender->name, 'email' => $message->sender->email]
                : null,
            'receiver' => $message->receiver
                ? ['id' => $message->receiver->id, 'name' => $message->receiver->name, 'email' => $message->receiver->email]
                : null,
        ];
    }

    /** Aperçu court (liste des conversations, notifications). */
    public static function preview(ChatMessage $message): string
    {
        if (($message->type ?? 'text') === 'voice') {
            $s = (int) round(($message->duration_ms ?? 0) / 1000);

            return '🎤 Message vocal ('.intdiv($s, 60).':'.str_pad((string) ($s % 60), 2, '0', STR_PAD_LEFT).')';
        }

        return str((string) $message->body)->squish()->limit(120)->toString();
    }
}
