<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MeetingTopic extends Model
{
    use HasFactory;

    protected $fillable = [
        'meeting_section_id',
        'title',
        'expected_duration',
        'status',
        'decision_summary',
        'order',
    ];

    protected function casts(): array
    {
        return [
            'expected_duration' => 'integer',
        ];
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(MeetingSection::class, 'meeting_section_id');
    }

    public function notes(): HasMany
    {
        return $this->hasMany(MeetingNote::class)->latest('created_at');
    }

    public function actions(): HasMany
    {
        return $this->hasMany(MeetingTopicAction::class)->latest('due_at');
    }
}
