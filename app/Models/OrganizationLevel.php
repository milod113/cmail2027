<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class OrganizationLevel extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_category_id',
        'name',
        'code',
        'rank',
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

    public function organizationalUnits(): HasMany
    {
        return $this->hasMany(OrganizationalUnit::class);
    }

    public function organizationCategory(): BelongsTo
    {
        return $this->belongsTo(OrganizationCategory::class);
    }
}
