<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'sender_id',
        'receiver_id',
        'sujet',
        'contenu',
        'fichier',
        'lu_le',
        'lu',
        'spam',
        'important',
        'sent_at',
        'requires_receipt',
        'receipt_requested_at',
        'scheduled_at',
        'archived',
        'type_message',
        'envoye',
        'deadline_reponse',
        'can_be_redirected',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'scheduled_at' => 'datetime',
        'lu_le' => 'datetime',
        'receipt_requested_at' => 'datetime',
        'deadline_reponse' => 'datetime',
        'lu' => 'boolean',
        'spam' => 'boolean',
        'important' => 'boolean',
        'requires_receipt' => 'boolean',
        'archived' => 'boolean',
        'envoye' => 'boolean',
        'can_be_redirected' => 'boolean',
    ];

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }
}
