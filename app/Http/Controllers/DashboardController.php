<?php

namespace App\Http\Controllers;

use App\Models\EventInvitation;
use App\Models\Message;
use App\Models\MessageDraft;
use App\Models\Publication;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $pendingSentRequests = Message::query()
            ->pendingAcknowledge()
            ->where('sender_id', $user->id)
            ->with([
                'receiver:id,name,email',
            ])
            ->orderByRaw('COALESCE(sent_at, created_at) asc')
            ->get()
            ->map(function (Message $message) {
                return [
                    'id' => $message->id,
                    'subject' => $message->sujet,
                    'body' => $message->contenu,
                    'excerpt' => str($message->contenu)->squish()->limit(120)->toString(),
                    'sent_at' => optional($message->sent_at)?->toIso8601String(),
                    'created_at' => optional($message->created_at)?->toIso8601String(),
                    'receiver' => $message->receiver
                        ? [
                            'id' => $message->receiver->id,
                            'name' => $message->receiver->name,
                            'email' => $message->receiver->email,
                        ]
                        : null,
                ];
            })
            ->values();

        $actionRequiredMessages = Message::query()
            ->requiresActionFrom((int) $user->id)
            ->with([
                'sender:id,name,email',
            ])
            ->orderByRaw('COALESCE(sent_at, created_at) asc')
            ->get()
            ->map(function (Message $message) {
                return [
                    'id' => $message->id,
                    'subject' => $message->sujet,
                    'body' => $message->contenu,
                    'excerpt' => str($message->contenu)->squish()->limit(120)->toString(),
                    'sent_at' => optional($message->sent_at)?->toIso8601String(),
                    'created_at' => optional($message->created_at)?->toIso8601String(),
                    'sender' => $message->sender
                        ? [
                            'id' => $message->sender->id,
                            'name' => $message->sender->name,
                            'email' => $message->sender->email,
                        ]
                        : null,
                ];
            })
            ->values();

        return Inertia::render('Dashboard', [
            'publications' => Publication::query()->feed()->get(),
            'stats' => [
                'unread_messages' => Message::query()
                    ->where('receiver_id', $user->id)
                    ->where('is_delivered', true)
                    ->where('lu', false)
                    ->where('archived', false)
                    ->count(),
                'pending_invitations' => EventInvitation::query()
                    ->where('user_id', $user->id)
                    ->where('status', 'pending')
                    ->count(),
                'drafts' => MessageDraft::query()
                    ->where('sender_id', $user->id)
                    ->count(),
                'unread_notifications' => $user->unreadNotifications()->count(),
                'publications_count' => Publication::query()->count(),
            ],
            'pendingSentRequests' => $pendingSentRequests,
            'actionRequiredMessages' => $actionRequiredMessages,
        ]);
    }
}
