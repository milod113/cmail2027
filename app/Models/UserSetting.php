<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'is_out_of_office',
        'ooo_message',
        'redirect_messages',
        'delegate_user_id',
        'custom_signature',
        'use_auto_signature',
    ];

    protected $casts = [
        'is_out_of_office' => 'boolean',
        'redirect_messages' => 'boolean',
        'use_auto_signature' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function delegateUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'delegate_user_id');
    }
}
