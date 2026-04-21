<?php

namespace App\Http\Controllers;

use App\Models\EventInvitation;
use App\Models\Message;
use App\Models\MessageDraft;
use App\Models\Publication;
use App\Models\Task;
use App\Support\RichTextSanitizer;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
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

        $recentActivity = collect()
            ->concat(
                Message::query()
                    ->with('sender:id,name,email')
                    ->where('receiver_id', $user->id)
                    ->where('is_delivered', true)
                    ->orderByRaw('COALESCE(sent_at, created_at) desc')
                    ->limit(4)
                    ->get([
                        'id',
                        'sender_id',
                        'sujet',
                        'contenu',
                        'sent_at',
                        'created_at',
                    ])
                    ->map(function (Message $message) {
                        $senderName = $message->sender?->name ?? 'Expediteur inconnu';

                        return [
                            'id' => 'received-message-'.$message->id,
                            'type' => 'received_message',
                            'title' => "Nouveau message de {$senderName}",
                            'description' => $message->sujet ?: str($message->contenu)->squish()->limit(80)->toString(),
                            'occurred_at' => optional($message->sent_at ?? $message->created_at)?->toIso8601String(),
                        ];
                    })
            )
            ->concat(
                Message::query()
                    ->with('receiver:id,name,email')
                    ->where('sender_id', $user->id)
                    ->where(function ($query) {
                        $query
                            ->whereNotNull('sent_at')
                            ->orWhere('status', 'sent');
                    })
                    ->orderByRaw('COALESCE(sent_at, created_at) desc')
                    ->limit(4)
                    ->get([
                        'id',
                        'receiver_id',
                        'sujet',
                        'contenu',
                        'sent_at',
                        'created_at',
                        'status',
                    ])
                    ->map(function (Message $message) {
                        $receiverName = $message->receiver?->name ?? 'Destinataire inconnu';

                        return [
                            'id' => 'sent-message-'.$message->id,
                            'type' => 'sent_message',
                            'title' => "Message envoye a {$receiverName}",
                            'description' => $message->sujet ?: str($message->contenu)->squish()->limit(80)->toString(),
                            'occurred_at' => optional($message->sent_at ?? $message->created_at)?->toIso8601String(),
                        ];
                    })
            )
            ->concat(
                MessageDraft::query()
                    ->where('sender_id', $user->id)
                    ->latest('updated_at')
                    ->limit(3)
                    ->get([
                        'id',
                        'sujet',
                        'contenu',
                        'updated_at',
                        'created_at',
                    ])
                    ->map(function (MessageDraft $draft) {
                        return [
                            'id' => 'draft-'.$draft->id,
                            'type' => 'draft_saved',
                            'title' => 'Brouillon mis a jour',
                            'description' => $draft->sujet ?: str($draft->contenu)->squish()->limit(80)->toString() ?: 'Brouillon sans sujet',
                            'occurred_at' => optional($draft->updated_at ?? $draft->created_at)?->toIso8601String(),
                        ];
                    })
            )
            ->concat(
                EventInvitation::query()
                    ->with('event:id,title,start_time')
                    ->where('user_id', $user->id)
                    ->latest('updated_at')
                    ->limit(3)
                    ->get([
                        'id',
                        'event_id',
                        'status',
                        'updated_at',
                        'created_at',
                    ])
                    ->map(function (EventInvitation $invitation) {
                        $eventTitle = trim((string) optional($invitation->event)->title);
                        $statusLabel = match ($invitation->status) {
                            'accepted' => 'Invitation acceptee',
                            'declined' => 'Invitation refusee',
                            default => 'Invitation en attente',
                        };

                        return [
                            'id' => 'invitation-'.$invitation->id,
                            'type' => 'invitation',
                            'title' => $statusLabel,
                            'description' => $eventTitle !== '' ? $eventTitle : 'Evenement sans titre',
                            'occurred_at' => optional($invitation->updated_at ?? $invitation->created_at)?->toIso8601String(),
                        ];
                    })
            )
            ->concat(
                Publication::query()
                    ->where('user_id', $user->id)
                    ->latest()
                    ->limit(2)
                    ->get([
                        'id',
                        'title',
                        'content',
                        'created_at',
                    ])
                    ->map(function (Publication $publication) {
                        $plainContent = RichTextSanitizer::plainText($publication->content);
                        $description = trim((string) $publication->title) !== ''
                            ? trim((string) $publication->title)
                            : Str::limit($plainContent, 80);

                        return [
                            'id' => 'publication-'.$publication->id,
                            'type' => 'publication',
                            'title' => 'Publication partagee',
                            'description' => $description !== '' ? $description : 'Nouvelle publication interne',
                            'occurred_at' => optional($publication->created_at)?->toIso8601String(),
                        ];
                    })
            )
            ->filter(fn (array $activity) => filled($activity['occurred_at']))
            ->sortByDesc('occurred_at')
            ->take(6)
            ->values();

        $feedbackRequestNotification = $user->unreadNotifications()
            ->where('data->type', 'feedback_request')
            ->latest()
            ->first();

        $tasks = Task::query()
            ->with([
                'message:id,sujet',
            ])
            ->where('user_id', $user->id)
            ->whereNull('archived_at')
            ->latest()
            ->limit(8)
            ->get([
                'id',
                'user_id',
                'message_id',
                'title',
                'description',
                'status',
                'archived_at',
                'created_at',
            ])
            ->map(function (Task $task) {
                return [
                    'id' => $task->id,
                    'message_id' => $task->message_id,
                    'title' => $task->title,
                    'description' => $task->description,
                    'status' => $task->status,
                    'archived_at' => optional($task->archived_at)?->toIso8601String(),
                    'created_at' => optional($task->created_at)?->toIso8601String(),
                    'message' => $task->message
                        ? [
                            'id' => $task->message->id,
                            'sujet' => $task->message->sujet,
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
            'recentActivity' => $recentActivity,
            'tasks' => $tasks,
            'feedbackRequest' => $feedbackRequestNotification
                ? [
                    'id' => $feedbackRequestNotification->id,
                    'title' => (string) ($feedbackRequestNotification->data['title'] ?? 'Votre avis sur Cmail'),
                    'message' => (string) ($feedbackRequestNotification->data['message'] ?? ''),
                    'type' => (string) ($feedbackRequestNotification->data['type'] ?? ''),
                ]
                : null,
        ]);
    }
}
