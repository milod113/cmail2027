<?php

namespace App\Support;

use App\Models\EventInvitation;
use Barryvdh\DomPDF\Facade\Pdf;

class EventInvitationPdfGenerator
{
    public function generate(EventInvitation $invitation): string
    {
        $invitation->loadMissing([
            'user:id,name,email',
            'event.organizer:id,name,email',
        ]);

        return Pdf::loadView('pdf.event-invitation', [
            'invitation' => $invitation,
            'event' => $invitation->event,
            'invitee' => $invitation->user,
            'organizer' => optional($invitation->event)->organizer,
            'generatedAt' => now(),
        ])
            ->setPaper('a4', 'portrait')
            ->output();
    }

    public function fileName(EventInvitation $invitation): string
    {
        $eventId = (int) $invitation->event_id;
        $userId = (int) $invitation->user_id;

        return "invitation-event-{$eventId}-user-{$userId}.pdf";
    }
}
