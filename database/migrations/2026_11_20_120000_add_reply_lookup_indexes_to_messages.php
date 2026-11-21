<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Index pour savoir rapidement si un utilisateur a répondu à un message
 * (compteur « À répondre », badge « Répondu » dans la réception).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->index(['sender_id', 'parent_id'], 'messages_sender_parent_idx');
            $table->index(['sender_id', 'message_group_uuid'], 'messages_sender_group_idx');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex('messages_sender_parent_idx');
            $table->dropIndex('messages_sender_group_idx');
        });
    }
};
