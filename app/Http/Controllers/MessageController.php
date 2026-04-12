<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\MessageDraft;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
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
            ],
        ]);
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
        return Inertia::render('Messages/Compose', $this->composePayload($request->user()->id));
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
        ]));
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateMessageForSend($request, $request->user()->id);

        $storedFile = $request->hasFile('fichier')
            ? $request->file('fichier')->store('messages', 'public')
            : null;

        $this->createMessagesFromPayload($validated, $request->user()->id, $storedFile);

        return redirect()
            ->route('messages.sent')
            ->with('success', 'Message envoyé avec succès.');
    }

    public function storeDraft(Request $request): RedirectResponse
    {
        $validated = $this->validateDraft($request, $request->user()->id);

        $draft = MessageDraft::create([
            'sender_id' => $request->user()->id,
            'receiver_ids' => $validated['receiver_ids'] ?? [],
            'sujet' => $validated['sujet'] ?? '',
            'contenu' => $validated['contenu'] ?? '',
            'fichier' => $request->hasFile('fichier')
                ? $request->file('fichier')->store('message-drafts', 'public')
                : null,
            'important' => $validated['important'] ?? false,
            'requires_receipt' => $validated['requires_receipt'] ?? false,
            'scheduled_at' => $validated['scheduled_at'] ?? null,
            'type_message' => $validated['type_message'] ?? 'normal',
            'deadline_reponse' => $validated['deadline_reponse'] ?? null,
            'can_be_redirected' => $validated['can_be_redirected'] ?? false,
        ]);

        return redirect()
            ->route('drafts.edit', $draft)
            ->with('success', 'Brouillon enregistré avec succès.');
    }

    public function updateDraft(Request $request, MessageDraft $draft): RedirectResponse
    {
        abort_unless($draft->sender_id === $request->user()->id, 403);
        $validated = $this->validateDraft($request, $request->user()->id);

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
        ]);

        return redirect()
            ->route('drafts.edit', $draft)
            ->with('success', 'Brouillon mis à jour.');
    }

    public function sendDraft(Request $request, MessageDraft $draft): RedirectResponse
    {
        abort_unless($draft->sender_id === $request->user()->id, 403);

        $validated = $this->validateMessageForSend($request, $request->user()->id);
        $storedFile = $this->storeOrReuseDraftFile($request, $draft);

        $this->createMessagesFromPayload($validated, $request->user()->id, $storedFile);

        if ($draft->fichier && $draft->fichier !== $storedFile) {
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

    private function validateMessageForSend(Request $request, int $userId): array
    {
        return $request->validate([
            'receiver_ids' => ['required', 'array', 'min:1'],
            'receiver_ids.*' => ['required', 'integer', 'distinct', 'exists:users,id', Rule::notIn([$userId])],
            'sujet' => ['required', 'string', 'max:255'],
            'contenu' => ['required', 'string'],
            'fichier' => ['nullable', 'file', 'max:10240'],
            'important' => ['required', 'boolean'],
            'requires_receipt' => ['required', 'boolean'],
            'scheduled_at' => ['nullable', 'date'],
            'type_message' => ['nullable', 'string', 'max:100'],
            'deadline_reponse' => ['nullable', 'date'],
            'can_be_redirected' => ['required', 'boolean'],
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
            'important' => ['required', 'boolean'],
            'requires_receipt' => ['required', 'boolean'],
            'scheduled_at' => ['nullable', 'date'],
            'type_message' => ['nullable', 'string', 'max:100'],
            'deadline_reponse' => ['nullable', 'date'],
            'can_be_redirected' => ['required', 'boolean'],
        ]);
    }

    private function createMessagesFromPayload(array $validated, int $senderId, ?string $storedFile): void
    {
        $scheduledAt = filled($validated['scheduled_at'] ?? null)
            ? Carbon::parse($validated['scheduled_at'])
            : null;
        $isScheduled = $scheduledAt !== null && $scheduledAt->isFuture();

        foreach ($validated['receiver_ids'] as $receiverId) {
            Message::create([
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
            ]);
        }
    }

    private function authorizeMessageAccess(int $userId, Message $message): void
    {
        abort_unless(
            $message->sender_id === $userId || $message->receiver_id === $userId,
            403
        );
    }

    private function storeOrReuseDraftFile(Request $request, MessageDraft $draft): ?string
    {
        if (! $request->hasFile('fichier')) {
            return $draft->fichier;
        }

        $storedFile = $request->file('fichier')->store('message-drafts', 'public');

        if ($draft->fichier) {
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
}
