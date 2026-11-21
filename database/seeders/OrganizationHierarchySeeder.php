<?php

namespace Database\Seeders;

use App\Models\Establishment;
use App\Models\MessageEscalationRule;
use App\Models\OrganizationCategory;
use App\Models\OrganizationLevel;
use App\Models\OrganizationalUnit;
use App\Models\Position;
use App\Models\Role;
use Illuminate\Database\Seeder;

class OrganizationHierarchySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Administratif',
                'code' => 'ADMINISTRATIF',
                'description' => 'Organigramme administratif et de support.',
            ],
            [
                'name' => 'Medical',
                'code' => 'MEDICAL',
                'description' => 'Organigramme des services et unites medicales.',
            ],
            [
                'name' => 'Chirurgical',
                'code' => 'CHIRURGICAL',
                'description' => 'Organigramme des services et unites chirurgicales.',
            ],
        ];

        foreach ($categories as $category) {
            OrganizationCategory::updateOrCreate(
                ['code' => $category['code']],
                [
                    'name' => $category['name'],
                    'is_active' => true,
                    'description' => $category['description'],
                ],
            );
        }

        $administrativeCategory = OrganizationCategory::query()->where('code', 'ADMINISTRATIF')->first();

        $levels = [
            ['name' => 'Direction generale', 'code' => 'DIRECTION_GENERALE', 'rank' => 1],
            ['name' => 'Direction', 'code' => 'DIRECTION', 'rank' => 2],
            ['name' => 'Sous-direction', 'code' => 'SOUS_DIRECTION', 'rank' => 3],
            ['name' => 'Bureau', 'code' => 'BUREAU', 'rank' => 4],
        ];

        foreach ($levels as $level) {
            OrganizationLevel::updateOrCreate(
                ['code' => $level['code']],
                [
                    'organization_category_id' => $administrativeCategory?->id,
                    'name' => $level['name'],
                    'rank' => $level['rank'],
                    'is_active' => true,
                ],
            );
        }

        $establishment = Establishment::query()->first();
        $generalLevel = OrganizationLevel::query()->where('code', 'DIRECTION_GENERALE')->first();
        $directionLevel = OrganizationLevel::query()->where('code', 'DIRECTION')->first();
        $bureauLevel = OrganizationLevel::query()->where('code', 'BUREAU')->first();

        if (! $establishment || ! $generalLevel || ! $directionLevel || ! $bureauLevel) {
            return;
        }

        $rootUnit = OrganizationalUnit::updateOrCreate(
            ['code' => 'SAMPLE-DIR-GEN'],
            [
                'establishment_id' => $establishment->id,
                'organization_level_id' => $generalLevel->id,
                'organization_category_id' => $administrativeCategory?->id,
                'name' => 'Direction generale',
                'is_active' => true,
                'description' => 'Exemple minimal. L organigramme reel doit etre cree par l admin.',
            ],
        );

        $sampleDirection = OrganizationalUnit::updateOrCreate(
            ['code' => 'SAMPLE-DAPM'],
            [
                'establishment_id' => $establishment->id,
                'organization_level_id' => $directionLevel->id,
                'organization_category_id' => $administrativeCategory?->id,
                'name' => 'Direction des activites medicales et paramedicales',
                'parent_id' => $rootUnit->id,
                'is_active' => true,
            ],
        );

        $sampleBureau = OrganizationalUnit::updateOrCreate(
            ['code' => 'SAMPLE-COMM'],
            [
                'establishment_id' => $establishment->id,
                'organization_level_id' => $bureauLevel->id,
                'organization_category_id' => $administrativeCategory?->id,
                'name' => 'Bureau de communication',
                'parent_id' => $sampleDirection->id,
                'is_active' => true,
            ],
        );

        $directionPosition = Position::updateOrCreate(
            ['code' => 'SAMPLE-POS-DIR'],
            [
                'title' => 'Directeur',
                'organizational_unit_id' => $sampleDirection->id,
                'role_id' => Role::query()->where('nom_role', 'Directeur')->value('id'),
                'is_head' => true,
                'is_active' => true,
                'hierarchy_order' => 10,
            ],
        );

        Position::updateOrCreate(
            ['code' => 'SAMPLE-POS-CB'],
            [
                'title' => 'Chef de bureau',
                'organizational_unit_id' => $sampleBureau->id,
                'role_id' => Role::query()->where('nom_role', 'Chef De Bureau')->value('id'),
                'reports_to_position_id' => $directionPosition->id,
                'is_head' => true,
                'is_active' => true,
                'hierarchy_order' => 20,
            ],
        );

        MessageEscalationRule::updateOrCreate(
            ['name' => 'Escalade globale vers le superieur hierarchique'],
            [
                'scope_type' => 'global',
                'scope_id' => null,
                'escalate_after_minutes' => 120,
                'target_type' => 'reports_to_position',
                'target_id' => null,
                'stop_after_first_hop' => false,
                'is_active' => true,
                'description' => 'Regle par defaut. L application de la logique metier viendra dans une etape separee.',
            ],
        );
    }
}
