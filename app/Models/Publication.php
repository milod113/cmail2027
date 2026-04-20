<?php

namespace App\Models;

use App\Support\RichTextSanitizer;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Auth;

class Publication extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'content',
        'photo_path',
        'archived',
    ];

    protected $appends = [
        'is_liked_by_current_user',
        'photo_url',
    ];

    protected $casts = [
        'archived' => 'boolean',
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
            ->where('archived', false)
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

        $path = ltrim((string) $this->photo_path, '/');

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        // Normalize legacy values like "public/..." or "storage/..."
        $path = preg_replace('#^(public/|storage/)#', '', $path) ?? $path;

        return '/storage/'.$path;
    }

    public function getContentAttribute(?string $value): string
    {
        return RichTextSanitizer::sanitize($value);
    }
}
