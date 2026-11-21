<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MessageEscalationRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'scope_type',
        'scope_id',
        'escalate_after_minutes',
        'target_type',
        'target_id',
        'stop_after_first_hop',
        'is_active',
        'description',
    ];

    protected $casts = [
        'stop_after_first_hop' => 'boolean',
        'is_active' => 'boolean',
    ];
}
