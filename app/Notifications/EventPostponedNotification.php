<?php

namespace App\Notifications;

use App\Models\Event;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EventPostponedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Event $event,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mailMessage = (new MailMessage())
            ->subject('Evenement reporte: '.$this->event->title)
            ->greeting('Bonjour '.($notifiable->name ?? ''))
            ->line("L'evenement \"{$this->event->title}\" a ete reporte.")
            ->line('Nouvelle date de debut: '.optional($this->event->start_time)->format('d/m/Y H:i'))
            ->line('Nouvelle date de fin: '.optional($this->event->end_time)->format('d/m/Y H:i'));

        if (filled($this->event->status_reason)) {
            $mailMessage->line('Motif: '.$this->event->status_reason);
        }

        return $mailMessage
            ->action("Voir l'evenement", route('events.show', $this->event->id))
            ->line("Merci de verifier la nouvelle date avant de confirmer votre disponibilite.");
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'event',
            'subtype' => 'event_postponed',
            'event_id' => $this->event->id,
            'event_title' => $this->event->title,
            'status' => $this->event->status,
            'status_reason' => $this->event->status_reason,
            'start_time' => optional($this->event->start_time)->toIso8601String(),
            'end_time' => optional($this->event->end_time)->toIso8601String(),
        ];
    }
}
