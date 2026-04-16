<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'sender_id',
        'receiver_id',
        'original_receiver_id',
        'receiver_ids',
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
        'message_group_uuid',
        'parent_id',
        'forwarded_from_message_id',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'scheduled_at' => 'datetime',
        'lu_le' => 'datetime',
        'receipt_requested_at' => 'datetime',
        'deadline_reponse' => 'datetime',
        'receiver_ids' => 'array',
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

    public function originalReceiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'original_receiver_id');
    }

    public function forwardedFrom(): BelongsTo
    {
        return $this->belongsTo(self::class, 'forwarded_from_message_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')
            ->with(['sender:id,name,email', 'receiver:id,name,email'])
            ->orderBy('created_at');
    }
}
