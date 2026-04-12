<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MessageDraft extends Model
{
    use HasFactory;

    protected $fillable = [
        'sender_id',
        'receiver_ids',
        'sujet',
        'contenu',
        'fichier',
        'important',
        'requires_receipt',
        'scheduled_at',
        'type_message',
        'deadline_reponse',
        'can_be_redirected',
    ];

    protected $casts = [
        'receiver_ids' => 'array',
        'important' => 'boolean',
        'requires_receipt' => 'boolean',
        'scheduled_at' => 'datetime',
        'deadline_reponse' => 'datetime',
        'can_be_redirected' => 'boolean',
    ];

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
