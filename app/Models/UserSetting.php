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
        'escalation_enabled',
        'backup_user_id',
        'escalation_timeout',
        'custom_signature',
        'use_auto_signature',
    ];

    protected $casts = [
        'is_out_of_office' => 'boolean',
        'redirect_messages' => 'boolean',
        'escalation_enabled' => 'boolean',
        'escalation_timeout' => 'integer',
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

    public function backupUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'backup_user_id');
    }
}
