<?php

namespace Database\Seeders;

use App\Models\Message;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Ajoute un GROS volume de messages (sans rien supprimer) pour tester la tenue
 * de l'application : listes longues, pagination, fils de discussion nombreux,
 * messages groupés, filtres, compteurs.
 *
 *   php artisan db:seed --class=DemoBulkMessagesSeeder
 *
 * Volume (environ) : 130 reçus, 70 envoyés, 15 groupés, 250+ réponses,
 * 120 messages entre autres utilisateurs (bruit réaliste dans la base).
 */
class DemoBulkMessagesSeeder extends DemoMessagesSeeder
{
    private const ME = 'embarki1988@gmail.com';

    /** Objets types par catégorie : [objet, corps]. %s = service tiré au hasard. */
    private const TEMPLATES = [
        'urgent' => [
            ['URGENT – Panne du réseau au service %s', "Bonjour,\n\nLe réseau est coupé depuis ce matin au service %s. Les postes ne peuvent plus accéder au dossier patient. Merci d'intervenir au plus vite.\n\nCordialement."],
            ['URGENT – Rupture de stock de consommables (%s)', "Bonjour,\n\nNous sommes en rupture de gants et de compresses stériles au service %s. Pouvez-vous débloquer une livraison en urgence ?\n\nMerci."],
            ['Critique – Coupure électrique bloc %s', "Bonjour,\n\nUne micro-coupure a touché le bloc %s. Le groupe électrogène a pris le relais mais un onduleur est en défaut. Intervention demandée immédiatement."],
            ['URGENT – Lit de réanimation indisponible (%s)', "Bonjour,\n\nLe service %s n'a plus de lit de réanimation disponible. Merci de coordonner un transfert si nécessaire.\n\nLe chef de service."],
        ],
        'reunion' => [
            ['Réunion de service – %s', "Bonjour,\n\nUne réunion du service %s aura lieu jeudi à 10h00 en salle de staff.\n\nOrdre du jour :\n1. Bilan du mois\n2. Planning\n3. Questions diverses\n\nMerci de confirmer votre présence."],
            ['Comité de coordination – Préparation', "Bonjour,\n\nMerci de préparer vos indicateurs pour le comité de coordination de la semaine prochaine (activité, effectifs, incidents).\n\nCordialement."],
            ['Invitation – Point d\'étape projet informatisation (%s)', "Bonjour,\n\nJe vous invite au point d'étape sur l'informatisation du service %s, mardi à 14h00.\n\nCordialement."],
        ],
        'rh' => [
            ['Planning des gardes – %s', "Bonjour,\n\nVous trouverez ci-dessous le planning des gardes du service %s pour le mois prochain. Merci de signaler toute incompatibilité avant vendredi.\n\nCordialement."],
            ['Demande de congé – Validation', "Bonjour,\n\nJe sollicite un congé annuel du 15 au 29 du mois prochain. Mon intérim sera assuré par mon adjoint.\n\nRespectueusement."],
            ['Recrutement – Infirmiers pour le service %s', "Bonjour,\n\nLe service %s a besoin de deux infirmiers supplémentaires. Pouvez-vous lancer la procédure de recrutement ?\n\nMerci."],
            ['Formation obligatoire – Hygiène des mains', "Bonjour,\n\nLa formation obligatoire sur l'hygiène des mains est programmée pour l'ensemble du personnel. Merci d'inscrire vos équipes.\n\nCordialement."],
        ],
        'finance' => [
            ['Bon de commande – Matériel %s', "Bonjour,\n\nVeuillez trouver le bon de commande du matériel destiné au service %s. Merci de le valider pour engagement budgétaire.\n\nCordialement."],
            ['Facture fournisseur en attente', "Bonjour,\n\nUne facture fournisseur est en attente de visa depuis 15 jours. Pouvez-vous la traiter en priorité ?\n\nMerci."],
            ['Budget prévisionnel – Service %s', "Bonjour,\n\nMerci de transmettre le budget prévisionnel du service %s pour l'exercice prochain avant la fin du mois.\n\nCordialement."],
        ],
        'support' => [
            ['Imprimante en panne – %s', "Bonjour,\n\nL'imprimante du service %s affiche une erreur et n'imprime plus. Pouvez-vous passer ?\n\nMerci."],
            ['Mot de passe oublié – Accès au poste', "Bonjour,\n\nUn agent de mon service n'arrive plus à se connecter à son poste. Pouvez-vous réinitialiser son mot de passe ?\n\nMerci."],
            ['Installation d\'un nouveau poste – %s', "Bonjour,\n\nUn nouveau poste de travail doit être installé au service %s. Merci de prévoir l'intervention cette semaine.\n\nCordialement."],
            ['Lenteur de l\'application dossier patient', "Bonjour,\n\nL'application du dossier patient est très lente depuis hier au service %s. Pouvez-vous vérifier le serveur ?\n\nMerci."],
        ],
        'validation' => [
            ['Demande de validation – Achat %s', "Bonjour,\n\nJe sollicite votre validation pour l'achat d'équipements destinés au service %s.\n\nCordialement."],
            ['Visa requis – Convention de stage', "Bonjour,\n\nLa convention de stage des étudiants en soins infirmiers nécessite votre visa avant lundi.\n\nMerci."],
            ['Autorisation d\'accès – Archives %s', "Bonjour,\n\nMerci d'autoriser l'accès aux archives du service %s pour l'audit en cours.\n\nCordialement."],
        ],
        'information' => [
            ['Note d\'information – %s', "Bonjour,\n\nPour information, le service %s fonctionnera en effectif réduit la semaine prochaine en raison de travaux.\n\nCordialement."],
            ['Rappel – Port du badge obligatoire', "Bonjour,\n\nNous rappelons que le port du badge professionnel est obligatoire dans l'enceinte de l'établissement.\n\nLa Direction."],
            ['Mise à jour des procédures – %s', "Bonjour,\n\nLes procédures du service %s ont été mises à jour. Merci d'en prendre connaissance.\n\nCordialement."],
            ['Bilan mensuel d\'activité – %s', "Bonjour,\n\nVeuillez trouver ci-dessous le bilan d'activité du service %s pour le mois écoulé : hausse de 8 %% des consultations, durée moyenne de séjour stable.\n\nCordialement."],
        ],
    ];

    private const SERVICES = [
        'Urgences', 'Pédiatrie', 'Cardiologie', 'Radiologie', 'Pneumologie', 'Chirurgie générale',
        'Maternité', 'Laboratoire central', 'Pharmacie', 'Réanimation', 'Neurologie', 'Néphrologie',
        'Oncologie', 'Bureau des entrées', 'Ophtalmologie', 'Orthopédie', 'Gastro-entérologie',
    ];

    private const REPLIES = [
        'Bien reçu, merci.',
        "D'accord, c'est noté. Je m'en occupe.",
        'Je reviens vers vous dans la journée.',
        'Merci pour l\'information, je transmets à mon équipe.',
        'Pouvez-vous me donner plus de détails ?',
        "C'est fait, merci de vérifier de votre côté.",
        'Je suis en réunion, je vous réponds dès que possible.',
        "Oui, c'est validé.",
        'Non, ce ne sera pas possible cette semaine. Je propose lundi prochain.',
        "Pouvez-vous m'appeler sur mon poste ?",
        "L'intervention est programmée pour demain matin.",
        "Le problème est résolu, merci pour votre patience.",
        'Je vous envoie le document complété en fin de journée.',
        'Merci, je confirme ma présence.',
        "Je n'ai pas encore reçu le document, pouvez-vous le renvoyer ?",
        'Très bien, on fait comme ça.',
    ];

    public function run(): void
    {
        \App\Support\MessageEmailNotifier::$enabled = false; // pas d'e-mails pour les données de démonstration
        mt_srand((int) (microtime(true) * 1000) % PHP_INT_MAX); // contenu différent à chaque passage
        $me = User::query()->where('email', self::ME)->firstOrFail()->id;
        $others = User::query()->where('id', '!=', $me)->pluck('id')->all();
        $before = Message::query()->count();

        DB::transaction(function () use ($me, $others) {
            // ------------------------------------------------ reçus (130)
            for ($i = 0; $i < 130; $i++) {
                $from = $this->pick($others);
                $at = $this->randomDate(60);
                $root = $this->randomMessage($from, $me, $at);
                $this->thread($root, $from, $me, $at, maxReplies: 6);
            }

            // ------------------------------------------------ envoyés (70)
            for ($i = 0; $i < 70; $i++) {
                $to = $this->pick($others);
                $at = $this->randomDate(60);
                $root = $this->randomMessage($me, $to, $at);
                $this->thread($root, $me, $to, $at, maxReplies: 5);
            }

            // ------------------------------------------------ groupés (15 : 8 envoyés, 7 reçus)
            for ($i = 0; $i < 15; $i++) {
                $sent = $i < 8;
                $from = $sent ? $me : $this->pick($others);
                $pool = array_values(array_diff($others, [$from]));
                shuffle($pool);
                $to = array_slice($pool, 0, mt_rand(3, 12));
                if (! $sent) {
                    $to[0] = $me;
                }
                [$cat, $subject, $body] = $this->content();
                $at = $this->randomDate(45);
                $readBy = array_values(array_filter($to, fn () => mt_rand(0, 100) < 65));
                $rows = $this->group($from, $to, $subject, $body, $at,
                    receipt: mt_rand(0, 1) === 1, category: $cat,
                    deadline: mt_rand(0, 2) === 0 ? $at->copy()->addDays(mt_rand(1, 10)) : null,
                    readBy: $readBy,
                    acknowledgedBy: array_slice($readBy, 0, intdiv(count($readBy), 2)));
                // Quelques destinataires répondent
                foreach ($rows as $rid => $row) {
                    if (mt_rand(0, 100) < 40) {
                        $this->reply($row, $rid, $from, $this->pick(self::REPLIES), $at->copy()->addMinutes(mt_rand(20, 2000)), read: mt_rand(0, 1) === 1);
                    }
                }
            }

            // ------------------------------------------------ bruit : messages entre autres utilisateurs (120)
            for ($i = 0; $i < 120; $i++) {
                $from = $this->pick($others);
                $to = $this->pick(array_values(array_diff($others, [$from])));
                $at = $this->randomDate(60);
                $root = $this->randomMessage($from, $to, $at);
                $this->thread($root, $from, $to, $at, maxReplies: 3);
            }
        });

        // Complément optionnel jusqu'à un total précis :
        //   SEED_TOTAL=1000 php artisan db:seed --class=DemoBulkMessagesSeeder
        $total = (int) env('SEED_TOTAL', 0);
        while ($total > 0 && Message::query()->count() < $total) {
            $this->randomMessage($this->pick($others), $me, $this->randomDate(60));
        }

        $this->command?->info('Ajoutés : '.(Message::query()->count() - $before).' messages (réponses incluses). Total : '.Message::query()->count().'.');
    }

    // ------------------------------------------------------------------ outils

    private function pick(array $a): mixed
    {
        return $a[mt_rand(0, count($a) - 1)];
    }

    /** Date aléatoire dans les N derniers jours, aux heures de travail. */
    private function randomDate(int $days): Carbon
    {
        return now()->subDays(mt_rand(0, $days))
            ->setTime(mt_rand(7, 18), mt_rand(0, 59))
            ->min(now()->subMinutes(mt_rand(5, 120)));
    }

    /** [catégorie, objet, corps] tirés des modèles. */
    private function content(): array
    {
        $cat = array_rand(self::TEMPLATES);
        [$s, $b] = $this->pick(self::TEMPLATES[$cat]);
        $svc = $this->pick(self::SERVICES);

        return [$cat, sprintf($s, $svc), sprintf($b, $svc)];
    }

    private function randomMessage(int $from, int $to, Carbon $at): Message
    {
        [$cat, $subject, $body] = $this->content();
        $old = $at->lt(now()->subDays(3));

        return $this->msg($from, $to, $subject, $body, $at,
            read: $old ? mt_rand(0, 100) < 85 : mt_rand(0, 100) < 40,
            important: $cat === 'urgent' || mt_rand(0, 100) < 12,
            receipt: mt_rand(0, 100) < 18,
            category: $cat,
            deadline: mt_rand(0, 100) < 20 ? $at->copy()->addDays(mt_rand(1, 14))->setTime(12, 0) : null);
    }

    /** Fil de discussion : 0 à N réponses alternées entre les deux personnes. */
    private function thread(Message $root, int $a, int $b, Carbon $at, int $maxReplies): void
    {
        $n = mt_rand(0, 100) < 45 ? 0 : mt_rand(1, $maxReplies);
        $t = $at->copy();
        for ($k = 0; $k < $n; $k++) {
            $t = $t->copy()->addMinutes(mt_rand(10, 600));
            if ($t->gt(now())) {
                break;
            }
            [$from, $to] = $k % 2 === 0 ? [$b, $a] : [$a, $b];
            $this->reply($root, $from, $to, $this->pick(self::REPLIES), $t, read: $k < $n - 1 || mt_rand(0, 1) === 1);
        }
    }
}
