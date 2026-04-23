<?php

namespace App\Models;

use App\Support\MessageCategorizer;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;
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
        'read_at',
        'lu',
        'spam',
        'important',
        'is_important',
        'sent_at',
        'acknowledged_at',
        'requires_receipt',
        'is_tracked',
        'receipt_requested_at',
        'scheduled_at',
        'status',
        'is_delivered',
        'archived',
        'type_message',
        'category',
        'category_source',
        'category_confidence',
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
        'acknowledged_at' => 'datetime',
        'lu_le' => 'datetime',
        'read_at' => 'datetime',
        'receipt_requested_at' => 'datetime',
        'deadline_reponse' => 'datetime',
        'receiver_ids' => 'array',
        'lu' => 'boolean',
        'spam' => 'boolean',
        'important' => 'boolean',
        'is_important' => 'boolean',
        'is_tracked' => 'boolean',
        'is_delivered' => 'boolean',
        'requires_receipt' => 'boolean',
        'archived' => 'boolean',
        'envoye' => 'boolean',
        'can_be_redirected' => 'boolean',
        'category_confidence' => 'float',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $message): void {
            if (filled($message->category)) {
                return;
            }

            $classification = app(MessageCategorizer::class)->categorize(
                (string) $message->sujet,
                (string) $message->contenu,
                $message->type_message
            );

            $message->category = $classification['category'];
            $message->category_source = $classification['source'];
            $message->category_confidence = $classification['confidence'];
        });
    }

    public function scopePendingAcknowledge(Builder $query): Builder
    {
        return $query
            ->where(function (Builder $importanceQuery) {
                $importanceQuery
                    ->where('is_important', true)
                    ->orWhere('important', true);
            })
            ->whereNull('acknowledged_at');
    }

    public function scopeRequiresActionFrom(Builder $query, int $userId): Builder
    {
        return $query
            ->pendingAcknowledge()
            ->where(function (Builder $recipientQuery) use ($userId) {
                $recipientQuery->where('receiver_id', $userId);

                if ($this->hasCast('receiver_ids', 'array')) {
                    $recipientQuery->orWhereJsonContains('receiver_ids', $userId);
                }
            });
    }

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

    public function reports(): HasMany
    {
        return $this->hasMany(ReportedMessage::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }
}
