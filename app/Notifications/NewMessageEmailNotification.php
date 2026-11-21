<?php

namespace App\Notifications;

use App\Models\Message;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

/**
 * E-mail « Vous avez reçu un message dans Cmail ».
 *
 * Confidentialité : le TEXTE du message et ses pièces jointes ne sont jamais copiés
 * dans l'e-mail (données médicales) — seulement l'expéditeur, l'objet et les
 * indications utiles. Le destinataire lit le message dans Cmail.
 *
 * Envoyé en file d'attente (php artisan queue:work) : l'envoi ne ralentit pas Cmail.
 */
class NewMessageEmailNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /** Nouvel essai si Gmail est momentanément injoignable. */
    public int $tries = 3;

    public array $backoff = [60, 300];

    public function __construct(public int $messageId)
    {
        // Pas d'e-mail si l'enregistrement du message est annulé (transaction)
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $data = $this->viewData($notifiable);

        return (new MailMessage)
            ->subject(($data['important'] ? '[Important] ' : '').$data['title'].' — Cmail')
            ->view(['emails.new-message', 'emails.new-message-text'], $data);
    }

    /**
     * Données affichées dans l'e-mail (jamais le texte du message).
     *
     * @return array<string, mixed>
     */
    public function viewData(object $notifiable): array
    {
        $m = Message::query()->with(['sender:id,name,role_id,department_id', 'sender.role:id,nom_role', 'sender.department:id,name'])
            ->find($this->messageId);
        $sender = $m?->sender;
        $senderName = $sender?->name ?? 'Un collègue';
        $isReply = $m && $m->parent_id !== null;

        return [
            'title' => ($isReply ? 'Nouvelle réponse de ' : 'Nouveau message de ').$senderName,
            'isReply' => $isReply,
            'important' => (bool) ($m && ($m->important || $m->is_important)),
            'recipientName' => trim((string) ($notifiable->name ?? '')),
            'senderName' => $senderName,
            'senderDetail' => collect([$sender?->role?->nom_role, $sender?->department?->name])
                ->filter(fn ($v) => filled($v) && ! str_starts_with((string) $v, 'legacy-role'))
                ->map(fn ($v) => Str::ucfirst((string) $v))
                ->implode(' · '),
            'subject' => Str::limit(trim((string) ($m?->sujet ?? '')), 140) ?: '(Sans objet)',
            'sentAt' => optional($m?->sent_at ?? $m?->created_at)?->locale('fr')->translatedFormat('l j F Y \à H:i'),
            'hasAttachment' => filled($m?->fichier),
            'requiresReceipt' => (bool) $m?->requires_receipt,
            'deadline' => $m?->deadline_reponse?->locale('fr')->translatedFormat('l j F Y \à H:i'),
            'url' => $this->messageUrl($m),
        ];
    }

    /** Lien vers le message sur le site Cmail, seulement si l'adresse du serveur est joignable (pas « localhost »). */
    private function messageUrl(?Message $m): ?string
    {
        if (! $m) {
            return null;
        }
        $host = parse_url((string) config('app.url'), PHP_URL_HOST);
        if (! $host || in_array($host, ['localhost', '127.0.0.1'], true)) {
            return null;
        }

        return route('messages.show', $m->parent_id ?? $m->id);
    }
}
