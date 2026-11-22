<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Prévient l'expéditeur que ses messages ont été lus (« Vu »).
 */
class ChatMessagesRead implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $senderUserId,
        public int $readerUserId,
        public int $upToId,
    ) {
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel("user.{$this->senderUserId}")];
    }

    public function broadcastAs(): string
    {
        return 'ChatMessagesRead';
    }

    public function broadcastWith(): array
    {
        return ['reader_id' => $this->readerUserId, 'up_to_id' => $this->upToId, 'read_at' => now()->toIso8601String()];
    }
}
