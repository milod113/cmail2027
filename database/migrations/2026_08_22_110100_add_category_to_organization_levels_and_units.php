<?php

use App\Models\OrganizationCategory;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('organization_levels', function (Blueprint $table) {
            if (! Schema::hasColumn('organization_levels', 'organization_category_id')) {
                $table->foreignId('organization_category_id')
                    ->nullable()
                    ->after('id')
                    ->constrained()
                    ->nullOnDelete();
            }
        });

        Schema::table('organizational_units', function (Blueprint $table) {
            if (! Schema::hasColumn('organizational_units', 'organization_category_id')) {
                $table->foreignId('organization_category_id')
                    ->nullable()
                    ->after('organization_level_id')
                    ->constrained()
                    ->nullOnDelete();
            }
        });

        $administrativeCategoryId = OrganizationCategory::query()
            ->where('code', 'ADMINISTRATIF')
            ->value('id');

        if ($administrativeCategoryId) {
            DB::table('organization_levels')
                ->whereNull('organization_category_id')
                ->update(['organization_category_id' => $administrativeCategoryId]);

            DB::table('organizational_units')
                ->whereNull('organization_category_id')
                ->update(['organization_category_id' => $administrativeCategoryId]);
        }
    }

    public function down(): void
    {
        Schema::table('organizational_units', function (Blueprint $table) {
            if (Schema::hasColumn('organizational_units', 'organization_category_id')) {
                $table->dropConstrainedForeignId('organization_category_id');
            }
        });

        Schema::table('organization_levels', function (Blueprint $table) {
            if (Schema::hasColumn('organization_levels', 'organization_category_id')) {
                $table->dropConstrainedForeignId('organization_category_id');
            }
        });
    }
};
