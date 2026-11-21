<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Mail\EventInvitationPdfMail;
use App\Mail\OrganizerEventInvitationSummaryMail;
use App\Models\Event;
use App\Models\EventInvitation;
use App\Models\User;
use App\Notifications\EventCanceledNotification;
use App\Notifications\EventPostponedNotification;
use App\Support\EventInvitationPdfGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

/**
 * Invitations aux événements — équivalent mobile de EventInvitationController (web).
 *
 * Les e-mails (billet PDF, récapitulatif, annulation, report) sont envoyés APRÈS la
 * réponse et ne bloquent jamais l'application : sur le réseau fermé de
 * l'établissement, le serveur SMTP peut être injoignable.
 */
class EventController extends Controller
{
    /**
     * Mes invitations + mes événements organisés.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $invitations = EventInvitation::query()
            ->with('event.organizer:id,name,email')
            ->where('user_id', $user->id)
            ->whereHas('event')
            ->latest('created_at')
            ->get()
            ->map(fn (EventInvitation $i) => [
                'id' => $i->id,
                'status' => $i->status,
                'created_at' => optional($i->created_at)?->toIso8601String(),
                'event' => $this->eventPayload($i->event),
            ])
            ->values();

        $organized = $user->canOrganizeEvents()
            ? Event::query()
                ->withCount([
                    'invitations',
                    'invitations as confirmed_count' => fn ($q) => $q->where('status', 'confirmed'),
                    'invitations as rejected_count' => fn ($q) => $q->where('status', 'rejected'),
                    'invitations as pending_count' => fn ($q) => $q->where('status', 'pending'),
                ])
                ->where('organizer_id', $user->id)
                ->orderByDesc('start_time')
                ->get()
                ->map(fn (Event $e) => $this->eventPayload($e) + [
                    'stats' => [
                        'total' => (int) $e->invitations_count,
                        'confirmed' => (int) $e->confirmed_count,
                        'rejected' => (int) $e->rejected_count,
                        'pending' => (int) $e->pending_count,
                    ],
                ])
                ->values()
            : collect();

        return response()->json([
            'can_organize' => $user->canOrganizeEvents(),
            'invitations' => $invitations,
            'organized' => $organized,
        ]);
    }

    /**
     * Détail d'un événement (invité, organisateur ou administrateur).
     */
    public function show(Request $request, Event $event): JsonResponse
    {
        $user = $request->user();
        $event->load(['organizer:id,name,email', 'invitations.user:id,name,email,role_id', 'invitations.user.role:id,nom_role']);

        $invitation = $event->invitations->firstWhere('user_id', $user->id);
        $isOrganizer = (int) $event->organizer_id === (int) $user->id;
        $isAdmin = $this->isAdmin($user);
        abort_unless($isOrganizer || $invitation !== null || $isAdmin, 403);

        $participants = $event->invitations->map(fn (EventInvitation $i) => [
            'id' => $i->id,
            'status' => $i->status,
            'updated_at' => optional($i->updated_at)?->toIso8601String(),
            'user' => $i->user ? [
                'id' => $i->user->id,
                'name' => $i->user->name,
                'email' => $i->user->email,
                'role' => optional($i->user->role)->nom_role,
            ] : null,
        ])->values();

        return response()->json([
            'event' => $this->eventPayload($event),
            'viewer' => [
                'is_organizer' => $isOrganizer,
                'can_manage' => $isOrganizer || $isAdmin,
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
            // La liste des participants n'est visible que par l'organisateur (et l'admin).
            'participants' => ($isOrganizer || $isAdmin) ? $participants : [],
        ]);
    }

    /**
     * Répondre à une invitation (mêmes règles que le web).
     */
    public function rsvp(Request $request, EventInvitation $invitation): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['pending', 'confirmed', 'rejected'])],
        ]);

        abort_unless((int) $invitation->user_id === (int) $request->user()->id, 403);
        abort_if($invitation->status === 'present', 422, 'Pointage déjà enregistré. Statut non modifiable.');
        $invitation->loadMissing('event:id,status');
        abort_if(optional($invitation->event)->status === 'canceled', 422, 'Cet événement a été annulé.');

        $invitation->update(['status' => $validated['status']]);

        return response()->json([
            'message' => 'Votre réponse a été enregistrée.',
            'status' => $invitation->status,
        ]);
    }

    /**
     * Lien temporaire (signé, 10 min) vers le billet PDF, à ouvrir dans le navigateur.
     */
    public function pdfLink(Request $request, EventInvitation $invitation): JsonResponse
    {
        $this->authorizePdf($request->user(), $invitation);

        return response()->json([
            'url' => URL::temporarySignedRoute('mobile.events.pdf', now()->addMinutes(10), ['invitation' => $invitation->id]),
        ]);
    }

    /**
     * Téléchargement du PDF via le lien signé (sans token : la signature fait foi).
     */
    public function pdf(EventInvitation $invitation): HttpResponse
    {
        $generator = app(EventInvitationPdfGenerator::class);

        return response($generator->generate($invitation), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => sprintf('inline; filename="%s"', $generator->fileName($invitation)),
        ]);
    }

    /**
     * Personnes invitables (organisateur).
     */
    public function invitees(Request $request): JsonResponse
    {
        abort_unless($request->user()->canOrganizeEvents(), 403);

        return response()->json([
            'data' => User::query()
                ->with(['role:id,nom_role', 'department:id,name'])
                ->whereKeyNot($request->user()->id)
                ->where('is_blocked', false)
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'role_id', 'department_id'])
                ->map(fn (User $u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'role' => optional($u->role)->nom_role,
                    'department' => optional($u->department)->name,
                ])
                ->values(),
        ]);
    }

    /**
     * Créer un événement et inviter (mêmes règles que le web).
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->canOrganizeEvents(), 403, "Vous n'êtes pas autorisé à organiser des événements.");

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
        ], [
            'location.required_if' => 'Indiquez le lieu de l\'événement.',
            'meeting_link.required_if' => 'Indiquez le lien de la réunion en ligne.',
            'end_time.after' => 'La fin doit être après le début.',
        ]);

        $inviteeIds = collect($validated['invitee_ids'])
            ->map(fn ($id) => (int) $id)
            ->reject(fn ($id) => $id === (int) $user->id)
            ->unique()
            ->values();
        abort_if($inviteeIds->isEmpty(), 422, 'Veuillez sélectionner au moins un invité.');

        $event = DB::transaction(function () use ($user, $validated, $inviteeIds) {
            $event = Event::query()->create([
                'organizer_id' => $user->id,
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'type' => $validated['type'],
                'location' => $validated['type'] === 'in_person' ? ($validated['location'] ?? null) : null,
                'meeting_link' => $validated['type'] === 'online' ? ($validated['meeting_link'] ?? null) : null,
                'status' => 'scheduled',
                'status_reason' => null,
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'],
            ]);

            foreach ($inviteeIds as $id) {
                EventInvitation::query()->create([
                    'event_id' => $event->id,
                    'user_id' => $id,
                    'status' => 'pending',
                    'qr_code_uuid' => null,
                ]);
            }

            return $event;
        });

        $eventId = $event->id;
        dispatch(fn () => self::sendInvitationEmails($eventId))->afterResponse();

        return response()->json([
            'message' => 'Événement créé. '.$inviteeIds->count().' invitation(s) envoyée(s).',
            'event_id' => $event->id,
        ], 201);
    }

    public function cancel(Request $request, Event $event): JsonResponse
    {
        $validated = $request->validate(['status_reason' => ['required', 'string', 'max:5000']]);
        $this->authorizeManage($request->user(), $event);

        DB::transaction(function () use ($event, $validated) {
            $event->update(['status' => 'canceled', 'status_reason' => $validated['status_reason']]);
            EventInvitation::query()->where('event_id', $event->id)->update(['qr_code_uuid' => null]);
        });

        $eventId = $event->id;
        dispatch(fn () => self::notifyInvitees($eventId, EventCanceledNotification::class))->afterResponse();

        return response()->json(['message' => 'Événement annulé. Les invités concernés seront prévenus.']);
    }

    public function postpone(Request $request, Event $event): JsonResponse
    {
        $validated = $request->validate([
            'start_time' => ['required', 'date'],
            'end_time' => ['required', 'date', 'after:start_time'],
            'status_reason' => ['required', 'string', 'max:5000'],
        ], ['end_time.after' => 'La fin doit être après le début.']);

        $this->authorizeManage($request->user(), $event);
        abort_if($event->status === 'canceled', 422, 'Un événement annulé ne peut pas être reporté.');
        abort_if($event->status === 'completed', 422, 'Un événement terminé ne peut pas être reporté.');

        DB::transaction(function () use ($event, $validated) {
            $event->update([
                'status' => 'postponed',
                'status_reason' => $validated['status_reason'],
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'],
            ]);
            EventInvitation::query()->where('event_id', $event->id)->update(['qr_code_uuid' => null]);
        });

        $eventId = $event->id;
        dispatch(fn () => self::notifyInvitees($eventId, EventPostponedNotification::class))->afterResponse();

        return response()->json(['message' => 'Événement reporté. Les invités concernés seront prévenus.']);
    }

    // ------------------------------------------------------------------ helpers

    private function eventPayload(?Event $e): ?array
    {
        if (! $e) {
            return null;
        }

        return [
            'id' => $e->id,
            'title' => $e->title,
            'description' => $e->description,
            'type' => $e->type,
            'location' => $e->location,
            'meeting_link' => $e->meeting_link,
            'status' => $e->status,
            'status_reason' => $e->status_reason,
            'start_time' => optional($e->start_time)?->toIso8601String(),
            'end_time' => optional($e->end_time)?->toIso8601String(),
            'organizer' => $e->relationLoaded('organizer') && $e->organizer
                ? ['id' => $e->organizer->id, 'name' => $e->organizer->name, 'email' => $e->organizer->email]
                : null,
        ];
    }

    private function isAdmin(User $user): bool
    {
        $role = Str::lower((string) optional($user->role)->nom_role);

        return (bool) $user->is_super_admin || in_array($role, ['admin', 'superadmin'], true);
    }

    private function authorizeManage(User $user, Event $event): void
    {
        abort_unless((int) $event->organizer_id === (int) $user->id || $this->isAdmin($user), 403);
    }

    private function authorizePdf(User $user, EventInvitation $invitation): void
    {
        $invitation->loadMissing('event');
        abort_unless(
            (int) $invitation->user_id === (int) $user->id
            || (int) optional($invitation->event)->organizer_id === (int) $user->id
            || $this->isAdmin($user),
            403
        );
        abort_if(optional($invitation->event)->status === 'canceled', 422, 'Cet événement a été annulé.');
    }

    /** Billets PDF par e-mail + récapitulatif à l'organisateur (comme le web). */
    private static function sendInvitationEmails(int $eventId): void
    {
        $event = Event::query()->with(['organizer:id,name,email', 'invitations.user:id,name,email'])->find($eventId);
        if (! $event) {
            return;
        }

        $generator = app(EventInvitationPdfGenerator::class);
        $statuses = [];
        $sent = $skipped = $failed = 0;

        foreach ($event->invitations as $invitation) {
            $name = (string) ($invitation->user?->name ?? 'Invité');
            $email = trim((string) optional($invitation->user)->email);
            if ($email === '') {
                $skipped++;
                $statuses[] = ['name' => $name, 'email' => '-', 'delivery' => 'skipped', 'error' => 'Adresse email absente.'];
                continue;
            }
            try {
                $invitation->setRelation('event', $event);
                Mail::to($email)->send(new EventInvitationPdfMail($invitation, $generator->generate($invitation), $generator->fileName($invitation)));
                $sent++;
                $statuses[] = ['name' => $name, 'email' => $email, 'delivery' => 'sent', 'error' => null];
            } catch (\Throwable $e) {
                $failed++;
                $statuses[] = ['name' => $name, 'email' => $email, 'delivery' => 'failed', 'error' => $e->getMessage()];
                Log::warning('Mobile: e-mail d\'invitation non envoyé.', ['event_id' => $eventId, 'error' => $e->getMessage()]);
            }
        }

        $organizerEmail = trim((string) optional($event->organizer)->email);
        if ($organizerEmail !== '') {
            try {
                Mail::to($organizerEmail)->send(new OrganizerEventInvitationSummaryMail($event, $statuses, $sent, $skipped, $failed));
            } catch (\Throwable $e) {
                Log::warning('Mobile: récapitulatif organisateur non envoyé.', ['event_id' => $eventId, 'error' => $e->getMessage()]);
            }
        }
    }

    /** Prévient les invités en attente / confirmés (annulation ou report). */
    private static function notifyInvitees(int $eventId, string $notificationClass): void
    {
        $event = Event::query()->with(['organizer:id,name,email', 'invitations.user'])->find($eventId);
        if (! $event) {
            return;
        }

        $event->invitations
            ->filter(fn (EventInvitation $i) => in_array($i->status, ['pending', 'confirmed'], true))
            ->map(fn (EventInvitation $i) => $i->user)
            ->filter()
            ->unique('id')
            ->each(function (User $u) use ($event, $notificationClass) {
                try {
                    $u->notify(new $notificationClass($event));
                } catch (\Throwable $e) {
                    Log::warning('Mobile: notification d\'événement non envoyée.', ['event_id' => $event->id, 'error' => $e->getMessage()]);
                }
            });
    }
}
