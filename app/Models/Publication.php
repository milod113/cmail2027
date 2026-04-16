<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class Publication extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'content',
        'photo_path',
    ];

    protected $appends = [
        'is_liked_by_current_user',
        'photo_url',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class)->latest();
    }

    public function likes(): HasMany
    {
        return $this->hasMany(Like::class);
    }

    public function scopeFeed(Builder $query): Builder
    {
        return $query
            ->with([
                'user:id,name,email',
                'comments' => fn ($commentQuery) => $commentQuery
                    ->with('user:id,name,email')
                    ->latest(),
                'likes:id,publication_id,user_id',
            ])
            ->withCount(['likes', 'comments'])
            ->latest();
    }

    public function getIsLikedByCurrentUserAttribute(): bool
    {
        $authUserId = Auth::id();

        if (! $authUserId) {
            return false;
        }

        if ($this->relationLoaded('likes')) {
            return $this->likes->contains(fn (Like $like) => $like->user_id === $authUserId);
        }

        return $this->likes()->where('user_id', $authUserId)->exists();
    }

    public function getPhotoUrlAttribute(): ?string
    {
        if (! $this->photo_path) {
            return null;
        }

        return Storage::disk('public')->url($this->photo_path);
    }
}
