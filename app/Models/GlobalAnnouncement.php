<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Builder;

class GlobalAnnouncement extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'content',
        'created_by',
        'audience_type',
        'role_id',
        'department_id',
        'priority',
        'starts_at',
        'ends_at',
        'is_published',
        'requires_acknowledgement',
        'is_pinned',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'is_published' => 'boolean',
            'requires_acknowledgement' => 'boolean',
            'is_pinned' => 'boolean',
            'published_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function recipients(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'global_announcement_user')
            ->withPivot([
                'id',
                'is_read',
                'read_at',
                'is_acknowledged',
                'acknowledged_at',
            ])
            ->withTimestamps();
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
    }

    public function scopeCurrentlyActive(Builder $query): Builder
    {
        return $query
            ->where(function (Builder $builder) {
                $builder
                    ->whereNull('starts_at')
                    ->orWhere('starts_at', '<=', now());
            })
            ->where(function (Builder $builder) {
                $builder
                    ->whereNull('ends_at')
                    ->orWhere('ends_at', '>=', now());
            });
    }
}
