<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PersonalReminder extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'content',
        'remind_at',
        'is_completed',
    ];

    protected $casts = [
        'remind_at' => 'datetime',
        'is_completed' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
