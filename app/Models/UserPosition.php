<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class UserPosition extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'position_id',
        'is_primary',
        'is_acting',
        'starts_at',
        'ends_at',
        'is_active',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'is_acting' => 'boolean',
        'is_active' => 'boolean',
        'starts_at' => 'date',
        'ends_at' => 'date',
    ];

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopePrimary(Builder $query): Builder
    {
        return $query->where('is_primary', true);
    }

    public function scopeCurrent(Builder $query): Builder
    {
        return $query
            ->where('is_active', true)
            ->where(function (Builder $builder) {
                $builder->whereNull('starts_at')->orWhereDate('starts_at', '<=', now()->toDateString());
            })
            ->where(function (Builder $builder) {
                $builder->whereNull('ends_at')->orWhereDate('ends_at', '>=', now()->toDateString());
            });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class);
    }

}
