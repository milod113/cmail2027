<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatMessageCreated implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public array $message,
        public int $senderUserId,
        public int $receiverUserId,
    ) {
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("user.{$this->senderUserId}"),
            new PrivateChannel("user.{$this->receiverUserId}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'ChatMessageCreated';
    }

    public function broadcastWith(): array
    {
        return [
            'message' => $this->message,
        ];
    }
}
