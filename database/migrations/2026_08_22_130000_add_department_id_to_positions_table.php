<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('positions', function (Blueprint $table) {
            if (! Schema::hasColumn('positions', 'department_id')) {
                $table->foreignId('department_id')
                    ->nullable()
                    ->after('code')
                    ->constrained()
                    ->nullOnDelete();
            }
        });

        if (
            Schema::hasColumn('positions', 'organizational_unit_id') &&
            Schema::hasColumn('positions', 'department_id') &&
            Schema::hasTable('organizational_units') &&
            Schema::hasColumn('organizational_units', 'department_id')
        ) {
            DB::statement('
                UPDATE positions p
                INNER JOIN organizational_units ou ON ou.id = p.organizational_unit_id
                SET p.department_id = ou.department_id
                WHERE p.department_id IS NULL
                  AND ou.department_id IS NOT NULL
            ');
        }

        Schema::table('positions', function (Blueprint $table) {
            if (Schema::hasColumn('positions', 'department_id')) {
                $table->index(['department_id', 'is_active'], 'positions_department_active_idx');
            }
        });
    }

    public function down(): void
    {
        Schema::table('positions', function (Blueprint $table) {
            if (Schema::hasColumn('positions', 'department_id')) {
                $table->dropIndex('positions_department_active_idx');
                $table->dropConstrainedForeignId('department_id');
            }
        });
    }
};
