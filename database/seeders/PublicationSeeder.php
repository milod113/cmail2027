<?php

namespace Database\Seeders;

use App\Models\Comment;
use App\Models\Like;
use App\Models\Publication;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Publications de démonstration (fil d'actualité) avec likes et commentaires.
 * Idempotent : une publication est identifiée par son titre.
 *
 *   php artisan db:seed --class=PublicationSeeder
 */
class PublicationSeeder extends Seeder
{
    public function run(): void
    {
        $publishers = User::query()->where('can_publish_publication', true)->pluck('id');
        if ($publishers->isEmpty()) {
            $publishers = User::query()->limit(3)->pluck('id');
        }
        $others = User::query()->limit(30)->pluck('id');
        if ($publishers->isEmpty() || $others->isEmpty()) {
            $this->command?->warn('Aucun utilisateur : exécutez d\'abord DatabaseSeeder.');

            return;
        }

        $items = [
            ['Plan blanc : exercice de simulation', "<p>Un exercice de déclenchement du <strong>plan blanc</strong> aura lieu le mardi 25 novembre à 9h00. Merci de vérifier la liste de rappel de votre service.</p>", 2],
            ['Déploiement de Cmail mobile', "<p>L'application <strong>Cmail mobile</strong> est disponible. Rendez-vous dans <em>Profil &gt; Mettre à jour l'application</em> pour installer la dernière version.</p>", 5],
            ['Campagne de vaccination antigrippale', "<p>La campagne de vaccination du personnel débute lundi à la médecine du travail, de 9h à 15h.</p>", 8],
            ['Maintenance du réseau informatique', "<p>Une coupure du réseau est prévue samedi de 22h à 24h pour maintenance. Pensez à enregistrer vos travaux.</p>", 12],
            ['Journée de formation : hygiène hospitalière', "<p>Une journée de formation sur l'<strong>hygiène hospitalière</strong> est organisée jeudi en salle de conférence. Inscriptions auprès de votre chef de service.</p>", 20],
            ['Félicitations à l\'équipe des urgences', "<p>Toute la direction félicite l'équipe des urgences pour son engagement lors de la dernière garde. Merci à tous !</p>", 30],
        ];

        $comments = [
            'Bien reçu, merci pour l\'information.',
            'Très bonne initiative !',
            'Pouvez-vous préciser l\'horaire ?',
            'Information transmise à mon équipe.',
            'Merci.',
        ];

        foreach ($items as $i => [$title, $html, $hoursAgo]) {
            $at = Carbon::now()->subHours($hoursAgo);
            $publication = Publication::query()->firstOrNew(['title' => $title]);
            $publication->fill([
                'user_id' => $publishers[$i % $publishers->count()],
                'content' => $html,
                'archived' => false,
            ]);
            $publication->created_at = $at;
            $publication->updated_at = $at;
            $publication->save();

            // Likes (3 à 6 utilisateurs différents)
            foreach ($others->shuffle()->take(3 + $i % 4) as $uid) {
                Like::query()->firstOrCreate(['publication_id' => $publication->id, 'user_id' => $uid]);
            }

            // Commentaires (une seule fois par publication)
            if ($publication->comments()->doesntExist()) {
                foreach ($others->shuffle()->take(1 + $i % 3) as $k => $uid) {
                    $comment = new Comment([
                        'publication_id' => $publication->id,
                        'user_id' => $uid,
                        'content' => $comments[($i + $k) % count($comments)],
                    ]);
                    $comment->created_at = $at->copy()->addMinutes(20 * ($k + 1));
                    $comment->updated_at = $comment->created_at;
                    $comment->save();
                }
            }
        }

        $this->command?->info('Publications de démonstration : '.Publication::query()->count().' au total.');
    }
}
