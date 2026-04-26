<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('meetings', function (Blueprint $table): void {
            $table->timestamp('opened_at')->nullable()->after('end_time');
            $table->timestamp('closed_at')->nullable()->after('opened_at');
        });

        Schema::table('meeting_participants', function (Blueprint $table): void {
            $table->timestamp('joined_at')->nullable()->after('user_id');
        });

        DB::table('meeting_participants')
            ->where('is_present', true)
            ->update([
                'joined_at' => now(),
            ]);

        Schema::table('meeting_participants', function (Blueprint $table): void {
            $table->dropColumn('is_present');
        });
    }

    public function down(): void
    {
        Schema::table('meeting_participants', function (Blueprint $table): void {
            $table->boolean('is_present')->default(false)->after('user_id');
        });

        DB::table('meeting_participants')
            ->whereNotNull('joined_at')
            ->update([
                'is_present' => true,
            ]);

        Schema::table('meeting_participants', function (Blueprint $table): void {
            $table->dropColumn('joined_at');
        });

        Schema::table('meetings', function (Blueprint $table): void {
            $table->dropColumn(['opened_at', 'closed_at']);
        });
    }
};
