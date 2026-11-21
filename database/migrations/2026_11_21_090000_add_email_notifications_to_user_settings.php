<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Réglage personnel : recevoir (ou non) un e-mail à chaque nouveau message Cmail.
 * Activé par défaut.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('user_settings', 'email_notifications')) {
            Schema::table('user_settings', function (Blueprint $table) {
                $table->boolean('email_notifications')->default(true)->after('use_auto_signature');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('user_settings', 'email_notifications')) {
            Schema::table('user_settings', function (Blueprint $table) {
                $table->dropColumn('email_notifications');
            });
        }
    }
};
