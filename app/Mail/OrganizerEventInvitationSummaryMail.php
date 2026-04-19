<?php

namespace App\Mail;

use App\Models\Event;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrganizerEventInvitationSummaryMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param array<int, array{name: string, email: string, delivery: string, error: string|null}> $deliveryStatuses
     */
    public function __construct(
        public Event $event,
        public array $deliveryStatuses,
        public int $sentCount,
        public int $skippedCount,
        public int $failedCount,
    ) {
    }

    public function envelope(): Envelope
    {
        $eventTitle = $this->event->title ?: 'Evenement';

        return new Envelope(
            subject: "Recapitulatif invitations: {$eventTitle}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.organizer-event-invitation-summary',
            with: [
                'event' => $this->event,
                'organizer' => $this->event->organizer,
                'deliveryStatuses' => $this->deliveryStatuses,
                'sentCount' => $this->sentCount,
                'skippedCount' => $this->skippedCount,
                'failedCount' => $this->failedCount,
            ],
        );
    }
}
