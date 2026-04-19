<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Query\Builder;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('messages', 'scheduled_at') || ! Schema::hasColumn('messages', 'status')) {
            Schema::table('messages', function (Blueprint $table) {
                if (! Schema::hasColumn('messages', 'scheduled_at')) {
                    $table->timestamp('scheduled_at')->nullable()->after('sent_at');
                }

                if (! Schema::hasColumn('messages', 'status')) {
                    $table->enum('status', ['draft', 'scheduled', 'sent'])
                        ->default('sent')
                        ->after('scheduled_at');
                }
            });
        }

        DB::table('messages')
            ->when(
                Schema::hasColumn('messages', 'status'),
                fn (Builder $query) => $query->where('status', '!=', 'sent')->orWhereNull('status')
            )
            ->update([
                'status' => 'sent',
            ]);

        DB::table('messages')
            ->whereNotNull('scheduled_at')
            ->where(function (Builder $query) {
                if (Schema::hasColumn('messages', 'is_delivered')) {
                    $query->where('is_delivered', false);
                }

                $query->orWhereNull('sent_at');
            })
            ->update([
                'status' => 'scheduled',
            ]);

        DB::table('messages')
            ->whereNull('scheduled_at')
            ->whereNull('sent_at')
            ->when(
                Schema::hasColumn('messages', 'envoye'),
                fn (Builder $query) => $query->where('envoye', false)
            )
            ->update([
                'status' => 'draft',
            ]);
    }

    public function down(): void
    {
        if (Schema::hasColumn('messages', 'status')) {
            Schema::table('messages', function (Blueprint $table) {
                $table->dropColumn('status');
            });
        }
    }
};
