<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('messages', 'scheduled_at') || ! Schema::hasColumn('messages', 'is_delivered')) {
            Schema::table('messages', function (Blueprint $table) {
                if (! Schema::hasColumn('messages', 'scheduled_at')) {
                    $table->timestamp('scheduled_at')->nullable()->after('sent_at');
                }

                if (! Schema::hasColumn('messages', 'is_delivered')) {
                    $table->boolean('is_delivered')->default(false)->after('scheduled_at');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('messages', 'is_delivered')) {
            Schema::table('messages', function (Blueprint $table) {
                if (Schema::hasColumn('messages', 'is_delivered')) {
                    $table->dropColumn('is_delivered');
                }
            });
        }
    }
};
