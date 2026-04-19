<?php

namespace App\Console\Commands;

use App\Jobs\ProcessScheduledMessages;
use Illuminate\Console\Command;

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
        app(ProcessScheduledMessages::class)->handle();
        $this->info('Scheduled messages processed.');

        return self::SUCCESS;
    }
}
