<?php

namespace App\Notifications;

use App\Models\ReportedMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewReportedMessageNotification extends Notification
{
    use Queueable;

    public function __construct(
        public ReportedMessage $reportedMessage,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'reported_message',
            'subtype' => 'reported_message_created',
            'report_id' => $this->reportedMessage->id,
            'message_id' => $this->reportedMessage->message_id,
            'message_subject' => (string) optional($this->reportedMessage->message)->sujet,
            'reporter_name' => (string) optional($this->reportedMessage->reporter)->name,
            'reporter_email' => (string) optional($this->reportedMessage->reporter)->email,
            'reason_category' => $this->reportedMessage->reason_category,
            'comment' => $this->reportedMessage->comment,
            'status' => $this->reportedMessage->status,
        ];
    }
}
