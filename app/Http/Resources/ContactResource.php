<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Schema;

class ContactResource extends JsonResource
{
    /**
     * Transform a user into a lightweight contact card.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $hasLastSeenAt = Schema::hasColumn('users', 'last_seen_at');
        $lastSeenAt = $hasLastSeenAt ? $this->last_seen_at : null;
        $isOnline = $hasLastSeenAt
            ? (bool) $this->is_online
                && $lastSeenAt !== null
                && $lastSeenAt->gte(now()->subMinutes(2))
            : (bool) $this->is_online;

        return [
            'id' => (int) $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'email' => $this->email,
            'department' => $this->whenLoaded('department', fn () => $this->department ? [
                'id' => (int) $this->department->id,
                'name' => $this->department->name,
            ] : null),
            'role' => $this->whenLoaded('role', fn () => $this->role ? [
                'id' => (int) $this->role->id,
                'nom_role' => $this->role->nom_role,
            ] : null),
            'is_online' => $isOnline,
            'is_favorite' => in_array((int) $this->id, $request->attributes->get('favorite_contact_ids', []), true),
            'is_blocked' => (bool) $this->is_blocked,
            'last_seen_at' => $this->when($lastSeenAt !== null, fn () => $lastSeenAt->toIso8601String(), null),
            'telephone' => $this->whenLoaded('profile', fn () => $this->profile?->telephone),
            'avatar_url' => $this->whenLoaded('profile', fn () => $this->profile?->photo ? Storage::disk('public')->url($this->profile->photo) : null),
        ];
    }
}
