<?php

namespace App\Jobs;

use App\Events\NotificationCreated;
use App\Models\Message;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessScheduledMessages implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $now = now();
        $deliveredCount = 0;

        Message::query()
            ->where('status', 'scheduled')
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<=', $now)
            ->orderBy('scheduled_at')
            ->orderBy('id')
            ->chunkById(100, function ($messages) use (&$deliveredCount, $now): void {
                foreach ($messages as $message) {
                    $updated = Message::query()
                        ->whereKey($message->id)
                        ->where('status', 'scheduled')
                        ->update([
                            'status' => 'sent',
                            'is_delivered' => true,
                            'sent_at' => $now,
                            'envoye' => true,
                            'receipt_requested_at' => $message->requires_receipt
                                ? ($message->receipt_requested_at ?? $now)
                                : null,
                            'updated_at' => $now,
                        ]);

                    if ($updated === 0) {
                        continue;
                    }

                    $deliveredCount++;
                    $this->broadcastSafely(
                        new NotificationCreated((int) $message->receiver_id, 'message', (int) $message->id)
                    );
                }
            });

        if ($deliveredCount > 0) {
            Log::info('Scheduled messages processed.', [
                'count' => $deliveredCount,
            ]);
        }
    }

    private function broadcastSafely(object $event): void
    {
        try {
            broadcast($event);
        } catch (\Throwable $exception) {
            Log::warning('Broadcast skipped while processing scheduled messages.', [
                'event' => $event::class,
                'message' => $exception->getMessage(),
            ]);
        }
    }
}
