<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReplyCreated implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int $messageId,
        public int $receiverUserId,
    ) {
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("message.{$this->messageId}"),
            new PrivateChannel("user.{$this->receiverUserId}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'ReplyCreated';
    }

    public function broadcastWith(): array
    {
        return [
            'message_id' => $this->messageId,
        ];
    }
}
