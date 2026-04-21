<?php

namespace App\Console\Commands;

use App\Jobs\SendTaskReminderJob;
use App\Models\MessageTask;
use Illuminate\Console\Command;

class DispatchTaskRemindersCommand extends Command
{
    protected $signature = 'tasks:dispatch-reminders';

    protected $description = 'Dispatch reminder jobs for due professional message tasks.';

    public function handle(): int
    {
        $now = now();
        $dispatched = 0;

        MessageTask::query()
            ->where('is_completed', false)
            ->whereNotNull('reminder_at')
            ->where('reminder_at', '<=', $now)
            ->orderBy('reminder_at')
            ->orderBy('id')
            ->chunkById(100, function ($tasks) use ($now, &$dispatched): void {
                foreach ($tasks as $task) {
                    $updated = MessageTask::query()
                        ->whereKey($task->id)
                        ->where('is_completed', false)
                        ->whereNotNull('reminder_at')
                        ->where('reminder_at', '<=', $now)
                        ->update([
                            'reminder_at' => null,
                            'updated_at' => $now,
                        ]);

                    if ($updated === 0) {
                        continue;
                    }

                    SendTaskReminderJob::dispatch((int) $task->id);
                    $dispatched++;
                }
            });

        $this->info("Task reminder jobs dispatched: {$dispatched}");

        return self::SUCCESS;
    }
}
