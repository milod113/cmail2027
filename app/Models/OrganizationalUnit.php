<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class OrganizationalUnit extends Model
{
    use HasFactory;

    protected $fillable = [
        'establishment_id',
        'organization_level_id',
        'organization_category_id',
        'name',
        'code',
        'department_id',
        'parent_id',
        'manager_user_id',
        'is_active',
        'description',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function establishment(): BelongsTo
    {
        return $this->belongsTo(Establishment::class);
    }

    public function organizationLevel(): BelongsTo
    {
        return $this->belongsTo(OrganizationLevel::class);
    }

    public function organizationCategory(): BelongsTo
    {
        return $this->belongsTo(OrganizationCategory::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_user_id');
    }

    public function positions(): HasMany
    {
        return $this->hasMany(Position::class);
    }

    public function activePositions(): HasMany
    {
        return $this->hasMany(Position::class)->where('is_active', true);
    }
}
