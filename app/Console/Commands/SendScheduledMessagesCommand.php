<?php

namespace App\Console\Commands;

use App\Events\NotificationCreated;
use App\Models\Message;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SendScheduledMessagesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'messages:send-scheduled';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Deliver messages whose scheduled send time has been reached.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $now = now();
        $deliveredCount = 0;

        Message::query()
            ->where('is_delivered', false)
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<=', $now)
            ->orderBy('scheduled_at')
            ->orderBy('id')
            ->chunkById(100, function ($messages) use (&$deliveredCount, $now): void {
                foreach ($messages as $message) {
                    $updated = Message::query()
                        ->whereKey($message->id)
                        ->where('is_delivered', false)
                        ->update([
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

        $this->info("Scheduled messages delivered: {$deliveredCount}");

        return self::SUCCESS;
    }

    private function broadcastSafely(object $event): void
    {
        try {
            broadcast($event);
        } catch (\Throwable $exception) {
            Log::warning('Broadcast skipped while delivering scheduled messages.', [
                'event' => $event::class,
                'message' => $exception->getMessage(),
            ]);
        }
    }
}
