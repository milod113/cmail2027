<?php

namespace App\Notifications;

use App\Models\MessageTask;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class MessageTaskReminderNotification extends Notification
{
    use Queueable;

    public function __construct(
        public MessageTask $messageTask,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $message = $this->messageTask->message;

        return [
            'type' => 'system',
            'subtype' => 'message_task_reminder',
            'title' => 'Rappel de tâche',
            'task_id' => $this->messageTask->id,
            'message_id' => (int) $this->messageTask->message_id,
            'task_title' => (string) $this->messageTask->title,
            'message_subject' => (string) optional($message)->sujet,
            'priority' => (string) $this->messageTask->priority,
            'due_date' => optional($this->messageTask->due_date)?->toIso8601String(),
        ];
    }
}
