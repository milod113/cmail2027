<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Dictée vocale : enregistrement envoyé par le téléphone, transcrit sur le serveur.
 */
class Dictation extends Model
{
    protected $fillable = ['user_id', 'status', 'language', 'audio_path', 'duration', 'text', 'error', 'processing_seconds'];

    protected $casts = [
        'duration' => 'float',
        'processing_seconds' => 'float',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
