<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReplyResource extends JsonResource
{
    /**
     * Transform a threaded reply into a mobile-friendly array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'content' => $this->contenu,
            'created_at' => $this->when($this->created_at !== null, fn () => $this->created_at->toIso8601String(), null),
            'sender' => $this->briefUser($this->sender),
            'attachment_url' => \App\Support\Attachments::signedUrl('message', (int) $this->id, $this->fichier, $request->user()?->id),
            'attachment_name' => $this->fichier ? basename((string) $this->fichier) : null,
        ];
    }

    /**
     * Compact user payload used for the reply sender.
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