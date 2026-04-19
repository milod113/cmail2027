<?php

namespace App\Mail;

use App\Models\EventInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EventInvitationPdfMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public EventInvitation $invitation,
        public string $pdfBinary,
        public string $pdfFileName,
    ) {
    }

    public function envelope(): Envelope
    {
        $eventTitle = optional($this->invitation->event)->title ?: 'Evenement';
        $organizerName = (string) optional(optional($this->invitation->event)->organizer)->name;
        $organizerEmail = trim((string) optional(optional($this->invitation->event)->organizer)->email);

        return new Envelope(
            subject: "Invitation: {$eventTitle}",
            replyTo: $organizerEmail !== ''
                ? [new Address($organizerEmail, $organizerName ?: null)]
                : [],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.event-invitation',
            with: [
                'invitation' => $this->invitation,
                'event' => $this->invitation->event,
                'invitee' => $this->invitation->user,
                'organizer' => optional($this->invitation->event)->organizer,
            ],
        );
    }

    /**
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [
            Attachment::fromData(fn () => $this->pdfBinary, $this->pdfFileName)
                ->withMime('application/pdf'),
        ];
    }
}
