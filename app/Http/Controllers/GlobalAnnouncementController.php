<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\GlobalAnnouncement;
use App\Models\Role;
use App\Models\User;
use App\Support\RichTextSanitizer;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class GlobalAnnouncementController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $status = trim((string) $request->string('status'));

        $announcements = GlobalAnnouncement::query()
            ->with([
                'creator:id,name,email',
                'role:id,nom_role',
                'department:id,name',
            ])
            ->withCount([
                'recipients',
                'recipients as read_count' => fn (Builder $query) => $query->where('global_announcement_user.is_read', true),
                'recipients as acknowledged_count' => fn (Builder $query) => $query->where('global_announcement_user.is_acknowledged', true),
            ])
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $builder) use ($search) {
                    $builder
                        ->where('title', 'like', "%{$search}%")
                        ->orWhere('content', 'like', "%{$search}%")
                        ->orWhereHas('creator', function (Builder $creatorQuery) use ($search) {
                            $creatorQuery
                                ->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            })
            ->when($status !== '', function (Builder $query) use ($status) {
                if ($status === 'published') {
                    $query->where('is_published', true);
                }

                if ($status === 'draft') {
                    $query->where('is_published', false);
                }

                if ($status === 'active') {
                    $query->published()->currentlyActive();
                }

                if ($status === 'expired') {
                    $query
                        ->where('is_published', true)
                        ->whereNotNull('ends_at')
                        ->where('ends_at', '<', now());
                }
            })
            ->latest('published_at')
            ->latest('created_at')
            ->paginate(12)
            ->withQueryString()
            ->through(fn (GlobalAnnouncement $announcement) => $this->mapAnnouncementRow($announcement));

        return Inertia::render('Admin/GlobalAnnouncements/Index', [
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
            'announcements' => $announcements,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/GlobalAnnouncements/Create', [
            'roles' => Role::query()->select('id', 'nom_role')->orderBy('nom_role')->get(),
            'departments' => Department::query()->select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateAnnouncement($request);
        $sanitizedContent = RichTextSanitizer::sanitize($validated['content']);

        if (RichTextSanitizer::plainText($sanitizedContent) === '') {
            throw ValidationException::withMessages([
                'content' => 'Le contenu de l’annonce est obligatoire.',
            ]);
        }

        $announcement = DB::transaction(function () use ($request, $validated, $sanitizedContent) {
            $isPublished = (bool) ($validated['is_published'] ?? false);

            $announcement = GlobalAnnouncement::query()->create([
                'title' => trim((string) $validated['title']),
                'content' => $sanitizedContent,
                'created_by' => $request->user()->id,
                'audience_type' => $validated['audience_type'],
                'role_id' => $validated['audience_type'] === 'role' ? $validated['role_id'] : null,
                'department_id' => $validated['audience_type'] === 'department' ? $validated['department_id'] : null,
                'priority' => $validated['priority'],
                'starts_at' => $validated['starts_at'] ?? null,
                'ends_at' => $validated['ends_at'] ?? null,
                'is_published' => $isPublished,
                'requires_acknowledgement' => (bool) $validated['requires_acknowledgement'],
                'is_pinned' => (bool) ($validated['is_pinned'] ?? true),
                'published_at' => $isPublished ? now() : null,
            ]);

            if ($isPublished) {
                $this->syncRecipients($announcement);
            }

            return $announcement;
        });

        return redirect()
            ->route('admin.announcements.show', $announcement)
            ->with('success', 'Annonce globale créée avec succès.');
    }

    public function show(GlobalAnnouncement $announcement): Response
    {
        $announcement->load([
            'creator:id,name,email',
            'role:id,nom_role',
            'department:id,name',
            'recipients:id,name,email',
        ])->loadCount([
            'recipients',
            'recipients as read_count' => fn (Builder $query) => $query->where('global_announcement_user.is_read', true),
            'recipients as acknowledged_count' => fn (Builder $query) => $query->where('global_announcement_user.is_acknowledged', true),
        ]);

        return Inertia::render('Admin/GlobalAnnouncements/Show', [
            'announcement' => $this->mapAnnouncementDetail($announcement),
            'roles' => Role::query()->select('id', 'nom_role')->orderBy('nom_role')->get(),
            'departments' => Department::query()->select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function togglePublish(Request $request, GlobalAnnouncement $announcement): RedirectResponse
    {
        $validated = $request->validate([
            'is_published' => ['required', 'boolean'],
        ]);

        DB::transaction(function () use ($announcement, $validated) {
            $isPublished = (bool) $validated['is_published'];

            $announcement->update([
                'is_published' => $isPublished,
                'published_at' => $isPublished ? ($announcement->published_at ?? now()) : null,
            ]);

            if ($isPublished) {
                $this->syncRecipients($announcement->fresh());
            }
        });

        return back()->with('success', (bool) $validated['is_published']
            ? 'Annonce publiée avec succès.'
            : 'Annonce repassée en brouillon.');
    }

    public function markAsRead(Request $request, GlobalAnnouncement $announcement): RedirectResponse
    {
        $user = $request->user();

        abort_unless($this->userCanAccessAnnouncement($announcement, $user->id), 403);

        $announcement->recipients()->syncWithoutDetaching([
            $user->id => [
                'is_read' => true,
                'read_at' => now(),
                'is_acknowledged' => false,
                'acknowledged_at' => null,
            ],
        ]);

        DB::table('global_announcement_user')
            ->where('global_announcement_id', $announcement->id)
            ->where('user_id', $user->id)
            ->update([
                'is_read' => true,
                'read_at' => now(),
                'updated_at' => now(),
            ]);

        return back();
    }

    public function acknowledge(Request $request, GlobalAnnouncement $announcement): RedirectResponse
    {
        $user = $request->user();

        abort_unless($this->userCanAccessAnnouncement($announcement, $user->id), 403);

        DB::table('global_announcement_user')
            ->where('global_announcement_id', $announcement->id)
            ->where('user_id', $user->id)
            ->update([
                'is_read' => true,
                'read_at' => now(),
                'is_acknowledged' => true,
                'acknowledged_at' => now(),
                'updated_at' => now(),
            ]);

        return back()->with('success', 'Accusé de réception enregistré.');
    }

    public static function activeAnnouncementsForUser(User $user): array
    {
        return GlobalAnnouncement::query()
            ->with(['role:id,nom_role', 'department:id,name'])
            ->published()
            ->currentlyActive()
            ->whereHas('recipients', fn (Builder $query) => $query->where('users.id', $user->id))
            ->orderByDesc('is_pinned')
            ->orderByDesc('priority')
            ->orderByDesc('published_at')
            ->get()
            ->map(function (GlobalAnnouncement $announcement) use ($user) {
                $pivot = $announcement->recipients()
                    ->where('users.id', $user->id)
                    ->first()?->pivot;

                return [
                    'id' => $announcement->id,
                    'title' => $announcement->title,
                    'content' => $announcement->content,
                    'priority' => $announcement->priority,
                    'requires_acknowledgement' => (bool) $announcement->requires_acknowledgement,
                    'is_pinned' => (bool) $announcement->is_pinned,
                    'starts_at' => optional($announcement->starts_at)?->toIso8601String(),
                    'ends_at' => optional($announcement->ends_at)?->toIso8601String(),
                    'audience_label' => self::audienceLabel($announcement),
                    'is_read' => (bool) ($pivot?->is_read ?? false),
                    'read_at' => optional($pivot?->read_at)?->toIso8601String(),
                    'is_acknowledged' => (bool) ($pivot?->is_acknowledged ?? false),
                    'acknowledged_at' => optional($pivot?->acknowledged_at)?->toIso8601String(),
                ];
            })
            ->values()
            ->all();
    }

    private function validateAnnouncement(Request $request): array
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'audience_type' => ['required', 'string', Rule::in(['all', 'role', 'department'])],
            'role_id' => ['nullable', 'exists:roles,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'priority' => ['required', 'string', Rule::in(['normal', 'important', 'urgent'])],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_published' => ['nullable', 'boolean'],
            'requires_acknowledgement' => ['nullable', 'boolean'],
            'is_pinned' => ['nullable', 'boolean'],
        ]);

        if (($validated['audience_type'] ?? 'all') === 'role' && empty($validated['role_id'])) {
            throw ValidationException::withMessages([
                'role_id' => 'Veuillez sélectionner un rôle pour cette audience.',
            ]);
        }

        if (($validated['audience_type'] ?? 'all') === 'department' && empty($validated['department_id'])) {
            throw ValidationException::withMessages([
                'department_id' => 'Veuillez sélectionner un département pour cette audience.',
            ]);
        }

        return $validated;
    }

    private function syncRecipients(GlobalAnnouncement $announcement): void
    {
        $recipientIds = $this->resolveRecipientIds($announcement);

        $syncPayload = $recipientIds
            ->mapWithKeys(fn (int $id) => [$id => [
                'is_read' => false,
                'read_at' => null,
                'is_acknowledged' => false,
                'acknowledged_at' => null,
            ]])
            ->all();

        $announcement->recipients()->sync($syncPayload);
    }

    private function resolveRecipientIds(GlobalAnnouncement $announcement): Collection
    {
        return User::query()
            ->when($announcement->audience_type === 'role' && $announcement->role_id, fn (Builder $query) => $query->where('role_id', $announcement->role_id))
            ->when($announcement->audience_type === 'department' && $announcement->department_id, fn (Builder $query) => $query->where('department_id', $announcement->department_id))
            ->orderBy('id')
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values();
    }

    private function mapAnnouncementRow(GlobalAnnouncement $announcement): array
    {
        return [
            'id' => $announcement->id,
            'title' => $announcement->title,
            'priority' => $announcement->priority,
            'is_published' => (bool) $announcement->is_published,
            'requires_acknowledgement' => (bool) $announcement->requires_acknowledgement,
            'is_pinned' => (bool) $announcement->is_pinned,
            'audience_label' => self::audienceLabel($announcement),
            'published_at' => optional($announcement->published_at)?->toIso8601String(),
            'starts_at' => optional($announcement->starts_at)?->toIso8601String(),
            'ends_at' => optional($announcement->ends_at)?->toIso8601String(),
            'creator' => $announcement->creator
                ? [
                    'name' => $announcement->creator->name,
                    'email' => $announcement->creator->email,
                ]
                : null,
            'recipients_count' => (int) ($announcement->recipients_count ?? 0),
            'read_count' => (int) ($announcement->read_count ?? 0),
            'acknowledged_count' => (int) ($announcement->acknowledged_count ?? 0),
        ];
    }

    private function mapAnnouncementDetail(GlobalAnnouncement $announcement): array
    {
        return [
            ...$this->mapAnnouncementRow($announcement),
            'content' => $announcement->content,
            'creator' => $announcement->creator
                ? [
                    'id' => $announcement->creator->id,
                    'name' => $announcement->creator->name,
                    'email' => $announcement->creator->email,
                ]
                : null,
            'audience_type' => $announcement->audience_type,
            'role_id' => $announcement->role_id,
            'department_id' => $announcement->department_id,
            'recipients' => $announcement->recipients->map(function (User $user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_read' => (bool) $user->pivot?->is_read,
                    'read_at' => optional($user->pivot?->read_at)?->toIso8601String(),
                    'is_acknowledged' => (bool) $user->pivot?->is_acknowledged,
                    'acknowledged_at' => optional($user->pivot?->acknowledged_at)?->toIso8601String(),
                ];
            })->values()->all(),
        ];
    }

    private static function audienceLabel(GlobalAnnouncement $announcement): string
    {
        if ($announcement->audience_type === 'role') {
            return $announcement->role?->nom_role
                ? "Rôle: {$announcement->role->nom_role}"
                : 'Rôle ciblé';
        }

        if ($announcement->audience_type === 'department') {
            return $announcement->department?->name
                ? "Département: {$announcement->department->name}"
                : 'Département ciblé';
        }

        return 'Tous les utilisateurs';
    }

    private function userCanAccessAnnouncement(GlobalAnnouncement $announcement, int $userId): bool
    {
        return $announcement->recipients()->where('users.id', $userId)->exists();
    }
}
