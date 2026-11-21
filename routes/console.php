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

Schedule::command('tasks:dispatch-reminders')
    ->name('dispatch-task-reminders')
    ->everyMinute()
    ->withoutOverlapping();

// File d'attente traitée aussi par le planificateur (schedule:work) : e-mails, OCR des
// documents, messages programmés… partent même si la fenêtre « queue:work » est fermée.
// S'arrête dès que la file est vide (ou après 55 s) ; jamais deux fois en même temps.
Schedule::command('queue:work --stop-when-empty --tries=3 --max-time=55')
    ->name('process-queue')
    ->everyMinute()
    ->withoutOverlapping(5);

// Dictées vocales : textes effacés après 24 h, aucun audio conservé
Schedule::command('dictations:prune')->name('prune-dictations')->hourly()->withoutOverlapping();
