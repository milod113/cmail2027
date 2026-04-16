<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupportTicket extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'category',
        'impact',
        'description',
        'screenshot_path',
        'status',
        'page_url',
        'user_agent',
        'browser',
        'platform',
        'screen_resolution',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
