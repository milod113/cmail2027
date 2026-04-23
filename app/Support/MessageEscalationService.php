<?php

namespace App\Support;

use App\Jobs\CheckMessageEscalation;
use App\Models\Message;

class MessageEscalationService
{
    public function scheduleIfEligible(Message $message): void
    {
        $message->loadMissing([
            'receiver' => fn ($query) => $query
                ->with('userSetting:id,user_id,escalation_enabled,backup_user_id,escalation_timeout')
                ->select('id', 'name', 'email'),
        ]);

        if (! $this->isEligible($message)) {
            return;
        }

        $settings = $message->receiver?->userSetting;

        if (! $settings?->escalation_enabled || ! $settings->backup_user_id) {
            return;
        }

        $timeout = max((int) $settings->escalation_timeout, 1);

        CheckMessageEscalation::dispatch((int) $message->id)
            ->delay(now()->addMinutes($timeout))
            ->afterCommit();
    }

    public function isEligible(Message $message): bool
    {
        if (! $message->is_delivered || ! $message->receiver_id) {
            return false;
        }

        if ((bool) ($message->is_escalated ?? false) || $message->read_at !== null) {
            return false;
        }

        if (! (bool) $message->can_be_redirected) {
            return false;
        }

        if ($message->forwarded_from_message_id) {
            return false;
        }

        $type = (string) ($message->type_message ?? 'normal');

        if (in_array($type, ['out_of_office', 'delegated', 'reply', 'support_reply', 'escalated'], true)) {
            return false;
        }

        return ! str_starts_with($type, 'recurring_');
    }
}
