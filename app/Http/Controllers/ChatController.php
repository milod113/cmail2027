<?php

namespace App\Http\Controllers;

use App\Events\ChatMessageCreated;
use App\Events\NotificationCreated;
use App\Models\ChatMessage;
use App\Models\User;
use App\Notifications\NewChatMessageNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class ChatController extends Controller
{
    public function store(Request $request, User $user): JsonResponse
    {
        if (! Schema::hasTable('chat_messages')) {
            return response()->json([
                'message' => 'Le module chat doit etre migre avant utilisation.',
            ], 503);
        }

        $authUser = $request->user();

        abort_if((int) $authUser->id === (int) $user->id, 403);

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $chatMessage = ChatMessage::query()->create([
            'sender_id' => $authUser->id,
            'receiver_id' => $user->id,
            'body' => trim((string) $validated['body']),
        ]);

        $chatMessage->load([
            'sender:id,name,email',
            'receiver:id,name,email',
        ]);

        $messagePayload = $this->mapChatMessage($chatMessage, $authUser);

        $user->notify(new NewChatMessageNotification($chatMessage));

        broadcast(new ChatMessageCreated($messagePayload, (int) $authUser->id, (int) $user->id));
        broadcast(new NotificationCreated((int) $user->id, 'message', (int) $chatMessage->id));

        return response()->json([
            'message' => $messagePayload,
        ]);
    }

    public function markRead(Request $request, User $user): JsonResponse
    {
        if (! Schema::hasTable('chat_messages')) {
            return response()->json([
                'updated' => 0,
            ]);
        }

        $authUser = $request->user();
        $now = now();

        $updatedCount = ChatMessage::query()
            ->where('sender_id', $user->id)
            ->where('receiver_id', $authUser->id)
            ->whereNull('read_at')
            ->update([
                'read_at' => $now,
            ]);

        $authUser->unreadNotifications()
            ->where('data->subtype', 'chat_message')
            ->where('data->sender_id', $user->id)
            ->get()
            ->markAsRead();

        return response()->json([
            'updated' => $updatedCount,
        ]);
    }

    private function mapChatMessage(ChatMessage $message, User $viewer): array
    {
        return \App\Support\ChatPayload::map($message, (int) $viewer->id);
    }
}
