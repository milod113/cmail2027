<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class Position extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'code',
        'department_id',
        'organizational_unit_id',
        'role_id',
        'reports_to_position_id',
        'is_head',
        'is_active',
        'hierarchy_order',
        'description',
    ];

    protected $casts = [
        'is_head' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function organizationalUnit(): BelongsTo
    {
        return $this->belongsTo(OrganizationalUnit::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function reportsToPosition(): BelongsTo
    {
        return $this->belongsTo(self::class, 'reports_to_position_id');
    }

    public function directReports(): HasMany
    {
        return $this->hasMany(self::class, 'reports_to_position_id');
    }

    public function userPositions(): HasMany
    {
        return $this->hasMany(UserPosition::class);
    }

    public function activeUserPositions(): HasMany
    {
        return $this->hasMany(UserPosition::class)->where('is_active', true);
    }

    public function headAssignments(): HasMany
    {
        return $this->hasMany(UserPosition::class)->where('is_primary', true)->where('is_active', true);
    }
}
