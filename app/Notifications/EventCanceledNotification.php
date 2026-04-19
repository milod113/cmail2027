<?php

namespace App\Notifications;

use App\Models\Event;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EventCanceledNotification extends Notification
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
            ->subject('Evenement annule: '.$this->event->title)
            ->greeting('Bonjour '.($notifiable->name ?? ''))
            ->line("L'evenement \"{$this->event->title}\" a ete annule.")
            ->line('Date prevue: '.optional($this->event->start_time)->format('d/m/Y H:i'));

        if (filled($this->event->status_reason)) {
            $mailMessage->line('Raison: '.$this->event->status_reason);
        }

        return $mailMessage
            ->action("Voir l'evenement", route('events.show', $this->event->id))
            ->line("Merci de ne plus tenir compte de cette invitation.");
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'event',
            'subtype' => 'event_canceled',
            'event_id' => $this->event->id,
            'event_title' => $this->event->title,
            'status' => $this->event->status,
            'status_reason' => $this->event->status_reason,
        ];
    }
}
