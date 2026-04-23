<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_settings', function (Blueprint $table) {
            if (! Schema::hasColumn('user_settings', 'escalation_enabled')) {
                $table->boolean('escalation_enabled')->default(false)->after('redirect_messages');
            }

            if (! Schema::hasColumn('user_settings', 'backup_user_id')) {
                $table->foreignId('backup_user_id')
                    ->nullable()
                    ->after('delegate_user_id')
                    ->constrained('users')
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('user_settings', 'escalation_timeout')) {
                $table->unsignedInteger('escalation_timeout')->default(15)->after('backup_user_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('user_settings', function (Blueprint $table) {
            if (Schema::hasColumn('user_settings', 'backup_user_id')) {
                $table->dropConstrainedForeignId('backup_user_id');
            }

            if (Schema::hasColumn('user_settings', 'escalation_timeout')) {
                $table->dropColumn('escalation_timeout');
            }

            if (Schema::hasColumn('user_settings', 'escalation_enabled')) {
                $table->dropColumn('escalation_enabled');
            }
        });
    }
};
