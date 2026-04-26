<?php

use App\Models\Meeting;
use App\Models\Message;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('user.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('contacts.presence', function ($user) {
    return [
        'id' => (int) $user->id,
        'name' => $user->name,
    ];
});

Broadcast::channel('message.{messageId}', function ($user, $messageId) {
    return Message::query()
        ->whereKey($messageId)
        ->where(function ($query) use ($user) {
            $query
                ->where('sender_id', $user->id)
                ->orWhere('receiver_id', $user->id);
        })
        ->exists();
});

Broadcast::channel('meeting.{meetingId}', function ($user, $meetingId) {
    $meeting = Meeting::query()->find($meetingId);

    return $meeting
        ? Gate::forUser($user)->allows('view', $meeting)
        : false;
});
