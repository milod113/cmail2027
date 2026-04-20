<?php

namespace App\Http\Controllers;

use App\Events\NotificationCreated;
use App\Models\Department;
use App\Models\Message;
use App\Models\Publication;
use App\Models\ReportedMessage;
use App\Models\Role;
use App\Models\SupportTicket;
use App\Models\User;
use App\Support\RichTextSanitizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'users_total' => User::query()->count(),
                'users_blocked' => User::query()->where('is_blocked', true)->count(),
                'departments_total' => Department::query()->count(),
                'support_open' => SupportTicket::query()->where('status', 'open')->count(),
                'messages_total' => Message::query()->count(),
                'publications_total' => Publication::query()->count(),
            ],
            'recentSupportTickets' => SupportTicket::query()
                ->with('user:id,name,email')
                ->latest()
                ->take(5)
                ->get()
                ->map(fn (SupportTicket $ticket) => $this->mapSupportTicket($ticket))
                ->values(),
        ]);
    }

    public function users(Request $request): Response
    {
        $search = trim((string) $request->string('search'));

        $users = User::query()
            ->with([
                'role:id,nom_role',
                'department:id,name',
            ])
            ->select([
                'id',
                'name',
                'email',
                'role_id',
                'department_id',
                'is_blocked',
                'is_super_admin',
                'can_publish_publication',
                'can_organize_event',
                'created_at',
            ])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhereHas('role', function ($roleQuery) use ($search) {
                            $roleQuery->where('nom_role', 'like', "%{$search}%");
                        })
                        ->orWhereHas('department', function ($departmentQuery) use ($search) {
                            $departmentQuery->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->orderBy('name')
            ->paginate(12)
            ->withQueryString()
            ->through(function (User $user): array {
                $roleName = (string) optional($user->role)->nom_role;
                [$lastName, $firstName] = $this->splitUserName($user->name);

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'last_name' => $lastName,
                    'first_name' => $firstName,
                    'email' => $user->email,
                    'role_id' => $user->role_id,
                    'role_name' => $roleName !== '' ? $roleName : null,
                    'department_name' => optional($user->department)->name,
                    'service_name' => optional($user->department)->name,
                    'is_active' => ! $user->is_blocked,
                    'is_super_admin' => (bool) $user->is_super_admin,
                    'can_publish_publication' => (bool) $user->can_publish_publication,
                    'can_organize_event' => (bool) $user->can_organize_event,
                    'access_level' => $this->resolveAccessLevel($user, $roleName),
                    'created_at' => optional($user->created_at)?->toIso8601String(),
                ];
            });

        return Inertia::render('Admin/UsersIndex', [
            'filters' => [
                'search' => $search,
            ],
            'users' => $users,
            'roles' => Role::query()
                ->select('id', 'nom_role')
                ->orderBy('nom_role')
                ->get(),
        ]);
    }

    public function showUser(User $user): Response
    {
        $user->load([
            'role:id,nom_role',
            'department:id,name',
            'profile:user_id,matricule,grade,telephone,adresse,photo',
        ]);

        $roleName = (string) optional($user->role)->nom_role;
        $sentMessages = Message::query()
            ->with('receiver:id,name,email')
            ->where('sender_id', $user->id)
            ->latest('sent_at')
            ->latest('created_at')
            ->take(8)
            ->get([
                'id',
                'sender_id',
                'receiver_id',
                'sujet',
                'type_message',
                'sent_at',
                'created_at',
                'is_delivered',
            ]);

        $receivedMessages = Message::query()
            ->with('sender:id,name,email')
            ->where('receiver_id', $user->id)
            ->latest('sent_at')
            ->latest('created_at')
            ->take(8)
            ->get([
                'id',
                'sender_id',
                'receiver_id',
                'sujet',
                'type_message',
                'sent_at',
                'created_at',
                'lu',
                'archived',
                'is_delivered',
            ]);

        return Inertia::render('Admin/UserShow', [
            'managedUser' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'department_id' => $user->department_id,
                'department_name' => optional($user->department)->name,
                'role_id' => $user->role_id,
                'role_name' => $roleName !== '' ? $roleName : null,
                'is_active' => ! $user->is_blocked,
                'is_online' => (bool) $user->is_online,
                'is_super_admin' => (bool) $user->is_super_admin,
                'can_publish_publication' => (bool) $user->can_publish_publication,
                'can_organize_event' => (bool) $user->can_organize_event,
                'access_level' => $this->resolveAccessLevel($user, $roleName),
                'profile' => [
                    'matricule' => $user->profile?->matricule,
                    'grade' => $user->profile?->grade,
                    'telephone' => $user->profile?->telephone,
                    'adresse' => $user->profile?->adresse,
                    'photo' => $user->profile?->photo,
                ],
                'activity' => [
                    'stats' => [
                        'sent_count' => Message::query()->where('sender_id', $user->id)->count(),
                        'received_count' => Message::query()->where('receiver_id', $user->id)->count(),
                        'unread_received_count' => Message::query()
                            ->where('receiver_id', $user->id)
                            ->where('is_delivered', true)
                            ->where('lu', false)
                            ->count(),
                        'archived_count' => Message::query()
                            ->where(function ($query) use ($user) {
                                $query
                                    ->where('sender_id', $user->id)
                                    ->orWhere('receiver_id', $user->id);
                            })
                            ->where('archived', true)
                            ->count(),
                    ],
                    'recent_sent' => $sentMessages->map(function (Message $message): array {
                        return [
                            'id' => $message->id,
                            'subject' => $message->sujet,
                            'type_message' => $message->type_message,
                            'sent_at' => optional($message->sent_at ?? $message->created_at)?->toIso8601String(),
                            'is_delivered' => (bool) $message->is_delivered,
                            'counterpart' => $message->receiver
                                ? [
                                    'name' => $message->receiver->name,
                                    'email' => $message->receiver->email,
                                ]
                                : null,
                        ];
                    })->values(),
                    'recent_received' => $receivedMessages->map(function (Message $message): array {
                        return [
                            'id' => $message->id,
                            'subject' => $message->sujet,
                            'type_message' => $message->type_message,
                            'sent_at' => optional($message->sent_at ?? $message->created_at)?->toIso8601String(),
                            'is_delivered' => (bool) $message->is_delivered,
                            'is_read' => (bool) $message->lu,
                            'archived' => (bool) $message->archived,
                            'counterpart' => $message->sender
                                ? [
                                    'name' => $message->sender->name,
                                    'email' => $message->sender->email,
                                ]
                                : null,
                        ];
                    })->values(),
                ],
            ],
            'roles' => Role::query()
                ->select('id', 'nom_role')
                ->orderBy('nom_role')
                ->get(),
            'departments' => Department::query()
                ->select('id', 'name')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function updateUserProfile(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['nullable', 'string', 'max:255', Rule::unique('users', 'username')->ignore($user->id)],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'department_id' => ['nullable', 'exists:departments,id'],
            'matricule' => ['nullable', 'string', 'max:255', Rule::unique('profiles', 'matricule')->ignore($user->profile?->id)],
            'grade' => ['nullable', 'string', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:20'],
            'adresse' => ['nullable', 'string', 'max:1000'],
            'photo' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:2048'],
        ]);

        $user->update([
            'name' => $validated['name'],
            'username' => filled($validated['username'] ?? null) ? trim((string) $validated['username']) : null,
            'email' => $validated['email'],
            'department_id' => $validated['department_id'] ?? null,
        ]);

        $profileData = [
            'matricule' => $validated['matricule'] ?? null,
            'grade' => $validated['grade'] ?? null,
            'telephone' => $validated['telephone'] ?? null,
            'adresse' => $validated['adresse'] ?? null,
        ];

        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('profiles/photos', 'public');
            $profileData['photo'] = $photoPath;

            if ($user->profile?->photo) {
                Storage::disk('public')->delete($user->profile->photo);
            }
        }

        $user->profile()->updateOrCreate(
            ['user_id' => $user->id],
            $profileData,
        );

        return back()->with('success', 'Profil utilisateur mis a jour avec succes.');
    }

    public function support(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $status = trim((string) $request->string('status'));
        $ticketId = $request->integer('ticket');

        $tickets = SupportTicket::query()
            ->with('user:id,name,email')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('category', 'like', "%{$search}%")
                        ->orWhere('impact', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($userQuery) use ($search) {
                            $userQuery
                                ->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            })
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->latest()
            ->paginate(12)
            ->withQueryString()
            ->through(fn (SupportTicket $ticket): array => $this->mapSupportTicket($ticket));

        $selectedTicket = null;

        if ($ticketId > 0) {
            $ticket = SupportTicket::query()
                ->with('user:id,name,email')
                ->find($ticketId);

            if ($ticket) {
                $selectedTicket = $this->mapSupportTicket($ticket, true);
            }
        }

        return Inertia::render('Admin/SupportIndex', [
            'filters' => [
                'search' => $search,
                'status' => $status,
                'ticket' => $ticketId > 0 ? (string) $ticketId : '',
            ],
            'tickets' => $tickets,
            'selectedTicket' => $selectedTicket,
        ]);
    }

    public function reports(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $status = trim((string) $request->string('status'));
        $reportId = $request->integer('report');

        $reports = ReportedMessage::query()
            ->with([
                'reporter:id,name,email',
                'message:id,sujet,contenu,sender_id,receiver_id,sent_at,created_at',
                'message.sender:id,name,email',
                'message.receiver:id,name,email',
            ])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('reason_category', 'like', "%{$search}%")
                        ->orWhere('comment', 'like', "%{$search}%")
                        ->orWhereHas('reporter', function ($reporterQuery) use ($search) {
                            $reporterQuery
                                ->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        })
                        ->orWhereHas('message', function ($messageQuery) use ($search) {
                            $messageQuery
                                ->where('sujet', 'like', "%{$search}%")
                                ->orWhere('contenu', 'like', "%{$search}%");
                        });
                });
            })
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->latest()
            ->paginate(12)
            ->withQueryString()
            ->through(fn (ReportedMessage $report): array => $this->mapReportedMessage($report));

        $selectedReport = null;

        if ($reportId > 0) {
            $report = ReportedMessage::query()
                ->with([
                    'reporter:id,name,email',
                    'message:id,sujet,contenu,sender_id,receiver_id,sent_at,created_at',
                    'message.sender:id,name,email',
                    'message.receiver:id,name,email',
                ])
                ->find($reportId);

            if ($report) {
                $selectedReport = $this->mapReportedMessage($report, true);
            }
        }

        return Inertia::render('Admin/AdminReportsDashboard', [
            'filters' => [
                'search' => $search,
                'status' => $status,
                'report' => $reportId > 0 ? (string) $reportId : '',
            ],
            'reports' => $reports,
            'selectedReport' => $selectedReport,
        ]);
    }

    public function audit(Request $request): Response
    {
        $search = trim((string) $request->string('search'));

        $messages = Message::query()
            ->with([
                'sender:id,name,email',
                'receiver:id,name,email',
            ])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('sujet', 'like', "%{$search}%")
                        ->orWhere('contenu', 'like', "%{$search}%")
                        ->orWhereHas('sender', function ($senderQuery) use ($search) {
                            $senderQuery
                                ->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        })
                        ->orWhereHas('receiver', function ($receiverQuery) use ($search) {
                            $receiverQuery
                                ->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            })
            ->latest('sent_at')
            ->latest('created_at')
            ->paginate(25)
            ->withQueryString()
            ->through(function (Message $message): array {
                return [
                    'id' => $message->id,
                    'subject' => $message->sujet,
                    'content_preview' => Str::limit(trim((string) $message->contenu), 180),
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
                    'sent_at' => optional($message->sent_at ?? $message->created_at)?->toIso8601String(),
                    'type_message' => $message->type_message,
                ];
            });

        return Inertia::render('Admin/MessageAudit', [
            'filters' => [
                'search' => $search,
            ],
            'messages' => $messages,
        ]);
    }

    public function publications(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $status = trim((string) $request->string('status'));

        $publications = Publication::query()
            ->with('user:id,name,email')
            ->withCount(['likes', 'comments'])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('title', 'like', "%{$search}%")
                        ->orWhere('content', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($userQuery) use ($search) {
                            $userQuery
                                ->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            })
            ->when($status !== '', function ($query) use ($status) {
                if ($status === 'active') {
                    $query->where('archived', false);
                }

                if ($status === 'archived') {
                    $query->where('archived', true);
                }
            })
            ->latest()
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Publication $publication): array => $this->mapPublication($publication));

        return Inertia::render('Admin/PublicationsIndex', [
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
            'publications' => $publications,
        ]);
    }

    public function showPublication(Publication $publication): Response
    {
        $publication->load([
            'user:id,name,email',
            'comments.user:id,name,email',
        ])->loadCount(['likes', 'comments']);

        return Inertia::render('Admin/PublicationShow', [
            'publication' => $this->mapPublication($publication, true),
        ]);
    }

    public function updatePublication(Request $request, Publication $publication): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'content' => ['required', 'string', 'max:20000'],
            'photo' => ['nullable', 'image', 'max:5120'],
            'remove_photo' => ['nullable', 'boolean'],
        ]);

        $sanitizedContent = RichTextSanitizer::sanitize($validated['content']);

        if (RichTextSanitizer::plainText($sanitizedContent) === '') {
            throw ValidationException::withMessages([
                'content' => 'Le contenu de la publication est obligatoire.',
            ]);
        }

        $payload = [
            'title' => filled($validated['title'] ?? null) ? trim((string) $validated['title']) : null,
            'content' => $sanitizedContent,
        ];

        if ((bool) ($validated['remove_photo'] ?? false) && $publication->photo_path) {
            Storage::disk('public')->delete($publication->photo_path);
            $payload['photo_path'] = null;
        }

        if ($request->hasFile('photo')) {
            $newPhotoPath = $request->file('photo')->store('publications', 'public');

            if ($publication->photo_path) {
                Storage::disk('public')->delete($publication->photo_path);
            }

            $payload['photo_path'] = $newPhotoPath;
        }

        $publication->update($payload);

        return back()->with('success', 'Publication mise a jour avec succes.');
    }

    public function togglePublicationArchive(Request $request, Publication $publication): RedirectResponse
    {
        $validated = $request->validate([
            'archived' => ['required', 'boolean'],
        ]);

        $publication->update([
            'archived' => (bool) $validated['archived'],
        ]);

        return back()->with('success', (bool) $validated['archived']
            ? 'Publication archivee avec succes.'
            : 'Publication restauree avec succes.');
    }

    public function destroyPublication(Publication $publication): RedirectResponse
    {
        if ($publication->photo_path) {
            Storage::disk('public')->delete($publication->photo_path);
        }

        $publication->delete();

        return redirect()
            ->route('admin.publications.index')
            ->with('success', 'Publication supprimee avec succes.');
    }

    public function updateReportStatus(Request $request, ReportedMessage $reportedMessage): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:pending,resolved,dismissed'],
        ]);

        $reportedMessage->update([
            'status' => $validated['status'],
        ]);

        return back()->with('success', 'Statut du signalement mis a jour.');
    }

    public function destroyReportedMessageSource(ReportedMessage $reportedMessage): RedirectResponse
    {
        $message = $reportedMessage->message;

        abort_unless($message !== null, 404);

        $message->delete();

        return back()->with('success', 'Le message incrimine a ete supprime.');
    }

    public function blockUser(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $user->update([
            'is_blocked' => ! $validated['is_active'],
        ]);

        return back()->with('success', $validated['is_active']
            ? 'Utilisateur debloque avec succes.'
            : 'Utilisateur bloque avec succes.');
    }

    public function changeRole(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'role_id' => ['nullable', 'exists:roles,id'],
            'access_level' => ['required', 'string', 'in:user,publisher,admin'],
            'can_organize_event' => ['nullable', 'boolean'],
        ]);

        $isAdminAccess = $validated['access_level'] === 'admin';
        $canPublish = in_array($validated['access_level'], ['publisher', 'admin'], true);

        $user->update([
            'role_id' => $validated['role_id'] ?? null,
            'is_super_admin' => $isAdminAccess,
            'can_publish_publication' => $canPublish,
            'can_organize_event' => array_key_exists('can_organize_event', $validated)
                ? (bool) $validated['can_organize_event']
                : (bool) $user->can_organize_event,
        ]);

        return back()->with('success', 'Privileges utilisateur mis a jour.');
    }

    public function respondSupport(Request $request, SupportTicket $ticket): RedirectResponse
    {
        $validated = $request->validate([
            'response' => ['required', 'string', 'max:5000'],
        ]);

        $payload = [
            'sender_id' => $request->user()->id,
            'receiver_id' => $ticket->user_id,
            'original_receiver_id' => null,
            'sujet' => sprintf('[Support #%d] Reponse de l\'administration', $ticket->id),
            'contenu' => trim($validated['response']),
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
            'type_message' => 'support_reply',
            'envoye' => true,
            'deadline_reponse' => null,
            'can_be_redirected' => false,
            'message_group_uuid' => null,
            'parent_id' => null,
            'forwarded_from_message_id' => null,
        ];

        if (Schema::hasColumn('messages', 'receiver_ids')) {
            $payload['receiver_ids'] = [$ticket->user_id];
        }

        $message = Message::query()->create($payload);

        $ticket->update([
            'status' => 'answered',
        ]);

        $this->broadcastSafely(
            new NotificationCreated((int) $ticket->user_id, 'message', (int) $message->id)
        );

        return back()->with('success', 'Reponse envoyee avec succes au demandeur.');
    }

    private function mapSupportTicket(SupportTicket $ticket, bool $full = false): array
    {
        return [
            'id' => $ticket->id,
            'status' => $ticket->status,
            'category' => $ticket->category,
            'impact' => $ticket->impact,
            'description' => $full
                ? $ticket->description
                : Str::limit($ticket->description, 120),
            'page_url' => $ticket->page_url,
            'browser' => $ticket->browser,
            'platform' => $ticket->platform,
            'screen_resolution' => $ticket->screen_resolution,
            'user_agent' => $ticket->user_agent,
            'screenshot_url' => $ticket->screenshot_path
                ? Storage::disk('public')->url($ticket->screenshot_path)
                : null,
            'created_at' => optional($ticket->created_at)?->toIso8601String(),
            'user' => $ticket->user
                ? [
                    'id' => $ticket->user->id,
                    'name' => $ticket->user->name,
                    'email' => $ticket->user->email,
                ]
                : null,
        ];
    }

    private function splitUserName(?string $fullName): array
    {
        $fullName = trim((string) $fullName);

        if ($fullName === '') {
            return ['-', '-'];
        }

        $parts = preg_split('/\s+/', $fullName) ?: [];

        if (count($parts) === 1) {
            return [$parts[0], $parts[0]];
        }

        $firstName = array_pop($parts);
        $lastName = implode(' ', $parts);

        return [$lastName !== '' ? $lastName : '-', $firstName ?: '-'];
    }

    private function mapReportedMessage(ReportedMessage $report, bool $full = false): array
    {
        $message = $report->message;

        return [
            'id' => $report->id,
            'status' => $report->status,
            'reason_category' => $report->reason_category,
            'comment' => $full
                ? $report->comment
                : Str::limit((string) $report->comment, 120),
            'created_at' => optional($report->created_at)?->toIso8601String(),
            'reporter' => $report->reporter
                ? [
                    'id' => $report->reporter->id,
                    'name' => $report->reporter->name,
                    'email' => $report->reporter->email,
                ]
                : null,
            'message' => $message
                ? [
                    'id' => $message->id,
                    'subject' => $message->sujet,
                    'content' => $full
                        ? $message->contenu
                        : Str::limit(trim((string) $message->contenu), 180),
                    'sent_at' => optional($message->sent_at ?? $message->created_at)?->toIso8601String(),
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
                ]
                : null,
        ];
    }

    private function mapPublication(Publication $publication, bool $full = false): array
    {
        $plainContent = RichTextSanitizer::plainText($publication->content);

        return [
            'id' => $publication->id,
            'title' => $publication->title,
            'content' => $full
                ? $publication->content
                : Str::limit($plainContent, 180),
            'photo_url' => $publication->photo_url,
            'archived' => (bool) $publication->archived,
            'created_at' => optional($publication->created_at)?->toIso8601String(),
            'updated_at' => optional($publication->updated_at)?->toIso8601String(),
            'likes_count' => (int) ($publication->likes_count ?? 0),
            'comments_count' => (int) ($publication->comments_count ?? 0),
            'user' => $publication->user
                ? [
                    'id' => $publication->user->id,
                    'name' => $publication->user->name,
                    'email' => $publication->user->email,
                ]
                : null,
            'comments' => $full
                ? $publication->comments->map(function ($comment) {
                    return [
                        'id' => $comment->id,
                        'content' => $comment->content,
                        'created_at' => optional($comment->created_at)?->toIso8601String(),
                        'user' => $comment->user
                            ? [
                                'id' => $comment->user->id,
                                'name' => $comment->user->name,
                                'email' => $comment->user->email,
                            ]
                            : null,
                    ];
                })->values()->all()
                : [],
        ];
    }

    private function resolveAccessLevel(User $user, string $roleName): string
    {
        $normalizedRole = Str::lower($roleName);

        if ((bool) $user->is_super_admin || in_array($normalizedRole, ['admin', 'superadmin'], true)) {
            return 'admin';
        }

        if ((bool) $user->can_publish_publication) {
            return 'publisher';
        }

        return 'user';
    }
}
