<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MeetingSection extends Model
{
    use HasFactory;

    protected $fillable = [
        'meeting_id',
        'title',
        'order',
    ];

    public function meeting(): BelongsTo
    {
        return $this->belongsTo(Meeting::class);
    }

    public function topics(): HasMany
    {
        return $this->hasMany(MeetingTopic::class)->orderBy('order');
    }
}
