<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Relance d'un destinataire (accusé de réception / réponse attendue) :
 * on enregistre la date et le nombre de relances pour que le téléphone du
 * destinataire puisse la recevoir (notifications par interrogation, sans temps réel).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->timestamp('last_pinged_at')->nullable()->after('acknowledged_at');
            $table->unsignedSmallInteger('ping_count')->default(0)->after('last_pinged_at');
            $table->index(['receiver_id', 'last_pinged_at'], 'messages_receiver_pinged_idx');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex('messages_receiver_pinged_idx');
            $table->dropColumn(['last_pinged_at', 'ping_count']);
        });
    }
};
