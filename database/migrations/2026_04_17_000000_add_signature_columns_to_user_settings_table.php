<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('user_settings', function (Blueprint $table) {
            if (! Schema::hasColumn('user_settings', 'custom_signature')) {
                $table->text('custom_signature')->nullable()->after('ooo_message');
            }

            if (! Schema::hasColumn('user_settings', 'use_auto_signature')) {
                $table->boolean('use_auto_signature')->default(true)->after('custom_signature');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_settings', function (Blueprint $table) {
            if (Schema::hasColumn('user_settings', 'use_auto_signature')) {
                $table->dropColumn('use_auto_signature');
            }

            if (Schema::hasColumn('user_settings', 'custom_signature')) {
                $table->dropColumn('custom_signature');
            }
        });
    }
};
