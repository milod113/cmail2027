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
        if (! Schema::hasColumn('messages', 'is_important') || ! Schema::hasColumn('messages', 'acknowledged_at')) {
            Schema::table('messages', function (Blueprint $table) {
                if (! Schema::hasColumn('messages', 'is_important')) {
                    $table->boolean('is_important')->default(false)->after('important');
                }

                if (! Schema::hasColumn('messages', 'acknowledged_at')) {
                    $table->timestamp('acknowledged_at')->nullable()->after('read_at');
                }
            });
        }

        if (Schema::hasColumn('messages', 'is_important') && Schema::hasColumn('messages', 'important')) {
            DB::table('messages')
                ->where('important', true)
                ->where(function (Builder $query) {
                    $query->where('is_important', false)->orWhereNull('is_important');
                })
                ->update([
                    'is_important' => true,
                ]);
        }
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $columns = [];

            if (Schema::hasColumn('messages', 'is_important')) {
                $columns[] = 'is_important';
            }

            if (Schema::hasColumn('messages', 'acknowledged_at')) {
                $columns[] = 'acknowledged_at';
            }

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
