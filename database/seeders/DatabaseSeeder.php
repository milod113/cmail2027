<?php

namespace Database\Seeders;

use App\Models\Establishment;
use App\Models\Role;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $roles = [
            ['nom_role' => 'directeur general', 'is_protected' => true, 'is_unique' => true],
            ['nom_role' => 'Secrétaire Général', 'is_protected' => true, 'is_unique' => true],
            ['nom_role' => 'Directeur', 'is_protected' => false, 'is_unique' => false],
            ['nom_role' => 'Sous Directeur', 'is_protected' => false, 'is_unique' => false],
            ['nom_role' => 'Chef Service', 'is_protected' => false, 'is_unique' => false],
            ['nom_role' => 'Chef De Bureau', 'is_protected' => false, 'is_unique' => false],
            ['nom_role' => 'User', 'is_protected' => false, 'is_unique' => false],
            ['nom_role' => 'Coordinateur des activités paramédicales', 'is_protected' => false, 'is_unique' => false],
            ['nom_role' => 'admin', 'is_protected' => false, 'is_unique' => false],
            ['nom_role' => 'Remplaçant', 'is_protected' => false, 'is_unique' => false],
            ['nom_role' => 'superadmin', 'is_protected' => true, 'is_unique' => false],
            ['nom_role' => 'organizer', 'is_protected' => false, 'is_unique' => false],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(
                ['nom_role' => $role['nom_role']],
                $role,
            );
        }

        $establishments = [
            ['name' => 'CHU de Tlemcen'],
            ['name' => 'Hôpital des Urgences'],
            ['name' => 'Centre de Diagnostic'],
        ];

        foreach ($establishments as $establishment) {
            Establishment::updateOrCreate(
                ['name' => $establishment['name']],
                $establishment,
            );
        }

        $defaultRoleId = Role::query()->where('nom_role', 'User')->value('id');

        $users = [
            [
                'name' => 'Dr. Fandi Bassim',
                'email' => 'fandi.bassim@cmail.test',
            ],
            [
                'name' => 'M. Berouine Kamal',
                'email' => 'kamal.berouine@cmail.test',
            ],
            [
                'name' => 'M. Mouhibi Abdeljalil',
                'email' => 'abdeljalil.mouhibi@cmail.test',
            ],
            [
                'name' => 'Direction Medicale',
                'email' => 'direction.medicale@cmail.test',
            ],
            [
                'name' => 'Service des Urgences',
                'email' => 'urgences@cmail.test',
            ],
            [
                'name' => 'Pharmacie Centrale',
                'email' => 'pharmacie@cmail.test',
            ],
            [
                'name' => 'Administration RH',
                'email' => 'rh@cmail.test',
            ],
            [
                'name' => 'Test User',
                'email' => 'test@example.com',
            ],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                [
                    'name' => $user['name'],
                    'username' => str($user['email'])->before('@')->slug('.')->value(),
                    'email_verified_at' => now(),
                    'role_id' => $defaultRoleId,
                    'password' => Hash::make('password'),
                ],
            );
        }

        $this->call([
            MeetingModuleSeeder::class,
        ]);
    }
}
