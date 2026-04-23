<?php

namespace App\Jobs;

use App\Events\NotificationCreated;
use App\Models\Message;
use App\Models\UserSetting;
use App\Support\MessageEscalationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class CheckMessageEscalation implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $messageId)
    {
    }

    public function handle(MessageEscalationService $escalationService): void
    {
        $message = Message::query()
            ->with([
                'sender:id,name,email',
                'receiver' => fn ($query) => $query
                    ->with('userSetting:id,user_id,escalation_enabled,backup_user_id,escalation_timeout')
                    ->select('id', 'name', 'email'),
            ])
            ->find($this->messageId);

        if (! $message || ! $escalationService->isEligible($message)) {
            return;
        }

        $settings = $message->receiver?->userSetting;

        if (! $settings?->escalation_enabled || ! $settings->backup_user_id) {
            return;
        }

        if (
            (int) $settings->backup_user_id === (int) $message->receiver_id ||
            (int) $settings->backup_user_id === (int) $message->sender_id
        ) {
            return;
        }

        DB::transaction(function () use ($settings, $escalationService): void {
            $lockedMessage = Message::query()
                ->with([
                    'sender:id,name,email',
                    'receiver:id,name,email',
                ])
                ->lockForUpdate()
                ->find($this->messageId);

            if (! $lockedMessage || ! $escalationService->isEligible($lockedMessage)) {
                return;
            }

            $lockedMessage->forceFill([
                'is_escalated' => true,
                'escalated_to_id' => $settings->backup_user_id,
            ])->save();

            $escalatedMessage = $this->createEscalatedCopy($lockedMessage, $settings);

            $this->broadcastSafely(
                new NotificationCreated((int) $escalatedMessage->receiver_id, 'message', (int) $escalatedMessage->id)
            );
        });
    }

    private function createEscalatedCopy(Message $message, UserSetting $settings): Message
    {
        $timeout = max((int) $settings->escalation_timeout, 1);
        $payload = [
            'sender_id' => $message->sender_id,
            'receiver_id' => $settings->backup_user_id,
            'original_receiver_id' => $message->receiver_id,
            'sujet' => $this->escalatedSubject($message->sujet),
            'contenu' => $this->escalatedBody($message, $timeout),
            'fichier' => $message->fichier,
            'lu_le' => null,
            'read_at' => null,
            'is_escalated' => false,
            'escalated_to_id' => null,
            'lu' => false,
            'spam' => false,
            'important' => $message->important,
            'is_important' => $message->is_important,
            'sent_at' => now(),
            'acknowledged_at' => null,
            'requires_receipt' => false,
            'is_tracked' => false,
            'receipt_requested_at' => null,
            'scheduled_at' => null,
            'status' => 'sent',
            'is_delivered' => true,
            'archived' => false,
            'type_message' => 'escalated',
            'envoye' => true,
            'deadline_reponse' => $message->deadline_reponse,
            'can_be_redirected' => false,
            'message_group_uuid' => null,
            'parent_id' => null,
            'forwarded_from_message_id' => $message->id,
        ];

        if (Schema::hasColumn('messages', 'receiver_ids')) {
            $payload['receiver_ids'] = [$settings->backup_user_id];
        }

        return Message::query()->create($payload);
    }

    private function escalatedSubject(?string $subject): string
    {
        $subject = trim((string) $subject);

        if ($subject === '') {
            return '[ESCALADE AUTO] Message non lu';
        }

        if (str_starts_with(mb_strtolower($subject), '[escalade auto]')) {
            return $subject;
        }

        return "[ESCALADE AUTO] {$subject}";
    }

    private function escalatedBody(Message $message, int $timeout): string
    {
        $receiverName = $message->receiver?->name ?? 'Utilisateur';

        return trim(implode("\n\n", [
            "[AUTOMATIC FORWARD - Unread after {$timeout} minutes]",
            "Original recipient: {$receiverName}",
            (string) $message->contenu,
        ]));
    }

    private function broadcastSafely(object $event): void
    {
        try {
            broadcast($event);
        } catch (\Throwable $exception) {
            Log::warning('Broadcast skipped while escalating message.', [
                'message_id' => $this->messageId,
                'event' => $event::class,
                'error' => $exception->getMessage(),
            ]);
        }
    }
}
