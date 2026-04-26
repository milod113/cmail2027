<?php

namespace App\Events;

use App\Models\Meeting;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MeetingOpened implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(public Meeting $meeting)
    {
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('meeting.'.$this->meeting->id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'MeetingOpened';
    }

    public function broadcastWith(): array
    {
        return [
            'meeting_id' => $this->meeting->id,
            'status' => $this->meeting->status,
            'opened_at' => optional($this->meeting->opened_at)?->toIso8601String(),
        ];
    }
}
