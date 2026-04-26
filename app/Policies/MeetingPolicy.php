<?php

namespace App\Policies;

use App\Models\Meeting;
use App\Models\User;

class MeetingPolicy
{
    public function view(User $user, Meeting $meeting): bool
    {
        if ((int) $meeting->organizer_id === (int) $user->id) {
            return true;
        }

        return $meeting->participants()
            ->where('users.id', $user->id)
            ->exists();
    }

    public function manage(User $user, Meeting $meeting): bool
    {
        return (int) $meeting->organizer_id === (int) $user->id;
    }
}
