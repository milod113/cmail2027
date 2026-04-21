<?php

namespace App\Console\Commands;

use App\Support\FeedbackCampaignDispatcher;
use Illuminate\Console\Command;

class RequestFeedbackCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cmail:request-feedback';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send a system feedback request notification to Cmail users.';

    /**
     * Execute the console command.
     */
    public function handle(FeedbackCampaignDispatcher $dispatcher): int
    {
        $count = $dispatcher->dispatch();

        $this->info(sprintf(
            'Campagne de feedback lancee avec succes. %d utilisateur(s) ont recu la notification.',
            $count
        ));

        return self::SUCCESS;
    }
}
