<?php

namespace App\Jobs;

use App\Events\NotificationCreated;
use App\Models\Message;
use App\Models\RecurringMessage;
use App\Support\MessageEscalationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ProcessRecurringMessages implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $now = CarbonImmutable::now()->seconds(0);
        $processedCount = 0;

        RecurringMessage::query()
            ->where('is_active', true)
            ->whereTime('time_of_day', '=', $now->format('H:i:s'))
            ->orderBy('id')
            ->chunkById(100, function ($recurringMessages) use ($now, &$processedCount): void {
                foreach ($recurringMessages as $recurringMessage) {
                    if (! $this->isDueForCurrentMinute($recurringMessage, $now)) {
                        continue;
                    }

                    $occurrenceKey = "recurring-message:{$recurringMessage->id}:{$now->format('YmdHi')}";

                    if (! Cache::add($occurrenceKey, true, now()->addMonths(15))) {
                        continue;
                    }

                    $message = Message::query()->create([
                        'sender_id' => (int) $recurringMessage->user_id,
                        'receiver_id' => (int) $recurringMessage->receiver_id,
                        'original_receiver_id' => null,
                        'receiver_ids' => [(int) $recurringMessage->receiver_id],
                        'sujet' => $this->makeRecurringSubject($recurringMessage),
                        'contenu' => trim((string) $recurringMessage->body),
                        'fichier' => null,
                        'lu_le' => null,
                        'read_at' => null,
                        'lu' => false,
                        'spam' => false,
                        'important' => false,
                        'sent_at' => $now,
                        'requires_receipt' => false,
                        'is_tracked' => false,
                        'receipt_requested_at' => null,
                        'scheduled_at' => null,
                        'status' => 'sent',
                        'is_delivered' => true,
                        'archived' => false,
                        'type_message' => "recurring_{$recurringMessage->frequency}",
                        'envoye' => true,
                        'deadline_reponse' => null,
                        'can_be_redirected' => false,
                        'message_group_uuid' => null,
                        'parent_id' => null,
                        'forwarded_from_message_id' => null,
                    ]);

                    $processedCount++;
                    $this->broadcastSafely(
                        new NotificationCreated((int) $message->receiver_id, 'message', (int) $message->id)
                    );
                    app(MessageEscalationService::class)->scheduleIfEligible($message);
                }
            });

        if ($processedCount > 0) {
            Log::info('Recurring messages processed.', [
                'count' => $processedCount,
                'minute' => $now->toIso8601String(),
            ]);
        }
    }

    private function isDueForCurrentMinute(RecurringMessage $recurringMessage, CarbonImmutable $now): bool
    {
        $anchorDate = CarbonImmutable::parse($recurringMessage->created_at);

        return match ($recurringMessage->frequency) {
            'daily' => true,
            'weekly' => $anchorDate->dayOfWeek === $now->dayOfWeek,
            'monthly' => min($anchorDate->day, $now->daysInMonth) === $now->day,
            default => false,
        };
    }

    private function makeRecurringSubject(RecurringMessage $recurringMessage): string
    {
        $preview = Str::of((string) $recurringMessage->body)
            ->replace(["\r\n", "\r", "\n"], ' ')
            ->squish()
            ->limit(60, '...')
            ->value();

        if ($preview === '') {
            return 'Message recurrent';
        }

        return $preview;
    }

    private function broadcastSafely(object $event): void
    {
        try {
            broadcast($event);
        } catch (\Throwable $exception) {
            Log::warning('Broadcast skipped while processing recurring messages.', [
                'event' => $event::class,
                'message' => $exception->getMessage(),
            ]);
        }
    }
}
