<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'email' => $this->email,
            'is_super_admin' => (bool) $this->is_super_admin,
            'department' => $this->whenLoaded('department', fn () => $this->department ? [
                'id' => $this->department->id,
                'name' => $this->department->name,
            ] : null),
            'role' => $this->whenLoaded('role', fn () => $this->role ? [
                'id' => $this->role->id,
                'nom_role' => $this->role->nom_role,
            ] : null),
            'profile' => $this->whenLoaded('profile', fn () => $this->profile ? [
                'matricule' => $this->profile->matricule,
                'grade' => $this->profile->grade,
                'telephone' => $this->profile->telephone,
            ] : null),
        ];
    }
}
