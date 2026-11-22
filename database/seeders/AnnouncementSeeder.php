<?php

namespace Database\Seeders;

use App\Models\GlobalAnnouncement;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Annonces de la direction de démonstration, adressées à tous les utilisateurs.
 * Idempotent : une annonce est identifiée par son titre.
 *
 *   php artisan db:seed --class=AnnouncementSeeder
 */
class AnnouncementSeeder extends Seeder
{
    public function run(): void
    {
        $author = User::query()->find(3)?->id ?? User::query()->value('id');
        $userIds = User::query()->pluck('id');
        if (! $author || $userIds->isEmpty()) {
            $this->command?->warn('Aucun utilisateur : exécutez d\'abord DatabaseSeeder.');

            return;
        }

        $items = [
            [
                'title' => 'Déclenchement du plan blanc – exercice du 25 novembre',
                'content' => '<p>Un exercice de déclenchement du <strong>plan blanc</strong> aura lieu le mardi 25 novembre à 9h00.</p><p>Chaque chef de service doit vérifier que la liste de rappel du personnel est à jour et que les numéros de téléphone sont joignables.</p>',
                'priority' => 'urgent',
                'is_pinned' => true,
                'requires_acknowledgement' => true,
                'hours' => 3,
                'ends_days' => 4,
            ],
            [
                'title' => 'Nouvelle procédure de gestion des congés',
                'content' => '<p>À compter du 1er décembre, les demandes de congé se font exclusivement via Cmail. Les formulaires papier ne seront plus acceptés.</p>',
                'priority' => 'important',
                'is_pinned' => false,
                'requires_acknowledgement' => true,
                'hours' => 20,
                'ends_days' => 15,
            ],
            [
                'title' => 'Application Cmail mobile disponible',
                'content' => "<p>L'application Cmail est disponible sur Android. Les mises à jour s'installent depuis <em>Profil &gt; Mettre à jour l'application</em>.</p>",
                'priority' => 'normal',
                'is_pinned' => false,
                'requires_acknowledgement' => false,
                'hours' => 30,
                'ends_days' => 30,
            ],
            [
                'title' => 'Fermeture du parking visiteurs',
                'content' => '<p>Le parking visiteurs sera fermé samedi et dimanche pour travaux de marquage. Merci d\'utiliser le parking du personnel.</p>',
                'priority' => 'normal',
                'is_pinned' => false,
                'requires_acknowledgement' => false,
                'hours' => 50,
                'ends_days' => 3,
            ],
        ];

        foreach ($items as $it) {
            $published = now()->subHours($it['hours']);
            $a = GlobalAnnouncement::query()->updateOrCreate(
                ['title' => $it['title']],
                [
                    'content' => $it['content'],
                    'created_by' => $author,
                    'audience_type' => 'all',
                    'priority' => $it['priority'],
                    'starts_at' => $published,
                    'ends_at' => now()->addDays($it['ends_days']),
                    'is_published' => true,
                    'requires_acknowledgement' => $it['requires_acknowledgement'],
                    'is_pinned' => $it['is_pinned'],
                    'published_at' => $published,
                ],
            );
            // Destinataires : tous les utilisateurs (sans écraser l'état lu / accusé existant)
            $a->recipients()->syncWithoutDetaching($userIds->all());
        }

        $this->command?->info('Annonces de démonstration : '.GlobalAnnouncement::query()->count().' au total.');
    }
}
