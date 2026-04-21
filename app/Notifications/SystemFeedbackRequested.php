<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class SystemFeedbackRequested extends Notification
{
    use Queueable;

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Votre avis sur Cmail',
            'type' => 'feedback_request',
            'message' => 'Aidez-nous a ameliorer Cmail en partageant votre experience.',
        ];
    }
}
