<?php

namespace App\Models;

use App\Support\MessageCategorizer;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Schema;

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
        'is_escalated',
        'escalated_to_id',
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
        'is_escalated' => 'boolean',
        'lu' => 'boolean',
        'spam' => 'boolean',
        'important' => 'boolean',
        'is_important' => 'boolean',
        'is_tracked' => 'boolean',
        'is_delivered' => 'boolean',
        'requires_receipt' => 'boolean',
        'archived' => 'boolean',
        'last_pinged_at' => 'datetime',
        'sender_archived_at' => 'datetime',
        'receiver_archived_at' => 'datetime',
        'sender_deleted_at' => 'datetime',
        'receiver_deleted_at' => 'datetime',
        'envoye' => 'boolean',
        'can_be_redirected' => 'boolean',
        'category_confidence' => 'float',
    ];

    protected static function booted(): void
    {
        // E-mail « nouveau message » au destinataire, dès que le message est livré
        static::created(function (self $message): void {
            \App\Support\MessageEmailNotifier::delivered($message);
            // Pièce jointe PDF / image : extraction du texte en arrière-plan (recherche dans les scans)
            if (filled($message->fichier)) {
                \App\Models\AttachmentText::queueFor($message->fichier);
            }
        });
        static::updated(function (self $message): void {
            if ($message->wasChanged('is_delivered') && $message->is_delivered) {
                \App\Support\MessageEmailNotifier::delivered($message);
            }
        });

        static::creating(function (self $message): void {
            if (! Schema::hasColumn($message->getTable(), 'category')) {
                return;
            }

            if (filled($message->category)) {
                return;
            }

            $classification = app(MessageCategorizer::class)->categorize(
                (string) $message->sujet,
                (string) $message->contenu,
                $message->type_message
            );

            $message->category = $classification['category'];

            if (Schema::hasColumn($message->getTable(), 'category_source')) {
                $message->category_source = $classification['source'];
            }

            if (Schema::hasColumn($message->getTable(), 'category_confidence')) {
                $message->category_confidence = $classification['confidence'];
            }
        });
    }

    /**
     * Côté de l'utilisateur sur ce message : 'sender', 'receiver' ou null.
     * (Archivage / suppression sont personnels : chacun agit sur son côté.)
     */
    public function sideFor(int $userId): ?string
    {
        if ((int) $this->receiver_id === $userId) {
            return 'receiver';
        }
        if ((int) $this->sender_id === $userId) {
            return 'sender';
        }

        return null;
    }

    /** Messages visibles dans la boîte de réception de l'utilisateur. */
    public function scopeInboxVisibleFor(Builder $query, int $userId): Builder
    {
        return $query
            ->where('receiver_id', $userId)
            ->where('archived', false)
            ->whereNull('receiver_archived_at')
            ->whereNull('receiver_deleted_at');
    }

    /** Messages visibles dans les « Envoyés » de l'utilisateur. */
    public function scopeSentVisibleFor(Builder $query, int $userId): Builder
    {
        return $query
            ->where('sender_id', $userId)
            ->where('archived', false)
            ->whereNull('sender_archived_at')
            ->whereNull('sender_deleted_at');
    }

    /** Messages archivés par l'utilisateur (de son côté), non supprimés. */
    public function scopeArchivedFor(Builder $query, int $userId): Builder
    {
        return $query->where(function (Builder $q) use ($userId) {
            $q->where(fn ($s) => $s->where('sender_id', $userId)->whereNotNull('sender_archived_at')->whereNull('sender_deleted_at'))
                ->orWhere(fn ($r) => $r->where('receiver_id', $userId)->whereNotNull('receiver_archived_at')->whereNull('receiver_deleted_at'))
                // Archivage global (modération) : toujours visible dans les archives des participants.
                ->orWhere(fn ($g) => $g->where('archived', true)->where(fn ($p) => $p->where('sender_id', $userId)->orWhere('receiver_id', $userId)));
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

    public function escalatedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'escalated_to_id');
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
