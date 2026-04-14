<?php

namespace App\Http\Controllers;

use App\Events\NotificationCreated;
use App\Events\ReplyCreated;
use App\Models\Message;
use App\Models\MessageDraft;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MessageController extends Controller
{
    public function inbox(Request $request): Response
    {
        $user = $request->user();
        $search = trim((string) $request->string('search'));
        $roleId = $request->integer('role');

        $messages = Message::query()
            ->with([
                'sender' => fn ($query) => $query
                    ->with('role:id,nom_role')
                    ->select('id', 'name', 'email', 'role_id'),
            ])
            ->where('receiver_id', $user->id)
            ->where('archived', false)
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('sujet', 'like', "%{$search}%")
                        ->orWhere('contenu', 'like', "%{$search}%")
                        ->orWhereHas('sender', function ($userQuery) use ($search) {
                            $userQuery
                                ->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            })
            ->when($roleId > 0, function ($query) use ($roleId) {
                $query->whereHas('sender', fn ($userQuery) => $userQuery->where('role_id', $roleId));
            })
            ->latest('sent_at')
            ->latest()
            ->get([
                'id',
                'sender_id',
                'receiver_id',
                'sujet',
                'contenu',
                'important',
                'lu',
                'sent_at',
                'scheduled_at',
                'type_message',
            ]);

        return Inertia::render('Messages/Inbox', [
            'stats' => [
                'unread' => $messages->where('lu', false)->count(),
                'important' => $messages->where('important', true)->count(),
                'total' => $messages->count(),
            ],
            'filters' => [
                'search' => $search,
                'role' => $roleId > 0 ? (string) $roleId : '',
            ],
            'roles' => Role::query()
                ->select('id', 'nom_role')
                ->orderBy('nom_role')
                ->get(),
            'messages' => $messages,
        ]);
    }

    public function sent(Request $request): Response
    {
        $user = $request->user();
        $search = trim((string) $request->string('search'));
        $roleId = $request->integer('role');

        return Inertia::render('Messages/Sent', [
            'messages' => Message::query()
                ->with([
                    'receiver' => fn ($query) => $query
                        ->with('role:id,nom_role')
                        ->select('id', 'name', 'email', 'role_id'),
                ])
                ->where('sender_id', $user->id)
                ->where('archived', false)
                ->when($search !== '', function ($query) use ($search) {
                    $query->where(function ($subQuery) use ($search) {
                        $subQuery
                            ->where('sujet', 'like', "%{$search}%")
                            ->orWhere('contenu', 'like', "%{$search}%")
                            ->orWhereHas('receiver', function ($userQuery) use ($search) {
                                $userQuery
                                    ->where('name', 'like', "%{$search}%")
                                    ->orWhere('email', 'like', "%{$search}%");
                            });
                    });
                })
                ->when($roleId > 0, function ($query) use ($roleId) {
                    $query->whereHas('receiver', fn ($userQuery) => $userQuery->where('role_id', $roleId));
                })
                ->latest('sent_at')
                ->latest()
                ->get([
                    'id',
                    'sender_id',
                    'receiver_id',
                    'sujet',
                    'contenu',
                    'important',
                    'sent_at',
                    'scheduled_at',
                    'type_message',
                    'requires_receipt',
                ]),
            'filters' => [
                'search' => $search,
                'role' => $roleId > 0 ? (string) $roleId : '',
            ],
            'roles' => Role::query()
                ->select('id', 'nom_role')
                ->orderBy('nom_role')
                ->get(),
        ]);
    }

    public function groupMessages(Request $request): Response
    {
        $user = $request->user();

        $messages = Message::query()
            ->with([
                'sender' => fn ($query) => $query
                    ->with('role:id,nom_role')
                    ->select('id', 'name', 'email', 'role_id'),
            ])
            ->where(function ($query) use ($user) {
                $query->where('sender_id', $user->id);

                if (Schema::hasColumn('messages', 'receiver_ids')) {
                    $query->orWhereJsonContains('receiver_ids', $user->id);
                }
            })
            ->when(
                Schema::hasColumn('messages', 'receiver_ids'),
                fn ($query) => $query->whereRaw('JSON_LENGTH(receiver_ids) >= 2'),
                fn ($query) => $query->whereRaw('1 = 0')
            )
            ->orderByDesc('created_at')
            ->get([
                'id',
                'sender_id',
                'receiver_id',
                'receiver_ids',
                'sujet',
                'contenu',
                'important',
                'lu',
                'created_at',
                'sent_at',
                'type_message',
            ])
            ->map(function (Message $message) use ($user) {
                $receiverIds = collect($message->receiver_ids ?? [])->filter()->values();

                return [
                    'id' => $message->id,
                    'sujet' => $message->sujet,
                    'contenu' => $message->contenu,
                    'important' => $message->important,
                    'lu' => $message->lu,
                    'created_at' => optional($message->created_at)?->toIso8601String(),
                    'sent_at' => optional($message->sent_at)?->toIso8601String(),
                    'participant_count' => $receiverIds
                        ->push($message->sender_id)
                        ->unique()
                        ->count(),
                    'is_sender' => (int) $message->sender_id === (int) $user->id,
                    'sender' => $message->sender
                        ? [
                            'id' => $message->sender->id,
                            'name' => $message->sender->name,
                            'email' => $message->sender->email,
                        ]
                        : null,
                ];
            });

        return Inertia::render('Messages/GroupIndex', [
            'messages' => $messages,
        ]);
    }

    public function archiveIndex(Request $request): Response
    {
        $user = $request->user();

        $messages = Message::query()
            ->with([
                'sender:id,name,email',
                'receiver:id,name,email',
            ])
            ->where('archived', true)
            ->where(function ($query) use ($user) {
                $query
                    ->where('sender_id', $user->id)
                    ->orWhere('receiver_id', $user->id);
            })
            ->latest('updated_at')
            ->latest()
            ->get([
                'id',
                'sender_id',
                'receiver_id',
                'sujet',
                'contenu',
                'important',
                'sent_at',
                'scheduled_at',
                'type_message',
                'updated_at',
            ]);

        return Inertia::render('Messages/Archive', [
            'messages' => $messages,
            'userId' => $user->id,
        ]);
    }

    public function showSent(Request $request, Message $message): Response
    {
        abort_unless($message->sender_id === $request->user()->id, 403);

        $message->load([
            'receiver:id,name,email',
            'sender:id,name,email',
        ]);

        $replies = collect();

        if (Schema::hasTable('reponses')) {
            $replies = \Illuminate\Support\Facades\DB::table('reponses')
                ->leftJoin('users', 'users.id', '=', 'reponses.user_id')
                ->where('reponses.message_id', $message->id)
                ->orderBy('reponses.created_at')
                ->get([
                    'reponses.id',
                    'reponses.user_id',
                    'reponses.contenu',
                    'reponses.fichier',
                    'reponses.created_at',
                    'users.name as user_name',
                ])
                ->map(function ($reply) {
                    return [
                        'id' => $reply->id,
                        'contenu' => $reply->contenu,
                        'fichier' => $reply->fichier,
                        'attachment_url' => $reply->fichier ? Storage::disk('public')->url($reply->fichier) : null,
                        'created_at' => optional($reply->created_at)?->toString(),
                        'user' => [
                            'id' => $reply->user_id,
                            'name' => $reply->user_name,
                        ],
                    ];
                });
        }

        return Inertia::render('Messages/SentShow', [
            'message' => [
                'id' => $message->id,
                'sujet' => $message->sujet,
                'contenu' => $message->contenu,
                'important' => $message->important,
                'requires_receipt' => $message->requires_receipt,
                'sent_at' => optional($message->sent_at)?->toIso8601String(),
                'scheduled_at' => optional($message->scheduled_at)?->toIso8601String(),
                'receipt_requested_at' => optional($message->receipt_requested_at)?->toIso8601String(),
                'deadline_reponse' => optional($message->deadline_reponse)?->toIso8601String(),
                'type_message' => $message->type_message,
                'can_be_redirected' => $message->can_be_redirected,
                'can_forward' => true,
                'fichier' => $message->fichier,
                'attachment_url' => $message->fichier ? Storage::disk('public')->url($message->fichier) : null,
                'receiver' => $message->receiver
                    ? [
                        'id' => $message->receiver->id,
                        'name' => $message->receiver->name,
                        'email' => $message->receiver->email,
                    ]
                    : null,
                'sender' => $message->sender
                    ? [
                        'id' => $message->sender->id,
                        'name' => $message->sender->name,
                        'email' => $message->sender->email,
                    ]
                    : null,
                'replies' => $replies->values()->all(),
            ],
        ]);
    }

    public function show(Request $request, Message $message): Response
    {
        $this->authorizeMessageAccess($request->user()->id, $message);

        if ($message->receiver_id === $request->user()->id && ! $message->lu) {
            $message->update([
                'lu' => true,
                'lu_le' => now(),
            ]);
        }

        $message->load([
            'sender:id,name,email',
            'receiver:id,name,email',
        ]);

        $replies = collect();

        if (Schema::hasTable('reponses')) {
            $replies = \Illuminate\Support\Facades\DB::table('reponses')
                ->leftJoin('users', 'users.id', '=', 'reponses.user_id')
                ->where('reponses.message_id', $message->id)
                ->orderBy('reponses.created_at')
                ->get([
                    'reponses.id',
                    'reponses.contenu',
                    'reponses.fichier',
                    'reponses.created_at',
                    'users.name as user_name',
                ])
                ->map(function ($reply) {
                    return [
                        'id' => $reply->id,
                        'contenu' => $reply->contenu,
                        'fichier' => $reply->fichier,
                        'attachment_url' => $reply->fichier ? Storage::disk('public')->url($reply->fichier) : null,
                        'created_at' => optional($reply->created_at)?->toString(),
                        'user' => [
                            'name' => $reply->user_name,
                        ],
                    ];
                });
        }

        return Inertia::render('Messages/Show', [
            'message' => [
                'id' => $message->id,
                'sujet' => $message->sujet,
                'contenu' => $message->contenu,
                'fichier' => $message->fichier,
                'attachment_url' => $message->fichier ? Storage::disk('public')->url($message->fichier) : null,
                'created_at' => optional($message->sent_at ?? $message->created_at)?->toIso8601String(),
                'can_be_redirected' => $message->can_be_redirected,
                'can_forward' => $message->sender_id === $request->user()->id || $message->can_be_redirected,
                'receiver_ids' => collect($message->receiver_ids ?? ($message->receiver_id ? [$message->receiver_id] : []))
                    ->filter()
                    ->values()
                    ->all(),
                'current_user_id' => $request->user()->id,
                'sender' => $message->sender
                    ? [
                        'id' => $message->sender->id,
                        'name' => $message->sender->name,
                        'email' => $message->sender->email,
                    ]
                    : null,
                'replies' => $replies->values()->all(),
                'unread_replies_count' => 0,
                'has_unread_replies' => false,
            ],
        ]);
    }

    public function storeReply(Request $request, Message $message): RedirectResponse
    {
        $this->authorizeMessageAccess($request->user()->id, $message);

        abort_unless(Schema::hasTable('reponses'), 500, 'Replies table is missing.');

        $validated = $request->validate([
            'contenu' => ['required', 'string'],
            'fichier' => ['nullable', 'file', 'max:10240'],
        ]);

        $storedFile = $request->hasFile('fichier')
            ? $request->file('fichier')->store('reponses', 'public')
            : null;

        DB::table('reponses')->insert([
            'message_id' => $message->id,
            'user_id' => $request->user()->id,
            'contenu' => $validated['contenu'],
            'fichier' => $storedFile,
            'lu' => false,
            'lu_le' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        if ((int) $message->sender_id !== (int) $request->user()->id) {
            broadcast(new ReplyCreated($message->id, (int) $message->sender_id))->toOthers();
            broadcast(new NotificationCreated((int) $message->sender_id, 'reply', $message->id))->toOthers();
        }

        return back()->with('success', 'Reponse envoyee avec succes.');
    }

    public function drafts(Request $request): Response
    {
        $drafts = MessageDraft::query()
            ->where('sender_id', $request->user()->id)
            ->latest('updated_at')
            ->get()
            ->map(function (MessageDraft $draft) {
                $receiverIds = collect($draft->receiver_ids ?? []);

                return [
                    'id' => $draft->id,
                    'sujet' => $draft->sujet,
                    'contenu' => $draft->contenu,
                    'receiver_count' => $receiverIds->count(),
                    'recipients' => User::query()
                        ->whereIn('id', $receiverIds)
                        ->orderBy('name')
                        ->get(['id', 'name', 'email']),
                    'updated_at' => optional($draft->updated_at)?->toIso8601String(),
                    'has_attachment' => filled($draft->fichier),
                    'type_message' => $draft->type_message,
                ];
            });

        return Inertia::render('Messages/Drafts', [
            'drafts' => $drafts,
        ]);
    }

    public function create(Request $request): Response
    {
        $forwardedMessageId = $request->integer('forward');
        $prefill = null;

        if ($forwardedMessageId > 0) {
            $message = Message::query()
                ->with([
                    'sender:id,name,email',
                    'receiver:id,name,email',
                ])
                ->findOrFail($forwardedMessageId);

            $this->authorizeMessageAccess($request->user()->id, $message);

            abort_unless(
                $message->sender_id === $request->user()->id || $message->can_be_redirected,
                403,
                'Ce message ne peut pas etre transfere.'
            );

            $prefill = [
                'receiver_ids' => [],
                'sujet' => $this->forwardSubject($message->sujet),
                'contenu' => $this->forwardBody($message),
                'important' => false,
                'requires_receipt' => false,
                'scheduled_at' => '',
                'type_message' => $message->type_message ?? 'normal',
                'deadline_reponse' => '',
                'can_be_redirected' => $message->can_be_redirected,
                'attachment_name' => $message->fichier ? basename($message->fichier) : null,
                'attachment_url' => $message->fichier ? Storage::disk('public')->url($message->fichier) : null,
                'existing_attachment_path' => $message->fichier,
                'forwarded_from_message_id' => $message->id,
                'forwarded_from' => [
                    'id' => $message->id,
                    'sender_name' => $message->sender?->name,
                    'sender_email' => $message->sender?->email,
                    'sent_at' => optional($message->sent_at ?? $message->created_at)?->toIso8601String(),
                    'attachment_name' => $message->fichier ? basename($message->fichier) : null,
                    'has_attachment' => filled($message->fichier),
                ],
            ];
        }

        return Inertia::render('Messages/Compose', $this->composePayload($request->user()->id, $prefill));
    }

    public function editDraft(Request $request, MessageDraft $draft): Response
    {
        abort_unless($draft->sender_id === $request->user()->id, 403);

        return Inertia::render('Messages/Compose', $this->composePayload($request->user()->id, [
            'id' => $draft->id,
            'receiver_ids' => $draft->receiver_ids ?? [],
            'sujet' => $draft->sujet ?? '',
            'contenu' => $draft->contenu ?? '',
            'important' => $draft->important,
            'requires_receipt' => $draft->requires_receipt,
            'scheduled_at' => optional($draft->scheduled_at)?->format('Y-m-d\TH:i'),
            'type_message' => $draft->type_message ?? 'normal',
            'deadline_reponse' => optional($draft->deadline_reponse)?->format('Y-m-d\TH:i'),
            'can_be_redirected' => $draft->can_be_redirected,
            'attachment_name' => $draft->fichier ? basename($draft->fichier) : null,
            'attachment_url' => $draft->fichier ? Storage::disk('public')->url($draft->fichier) : null,
            'existing_attachment_path' => $draft->fichier,
            'forwarded_from_message_id' => $draft->forwarded_from_message_id,
        ]));
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateMessageForSend($request, $request->user()->id);
        $validated['forwarded_from_message_id'] = $this->resolveForwardedFromMessageId(
            $validated['forwarded_from_message_id'] ?? null,
            $request->user()->id
        );
        $storedFile = $this->resolveAttachmentPath($request, 'messages');

        $createdMessages = $this->createMessagesFromPayload($validated, $request->user()->id, $storedFile);

        foreach ($createdMessages as $message) {
            broadcast(new NotificationCreated((int) $message->receiver_id, 'message', (int) $message->id))->toOthers();
        }

        return redirect()
            ->route('messages.sent')
            ->with('success', 'Message envoyé avec succès.');
    }

    public function storeDraft(Request $request): RedirectResponse
    {
        $validated = $this->validateDraft($request, $request->user()->id);
        $validated['forwarded_from_message_id'] = $this->resolveForwardedFromMessageId(
            $validated['forwarded_from_message_id'] ?? null,
            $request->user()->id
        );

        $draft = MessageDraft::create([
            'sender_id' => $request->user()->id,
            'receiver_ids' => $validated['receiver_ids'] ?? [],
            'sujet' => $validated['sujet'] ?? '',
            'contenu' => $validated['contenu'] ?? '',
            'fichier' => $request->hasFile('fichier')
                ? $request->file('fichier')->store('message-drafts', 'public')
                : $this->resolveExistingAttachmentPath($request),
            'important' => $validated['important'] ?? false,
            'requires_receipt' => $validated['requires_receipt'] ?? false,
            'scheduled_at' => $validated['scheduled_at'] ?? null,
            'type_message' => $validated['type_message'] ?? 'normal',
            'deadline_reponse' => $validated['deadline_reponse'] ?? null,
            'can_be_redirected' => $validated['can_be_redirected'] ?? false,
            'forwarded_from_message_id' => $validated['forwarded_from_message_id'] ?? null,
        ]);

        return redirect()
            ->route('drafts.edit', $draft)
            ->with('success', 'Brouillon enregistré avec succès.');
    }

    public function updateDraft(Request $request, MessageDraft $draft): RedirectResponse
    {
        abort_unless($draft->sender_id === $request->user()->id, 403);
        $validated = $this->validateDraft($request, $request->user()->id);
        $validated['forwarded_from_message_id'] = $this->resolveForwardedFromMessageId(
            $validated['forwarded_from_message_id'] ?? null,
            $request->user()->id
        );

        $draft->update([
            'receiver_ids' => $validated['receiver_ids'] ?? [],
            'sujet' => $validated['sujet'] ?? '',
            'contenu' => $validated['contenu'] ?? '',
            'fichier' => $this->storeOrReuseDraftFile($request, $draft),
            'important' => $validated['important'] ?? false,
            'requires_receipt' => $validated['requires_receipt'] ?? false,
            'scheduled_at' => $validated['scheduled_at'] ?? null,
            'type_message' => $validated['type_message'] ?? 'normal',
            'deadline_reponse' => $validated['deadline_reponse'] ?? null,
            'can_be_redirected' => $validated['can_be_redirected'] ?? false,
            'forwarded_from_message_id' => $validated['forwarded_from_message_id'] ?? null,
        ]);

        return redirect()
            ->route('drafts.edit', $draft)
            ->with('success', 'Brouillon mis à jour.');
    }

    public function sendDraft(Request $request, MessageDraft $draft): RedirectResponse
    {
        abort_unless($draft->sender_id === $request->user()->id, 403);

        $validated = $this->validateMessageForSend($request, $request->user()->id);
        $validated['forwarded_from_message_id'] = $this->resolveForwardedFromMessageId(
            $validated['forwarded_from_message_id'] ?? null,
            $request->user()->id
        );
        $storedFile = $this->storeOrReuseDraftFile($request, $draft);

        $createdMessages = $this->createMessagesFromPayload($validated, $request->user()->id, $storedFile);

        foreach ($createdMessages as $message) {
            broadcast(new NotificationCreated((int) $message->receiver_id, 'message', (int) $message->id))->toOthers();
        }

        if ($draft->fichier && $draft->fichier !== $storedFile && $this->draftOwnsAttachment($draft, $draft->fichier)) {
            Storage::disk('public')->delete($draft->fichier);
        }

        $draft->delete();

        return redirect()
            ->route('messages.sent')
            ->with('success', 'Brouillon envoyé avec succès.');
    }

    public function archive(Request $request, Message $message): RedirectResponse
    {
        $this->authorizeMessageAccess($request->user()->id, $message);

        $message->update([
            'archived' => true,
        ]);

        return back()->with('success', 'Message archivé avec succès.');
    }

    public function unarchive(Request $request, Message $message): RedirectResponse
    {
        $this->authorizeMessageAccess($request->user()->id, $message);

        $message->update([
            'archived' => false,
        ]);

        return back()->with('success', 'Message restauré avec succès.');
    }

    public function notifications(Request $request)
    {
        $user = $request->user();
        $readAt = $user->notifications_read_at;

        $messageNotifications = Message::query()
            ->with('sender:id,name,email')
            ->where('receiver_id', $user->id)
            ->latest(DB::raw('COALESCE(sent_at, created_at)'))
            ->limit(10)
            ->get()
            ->map(function (Message $message) use ($readAt) {
                $createdAt = $message->sent_at ?? $message->created_at;

                return [
                    'id' => "message-{$message->id}",
                    'type' => 'message',
                    'title' => 'Nouveau message',
                    'body' => $message->sujet,
                    'meta' => $message->sender?->name ?? 'Expediteur inconnu',
                    'href' => route('messages.show', $message),
                    'created_at' => optional($createdAt)?->toIso8601String(),
                    'unread' => $readAt === null || optional($createdAt)?->gt($readAt),
                ];
            });

        $replyNotifications = collect();

        if (Schema::hasTable('reponses')) {
            $replyNotifications = DB::table('reponses')
                ->join('messages', 'messages.id', '=', 'reponses.message_id')
                ->leftJoin('users', 'users.id', '=', 'reponses.user_id')
                ->where('messages.sender_id', $user->id)
                ->where('reponses.user_id', '!=', $user->id)
                ->orderByDesc('reponses.created_at')
                ->limit(10)
                ->get([
                    'reponses.id',
                    'reponses.message_id',
                    'reponses.created_at',
                    'messages.sujet',
                    'users.name as user_name',
                ])
                ->map(function ($reply) use ($readAt) {
                    $createdAt = Carbon::parse($reply->created_at);

                    return [
                        'id' => "reply-{$reply->id}",
                        'type' => 'reply',
                        'title' => 'Nouvelle reponse',
                        'body' => $reply->sujet ?: 'Message sans sujet',
                        'meta' => $reply->user_name ?: 'Utilisateur inconnu',
                        'href' => route('messages.sent.show', $reply->message_id),
                        'created_at' => $createdAt->toIso8601String(),
                        'unread' => $readAt === null || $createdAt->gt($readAt),
                    ];
                });
        }

        $notifications = $messageNotifications
            ->concat($replyNotifications)
            ->sortByDesc('created_at')
            ->take(12)
            ->values();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $notifications->where('unread', true)->count(),
            'unread_messages_count' => Message::query()
                ->where('receiver_id', $user->id)
                ->where('lu', false)
                ->where('archived', false)
                ->count(),
        ]);
    }

    public function markNotificationsRead(Request $request)
    {
        $request->user()->forceFill([
            'notifications_read_at' => now(),
        ])->save();

        return response()->noContent();
    }

    private function validateMessageForSend(Request $request, int $userId): array
    {
        return $request->validate([
            'receiver_ids' => ['required', 'array', 'min:1'],
            'receiver_ids.*' => ['required', 'integer', 'distinct', 'exists:users,id', Rule::notIn([$userId])],
            'sujet' => ['required', 'string', 'max:255'],
            'contenu' => ['required', 'string'],
            'fichier' => ['nullable', 'file', 'max:10240'],
            'existing_attachment_path' => ['nullable', 'string', 'max:255'],
            'important' => ['required', 'boolean'],
            'requires_receipt' => ['required', 'boolean'],
            'scheduled_at' => ['nullable', 'date'],
            'type_message' => ['nullable', 'string', 'max:100'],
            'deadline_reponse' => ['nullable', 'date'],
            'can_be_redirected' => ['required', 'boolean'],
            'forwarded_from_message_id' => ['nullable', 'integer', 'exists:messages,id'],
        ]);
    }

    private function validateDraft(Request $request, int $userId): array
    {
        return $request->validate([
            'receiver_ids' => ['nullable', 'array'],
            'receiver_ids.*' => ['required', 'integer', 'distinct', 'exists:users,id', Rule::notIn([$userId])],
            'sujet' => ['nullable', 'string', 'max:255'],
            'contenu' => ['nullable', 'string'],
            'fichier' => ['nullable', 'file', 'max:10240'],
            'existing_attachment_path' => ['nullable', 'string', 'max:255'],
            'important' => ['required', 'boolean'],
            'requires_receipt' => ['required', 'boolean'],
            'scheduled_at' => ['nullable', 'date'],
            'type_message' => ['nullable', 'string', 'max:100'],
            'deadline_reponse' => ['nullable', 'date'],
            'can_be_redirected' => ['required', 'boolean'],
            'forwarded_from_message_id' => ['nullable', 'integer', 'exists:messages,id'],
        ]);
    }

    private function createMessagesFromPayload(array $validated, int $senderId, ?string $storedFile): array
    {
        $scheduledAt = filled($validated['scheduled_at'] ?? null)
            ? Carbon::parse($validated['scheduled_at'])
            : null;
        $isScheduled = $scheduledAt !== null && $scheduledAt->isFuture();
        $messages = [];

        foreach ($validated['receiver_ids'] as $receiverId) {
            $messages[] = Message::create([
                'sender_id' => $senderId,
                'receiver_id' => $receiverId,
                'sujet' => $validated['sujet'],
                'contenu' => $validated['contenu'],
                'fichier' => $storedFile,
                'lu_le' => null,
                'lu' => false,
                'spam' => false,
                'important' => $validated['important'],
                'sent_at' => $isScheduled ? null : now(),
                'requires_receipt' => $validated['requires_receipt'],
                'receipt_requested_at' => $validated['requires_receipt'] ? now() : null,
                'scheduled_at' => $scheduledAt,
                'archived' => false,
                'type_message' => $validated['type_message'] ?? 'normal',
                'envoye' => ! $isScheduled,
                'deadline_reponse' => $validated['deadline_reponse'] ?? null,
                'can_be_redirected' => $validated['can_be_redirected'],
                'forwarded_from_message_id' => $validated['forwarded_from_message_id'] ?? null,
            ]);
        }

        return $messages;
    }

    private function authorizeMessageAccess(int $userId, Message $message): void
    {
        $hasJsonRecipient = Schema::hasColumn('messages', 'receiver_ids')
            && in_array($userId, $message->receiver_ids ?? [], true);

        abort_unless(
            $message->sender_id === $userId
                || $message->receiver_id === $userId
                || $hasJsonRecipient,
            403
        );
    }

    private function storeOrReuseDraftFile(Request $request, MessageDraft $draft): ?string
    {
        if (! $request->hasFile('fichier')) {
            return $this->resolveExistingAttachmentPath($request) ?? $draft->fichier;
        }

        $storedFile = $request->file('fichier')->store('message-drafts', 'public');

        if ($draft->fichier && $this->draftOwnsAttachment($draft, $draft->fichier)) {
            Storage::disk('public')->delete($draft->fichier);
        }

        return $storedFile;
    }

    private function composePayload(int $userId, ?array $draft = null): array
    {
        return [
            'recipients' => User::query()
                ->with('role:id,nom_role')
                ->select('id', 'name', 'email', 'role_id')
                ->whereKeyNot($userId)
                ->orderBy('name')
                ->get(),
            'roles' => Role::query()
                ->select('id', 'nom_role')
                ->orderBy('nom_role')
                ->get(),
            'draft' => $draft,
        ];
    }

    private function resolveAttachmentPath(Request $request, string $directory): ?string
    {
        if ($request->hasFile('fichier')) {
            return $request->file('fichier')->store($directory, 'public');
        }

        return $this->resolveExistingAttachmentPath($request);
    }

    private function resolveExistingAttachmentPath(Request $request): ?string
    {
        $path = trim((string) $request->input('existing_attachment_path', ''));

        if ($path === '') {
            return null;
        }

        return Storage::disk('public')->exists($path) ? $path : null;
    }

    private function resolveForwardedFromMessageId(?int $messageId, int $userId): ?int
    {
        if (! $messageId) {
            return null;
        }

        $message = Message::query()->findOrFail($messageId);
        $this->authorizeMessageAccess($userId, $message);

        abort_unless(
            $message->sender_id === $userId || $message->can_be_redirected,
            403,
            'Ce message ne peut pas etre transfere.'
        );

        return $message->id;
    }

    private function draftOwnsAttachment(MessageDraft $draft, string $path): bool
    {
        if (! $draft->forwarded_from_message_id) {
            return true;
        }

        $sourceAttachmentPath = Message::query()
            ->whereKey($draft->forwarded_from_message_id)
            ->value('fichier');

        return $sourceAttachmentPath !== $path;
    }

    private function forwardSubject(?string $subject): string
    {
        $subject = trim((string) $subject);

        if ($subject === '') {
            return 'TR: Message sans sujet';
        }

        if (str_starts_with(mb_strtolower($subject), 'tr:')) {
            return $subject;
        }

        return "TR: {$subject}";
    }

    private function forwardBody(Message $message): string
    {
        $senderName = $message->sender?->name ?? 'Inconnu';
        $senderEmail = $message->sender?->email ? " <{$message->sender->email}>" : '';
        $sentAt = optional($message->sent_at ?? $message->created_at)?->format('d/m/Y H:i') ?? 'Date inconnue';
        $attachmentNote = $message->fichier
            ? "\nPiece jointe originale : ".basename($message->fichier)
            : '';

        return trim(
            "---------- Message transfere ----------\n".
            "De : {$senderName}{$senderEmail}\n".
            "Date : {$sentAt}\n".
            "Sujet : {$message->sujet}\n".
            $attachmentNote.
            "\n\n".
            trim((string) $message->contenu)
        );
    }
}
