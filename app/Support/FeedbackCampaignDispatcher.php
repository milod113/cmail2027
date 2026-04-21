<?php

namespace App\Support;

use App\Models\User;
use App\Notifications\SystemFeedbackRequested;
use Illuminate\Support\Collection;

class FeedbackCampaignDispatcher
{
    public function dispatch(): int
    {
        $users = User::query()
            ->where('is_blocked', false)
            ->get();

        $users->each(function (User $user): void {
            $user->unreadNotifications()
                ->where('data->type', 'feedback_request')
                ->delete();

            $user->notify(new SystemFeedbackRequested());
        });

        return $users->count();
    }
}
