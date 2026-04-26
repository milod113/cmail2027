<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MessageTask extends Model
{
    use HasFactory;

    protected $fillable = [
        'message_id',
        'owner_id',
        'meeting_id',
        'meeting_topic_id',
        'meeting_topic_action_id',
        'title',
        'description',
        'due_date',
        'reminder_at',
        'priority',
        'is_completed',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'datetime',
            'reminder_at' => 'datetime',
            'is_completed' => 'boolean',
        ];
    }

    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function meeting(): BelongsTo
    {
        return $this->belongsTo(Meeting::class);
    }

    public function meetingTopic(): BelongsTo
    {
        return $this->belongsTo(MeetingTopic::class, 'meeting_topic_id');
    }

    public function meetingTopicAction(): BelongsTo
    {
        return $this->belongsTo(MeetingTopicAction::class, 'meeting_topic_action_id');
    }
}
