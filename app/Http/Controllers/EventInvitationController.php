<?php

namespace App\Http\Controllers;

use App\Events\NotificationCreated;
use App\Mail\EventInvitationPdfMail;
use App\Mail\OrganizerEventInvitationSummaryMail;
use App\Models\Event;
use App\Models\EventInvitation;
use App\Models\User;
use App\Notifications\EventCanceledNotification;
use App\Notifications\EventPostponedNotification;
use App\Support\EventInvitationPdfGenerator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class EventInvitationController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $canOrganize = method_exists($user, 'canOrganizeEvents')
            ? (bool) $user->canOrganizeEvents()
            : (bool) ($user->can_organize_event ?? false);

        $invitations = collect();
        $organizedEvents = collect();

        if (Schema::hasTable('events') && Schema::hasTable('event_invitations')) {
            $invitations = EventInvitation::query()
                ->with([
                    'event.organizer:id,name,email',
                ])
                ->where('user_id', $user->id)
                ->latest('created_at')
                ->get()
                ->map(function (EventInvitation $invitation): array {
                    $event = $invitation->event;

                    return [
                        'id' => $invitation->id,
                        'status' => $invitation->status,
                        'qr_code_uuid' => $invitation->qr_code_uuid,
                        'event' => $event
                            ? [
                                'id' => $event->id,
                                'title' => $event->title,
                                'description' => $event->description,
                                'type' => $event->type,
                                'location' => $event->location,
                                'meeting_link' => $event->meeting_link,
                                'status' => $event->status,
                                'status_reason' => $event->status_reason,
                                'start_time' => optional($event->start_time)->toIso8601String(),
                                'end_time' => optional($event->end_time)->toIso8601String(),
                                'organizer' => $event->organizer
                                    ? [
                                        'id' => $event->organizer->id,
                                        'name' => $event->organizer->name,
                                        'email' => $event->organizer->email,
                                    ]
                                    : null,
                            ]
                            : null,
                    ];
                })
                ->values();

            if ($canOrganize) {
                $organizedEvents = Event::query()
                    ->where('organizer_id', $user->id)
                    ->orderByDesc('start_time')
                    ->take(6)
                    ->get()
                    ->map(function (Event $event): array {
                        return [
                            'id' => $event->id,
                            'title' => $event->title,
                            'type' => $event->type,
                            'status' => $event->status,
                            'status_reason' => $event->status_reason,
                            'start_time' => optional($event->start_time)->toIso8601String(),
                            'end_time' => optional($event->end_time)->toIso8601String(),
                        ];
                    })
                    ->values();
            }
        }

        return Inertia::render('Events/Index', [
            'canOrganizeEvent' => $canOrganize,
            'invitations' => $invitations,
            'organizedEvents' => $organizedEvents,
        ]);
    }

    public function create(Request $request): Response
    {
        Gate::authorize('organize-events');

        return Inertia::render('Events/Create', [
            'invitees' => $this->organizerInvitees((int) $request->user()->id),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('organize-events');

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'type' => ['required', Rule::in(['in_person', 'online'])],
            'location' => ['nullable', 'string', 'max:255', 'required_if:type,in_person'],
            'meeting_link' => ['nullable', 'string', 'max:2000', 'required_if:type,online'],
            'start_time' => ['required', 'date'],
            'end_time' => ['required', 'date', 'after:start_time'],
            'invitee_ids' => ['required', 'array', 'min:1'],
            'invitee_ids.*' => ['integer', 'distinct', 'exists:users,id'],
        ]);

        $inviteeIds = collect($validated['invitee_ids'])
            ->filter(fn ($id) => (int) $id !== (int) $request->user()->id)
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        abort_if($inviteeIds->isEmpty(), 422, 'Veuillez selectionner au moins un invite.');

        $event = null;
        $invitations = collect();

        DB::transaction(function () use ($request, $validated, $inviteeIds, &$event, &$invitations): void {
            $event = Event::query()->create([
                'organizer_id' => $request->user()->id,
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'type' => $validated['type'],
                'location' => $validated['type'] === 'in_person'
                    ? ($validated['location'] ?? null)
                    : null,
                'meeting_link' => $validated['type'] === 'online'
                    ? ($validated['meeting_link'] ?? null)
                    : null,
                'status' => 'scheduled',
                'status_reason' => null,
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'],
            ]);

            $invitations = $inviteeIds
                ->map(fn (int $inviteeId) => EventInvitation::query()->create([
                    'event_id' => $event->id,
                    'user_id' => $inviteeId,
                    'status' => 'pending',
                    'qr_code_uuid' => null,
                ]))
                ->values();
        });

        foreach ($invitations as $invitation) {
            $this->broadcastSafely(
                new NotificationCreated((int) $invitation->user_id, 'event_invitation', (int) $event->id)
            );
        }

        $pdfGenerator = app(EventInvitationPdfGenerator::class);
        $deliveryStatuses = [];
        $sentCount = 0;
        $skippedCount = 0;
        $failedCount = 0;

        foreach ($invitations as $invitation) {
            $invitation->loadMissing([
                'user:id,name,email',
                'event.organizer:id,name,email',
            ]);

            $inviteeName = (string) ($invitation->user?->name ?? 'Invite');
            $inviteeEmail = trim((string) optional($invitation->user)->email);

            if ($inviteeEmail === '') {
                $skippedCount++;
                $deliveryStatuses[] = [
                    'name' => $inviteeName,
                    'email' => '-',
                    'delivery' => 'skipped',
                    'error' => 'Adresse email absente.',
                ];
                continue;
            }

            try {
                $pdfBinary = $pdfGenerator->generate($invitation);
                $pdfFileName = $pdfGenerator->fileName($invitation);

                Mail::to($inviteeEmail)->send(
                    new EventInvitationPdfMail($invitation, $pdfBinary, $pdfFileName)
                );

                $sentCount++;
                $deliveryStatuses[] = [
                    'name' => $inviteeName,
                    'email' => $inviteeEmail,
                    'delivery' => 'sent',
                    'error' => null,
                ];
            } catch (\Throwable $exception) {
                $failedCount++;
                $deliveryStatuses[] = [
                    'name' => $inviteeName,
                    'email' => $inviteeEmail,
                    'delivery' => 'failed',
                    'error' => $exception->getMessage(),
                ];

                Log::error('Event invitation PDF email failed.', [
                    'event_id' => $event->id,
                    'invitation_id' => $invitation->id,
                    'user_id' => $invitation->user_id,
                    'email' => $inviteeEmail,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        $event->loadMissing('organizer:id,name,email');
        $organizerEmail = trim((string) optional($event->organizer)->email);

        if ($organizerEmail !== '') {
            try {
                Mail::to($organizerEmail)->send(
                    new OrganizerEventInvitationSummaryMail(
                        $event,
                        $deliveryStatuses,
                        $sentCount,
                        $skippedCount,
                        $failedCount,
                    )
                );
            } catch (\Throwable $exception) {
                Log::error('Organizer invitation summary email failed.', [
                    'event_id' => $event->id,
                    'organizer_id' => $event->organizer_id,
                    'email' => $organizerEmail,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        return redirect()
            ->route('events.invitations')
            ->with('success', $this->buildInvitationStoreMessage(
                (int) $invitations->count(),
                $sentCount,
                $skippedCount,
                $failedCount,
            ));
    }

    public function show(Request $request, Event $event): Response
    {
        abort_if(! Schema::hasTable('event_invitations'), 404);

        $user = $request->user();

        $event->load([
            'organizer:id,name,email',
            'invitations.user:id,name,email',
        ]);

        $invitation = $event->invitations->firstWhere('user_id', $user->id);
        $isOrganizer = (int) $event->organizer_id === (int) $user->id;
        $roleName = Str::lower((string) optional($user->role)->nom_role);
        $isAdmin = (bool) $user->is_super_admin || in_array($roleName, ['admin', 'superadmin'], true);

        abort_unless($isOrganizer || $invitation !== null || $isAdmin, 403);

        $participants = $event->invitations
            ->map(function (EventInvitation $item): array {
                return [
                    'id' => $item->id,
                    'user' => $item->user
                        ? [
                            'id' => $item->user->id,
                            'name' => $item->user->name,
                            'email' => $item->user->email,
                        ]
                        : null,
                    'status' => $item->status,
                    'qr_code_uuid' => $item->qr_code_uuid,
                ];
            })
            ->values();

        return Inertia::render('Events/Show', [
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
                'description' => $event->description,
                'type' => $event->type,
                'location' => $event->location,
                'meeting_link' => $event->meeting_link,
                'status' => $event->status,
                'status_reason' => $event->status_reason,
                'start_time' => optional($event->start_time)->toIso8601String(),
                'end_time' => optional($event->end_time)->toIso8601String(),
                'organizer' => $event->organizer
                    ? [
                        'id' => $event->organizer->id,
                        'name' => $event->organizer->name,
                        'email' => $event->organizer->email,
                    ]
                    : null,
            ],
            'viewer' => [
                'is_organizer' => $isOrganizer,
                'is_admin' => $isAdmin,
                'invitation_id' => $invitation?->id,
                'invitation_status' => $invitation?->status,
            ],
            'stats' => [
                'total' => $participants->count(),
                'pending' => $participants->where('status', 'pending')->count(),
                'confirmed' => $participants->where('status', 'confirmed')->count(),
                'rejected' => $participants->where('status', 'rejected')->count(),
                'present' => $participants->where('status', 'present')->count(),
            ],
            'participants' => $participants,
        ]);
    }

    public function rsvp(Request $request, EventInvitation $invitation): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['pending', 'confirmed', 'rejected'])],
        ]);

        abort_unless((int) $invitation->user_id === (int) $request->user()->id, 403);
        abort_if($invitation->status === 'present', 422, 'Pointage deja enregistre. Statut non modifiable.');
        $invitation->loadMissing('event:id,status');
        abort_if(optional($invitation->event)->status === 'canceled', 422, 'Cet evenement a ete annule.');

        $invitation->update([
            'status' => $validated['status'],
        ]);

        $invitation->loadMissing('event:id,organizer_id');
        $organizerId = (int) optional($invitation->event)->organizer_id;

        if ($organizerId > 0 && $organizerId !== (int) $request->user()->id) {
            $this->broadcastSafely(
                new NotificationCreated($organizerId, 'event_rsvp', (int) $invitation->id)
            );
        }

        return back()->with('success', 'Votre reponse a ete enregistree.');
    }

    public function cancelEvent(Request $request, Event $event): RedirectResponse
    {
        $validated = $request->validate([
            'status_reason' => ['required', 'string', 'max:5000'],
        ]);

        $user = $request->user();
        $roleName = Str::lower((string) optional($user->role)->nom_role);
        $isAdmin = (bool) $user->is_super_admin || in_array($roleName, ['admin', 'superadmin'], true);
        $isOrganizer = (int) $event->organizer_id === (int) $user->id;

        abort_unless($isOrganizer || $isAdmin, 403);

        DB::transaction(function () use ($event, $validated): void {
            $event->update([
                'status' => 'canceled',
                'status_reason' => $validated['status_reason'],
            ]);

            EventInvitation::query()
                ->where('event_id', $event->id)
                ->update([
                    'qr_code_uuid' => null,
                ]);
        });

        $event->load([
            'organizer:id,name,email',
            'invitations.user:id,name,email',
        ]);

        $recipients = $event->invitations
            ->filter(fn (EventInvitation $invitation) => in_array($invitation->status, ['pending', 'confirmed'], true))
            ->map(fn (EventInvitation $invitation) => $invitation->user)
            ->filter()
            ->unique('id')
            ->values();

        foreach ($recipients as $recipient) {
            $recipient->notify(new EventCanceledNotification($event));
        }

        return back()->with('success', 'Evenement annule. Les invites concernes ont ete notifies.');
    }

    public function postponeEvent(Request $request, Event $event): RedirectResponse
    {
        $validated = $request->validate([
            'start_time' => ['required', 'date'],
            'end_time' => ['required', 'date', 'after:start_time'],
            'status_reason' => ['required', 'string', 'max:5000'],
        ]);

        $user = $request->user();
        $roleName = Str::lower((string) optional($user->role)->nom_role);
        $isAdmin = (bool) $user->is_super_admin || in_array($roleName, ['admin', 'superadmin'], true);
        $isOrganizer = (int) $event->organizer_id === (int) $user->id;

        abort_unless($isOrganizer || $isAdmin, 403);
        abort_if($event->status === 'canceled', 422, 'Un evenement annule ne peut pas etre reporte.');
        abort_if($event->status === 'completed', 422, 'Un evenement termine ne peut pas etre reporte.');

        DB::transaction(function () use ($event, $validated): void {
            $event->update([
                'status' => 'postponed',
                'status_reason' => $validated['status_reason'],
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'],
            ]);

            EventInvitation::query()
                ->where('event_id', $event->id)
                ->update([
                    'qr_code_uuid' => null,
                ]);
        });

        $event->load([
            'organizer:id,name,email',
            'invitations.user:id,name,email',
        ]);

        $recipients = $event->invitations
            ->filter(fn (EventInvitation $invitation) => in_array($invitation->status, ['pending', 'confirmed'], true))
            ->map(fn (EventInvitation $invitation) => $invitation->user)
            ->filter()
            ->unique('id')
            ->values();

        foreach ($recipients as $recipient) {
            $recipient->notify(new EventPostponedNotification($event));
        }

        return back()->with('success', 'Evenement reporte. Les invites concernes ont ete notifies.');
    }

    public function downloadPdf(Request $request, EventInvitation $invitation): HttpResponse
    {
        $invitation->loadMissing([
            'event.organizer:id,name,email',
            'user:id,name,email',
        ]);

        $user = $request->user();
        $event = $invitation->event;

        $roleName = Str::lower((string) optional($user->role)->nom_role);
        $isAdmin = (bool) $user->is_super_admin || in_array($roleName, ['admin', 'superadmin'], true);
        $isInvitee = (int) $invitation->user_id === (int) $user->id;
        $isOrganizer = $event && (int) $event->organizer_id === (int) $user->id;

        abort_unless($isInvitee || $isOrganizer || $isAdmin, 403);

        $pdfGenerator = app(EventInvitationPdfGenerator::class);
        $pdfBinary = $pdfGenerator->generate($invitation);
        $pdfFileName = $pdfGenerator->fileName($invitation);

        return response($pdfBinary, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => sprintf('attachment; filename="%s"', $pdfFileName),
        ]);
    }

    private function organizerInvitees(int $organizerId)
    {
        return User::query()
            ->with([
                'role:id,nom_role',
                'department:id,name',
            ])
            ->whereKeyNot($organizerId)
            ->where('is_blocked', false)
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role_id', 'department_id'])
            ->map(function (User $user): array {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role_name' => optional($user->role)->nom_role,
                    'department_name' => optional($user->department)->name,
                ];
            })
            ->values();
    }

    private function buildInvitationStoreMessage(
        int $totalInvitations,
        int $sentCount,
        int $skippedCount,
        int $failedCount,
    ): string {
        if ($totalInvitations === 0) {
            return 'Evenement cree.';
        }

        $message = "Evenement cree. {$sentCount}/{$totalInvitations} invitation(s) email envoyee(s).";

        if ($skippedCount > 0) {
            $message .= " {$skippedCount} sans adresse email.";
        }

        if ($failedCount > 0) {
            $message .= " {$failedCount} en echec d'envoi.";
        }

        return $message;
    }
}
