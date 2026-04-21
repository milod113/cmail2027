<?php

namespace App\Http\Controllers;

use App\Events\NotificationCreated;
use App\Events\ReplyCreated;
use App\Models\EventInvitation;
use App\Models\Message;
use App\Models\MessageDraft;
use App\Models\Role;
use App\Models\User;
use App\Models\UserSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
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
        $quickFilter = (string) $request->string('quick');
        $allowedQuickFilters = ['', 'yesterday', 'important', 'urgent'];

        if (! in_array($quickFilter, $allowedQuickFilters, true)) {
            $quickFilter = '';
        }

        $messages = Message::query()
            ->with([
                'sender' => fn ($query) => $query
                    ->with('role:id,nom_role')
                    ->select('id', 'name', 'email', 'role_id'),
                'originalReceiver:id,name,email',
            ])
            ->where('receiver_id', $user->id)
            ->where('is_delivered', true)
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
            ->when($quickFilter === 'yesterday', function ($query) {
                $query->whereDate(DB::raw('COALESCE(sent_at, created_at)'), Carbon::yesterday()->toDateString());
            })
            ->when($quickFilter === 'important', function ($query) {
                $query->where('important', true);
            })
            ->when($quickFilter === 'urgent', function ($query) {
                $query->where('type_message', 'urgent');
            })
            ->latest('sent_at')
            ->latest()
            ->get([
                'id',
                'sender_id',
                'receiver_id',
                'original_receiver_id',
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
                'quick' => $quickFilter,
            ],
            'roles' => Role::query()
                ->select('id', 'nom_role')
                ->orderBy('nom_role')
                ->get(),
            'messages' => $messages,
        ]);
    }

    public function toggleImportant(Request $request, Message $message): RedirectResponse
    {
        $this->authorizeMessageAccess($request->user()->id, $message);

        $isImportant = ! $message->important;

        $message->update([
            'important' => $isImportant,
            'is_important' => $isImportant,
        ]);

        return back()->with('success', $message->important
            ? 'Message marque comme important.'
            : 'Message retire des importants.');
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
                    'originalReceiver:id,name,email',
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
                    'original_receiver_id',
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
        $hasReceiverIdsColumn = Schema::hasColumn('messages', 'receiver_ids');

        $columns = [
            'id',
            'sender_id',
            'receiver_id',
            'sujet',
            'contenu',
            'important',
            'lu',
            'created_at',
            'sent_at',
            'type_message',
            'message_group_uuid',
        ];

        if ($hasReceiverIdsColumn) {
            $columns[] = 'receiver_ids';
        }

        $messages = Message::query()
            ->with([
                'sender' => fn ($query) => $query
                    ->with('role:id,nom_role')
                    ->select('id', 'name', 'email', 'role_id'),
            ])
            ->whereNull('parent_id')
            ->where(function ($query) use ($user) {
                $query
                    ->where('sender_id', $user->id)
                    ->orWhere('receiver_id', $user->id);
            })
            ->when(
                $hasReceiverIdsColumn,
                fn ($query) => $query->whereRaw('JSON_LENGTH(receiver_ids) >= 2'),
                fn ($query) => $query->whereRaw('1 = 0')
            )
            ->orderByDesc('created_at')
            ->get($columns)
            ->groupBy(function (Message $message) {
                if (filled($message->message_group_uuid)) {
                    return 'uuid:'.$message->message_group_uuid;
                }

                $receiverIds = collect($message->receiver_ids ?? [])
                    ->filter()
                    ->map(fn ($id) => (int) $id)
                    ->sort()
                    ->values()
                    ->all();

                return implode('|', [
                    $message->sender_id,
                    json_encode($receiverIds),
                    $message->sujet,
                    $message->contenu,
                    optional($message->sent_at ?? $message->created_at)?->toIso8601String(),
                    $message->type_message ?? '',
                ]);
            })
            ->map(function ($group) use ($user) {
                $preferredMessage = $group->firstWhere('receiver_id', $user->id)
                    ?? $group->firstWhere('sender_id', $user->id)
                    ?? $group->first();

                $receiverIds = collect($preferredMessage->receiver_ids ?? [])
                    ->filter()
                    ->map(fn ($id) => (int) $id)
                    ->values();

                return [
                    'id' => $preferredMessage->id,
                    'sujet' => $preferredMessage->sujet,
                    'contenu' => $preferredMessage->contenu,
                    'important' => $group->contains(fn (Message $message) => $message->important),
                    'lu' => (bool) $preferredMessage->lu,
                    'created_at' => optional($preferredMessage->created_at)?->toIso8601String(),
                    'sent_at' => optional($preferredMessage->sent_at)?->toIso8601String(),
                    'participant_count' => $receiverIds
                        ->push($preferredMessage->sender_id)
                        ->unique()
                        ->count(),
                    'is_sender' => (int) $preferredMessage->sender_id === (int) $user->id,
                    'sender' => $preferredMessage->sender
                        ? [
                            'id' => $preferredMessage->sender->id,
                            'name' => $preferredMessage->sender->name,
                            'email' => $preferredMessage->sender->email,
                        ]
                        : null,
                ];
            })
            ->values();

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
        $threadRoot = $this->resolveThreadRootMessage($message);

        if ($this->shouldRenderGroupThreadView($request->user()->id, $threadRoot)) {
            return $this->renderGroupThreadView($request, $threadRoot);
        }

        $this->authorizeMessageAccess($request->user()->id, $message);

        if (
            (int) $message->receiver_id === (int) $request->user()->id
            && ! $message->is_delivered
        ) {
            abort(404);
        }

        if ($message->receiver_id === $request->user()->id && ! $message->lu) {
            $message->update([
                'lu' => true,
                'lu_le' => now(),
            ]);
        }

        if ((int) $message->receiver_id === (int) $request->user()->id) {
            $this->markAsRead($message);
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
                'important' => (bool) ($message->is_important || $message->important),
                'requires_receipt' => $message->requires_receipt,
                'receipt_requested_at' => optional($message->receipt_requested_at)?->toIso8601String(),
                'deadline_reponse' => optional($message->deadline_reponse)?->toIso8601String(),
                'acknowledged_at' => optional($message->acknowledged_at)?->toIso8601String(),
                'type_message' => $message->type_message,
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
                'receiver' => $message->receiver
                    ? [
                        'id' => $message->receiver->id,
                        'name' => $message->receiver->name,
                        'email' => $message->receiver->email,
                    ]
                    : null,
                'replies' => $replies->values()->all(),
                'unread_replies_count' => 0,
                'has_unread_replies' => false,
            ],
        ]);
    }

    public function trackedIndex(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Messages/TrackedMessages', [
            'messages' => Message::query()
                ->with([
                    'receiver:id,name,email',
                ])
                ->where('sender_id', $user->id)
                ->where('is_tracked', true)
                ->latest('sent_at')
                ->latest()
                ->get([
                    'id',
                    'sender_id',
                    'receiver_id',
                    'sujet',
                    'contenu',
                    'sent_at',
                    'read_at',
                    'is_tracked',
                    'is_delivered',
                    'created_at',
                ]),
        ]);
    }

    public function replyAll(Request $request, Message $message): RedirectResponse
    {
        $rootMessage = $this->resolveThreadRootMessage($message);
        $this->authorizeDirectorThreadReply($request->user()->id, $rootMessage);

        $validated = $this->validateTrackedReply($request);
        $storedFile = $this->resolveAttachmentPath($request, 'messages');

        $recipientMessages = $this->groupRecipientMessages($rootMessage);
        $receiverIds = $recipientMessages
            ->pluck('receiver_id')
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

        foreach ($recipientMessages as $recipientMessage) {
            $reply = $this->createTrackedReplyMessage(
                $rootMessage,
                $request->user()->id,
                (int) $recipientMessage->receiver_id,
                $validated['contenu'],
                $storedFile,
                $receiverIds,
            );

            $this->broadcastSafely(
                new NotificationCreated((int) $reply->receiver_id, 'message', (int) $reply->id)
            );
        }

        return back()->with('success', 'Réponse envoyée à tous les destinataires.');
    }

    public function replyRecipient(Request $request, Message $message, User $recipient): RedirectResponse
    {
        $rootMessage = $this->resolveThreadRootMessage($message);
        $this->authorizeDirectorThreadReply($request->user()->id, $rootMessage);

        $recipientMessages = $this->groupRecipientMessages($rootMessage);
        abort_unless(
            $recipientMessages->contains(fn (Message $recipientMessage) => (int) $recipientMessage->receiver_id === (int) $recipient->id),
            404
        );

        $validated = $this->validateTrackedReply($request);
        $storedFile = $this->resolveAttachmentPath($request, 'messages');

        $reply = $this->createTrackedReplyMessage(
            $rootMessage,
            $request->user()->id,
            (int) $recipient->id,
            $validated['contenu'],
            $storedFile,
            [$recipient->id],
        );

        $this->broadcastSafely(
            new NotificationCreated((int) $reply->receiver_id, 'message', (int) $reply->id)
        );

        return back()->with('success', 'Réponse envoyée au destinataire sélectionné.');
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
            $this->broadcastSafely(new ReplyCreated($message->id, (int) $message->sender_id));
            $this->broadcastSafely(
                new NotificationCreated((int) $message->sender_id, 'reply', $message->id)
            );
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

        if ($prefill === null) {
            $recipientId = $request->integer('recipient_id');

            if ($recipientId > 0) {
                abort_if($recipientId === $request->user()->id, 403);
                abort_unless(User::query()->where('id', $recipientId)->exists(), 404);

                $prefill = [
                    'receiver_ids' => [$recipientId],
                    'sujet' => '',
                    'contenu' => '',
                    'important' => false,
                    'requires_receipt' => false,
                    'scheduled_at' => '',
                    'type_message' => 'normal',
                    'deadline_reponse' => '',
                    'can_be_redirected' => false,
                    'attachment_name' => null,
                    'attachment_url' => null,
                    'existing_attachment_path' => '',
                    'forwarded_from_message_id' => null,
                ];
            }
        }

        return Inertia::render('Messages/Compose', $this->composePayload($request->user()->id, $prefill));
    }

    public function composeParam(Request $request): Response
    {
        $recipientId = $request->integer('recipient_id');

        abort_unless($recipientId > 0, 400);
        abort_if($recipientId === $request->user()->id, 403);
        abort_unless(User::query()->where('id', $recipientId)->exists(), 404);

        $prefill = [
            'receiver_ids' => [$recipientId],
            'sujet' => '',
            'contenu' => '',
            'important' => false,
            'requires_receipt' => false,
            'scheduled_at' => '',
            'type_message' => 'normal',
            'deadline_reponse' => '',
            'can_be_redirected' => false,
            'attachment_name' => null,
            'attachment_url' => null,
            'existing_attachment_path' => '',
            'forwarded_from_message_id' => null,
        ];

        return Inertia::render('Messages/ComposeParam', $this->composePayload($request->user()->id, $prefill));
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
        $deliveredMessages = collect($createdMessages)
            ->filter(fn (Message $message) => $message->is_delivered)
            ->values();
        $followUpMessages = $this->handleOutOfOfficeActions($deliveredMessages->all());

        foreach ($deliveredMessages->concat($followUpMessages) as $message) {
            $this->broadcastSafely(
                new NotificationCreated((int) $message->receiver_id, 'message', (int) $message->id)
            );
        }

        if ($deliveredMessages->isEmpty()) {
            return redirect()
                ->route('messages.sent')
                ->with('success', 'Message programme avec succes.');
        }

        return redirect()
            ->route('messages.sent')
            ->with('success', 'Message envoye avec succes.');

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
        $deliveredMessages = collect($createdMessages)
            ->filter(fn (Message $message) => $message->is_delivered)
            ->values();
        $followUpMessages = $this->handleOutOfOfficeActions($deliveredMessages->all());

        foreach ($deliveredMessages->concat($followUpMessages) as $message) {
            $this->broadcastSafely(
                new NotificationCreated((int) $message->receiver_id, 'message', (int) $message->id)
            );
        }

        if ($draft->fichier && $draft->fichier !== $storedFile && $this->draftOwnsAttachment($draft, $draft->fichier)) {
            Storage::disk('public')->delete($draft->fichier);
        }

        $draft->delete();

        if ($deliveredMessages->isEmpty()) {
            return redirect()
                ->route('messages.sent')
                ->with('success', 'Brouillon programme avec succes.');
        }

        return redirect()
            ->route('messages.sent')
            ->with('success', 'Brouillon envoye avec succes.');

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

    public function bulkArchive(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'message_ids' => ['required', 'array', 'min:1'],
            'message_ids.*' => ['required', 'integer', 'exists:messages,id'],
        ]);

        $messages = Message::query()
            ->whereIn('id', $validated['message_ids'])
            ->get();

        abort_if($messages->count() !== count($validated['message_ids']), 404);

        foreach ($messages as $message) {
            $this->authorizeMessageAccess($request->user()->id, $message);
        }

        Message::query()
            ->whereIn('id', $messages->pluck('id'))
            ->update([
                'archived' => true,
            ]);

        return back()->with('success', 'Messages archivés avec succès.');
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
            ->where('is_delivered', true)
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

        $eventInviteNotifications = collect();
        $eventRsvpNotifications = collect();
        $databaseNotifications = Schema::hasTable('notifications')
            ? $user->notifications()
                ->latest()
                ->limit(10)
                ->get()
                ->map(function ($notification) use ($readAt) {
                    $data = is_array($notification->data) ? $notification->data : [];
                    $createdAt = $notification->created_at;
                    $eventId = (int) ($data['event_id'] ?? 0);
                    $eventTitle = (string) ($data['event_title'] ?? 'Evenement');
                    $messageSubject = (string) ($data['message_subject'] ?? 'Message sans sujet');
                    $reporterName = (string) ($data['reporter_name'] ?? 'Utilisateur inconnu');
                    $reasonCategory = (string) ($data['reason_category'] ?? '');
                    $reason = trim((string) ($data['status_reason'] ?? ''));
                    $subtype = (string) ($data['subtype'] ?? 'system');

                    if ($subtype === 'event_canceled') {
                        return [
                            'id' => "db-{$notification->id}",
                            'type' => 'event',
                            'title' => 'Evenement annule',
                            'body' => $eventTitle,
                            'meta' => $reason !== '' ? $reason : 'Annulation communiquee par l organisateur',
                            'href' => $eventId > 0 ? route('events.show', $eventId) : route('events.invitations'),
                            'created_at' => optional($createdAt)?->toIso8601String(),
                            'unread' => $notification->read_at === null || ($readAt !== null && optional($createdAt)?->gt($readAt)),
                        ];
                    }

                    if ($subtype === 'event_postponed') {
                        $startTime = filled($data['start_time'] ?? null)
                            ? Carbon::parse((string) $data['start_time'])->format('d/m/Y H:i')
                            : null;

                        return [
                            'id' => "db-{$notification->id}",
                            'type' => 'event',
                            'title' => 'Evenement reporte',
                            'body' => $eventTitle,
                            'meta' => $startTime
                                ? "Nouvelle date: {$startTime}"
                                : ($reason !== '' ? $reason : 'Report communique par l organisateur'),
                            'href' => $eventId > 0 ? route('events.show', $eventId) : route('events.invitations'),
                            'created_at' => optional($createdAt)?->toIso8601String(),
                            'unread' => $notification->read_at === null || ($readAt !== null && optional($createdAt)?->gt($readAt)),
                        ];
                    }

                    if ($subtype === 'reported_message_created') {
                        $reportId = (int) ($data['report_id'] ?? 0);

                        return [
                            'id' => "db-{$notification->id}",
                            'type' => 'system',
                            'title' => 'Nouveau signalement message',
                            'body' => $messageSubject !== '' ? $messageSubject : 'Message signale',
                            'meta' => trim($reporterName.($reasonCategory !== '' ? ' - '.$reasonCategory : '')),
                            'href' => $reportId > 0 ? route('admin.reports.index', ['report' => $reportId]) : route('admin.reports.index'),
                            'created_at' => optional($createdAt)?->toIso8601String(),
                            'unread' => $notification->read_at === null,
                        ];
                    }

                    if ($subtype === 'chat_message') {
                        $senderId = (int) ($data['sender_id'] ?? 0);
                        $senderName = (string) ($data['sender_name'] ?? 'Utilisateur inconnu');
                        $preview = (string) ($data['preview'] ?? 'Nouveau message instantane');

                        return [
                            'id' => "db-{$notification->id}",
                            'type' => 'message',
                            'title' => 'Nouveau message instantane',
                            'body' => $preview,
                            'meta' => $senderName,
                            'href' => $senderId > 0 ? route('contacts.show', $senderId) : route('notifications.index'),
                            'created_at' => optional($createdAt)?->toIso8601String(),
                            'unread' => $notification->read_at === null,
                        ];
                    }

                    if ($subtype === 'message_task_reminder') {
                        $taskId = (int) ($data['task_id'] ?? 0);
                        $taskTitle = (string) ($data['task_title'] ?? 'Tache professionnelle');
                        $messageSubject = (string) ($data['message_subject'] ?? '');
                        $priority = (string) ($data['priority'] ?? 'normal');

                        return [
                            'id' => "db-{$notification->id}",
                            'type' => 'system',
                            'title' => 'Rappel de tâche',
                            'body' => $taskTitle,
                            'meta' => trim(($messageSubject !== '' ? $messageSubject.' - ' : '').$priority),
                            'href' => $taskId > 0 ? route('tasks.show', $taskId) : route('tasks.index'),
                            'created_at' => optional($createdAt)?->toIso8601String(),
                            'unread' => $notification->read_at === null,
                        ];
                    }

                    return [
                        'id' => "db-{$notification->id}",
                        'type' => 'system',
                        'title' => 'Notification',
                        'body' => $eventTitle,
                        'meta' => $reason,
                        'href' => $eventId > 0 ? route('events.show', $eventId) : route('notifications.index'),
                        'created_at' => optional($createdAt)?->toIso8601String(),
                        'unread' => $notification->read_at === null,
                    ];
                })
            : collect();

        if (Schema::hasTable('events') && Schema::hasTable('event_invitations')) {
            $eventInviteNotifications = EventInvitation::query()
                ->with([
                    'event:id,title,organizer_id',
                    'event.organizer:id,name',
                ])
                ->where('user_id', $user->id)
                ->latest('created_at')
                ->limit(10)
                ->get()
                ->map(function (EventInvitation $invitation) use ($readAt) {
                    $createdAt = $invitation->created_at;
                    $event = $invitation->event;

                    return [
                        'id' => "event-invite-{$invitation->id}",
                        'type' => 'event',
                        'title' => 'Invitation evenement',
                        'body' => $event?->title ?? 'Evenement',
                        'meta' => $event?->organizer?->name ?? 'Organisateur',
                        'href' => $event ? route('events.show', $event->id) : route('events.invitations'),
                        'created_at' => optional($createdAt)?->toIso8601String(),
                        'unread' => $readAt === null || optional($createdAt)?->gt($readAt),
                    ];
                });

            $eventRsvpNotifications = EventInvitation::query()
                ->with([
                    'event:id,title,organizer_id',
                    'user:id,name',
                ])
                ->whereHas('event', fn ($query) => $query->where('organizer_id', $user->id))
                ->where('user_id', '!=', $user->id)
                ->whereIn('status', ['confirmed', 'rejected', 'present'])
                ->latest('updated_at')
                ->limit(10)
                ->get()
                ->map(function (EventInvitation $invitation) use ($readAt) {
                    $updatedAt = $invitation->updated_at;
                    $event = $invitation->event;
                    $inviteeName = $invitation->user?->name ?? 'Utilisateur';

                    return [
                        'id' => "event-rsvp-{$invitation->id}-".optional($updatedAt)?->timestamp,
                        'type' => 'event',
                        'title' => 'Reponse invitation',
                        'body' => $event?->title ?? 'Evenement',
                        'meta' => "{$inviteeName}: {$invitation->status}",
                        'href' => $event ? route('events.show', $event->id) : route('events.invitations'),
                        'created_at' => optional($updatedAt)?->toIso8601String(),
                        'unread' => $readAt === null || optional($updatedAt)?->gt($readAt),
                    ];
                });
        }

        $notifications = $messageNotifications
            ->concat($replyNotifications)
            ->concat($eventInviteNotifications)
            ->concat($eventRsvpNotifications)
            ->concat($databaseNotifications)
            ->sortByDesc('created_at')
            ->take(12)
            ->values();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $notifications->where('unread', true)->count(),
            'unread_messages_count' => Message::query()
                ->where('receiver_id', $user->id)
                ->where('is_delivered', true)
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

        if (Schema::hasTable('notifications')) {
            $request->user()->unreadNotifications->markAsRead();
        }

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
            'is_tracked' => ['required', 'boolean'],
            'scheduled_at' => ['nullable', 'date', 'after:now'],
            'type_message' => ['nullable', 'string', 'max:100'],
            'deadline_reponse' => ['nullable', 'date'],
                'can_be_redirected' => ['required', 'boolean'],
                'forwarded_from_message_id' => ['nullable', 'integer', 'exists:messages,id'],
                'original_receiver_id' => ['nullable', 'integer', 'exists:users,id'],
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
                'original_receiver_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);
    }

    private function createMessagesFromPayload(array $validated, int $senderId, ?string $storedFile): array
    {
        $sender = User::query()
            ->with(['settings', 'profile', 'department'])
            ->findOrFail($senderId);
        $scheduledAt = filled($validated['scheduled_at'] ?? null)
            ? Carbon::parse($validated['scheduled_at'])
            : null;
        $isScheduled = $scheduledAt !== null && $scheduledAt->isFuture();
        $sentAt = $isScheduled ? null : now();
        $receiptRequestedAt = $validated['requires_receipt'] && ! $isScheduled ? now() : null;
        $messageGroupUuid = count($validated['receiver_ids']) > 1 ? (string) Str::uuid() : null;
        $content = $this->appendSignatureToMessageContent(
            (string) $validated['contenu'],
            $sender->formatted_signature
        );
        $messages = [];

        foreach ($validated['receiver_ids'] as $receiverId) {
            $payload = [
                'sender_id' => $senderId,
                'receiver_id' => $receiverId,
                'original_receiver_id' => $validated['original_receiver_id'] ?? null,
                'sujet' => $validated['sujet'],
                'contenu' => $content,
                'fichier' => $storedFile,
                'lu_le' => null,
                'lu' => false,
                'spam' => false,
                'important' => $validated['important'],
                'is_important' => $validated['important'],
                'sent_at' => $sentAt,
                'requires_receipt' => $validated['requires_receipt'],
                'is_tracked' => $validated['is_tracked'],
                'receipt_requested_at' => $receiptRequestedAt,
                'scheduled_at' => $scheduledAt,
                'is_delivered' => ! $isScheduled,
                'read_at' => null,
                'archived' => false,
                'type_message' => $validated['type_message'] ?? 'normal',
                'envoye' => ! $isScheduled,
                'deadline_reponse' => $validated['deadline_reponse'] ?? null,
                'can_be_redirected' => $validated['can_be_redirected'],
                'message_group_uuid' => $messageGroupUuid,
                'forwarded_from_message_id' => $validated['forwarded_from_message_id'] ?? null,
            ];

            if (Schema::hasColumn('messages', 'receiver_ids')) {
                $payload['receiver_ids'] = array_values($validated['receiver_ids']);
            }

            $messages[] = Message::create($payload);
        }

        return $messages;
    }

    private function appendSignatureToMessageContent(string $content, string $signature): string
    {
        $signature = trim($this->normalizeMessageText($signature));

        if ($signature === '') {
            return $content;
        }

        $normalizedContent = $this->normalizeMessageText($content);
        $trimmedContent = rtrim($normalizedContent);

        if ($trimmedContent === '') {
            return $signature;
        }

        if (str_ends_with($trimmedContent, $signature)) {
            return $content;
        }

        return $trimmedContent."\n\n".$signature;
    }

    private function normalizeMessageText(string $value): string
    {
        return str_replace(["\r\n", "\r"], "\n", $value);
    }

    private function markAsRead(Message $message): void
    {
        if (! $message->is_tracked || $message->read_at !== null) {
            return;
        }

        $message->forceFill([
            'read_at' => now(),
        ])->save();
    }

    private function handleOutOfOfficeActions(array $messages): array
    {
        $messages = collect($messages)
            ->filter(fn ($message) => $message instanceof Message)
            ->values();

        if ($messages->isEmpty()) {
            return [];
        }

        $messages->each(function (Message $message): void {
            $message->loadMissing([
                'sender:id,name,email',
                'receiver' => fn ($query) => $query
                    ->with([
                        'userSetting.delegateUser:id,name,email',
                    ])
                    ->select('id', 'name', 'email'),
            ]);
        });

        $generatedMessages = [];

        foreach ($messages as $message) {
            $settings = $message->receiver?->userSetting;

            if (! $settings?->is_out_of_office) {
                continue;
            }

            $autoReply = $this->createOutOfOfficeReply($message, $settings);

            if ($autoReply) {
                $generatedMessages[] = $autoReply;
            }

            $delegatedCopy = $this->createDelegatedCopy($message, $settings);

            if ($delegatedCopy) {
                $generatedMessages[] = $delegatedCopy;
            }
        }

        return $generatedMessages;
    }

    private function createOutOfOfficeReply(Message $message, UserSetting $settings): ?Message
    {
        if (! $settings->ooo_message || (int) $message->sender_id === (int) $message->receiver_id) {
            return null;
        }

        $payload = [
            'sender_id' => $message->receiver_id,
            'receiver_id' => $message->sender_id,
            'original_receiver_id' => null,
            'sujet' => $this->replySubject($message->sujet),
            'contenu' => $settings->ooo_message,
            'fichier' => null,
            'lu_le' => null,
            'lu' => false,
            'spam' => false,
            'important' => false,
            'sent_at' => now(),
            'requires_receipt' => false,
            'receipt_requested_at' => null,
            'scheduled_at' => null,
            'is_delivered' => true,
            'archived' => false,
            'type_message' => 'out_of_office',
            'envoye' => true,
            'deadline_reponse' => null,
            'can_be_redirected' => false,
            'message_group_uuid' => null,
            'parent_id' => null,
            'forwarded_from_message_id' => $message->id,
        ];

        if (Schema::hasColumn('messages', 'receiver_ids')) {
            $payload['receiver_ids'] = [$message->sender_id];
        }

        return Message::create($payload);
    }

    private function createDelegatedCopy(Message $message, UserSetting $settings): ?Message
    {
        if (! $settings->redirect_messages || ! $settings->delegate_user_id) {
            return null;
        }

        if ((int) $settings->delegate_user_id === (int) $message->sender_id) {
            return null;
        }

        $payload = [
            'sender_id' => $message->sender_id,
            'receiver_id' => $settings->delegate_user_id,
            'original_receiver_id' => $message->receiver_id,
            'sujet' => $this->delegatedSubject($message->sujet),
            'contenu' => $this->delegatedBody($message),
            'fichier' => $message->fichier,
            'lu_le' => null,
            'lu' => false,
            'spam' => false,
            'important' => $message->important,
            'sent_at' => now(),
            'requires_receipt' => $message->requires_receipt,
            'receipt_requested_at' => $message->requires_receipt ? now() : null,
            'scheduled_at' => null,
            'is_delivered' => true,
            'archived' => false,
            'type_message' => 'delegated',
            'envoye' => true,
            'deadline_reponse' => $message->deadline_reponse,
            'can_be_redirected' => false,
            'message_group_uuid' => null,
            'parent_id' => null,
            'forwarded_from_message_id' => $message->id,
        ];

        if (Schema::hasColumn('messages', 'receiver_ids')) {
            $payload['receiver_ids'] = [$settings->delegate_user_id];
        }

        return Message::create($payload);
    }

    private function delegatedSubject(?string $subject): string
    {
        $subject = trim((string) $subject);

        if ($subject === '') {
            return '[AUTO] Message redirige';
        }

        if (str_starts_with(mb_strtolower($subject), '[auto]')) {
            return $subject;
        }

        return "[AUTO] {$subject}";
    }

    private function delegatedBody(Message $message): string
    {
        $receiverName = $message->receiver?->name ?? 'Inconnu';
        $receiverEmail = $message->receiver?->email ? " <{$message->receiver->email}>" : '';
        $sentAt = optional($message->sent_at ?? $message->created_at)?->format('d/m/Y H:i') ?? 'Date inconnue';

        return trim(
            "Ce message vous a ete redirige automatiquement (absence/delegation).\n".
            "Destinataire initial : {$receiverName}{$receiverEmail}\n".
            "Date du message initial : {$sentAt}\n\n".
            trim((string) $message->contenu)
        );
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

    private function shouldRenderGroupThreadView(int $userId, Message $message): bool
    {
        return (int) $message->sender_id === (int) $userId
            && collect($message->receiver_ids ?? [])->filter()->count() > 1;
    }

    private function resolveThreadRootMessage(Message $message): Message
    {
        if ($message->parent_id) {
            return Message::query()->findOrFail($message->parent_id);
        }

        if (filled($message->message_group_uuid)) {
            return Message::query()
                ->where('message_group_uuid', $message->message_group_uuid)
                ->whereNull('parent_id')
                ->orderBy('id')
                ->first() ?? $message;
        }

        return $message;
    }

    private function renderGroupThreadView(Request $request, Message $rootMessage): Response
    {
        $rootMessage->load([
            'sender:id,name,email',
            'replies',
        ]);

        $recipientMessages = $this->groupRecipientMessages($rootMessage);
        $legacyRepliesByMessageId = $this->groupLegacyRepliesByMessageId($recipientMessages->pluck('id')->all(), (int) $rootMessage->sender_id);
        $replies = $rootMessage->replies;

        $recipientStatuses = $recipientMessages->map(function (Message $recipientMessage) use ($replies, $rootMessage, $legacyRepliesByMessageId) {
            $recipient = $recipientMessage->receiver;

            $trackedReplies = $replies
                ->filter(function (Message $reply) use ($rootMessage, $recipientMessage) {
                    $participants = collect([$rootMessage->sender_id, $recipientMessage->receiver_id])
                        ->map(fn ($id) => (int) $id)
                        ->sort()
                        ->values()
                        ->all();

                    $replyParticipants = collect([$reply->sender_id, $reply->receiver_id])
                        ->map(fn ($id) => (int) $id)
                        ->sort()
                        ->values()
                        ->all();

                    return $participants === $replyParticipants;
                })
                ->values();

            $legacyReplies = collect($legacyRepliesByMessageId->get($recipientMessage->id, []));

            $threadItems = collect([
                [
                    'id' => "original-{$recipientMessage->id}",
                    'type' => 'original',
                    'contenu' => $rootMessage->contenu,
                    'created_at' => optional($recipientMessage->sent_at ?? $recipientMessage->created_at)?->toIso8601String(),
                    'sender' => $rootMessage->sender
                        ? [
                            'id' => $rootMessage->sender->id,
                            'name' => $rootMessage->sender->name,
                            'email' => $rootMessage->sender->email,
                        ]
                        : null,
                    'receiver' => $recipient
                        ? [
                            'id' => $recipient->id,
                            'name' => $recipient->name,
                            'email' => $recipient->email,
                        ]
                        : null,
                ],
            ])
                ->concat($legacyReplies)
                ->concat(
                $trackedReplies->map(function (Message $reply) {
                    return [
                        'id' => "tracked-{$reply->id}",
                        'type' => 'reply',
                        'contenu' => $reply->contenu,
                        'created_at' => optional($reply->sent_at ?? $reply->created_at)?->toIso8601String(),
                        'sender' => $reply->sender
                            ? [
                                'id' => $reply->sender->id,
                                'name' => $reply->sender->name,
                                'email' => $reply->sender->email,
                            ]
                            : null,
                        'receiver' => $reply->receiver
                            ? [
                                'id' => $reply->receiver->id,
                                'name' => $reply->receiver->name,
                                'email' => $reply->receiver->email,
                        ]
                        : null,
                    ];
                })
            )->sortBy('created_at')->values();

            $lastReply = $threadItems
                ->filter(fn (array $item) => $item['type'] === 'reply')
                ->sortBy('created_at')
                ->last();

            return [
                'recipient' => $recipient
                    ? [
                        'id' => $recipient->id,
                        'name' => $recipient->name,
                        'email' => $recipient->email,
                        ]
                    : null,
                'read_status' => [
                    'is_read' => (bool) $recipientMessage->lu,
                    'read_at' => optional($recipientMessage->lu_le)?->toIso8601String(),
                ],
                'reply_date' => $lastReply['created_at'] ?? null,
                'reply_excerpt' => $lastReply ? Str::limit((string) $lastReply['contenu'], 90) : null,
                'thread' => $threadItems->all(),
            ];
        })->filter(fn (array $status) => $status['recipient'] !== null)->values();

        return Inertia::render('Messages/MessageView', [
            'message' => [
                'id' => $rootMessage->id,
                'sujet' => $rootMessage->sujet,
                'contenu' => $rootMessage->contenu,
                'created_at' => optional($rootMessage->sent_at ?? $rootMessage->created_at)?->toIso8601String(),
                'sender' => $rootMessage->sender
                    ? [
                        'id' => $rootMessage->sender->id,
                        'name' => $rootMessage->sender->name,
                        'email' => $rootMessage->sender->email,
                    ]
                    : null,
                'recipient_count' => $recipientStatuses->count(),
                'recipients' => $recipientStatuses,
            ],
        ]);
    }

    private function groupLegacyRepliesByMessageId(array $messageIds, int $directorId)
    {
        if (empty($messageIds) || ! Schema::hasTable('reponses')) {
            return collect();
        }

        return DB::table('reponses')
            ->leftJoin('users', 'users.id', '=', 'reponses.user_id')
            ->whereIn('reponses.message_id', $messageIds)
            ->orderBy('reponses.created_at')
            ->get([
                'reponses.id',
                'reponses.message_id',
                'reponses.user_id',
                'reponses.contenu',
                'reponses.created_at',
                'users.name as user_name',
                'users.email as user_email',
            ])
            ->groupBy('message_id')
            ->map(function ($items) use ($directorId) {
                return collect($items)->map(function ($reply) use ($directorId) {
                    $senderId = (int) $reply->user_id;

                    return [
                        'id' => "legacy-{$reply->id}",
                        'type' => 'reply',
                        'contenu' => $reply->contenu,
                        'created_at' => $reply->created_at ? Carbon::parse($reply->created_at)->toIso8601String() : null,
                        'sender' => [
                            'id' => $senderId,
                            'name' => $reply->user_name,
                            'email' => $reply->user_email,
                        ],
                        'receiver' => null,
                    ];
                })->all();
            });
    }

    private function groupRecipientMessages(Message $rootMessage)
    {
        return Message::query()
            ->with('receiver:id,name,email')
            ->when(
                filled($rootMessage->message_group_uuid),
                fn ($query) => $query->where('message_group_uuid', $rootMessage->message_group_uuid),
                fn ($query) => $query->whereKey($rootMessage->id),
            )
            ->whereNull('parent_id')
            ->orderBy('receiver_id')
            ->get([
                'id',
                'sender_id',
                'receiver_id',
                'receiver_ids',
                'sujet',
                'contenu',
                'lu',
                'lu_le',
                'sent_at',
                'created_at',
                'message_group_uuid',
            ]);
    }

    private function authorizeDirectorThreadReply(int $userId, Message $rootMessage): void
    {
        $this->authorizeMessageAccess($userId, $rootMessage);
        abort_unless((int) $rootMessage->sender_id === (int) $userId, 403);
    }

    private function validateTrackedReply(Request $request): array
    {
        return $request->validate([
            'contenu' => ['required', 'string'],
            'fichier' => ['nullable', 'file', 'max:10240'],
        ]);
    }

    private function createTrackedReplyMessage(
        Message $rootMessage,
        int $senderId,
        int $receiverId,
        string $content,
        ?string $storedFile,
        array $receiverIds
    ): Message {
        $payload = [
            'sender_id' => $senderId,
            'receiver_id' => $receiverId,
            'sujet' => $this->replySubject($rootMessage->sujet),
            'contenu' => $content,
            'fichier' => $storedFile,
            'lu_le' => null,
            'lu' => false,
            'spam' => false,
            'important' => false,
            'sent_at' => now(),
            'requires_receipt' => false,
            'receipt_requested_at' => null,
            'scheduled_at' => null,
            'is_delivered' => true,
            'archived' => false,
            'type_message' => 'reply',
            'envoye' => true,
            'deadline_reponse' => null,
            'can_be_redirected' => false,
            'message_group_uuid' => $rootMessage->message_group_uuid,
            'parent_id' => $rootMessage->id,
            'forwarded_from_message_id' => null,
        ];

        if (Schema::hasColumn('messages', 'receiver_ids')) {
            $payload['receiver_ids'] = array_values($receiverIds);
        }

        return Message::create($payload);
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
        $favoriteContactIds = User::query()
            ->findOrFail($userId)
            ->favoriteContacts()
            ->pluck('users.id')
            ->map(fn ($id) => (int) $id)
            ->all();

        return [
            'recipients' => User::query()
                ->with([
                    'role:id,nom_role',
                    'userSetting:id,user_id,is_out_of_office,redirect_messages,delegate_user_id',
                    'userSetting.delegateUser:id,name,email',
                ])
                ->select('id', 'name', 'email', 'role_id')
                ->whereKeyNot($userId)
                ->orderBy('name')
                ->get()
                ->map(function (User $recipient) use ($favoriteContactIds): array {
                    $settings = $recipient->userSetting;
                    $delegateUser = $settings?->delegateUser;
                    $hasAutoDelegation = (bool) (
                        $settings?->is_out_of_office
                        && $settings?->redirect_messages
                        && $settings?->delegate_user_id
                    );

                    return [
                        'id' => $recipient->id,
                        'name' => $recipient->name,
                        'email' => $recipient->email,
                        'role_id' => $recipient->role_id,
                        'role' => $recipient->role
                            ? [
                                'id' => $recipient->role->id,
                                'nom_role' => $recipient->role->nom_role,
                            ]
                            : null,
                        'is_favorite' => in_array((int) $recipient->id, $favoriteContactIds, true),
                        'is_out_of_office' => (bool) ($settings?->is_out_of_office ?? false),
                        'redirect_messages' => (bool) ($settings?->redirect_messages ?? false),
                        'has_auto_delegation' => $hasAutoDelegation,
                        'delegate_user' => $delegateUser
                            ? [
                                'id' => $delegateUser->id,
                                'name' => $delegateUser->name,
                                'email' => $delegateUser->email,
                            ]
                            : null,
                    ];
                })
                ->values(),
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

    private function replySubject(?string $subject): string
    {
        $subject = trim((string) $subject);

        if ($subject === '') {
            return 'RE: Message sans sujet';
        }

        if (str_starts_with(mb_strtolower($subject), 're:')) {
            return $subject;
        }

        return "RE: {$subject}";
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
