<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Dictées vocales en cours de transcription.
 * L'audio est supprimé dès la transcription ; le texte est effacé après 24 h.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dictations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending')->index();
            $table->string('language', 8)->default('fr');
            $table->string('audio_path')->nullable();
            $table->decimal('duration', 6, 1)->nullable(); // secondes d'audio
            $table->text('text')->nullable();
            $table->string('error', 500)->nullable();
            $table->decimal('processing_seconds', 6, 1)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dictations');
    }
};
