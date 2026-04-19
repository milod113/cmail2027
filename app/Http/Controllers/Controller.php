<?php

namespace App\Http\Controllers;

use Illuminate\Broadcasting\PendingBroadcast;
use Illuminate\Support\Facades\Log;

abstract class Controller
{
    protected function broadcastSafely(object $event, bool $toOthers = true): void
    {
        try {
            $pendingBroadcast = broadcast($event);

            if ($toOthers && $pendingBroadcast instanceof PendingBroadcast) {
                $pendingBroadcast->toOthers();
            }

            unset($pendingBroadcast);
        } catch (\Throwable $exception) {
            Log::warning('Broadcast skipped because the websocket broadcaster is unavailable.', [
                'event' => $event::class,
                'message' => $exception->getMessage(),
            ]);
        }
    }
}
