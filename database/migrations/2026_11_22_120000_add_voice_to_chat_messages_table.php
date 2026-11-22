<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Messages vocaux dans le chat : type (text | voice), fichier audio privé et durée.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->string('type', 16)->default('text')->after('receiver_id');
            $table->string('audio_path')->nullable()->after('body');
            $table->unsignedInteger('duration_ms')->nullable()->after('audio_path');
            $table->text('body')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->dropColumn(['type', 'audio_path', 'duration_ms']);
        });
    }
};
