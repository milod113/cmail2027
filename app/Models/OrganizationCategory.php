<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrganizationCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
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

    public function organizationLevels(): HasMany
    {
        return $this->hasMany(OrganizationLevel::class);
    }

    public function organizationalUnits(): HasMany
    {
        return $this->hasMany(OrganizationalUnit::class);
    }
}
