<?php

namespace App\Events;

use App\Models\MeetingNote;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NoteCreated implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

    public function __construct(public MeetingNote $note)
    {
        $this->note->loadMissing([
            'user:id,name,email',
            'topic.section:id,meeting_id',
        ]);
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('meeting.'.$this->meetingId()),
        ];
    }

    public function broadcastAs(): string
    {
        return 'NoteCreated';
    }

    public function broadcastWhen(): bool
    {
        return ! (bool) $this->note->is_private;
    }

    public function broadcastWith(): array
    {
        return [
            'note' => [
                'id' => $this->note->id,
                'meeting_id' => $this->meetingId(),
                'meeting_topic_id' => $this->note->meeting_topic_id,
                'content' => $this->note->content,
                'is_private' => (bool) $this->note->is_private,
                'created_at' => optional($this->note->created_at)?->toIso8601String(),
                'user' => $this->note->user
                    ? [
                        'id' => $this->note->user->id,
                        'name' => $this->note->user->name,
                        'email' => $this->note->user->email,
                    ]
                    : null,
            ],
        ];
    }

    private function meetingId(): int
    {
        return (int) $this->note->topic->section->meeting_id;
    }
}
