<?php

namespace App\Http\Controllers;

use App\Events\MeetingOpened;
use App\Events\MeetingStateUpdated;
use App\Models\Meeting;
use App\Models\MeetingNote;
use App\Models\MeetingSection;
use App\Models\MeetingTopic;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MeetingController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $meetings = Meeting::query()
            ->with([
                'organizer:id,name,email',
                'participants:id,name,email',
            ])
            ->withCount('participants')
            ->where(function ($query) use ($user): void {
                $query
                    ->where('organizer_id', $user->id)
                    ->orWhereHas('participants', function ($participantsQuery) use ($user): void {
                        $participantsQuery->where('users.id', $user->id);
                    });
            })
            ->orderByDesc('start_time')
            ->get()
            ->map(fn (Meeting $meeting): array => [
                'id' => $meeting->id,
                'title' => $meeting->title,
                'type' => $meeting->type,
                'location_or_link' => $meeting->location_or_link,
                'start_time' => optional($meeting->start_time)?->toIso8601String(),
                'end_time' => optional($meeting->end_time)?->toIso8601String(),
                'status' => $meeting->status,
                'participants_count' => $meeting->participants_count,
                'organizer' => $meeting->organizer
                    ? [
                        'id' => $meeting->organizer->id,
                        'name' => $meeting->organizer->name,
                        'email' => $meeting->organizer->email,
                    ]
                    : null,
                'participants_preview' => $meeting->participants
                    ->take(4)
                    ->map(fn (User $participant): array => [
                        'id' => $participant->id,
                        'name' => $participant->name,
                        'email' => $participant->email,
                    ])
                    ->values(),
                'is_organizer' => (int) $meeting->organizer_id === (int) $user->id,
                'show_url' => route('meetings.show', $meeting),
            ])
            ->values();

        return Inertia::render('Meetings/Index', [
            'canOrganizeMeetings' => $user->canOrganizeMeetings(),
            'meetings' => $meetings,
        ]);
    }

    public function create(Request $request): Response
    {
        Gate::authorize('organize-meetings');

        return Inertia::render('Meetings/Create', [
            'participants' => $this->participantOptions((int) $request->user()->id),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('organize-meetings');

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(['presentiel', 'distanciel'])],
            'location_or_link' => ['nullable', 'string', 'max:2000'],
            'start_time' => ['required', 'date'],
            'end_time' => ['nullable', 'date', 'after_or_equal:start_time'],
            'participant_ids' => ['required', 'array', 'min:1'],
            'participant_ids.*' => ['integer', 'distinct', 'exists:users,id'],
            'sections' => ['required', 'array', 'min:1'],
            'sections.*.title' => ['required', 'string', 'max:255'],
            'sections.*.topics' => ['required', 'array', 'min:1'],
            'sections.*.topics.*.title' => ['required', 'string', 'max:255'],
            'sections.*.topics.*.expected_duration' => ['nullable', 'integer', 'min:1', 'max:480'],
            'sections.*.topics.*.status' => ['required', Rule::in(['en_attente', 'en_cours', 'traite'])],
        ]);

        if ($validated['type'] === 'presentiel' && blank($validated['location_or_link'] ?? null)) {
            return back()->withErrors([
                'location_or_link' => 'Le lieu de la reunion est obligatoire pour un staff en presentiel.',
            ]);
        }

        if ($validated['type'] === 'distanciel' && blank($validated['location_or_link'] ?? null)) {
            return back()->withErrors([
                'location_or_link' => 'Le lien de reunion est obligatoire pour un staff en distanciel.',
            ]);
        }

        $participantIds = collect($validated['participant_ids'])
            ->map(fn ($id): int => (int) $id)
            ->reject(fn (int $id): bool => $id === (int) $request->user()->id)
            ->unique()
            ->values();

        if ($participantIds->isEmpty()) {
            return back()->withErrors([
                'participant_ids' => 'Veuillez selectionner au moins un participant autre que l organisateur.',
            ]);
        }

        $meeting = DB::transaction(function () use ($request, $validated, $participantIds): Meeting {
            $meeting = Meeting::query()->create([
                'title' => trim((string) $validated['title']),
                'type' => $validated['type'],
                'location_or_link' => filled($validated['location_or_link'] ?? null)
                    ? trim((string) $validated['location_or_link'])
                    : null,
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'] ?? null,
                'organizer_id' => $request->user()->id,
                'status' => 'planifie',
            ]);

            $meeting->participants()->sync(
                $participantIds->mapWithKeys(fn (int $participantId): array => [
                    $participantId => ['joined_at' => null],
                ])->all()
            );

            foreach ($validated['sections'] as $sectionIndex => $sectionData) {
                $section = $meeting->sections()->create([
                    'title' => trim((string) $sectionData['title']),
                    'order' => $sectionIndex + 1,
                ]);

                foreach ($sectionData['topics'] as $topicIndex => $topicData) {
                    $section->topics()->create([
                        'title' => trim((string) $topicData['title']),
                        'expected_duration' => filled($topicData['expected_duration'] ?? null)
                            ? (int) $topicData['expected_duration']
                            : null,
                        'status' => $topicData['status'],
                        'order' => $topicIndex + 1,
                    ]);
                }
            }

            return $meeting;
        });

        return redirect()
            ->route('meetings.show', $meeting)
            ->with('success', 'Staff medical cree avec succes.');
    }

    public function show(Request $request, Meeting $meeting): Response
    {
        Gate::authorize('view', $meeting);

        $meeting->load([
            'organizer:id,name,email',
            'participants:id,name,email',
            'sections' => fn ($query) => $query->orderBy('order'),
            'sections.topics' => fn ($query) => $query->orderBy('order'),
            'sections.topics.actions' => fn ($query) => $query->with('owner:id,name,email')->latest('due_at'),
            'sections.topics.notes' => fn ($query) => $query
                ->with('user:id,name,email')
                ->orderBy('created_at'),
        ]);

        return Inertia::render('Meetings/Show', [
            'meeting' => $this->mapMeetingDetail($meeting, $request->user()),
            'actionOwners' => $this->actionOwnerOptions($meeting),
        ]);
    }

    public function openMeeting(Request $request, Meeting $meeting): RedirectResponse
    {
        Gate::authorize('manage', $meeting);
        abort_if($meeting->opened_at !== null, 422, 'Le staff a deja ete ouvert.');
        abort_if($meeting->closed_at !== null, 422, 'Ce staff est deja cloture.');

        $meeting->forceFill([
            'opened_at' => now(),
            'status' => 'en_cours',
        ])->save();

        $meeting->refresh();

        $this->broadcastSafely(new MeetingOpened($meeting));

        return back()->with('success', 'Le staff a ete ouvert et la prise de notes est maintenant active.');
    }

    public function closeMeeting(Request $request, Meeting $meeting): RedirectResponse
    {
        Gate::authorize('manage', $meeting);

        abort_if($meeting->opened_at === null, 422, 'Le staff doit etre ouvert avant d etre cloture.');
        abort_if($meeting->closed_at !== null, 422, 'Ce staff est deja cloture.');

        $meeting->forceFill([
            'closed_at' => now(),
            'status' => 'termine',
        ])->save();

        $meeting->refresh();
        $this->broadcastSafely(new MeetingStateUpdated($meeting, 'meeting-closed'));

        return back()->with('success', 'Le staff a ete cloture. Les notes et decisions sont maintenant figees.');
    }

    public function joinMeeting(Request $request, Meeting $meeting): JsonResponse
    {
        Gate::authorize('view', $meeting);

        abort_if((int) $meeting->organizer_id === (int) $request->user()->id, 422, 'L organisateur n a pas besoin de rejoindre manuellement le staff.');
        abort_if($meeting->opened_at === null || $meeting->status !== 'en_cours', 403, 'Le staff n est pas encore ouvert.');
        abort_if($meeting->closed_at !== null, 403, 'Le staff est deja cloture.');

        $joinedAt = $this->ensureParticipantJoined($meeting, $request->user());

        return response()->json([
            'joined_at' => optional($joinedAt)?->toIso8601String(),
        ]);
    }

    private function participantOptions(int $userId): Collection
    {
        return User::query()
            ->with([
                'role:id,nom_role',
                'department:id,name',
            ])
            ->whereKeyNot($userId)
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'email',
                'role_id',
                'department_id',
            ])
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role_name' => optional($user->role)->nom_role,
                'department_name' => optional($user->department)->name,
            ])
            ->values();
    }

    private function actionOwnerOptions(Meeting $meeting): Collection
    {
        $participantIds = $meeting->participants()
            ->pluck('users.id')
            ->push((int) $meeting->organizer_id)
            ->unique()
            ->values();

        return User::query()
            ->whereIn('id', $participantIds)
            ->orderBy('name')
            ->get(['id', 'name', 'email'])
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ])
            ->values();
    }

    private function mapMeetingDetail(Meeting $meeting, User $currentUser): array
    {
        $participantPivot = $meeting->participants
            ->firstWhere('id', $currentUser->id)?->pivot;
        $viewerIsOrganizer = (int) $meeting->organizer_id === (int) $currentUser->id;
        $viewerJoinedAt = optional($participantPivot?->joined_at)?->toIso8601String();
        $meetingIsOpen = $meeting->opened_at !== null && $meeting->closed_at === null;

        return [
            'id' => $meeting->id,
            'title' => $meeting->title,
            'type' => $meeting->type,
            'location_or_link' => $meeting->location_or_link,
            'start_time' => optional($meeting->start_time)?->toIso8601String(),
            'end_time' => optional($meeting->end_time)?->toIso8601String(),
            'opened_at' => optional($meeting->opened_at)?->toIso8601String(),
            'closed_at' => optional($meeting->closed_at)?->toIso8601String(),
            'status' => $meeting->status,
            'viewer' => [
                'id' => $currentUser->id,
                'is_organizer' => $viewerIsOrganizer,
                'joined_at' => $viewerJoinedAt,
                'can_open' => $viewerIsOrganizer && $meeting->opened_at === null && $meeting->closed_at === null,
                'can_close' => $viewerIsOrganizer && $meeting->opened_at !== null && $meeting->closed_at === null,
                'can_manage' => $viewerIsOrganizer && $meeting->closed_at === null,
                'can_write_notes' => $meetingIsOpen && ($viewerIsOrganizer || $viewerJoinedAt !== null),
            ],
            'organizer' => $meeting->organizer
                ? [
                    'id' => $meeting->organizer->id,
                    'name' => $meeting->organizer->name,
                    'email' => $meeting->organizer->email,
                ]
                : null,
            'participants' => $meeting->participants
                ->map(fn (User $participant): array => [
                    'id' => $participant->id,
                    'name' => $participant->name,
                    'email' => $participant->email,
                    'joined_at' => optional($participant->pivot?->joined_at)?->toIso8601String(),
                ])
                ->values(),
            'sections' => $meeting->sections
                ->map(function (MeetingSection $section) use ($meeting, $currentUser): array {
                    return [
                        'id' => $section->id,
                        'title' => $section->title,
                        'order' => $section->order,
                        'topics' => $section->topics
                            ->map(function (MeetingTopic $topic) use ($meeting, $currentUser): array {
                                return [
                                    'id' => $topic->id,
                                    'title' => $topic->title,
                                    'expected_duration' => $topic->expected_duration,
                                    'status' => $topic->status,
                                    'decision_summary' => $topic->decision_summary,
                                    'order' => $topic->order,
                                    'actions' => $topic->actions
                                        ->map(fn (\App\Models\MeetingTopicAction $action): array => [
                                            'id' => $action->id,
                                            'meeting_topic_id' => $action->meeting_topic_id,
                                            'title' => $action->title,
                                            'notes' => $action->notes,
                                            'status' => $action->status,
                                            'due_at' => optional($action->due_at)?->toIso8601String(),
                                            'owner' => $action->owner
                                                ? [
                                                    'id' => $action->owner->id,
                                                    'name' => $action->owner->name,
                                                    'email' => $action->owner->email,
                                                ]
                                                : null,
                                        ])
                                        ->values(),
                                    'notes' => $topic->notes
                                        ->filter(fn (MeetingNote $note): bool => ! $note->is_private
                                            || (int) $note->user_id === (int) $currentUser->id
                                            || (int) $meeting->organizer_id === (int) $currentUser->id)
                                        ->values()
                                        ->map(fn (MeetingNote $note): array => [
                                            'id' => $note->id,
                                            'meeting_topic_id' => $note->meeting_topic_id,
                                            'content' => $note->content,
                                            'is_private' => (bool) $note->is_private,
                                            'created_at' => optional($note->created_at)?->toIso8601String(),
                                            'user' => $note->user
                                                ? [
                                                    'id' => $note->user->id,
                                                    'name' => $note->user->name,
                                                    'email' => $note->user->email,
                                                ]
                                                : null,
                                        ]),
                                ];
                            })
                            ->values(),
                    ];
                })
                ->values(),
        ];
    }

    private function ensureParticipantJoined(Meeting $meeting, User $user): ?\Illuminate\Support\Carbon
    {
        if ((int) $meeting->organizer_id === (int) $user->id) {
            return null;
        }

        if ($meeting->opened_at === null || $meeting->closed_at !== null || $meeting->status !== 'en_cours') {
            return null;
        }

        $participant = $meeting->participants()
            ->where('users.id', $user->id)
            ->first();

        if (! $participant) {
            return null;
        }

        if ($participant->pivot?->joined_at !== null) {
            return $participant->pivot->joined_at;
        }

        $timestamp = now();

        $meeting->participants()->updateExistingPivot($user->id, [
            'joined_at' => $timestamp,
        ]);

        return $timestamp;
    }
}
