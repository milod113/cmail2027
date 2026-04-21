<?php

namespace App\Http\Controllers;

use App\Models\EventInvitation;
use App\Models\Message;
use App\Models\MessageDraft;
use App\Models\MessageTask;
use App\Models\Publication;
use App\Models\Task;
use App\Support\RichTextSanitizer;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
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

        $tasks = MessageTask::query()
            ->with([
                'message:id,sender_id,receiver_id,receiver_ids,sujet',
            ])
            ->whereHas('message', function (Builder $query) use ($user) {
                $query->where(function (Builder $messageQuery) use ($user) {
                    $messageQuery
                        ->where('sender_id', $user->id)
                        ->orWhere('receiver_id', $user->id);

                    if (Schema::hasColumn('messages', 'receiver_ids')) {
                        $messageQuery->orWhereJsonContains('receiver_ids', (int) $user->id);
                    }
                });
            })
            ->orderByRaw('CASE WHEN is_completed = 0 THEN 0 ELSE 1 END')
            ->orderByRaw('CASE WHEN due_date IS NULL THEN 1 ELSE 0 END')
            ->orderBy('due_date')
            ->latest('id')
            ->limit(8)
            ->get()
            ->map(function (MessageTask $task) use ($user) {
                $message = $task->message;
                $isSender = $message && (int) $message->sender_id === (int) $user->id;

                return [
                    'id' => $task->id,
                    'kind' => 'message_task',
                    'message_id' => $task->message_id,
                    'title' => $task->title,
                    'description' => $task->description,
                    'priority' => $task->priority,
                    'status' => $task->is_completed ? 'completed' : 'pending',
                    'is_completed' => $task->is_completed,
                    'due_date' => optional($task->due_date)?->toIso8601String(),
                    'reminder_at' => optional($task->reminder_at)?->toIso8601String(),
                    'archived_at' => null,
                    'created_at' => optional($task->created_at)?->toIso8601String(),
                    'show_url' => route('tasks.show', $task),
                    'toggle_url' => route('tasks.toggle-status', $task),
                    'message' => $task->message
                        ? [
                            'id' => $message->id,
                            'sujet' => $message->sujet,
                            'view_url' => $isSender
                                ? route('messages.sent.show', $message)
                                : route('messages.show', $message),
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
