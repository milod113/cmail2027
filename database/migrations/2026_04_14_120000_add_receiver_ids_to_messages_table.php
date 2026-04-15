<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->json('receiver_ids')->nullable()->after('receiver_id');
        });

        DB::table('messages')
            ->whereNotNull('receiver_id')
            ->update([
                'receiver_ids' => DB::raw('JSON_ARRAY(receiver_id)'),
            ]);
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn('receiver_ids');
        });
    }
};
