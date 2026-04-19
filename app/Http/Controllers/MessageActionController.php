<?php

namespace App\Http\Controllers;

use App\Events\NotificationCreated;
use App\Models\Message;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class MessageActionController extends Controller
{
    public function acknowledge(Request $request, Message $message): RedirectResponse
    {
        $userId = (int) $request->user()->id;

        abort_unless($message->is_important || $message->important, 404);
        abort_unless((int) $message->receiver_id === $userId, 403);

        if ($message->acknowledged_at !== null) {
            return back()->with('success', 'Ce message a deja ete valide.');
        }

        $message->forceFill([
            'acknowledged_at' => now(),
        ])->save();

        if ((int) $message->sender_id !== $userId) {
            $this->broadcastSafely(
                new NotificationCreated((int) $message->sender_id, 'message', (int) $message->id)
            );
        }

        return back()->with('success', 'Reception du message validee.');
    }

    public function ping(Request $request, Message $message): RedirectResponse
    {
        $userId = (int) $request->user()->id;

        abort_unless($message->is_important || $message->important, 404);
        abort_unless((int) $message->sender_id === $userId, 403);

        if ($message->acknowledged_at !== null) {
            return back()->with('success', 'Ce message a deja ete valide.');
        }

        $this->broadcastSafely(
            new NotificationCreated((int) $message->receiver_id, 'message', (int) $message->id)
        );

        return back()->with('success', 'Relance envoyee au destinataire.');
    }
}
