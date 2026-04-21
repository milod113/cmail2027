<?php

namespace App\Notifications;

use App\Models\ChatMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewChatMessageNotification extends Notification
{
    use Queueable;

    public function __construct(
        public ChatMessage $chatMessage,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $sender = $this->chatMessage->sender;

        return [
            'type' => 'message',
            'subtype' => 'chat_message',
            'title' => 'Nouveau message instantane',
            'chat_message_id' => $this->chatMessage->id,
            'sender_id' => (int) $this->chatMessage->sender_id,
            'sender_name' => (string) optional($sender)->name,
            'sender_email' => (string) optional($sender)->email,
            'preview' => str($this->chatMessage->body)->squish()->limit(120)->toString(),
        ];
    }
}
