<?php

namespace Database\Seeders;

use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Vide toute la messagerie (messages, réponses, brouillons, tâches/signalements/notifications liés,
 * fichiers joints) puis crée un jeu de messages réalistes autour du compte de test.
 *
 *   php artisan db:seed --class=DemoMessagesSeeder
 */
class DemoMessagesSeeder extends Seeder
{
    /** Compte de test (application mobile). */
    private const ME = 'embarki1988@gmail.com';

    public function run(): void
    {
        \App\Support\MessageEmailNotifier::$enabled = false; // pas d'e-mails pour les données de démonstration
        $me = User::query()->where('email', self::ME)->firstOrFail();

        $this->wipe();

        // Correspondants (repli sur n'importe quel autre utilisateur si un id n'existe plus)
        $u = fn (int $id) => User::query()->find($id)?->id ?? User::query()->where('id', '!=', $me->id)->value('id');
        $dg = $u(3);        // Directeur général
        $sg = $u(29);       // Secrétaire général
        $dapm = $u(18);     // Directeur
        $dir19 = $u(19);
        $dir20 = $u(20);
        $dir21 = $u(21);
        $dir24 = $u(24);
        $sousDir = $u(22);
        $coord = $u(23);    // Coordinatrice paramédicale
        $bureau = $u(26);   // Chef de bureau
        $maint = $u(28);    // Maintenance
        $secu = $u(25);
        $support = $u(30);  // Assistance technique

        $now = now();

        // ============================================================ REÇUS
        $this->msg($dg, $me->id, 'Note de service – Déclenchement du plan blanc (exercice)',
            "Bonjour,\n\nUn exercice de déclenchement du plan blanc aura lieu le mardi 25 novembre à 9h00. "
            ."Je vous demande de vérifier que la liste de rappel du personnel de votre service est à jour "
            ."et que les numéros de téléphone sont joignables.\n\nMerci de confirmer la bonne réception de cette note "
            ."et de me transmettre la liste actualisée avant la date indiquée.\n\nLe Directeur Général",
            at: $now->copy()->subHours(2), important: true, receipt: true, category: 'urgent',
            deadline: $now->copy()->addDays(2)->setTime(12, 0));

        $this->msg($sg, $me->id, 'Réunion de coordination – Jeudi 10h00',
            "Bonjour,\n\nVous êtes convié à la réunion de coordination hebdomadaire jeudi à 10h00 en salle du conseil.\n\n"
            ."Ordre du jour :\n1. Suivi des incidents informatiques de la semaine\n2. Déploiement de l'application Cmail mobile\n"
            ."3. Questions diverses\n\nMerci de confirmer votre présence.\n\nLe Secrétaire Général",
            at: $now->copy()->subHours(5), category: 'reunion', deadline: $now->copy()->addDay()->setTime(16, 0));

        $annuaire = $this->msg($dapm, $me->id, "Mise à jour de l'annuaire du personnel",
            "Bonjour,\n\nPlusieurs agents de la DAPM ont changé de poste ce mois-ci. Pouvez-vous mettre à jour "
            ."leurs fonctions dans l'annuaire Cmail ? Je vous envoie la liste en réponse si nécessaire.\n\nCordialement.",
            at: $now->copy()->subDays(1)->setTime(9, 15), read: true, category: 'support');
        $this->reply($annuaire, $me->id, $dapm, "Bonjour,\n\nOui bien sûr, envoyez-moi la liste et je m'en occupe dans la journée.", $now->copy()->subDays(1)->setTime(9, 40), read: true);
        $this->reply($annuaire, $dapm, $me->id, "Merci beaucoup. Il s'agit de 4 agents : je vous transmets le tableau ce soir.", $now->copy()->subDays(1)->setTime(10, 5));

        $this->msg($coord, $me->id, 'Planning des gardes – Décembre',
            "Bonjour,\n\nVeuillez trouver ci-dessous les modifications du planning des gardes paramédicales pour décembre. "
            ."Merci de vérifier que les comptes Cmail des nouveaux agents sont bien actifs avant le 1er décembre.\n\nCordialement.",
            at: $now->copy()->subDays(1)->setTime(14, 30), read: true, category: 'rh');

        $this->msg($bureau, $me->id, 'URGENT – Panne imprimante bureau des entrées',
            "Bonjour,\n\nL'imprimante du bureau des entrées ne fonctionne plus depuis ce matin (bourrage papier + erreur réseau). "
            ."Les admissions sont ralenties. Pouvez-vous intervenir au plus vite ?\n\nMerci.",
            at: $now->copy()->subMinutes(40), important: true, category: 'urgent');

        $this->msg($sousDir, $me->id, "Formation hygiène hospitalière – Inscriptions",
            "Bonjour,\n\nUne session de formation sur l'hygiène hospitalière est prévue le 3 décembre. "
            ."Les inscriptions sont ouvertes jusqu'au 28 novembre auprès de la sous-direction.\n\nCordialement.",
            at: $now->copy()->subDays(2)->setTime(11, 0), read: true, category: 'information');

        $this->msg($support, $me->id, 'Nouvelle version de Cmail mobile disponible',
            "Bonjour,\n\nUne nouvelle version de l'application mobile est disponible : brouillons, réponses rapides, "
            ."numérisation de documents et mode sombre.\n\nN'hésitez pas à nous faire part de vos remarques.\n\nL'équipe Cmail",
            at: $now->copy()->subHours(20), category: 'information');

        // Message groupé reçu (le Directeur à plusieurs destinataires, dont moi)
        $this->group($dir24, [$me->id, $dir19, $dir20, $bureau], 'Inventaire annuel du matériel informatique',
            "Bonjour à tous,\n\nDans le cadre de l'inventaire annuel, merci de recenser le matériel informatique de vos services "
            ."(postes, imprimantes, onduleurs) et de signaler les équipements hors service.\n\nRetour attendu avant vendredi.\n\nCordialement.",
            at: $now->copy()->subDays(2)->setTime(8, 30), receipt: true, category: 'validation',
            deadline: $now->copy()->addDays(3)->setTime(17, 0), readBy: [$me->id, $dir19]);

        // ============================================================ ENVOYÉS
        $rapport = $this->msg($me->id, $dg, "Rapport mensuel d'activité – Service informatique",
            "Monsieur le Directeur Général,\n\nVeuillez trouver ci-dessous la synthèse de l'activité du service informatique pour le mois :\n\n"
            ."• 126 interventions réalisées (dont 18 urgentes)\n• Déploiement de Cmail mobile auprès de 40 utilisateurs\n"
            ."• Remplacement de 12 postes de travail\n\nJe reste à votre disposition pour tout complément.\n\nRespectueusement.",
            at: $now->copy()->subDays(3)->setTime(10, 0), read: true, important: true, category: 'information');
        $this->reply($rapport, $dg, $me->id, "Merci pour ce rapport clair. Bon travail à toute l'équipe, continuez ainsi.", $now->copy()->subDays(3)->setTime(15, 20), read: true);

        $maintenance = $this->group($me->id, [$dapm, $dir19, $dir20, $dir21], 'Maintenance du serveur Cmail – Samedi 8h-10h',
            "Bonjour,\n\nUne opération de maintenance du serveur Cmail aura lieu samedi de 8h00 à 10h00. "
            ."La messagerie sera indisponible pendant cette période.\n\nMerci d'en informer vos équipes.\n\nService informatique",
            at: $now->copy()->subDays(1)->setTime(16, 0), receipt: true, category: 'information',
            readBy: [$dapm, $dir19], acknowledgedBy: [$dapm]);
        $this->reply($maintenance[$dir19], $dir19, $me->id, "Bien reçu, l'information a été transmise aux équipes.", $now->copy()->subDays(1)->setTime(17, 10));

        $this->msg($me->id, $maint, 'Intervention réseau – Service de radiologie',
            "Bonjour,\n\nLe service de radiologie signale des coupures réseau répétées. Pouvez-vous vérifier le câblage "
            ."de la baie de brassage du 2e étage ? Je serai sur place demain à 9h.\n\nMerci.",
            at: $now->copy()->subHours(3), category: 'support', deadline: $now->copy()->addDay()->setTime(9, 0));

        $this->msg($me->id, $sousDir, 'Demande de validation – Achat de 5 onduleurs',
            "Bonjour,\n\nSuite aux coupures électriques du mois dernier, je sollicite votre validation pour l'achat de "
            ."5 onduleurs destinés aux postes critiques (urgences, pharmacie, bureau des entrées).\n\nCordialement.",
            at: $now->copy()->subDays(2)->setTime(13, 45), read: true, category: 'validation');

        // ============================================================ PROGRAMMÉ
        $this->msg($me->id, $secu, 'Rappel – Sauvegarde mensuelle des données',
            "Bonjour,\n\nPetit rappel : la sauvegarde mensuelle des données aura lieu ce week-end. Merci de ne pas éteindre "
            ."les serveurs du local technique.\n\nCordialement.",
            at: $now->copy()->addDay()->setTime(8, 0), scheduled: true, category: 'information');

        $this->command?->info('Messagerie réinitialisée : '.Message::query()->count().' messages créés.');
    }

    // ------------------------------------------------------------------ nettoyage

    private function wipe(): void
    {
        $messageIds = DB::table('messages')->pluck('id');

        // Fichiers joints (messages, réponses, brouillons)
        $files = DB::table('messages')->whereNotNull('fichier')->pluck('fichier')
            ->merge(DB::table('reponses')->whereNotNull('fichier')->pluck('fichier'))
            ->merge(DB::table('message_drafts')->whereNotNull('fichier')->pluck('fichier'));

        DB::transaction(function () use ($messageIds) {
            DB::table('message_tasks')->whereNotNull('message_id')->delete();
            DB::table('tasks')->whereNotNull('message_id')->delete();
            DB::table('reported_messages')->delete();
            DB::table('reponses')->delete();
            DB::table('message_drafts')->delete();
            DB::table('messages')->update(['parent_id' => null, 'forwarded_from_message_id' => null]);
            DB::table('messages')->delete();
            // Notifications liées aux messages (les notifications de chat sont conservées)
            DB::table('notifications')->where('type', 'not like', '%Chat%')->delete();
        });

        $disk = Storage::disk('public');
        foreach ($files->filter()->unique() as $f) {
            $disk->delete($f);
        }
        foreach (['messages', 'message-drafts', 'reponses'] as $dir) {
            foreach ($disk->files($dir) as $f) {
                $disk->delete($f);
            }
        }

        $this->command?->warn('Ancienne messagerie supprimée ('.$messageIds->count().' messages).');
    }

    // ------------------------------------------------------------------ fabrique

    protected function base(int $from, int $to, string $subject, string $body, Carbon $at, array $o): array
    {
        $scheduled = $o['scheduled'] ?? false;
        $read = ! $scheduled && ($o['read'] ?? false);
        $receipt = $o['receipt'] ?? false;

        return [
            'sender_id' => $from,
            'receiver_id' => $to,
            'receiver_ids' => json_encode($o['receiver_ids'] ?? [$to]),
            'sujet' => $subject,
            'contenu' => $body,
            'fichier' => null,
            'lu' => $read,
            'lu_le' => $read ? $at->copy()->addMinutes(20) : null,
            'read_at' => $read ? $at->copy()->addMinutes(20) : null,
            'acknowledged_at' => ($o['acknowledged'] ?? false) ? $at->copy()->addMinutes(25) : null,
            'spam' => false,
            'important' => $o['important'] ?? false,
            'is_important' => $o['important'] ?? false,
            'sent_at' => $scheduled ? null : $at,
            'requires_receipt' => $receipt,
            'is_tracked' => $receipt,
            'receipt_requested_at' => $receipt ? $at : null,
            'scheduled_at' => $scheduled ? $at : null,
            'status' => $scheduled ? 'scheduled' : 'sent',
            'is_delivered' => ! $scheduled,
            'envoye' => ! $scheduled,
            'archived' => false,
            'type_message' => $o['type'] ?? 'normal',
            'category' => $o['category'] ?? 'information',
            'category_source' => 'rules',
            'category_confidence' => 0.9,
            'deadline_reponse' => $o['deadline'] ?? null,
            'can_be_redirected' => true,
            'message_group_uuid' => $o['group'] ?? null,
            'parent_id' => $o['parent_id'] ?? null,
            'ping_count' => 0,
            'is_escalated' => false,
            'created_at' => $scheduled ? now() : $at,
            'updated_at' => $scheduled ? now() : $at,
        ];
    }

    protected function msg(int $from, int $to, string $subject, string $body, Carbon $at, bool $read = false, bool $important = false,
        bool $receipt = false, string $category = 'information', ?Carbon $deadline = null, bool $scheduled = false): Message
    {
        $id = DB::table('messages')->insertGetId($this->base($from, $to, $subject, $body, $at, compact(
            'read', 'important', 'receipt', 'category', 'deadline', 'scheduled'
        )));

        return Message::query()->findOrFail($id);
    }

    /** Message groupé : une ligne par destinataire, même uuid. Renvoie [receiverId => Message]. */
    protected function group(int $from, array $to, string $subject, string $body, Carbon $at, bool $receipt = false,
        string $category = 'information', ?Carbon $deadline = null, array $readBy = [], array $acknowledgedBy = []): array
    {
        $uuid = (string) Str::uuid();
        $out = [];
        foreach ($to as $rid) {
            $id = DB::table('messages')->insertGetId($this->base($from, $rid, $subject, $body, $at, [
                'receiver_ids' => $to,
                'group' => $uuid,
                'receipt' => $receipt,
                'category' => $category,
                'deadline' => $deadline,
                'read' => in_array($rid, $readBy, true),
                'acknowledged' => in_array($rid, $acknowledgedBy, true),
            ]));
            $out[$rid] = Message::query()->findOrFail($id);
        }

        return $out;
    }

    protected function reply(Message $root, int $from, int $to, string $body, Carbon $at, bool $read = false): void
    {
        $subject = str_starts_with($root->sujet, 'RE:') ? $root->sujet : 'RE: '.$root->sujet;
        DB::table('messages')->insert($this->base($from, $to, $subject, $body, $at, [
            'type' => 'reply',
            'category' => 'reponse',
            'read' => $read,
            'parent_id' => $root->id,
            'group' => $root->message_group_uuid,
        ]));
        // Le fil remonte : le message racine est « mis à jour » à l'heure de la réponse
        DB::table('messages')->where('id', $root->id)->update(['updated_at' => $at]);
    }
}
