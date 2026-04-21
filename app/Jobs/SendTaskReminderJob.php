<?php

namespace App\Jobs;

use App\Events\NotificationCreated;
use App\Models\MessageTask;
use App\Notifications\MessageTaskReminderNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendTaskReminderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $messageTaskId,
    ) {
    }

    public function handle(): void
    {
        $messageTask = MessageTask::query()
            ->with([
                'message:id,receiver_id,sujet',
                'message.receiver:id,name,email',
            ])
            ->find($this->messageTaskId);

        if (! $messageTask || $messageTask->is_completed) {
            return;
        }

        $receiver = $messageTask->message?->receiver;

        if (! $receiver) {
            Log::warning('Task reminder skipped because the message receiver is missing.', [
                'message_task_id' => $this->messageTaskId,
                'message_id' => $messageTask->message_id,
            ]);

            return;
        }

        $receiver->notify(new MessageTaskReminderNotification($messageTask));
        $this->broadcastSafely(
            new NotificationCreated((int) $receiver->id, 'system', (int) $messageTask->id)
        );
    }

    private function broadcastSafely(object $event): void
    {
        try {
            broadcast($event);
        } catch (\Throwable $exception) {
            Log::warning('Broadcast skipped while sending task reminder.', [
                'event' => $event::class,
                'message' => $exception->getMessage(),
            ]);
        }
    }
}
