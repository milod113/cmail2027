<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatMessage extends Model
{
    protected $fillable = [
        'sender_id',
        'receiver_id',
        'type',
        'body',
        'audio_path',
        'duration_ms',
        'read_at',
    ];

    /** Durée maximale d'un message vocal (secondes). */
    public const MAX_VOICE_SECONDS = 180;

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
            'duration_ms' => 'integer',
        ];
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }
}
