<?php

use App\Jobs\ProcessRecurringMessages;
use App\Jobs\ProcessScheduledMessages;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

Schedule::job(new ProcessScheduledMessages())
    ->name('process-scheduled-messages')
    ->everyMinute()
    ->withoutOverlapping();

Schedule::job(new ProcessRecurringMessages())
    ->name('process-recurring-messages')
    ->everyMinute()
    ->withoutOverlapping();
