<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    /**
     * Transform the message into a stable, mobile-friendly array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'subject' => $this->sujet,
            'excerpt' => mb_strimwidth((string) $this->contenu, 0, 180, '…'),
            'content' => $this->contenu,
            'sender' => $this->whenLoaded('sender', fn () => $this->briefUser($this->sender)),
            'receiver' => $this->whenLoaded('receiver', fn () => $this->briefUser($this->receiver)),
            'receiver_ids' => $this->receiverIds(),
            'is_read' => (bool) $this->lu,
            'read_at' => $this->when($this->read_at !== null, fn () => $this->read_at->toIso8601String(), null),
            'is_important' => (bool) ($this->important ?? $this->is_important),
            'type_message' => $this->type_message,
            'category' => $this->category,
            'requires_receipt' => (bool) $this->requires_receipt,
            'is_tracked' => (bool) $this->is_tracked,
            'deadline_reponse' => $this->when($this->deadline_reponse !== null, fn () => $this->deadline_reponse->toIso8601String(), null),
            'pinged_at' => $this->when($this->last_pinged_at !== null, fn () => $this->last_pinged_at->toIso8601String(), null),
            'ping_count' => (int) ($this->ping_count ?? 0),
            // Liste « Envoyés » : le destinataire a-t-il répondu ? -> faut-il relancer ?
            'follow_up' => $this->when(
                array_key_exists('recipient_replied', $this->getAttributes()),
                fn () => \App\Support\MessageFollowUp::kind($this->resource, (bool) $this->recipient_replied)
            ),
            'replied_by_me' => $this->when(array_key_exists('replied_by_me', $this->getAttributes()), fn () => (bool) $this->replied_by_me),
            'acknowledged_at' => $this->when($this->acknowledged_at !== null, fn () => $this->acknowledged_at->toIso8601String(), null),
            'sent_at' => $this->when($this->sent_at !== null, fn () => $this->sent_at->toIso8601String(), null),
            'scheduled_at' => $this->when($this->scheduled_at !== null, fn () => $this->scheduled_at->toIso8601String(), null),
            'created_at' => $this->when($this->created_at !== null, fn () => $this->created_at->toIso8601String(), null),
            // Lien signé et temporaire : le fichier est privé (voir AttachmentController)
            'attachment_url' => \App\Support\Attachments::signedUrl('message', (int) $this->id, $this->fichier, $request->user()?->id),
            'attachment_name' => $this->fichier ? basename((string) $this->fichier) : null,
            'attachment_path' => $this->fichier ? (string) $this->fichier : null,
            'message_group_uuid' => $this->message_group_uuid,
            'parent_id' => $this->parent_id,
            'replies' => $this->whenLoaded('replies', fn () => ReplyResource::collection($this->replies)),
        ];
    }

    /**
     * Merge the primary receiver and the JSON recipients into a unique id list.
     *
     * @return array<int, int>
     */
    private function receiverIds(): array
    {
        $ids = collect((array) ($this->receiver_ids ?? []))
            ->push($this->receiver_id)
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

        return $ids;
    }

    /**
     * Compact user payload used for sender / receiver.
     *
     * @return array<string, mixed>|null
     */
    private function briefUser(mixed $user): ?array
    {
        if (! $user) {
            return null;
        }

        return [
            'id' => (int) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => optional($user->role)->nom_role,
        ];
    }
}
