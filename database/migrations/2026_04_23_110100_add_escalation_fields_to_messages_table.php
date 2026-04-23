<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            if (! Schema::hasColumn('messages', 'is_escalated')) {
                $table->boolean('is_escalated')->default(false)->after('read_at');
            }

            if (! Schema::hasColumn('messages', 'escalated_to_id')) {
                $table->foreignId('escalated_to_id')
                    ->nullable()
                    ->after('is_escalated')
                    ->constrained('users')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            if (Schema::hasColumn('messages', 'escalated_to_id')) {
                $table->dropConstrainedForeignId('escalated_to_id');
            }

            if (Schema::hasColumn('messages', 'is_escalated')) {
                $table->dropColumn('is_escalated');
            }
        });
    }
};
