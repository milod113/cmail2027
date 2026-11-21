<?php

use App\Models\OrganizationLevel;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('organizational_units', function (Blueprint $table) {
            if (! Schema::hasColumn('organizational_units', 'establishment_id')) {
                $table->foreignId('establishment_id')
                    ->nullable()
                    ->after('id')
                    ->constrained()
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('organizational_units', 'organization_level_id')) {
                $table->foreignId('organization_level_id')
                    ->nullable()
                    ->after('establishment_id')
                    ->constrained()
                    ->nullOnDelete();
            }
        });

        if (Schema::hasColumn('organizational_units', 'level') && Schema::hasColumn('organizational_units', 'organization_level_id')) {
            $levelsByRank = OrganizationLevel::query()
                ->get(['id', 'rank'])
                ->keyBy('rank');

            DB::table('organizational_units')
                ->select(['id', 'level', 'organization_level_id'])
                ->orderBy('id')
                ->get()
                ->each(function ($unit) use ($levelsByRank) {
                    if ($unit->organization_level_id) {
                        return;
                    }

                    $mappedLevel = $levelsByRank->get((int) $unit->level);

                    if (! $mappedLevel) {
                        return;
                    }

                    DB::table('organizational_units')
                        ->where('id', $unit->id)
                        ->update(['organization_level_id' => $mappedLevel->id]);
                });
        }

        Schema::table('organizational_units', function (Blueprint $table) {
            // Idempotent : sur une base neuve, cet index existe déjà (créé par la migration de la table)
            if (Schema::hasColumn('organizational_units', 'establishment_id')
                && Schema::hasColumn('organizational_units', 'organization_level_id')
                && ! Schema::hasIndex('organizational_units', 'org_units_establishment_level_idx')) {
                $table->index(
                    ['establishment_id', 'organization_level_id', 'is_active'],
                    'org_units_establishment_level_idx'
                );
            }
        });
    }

    public function down(): void
    {
        Schema::table('organizational_units', function (Blueprint $table) {
            if (Schema::hasColumn('organizational_units', 'organization_level_id')) {
                $table->dropIndex('org_units_establishment_level_idx');
                $table->dropConstrainedForeignId('organization_level_id');
            }

            if (Schema::hasColumn('organizational_units', 'establishment_id')) {
                $table->dropConstrainedForeignId('establishment_id');
            }
        });
    }
};
