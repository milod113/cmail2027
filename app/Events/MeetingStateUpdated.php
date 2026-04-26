<?php

namespace App\Events;

use App\Models\Meeting;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MeetingStateUpdated implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public Meeting $meeting,
        public string $context = 'updated',
    ) {
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('meeting.'.$this->meeting->id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'MeetingStateUpdated';
    }

    public function broadcastWith(): array
    {
        return [
            'meeting_id' => $this->meeting->id,
            'context' => $this->context,
        ];
    }
}
