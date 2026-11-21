<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Archivage et suppression PERSONNELS : chaque participant (expéditeur /
 * destinataire) archive ou supprime le message pour lui seul ; l'autre le garde.
 *
 * La colonne `archived` existante reste l'indicateur global (modération admin).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->timestamp('sender_archived_at')->nullable()->after('archived');
            $table->timestamp('receiver_archived_at')->nullable()->after('sender_archived_at');
            $table->timestamp('sender_deleted_at')->nullable()->after('receiver_archived_at');
            $table->timestamp('receiver_deleted_at')->nullable()->after('sender_deleted_at');

            $table->index(['receiver_id', 'receiver_deleted_at', 'receiver_archived_at'], 'messages_receiver_personal_idx');
            $table->index(['sender_id', 'sender_deleted_at', 'sender_archived_at'], 'messages_sender_personal_idx');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex('messages_receiver_personal_idx');
            $table->dropIndex('messages_sender_personal_idx');
            $table->dropColumn(['sender_archived_at', 'receiver_archived_at', 'sender_deleted_at', 'receiver_deleted_at']);
        });
    }
};
