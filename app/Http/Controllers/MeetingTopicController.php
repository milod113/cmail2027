<?php

namespace App\Http\Controllers;

use App\Events\MeetingStateUpdated;
use App\Models\Meeting;
use App\Models\MeetingTopic;
use App\Models\MeetingTopicAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class MeetingTopicController extends Controller
{
    public function updateDecision(Request $request, Meeting $meeting, MeetingTopic $topic): JsonResponse
    {
        Gate::authorize('manage', $meeting);

        $topic->loadMissing('section:id,meeting_id');

        abort_unless((int) $topic->section->meeting_id === (int) $meeting->id, 404);
        abort_if($meeting->closed_at !== null, 422, 'Ce staff est deja cloture.');

        $validated = $request->validate([
            'decision_summary' => ['nullable', 'string', 'max:20000'],
            'status' => ['required', Rule::in(['en_attente', 'en_cours', 'traite'])],
        ]);

        $topic->forceFill([
            'decision_summary' => filled($validated['decision_summary'] ?? null)
                ? trim((string) $validated['decision_summary'])
                : null,
            'status' => $validated['status'],
        ])->save();

        $meeting->refresh();
        $this->broadcastSafely(new MeetingStateUpdated($meeting, 'topic-decision-updated'));

        return response()->json([
            'topic' => $this->mapTopic($topic->fresh(['actions.owner:id,name,email'])),
        ]);
    }

    public function storeAction(Request $request, Meeting $meeting, MeetingTopic $topic): JsonResponse
    {
        Gate::authorize('manage', $meeting);

        $topic->loadMissing('section:id,meeting_id');

        abort_unless((int) $topic->section->meeting_id === (int) $meeting->id, 404);
        abort_if($meeting->closed_at !== null, 422, 'Ce staff est deja cloture.');

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'owner_id' => ['nullable', 'integer', 'exists:users,id'],
            'due_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'status' => ['required', Rule::in(['a_faire', 'en_cours', 'termine'])],
        ]);

        $this->ensureOwnerBelongsToMeeting($meeting, $validated['owner_id'] ?? null);

        $action = $topic->actions()->create([
            'title' => trim((string) $validated['title']),
            'owner_id' => $validated['owner_id'] ?? null,
            'due_at' => $validated['due_at'] ?? null,
            'notes' => filled($validated['notes'] ?? null) ? trim((string) $validated['notes']) : null,
            'status' => $validated['status'],
        ]);

        $action->loadMissing('owner:id,name,email');

        $meeting->refresh();
        $this->broadcastSafely(new MeetingStateUpdated($meeting, 'topic-action-created'));

        return response()->json([
            'action' => $this->mapAction($action),
        ], 201);
    }

    public function updateAction(Request $request, Meeting $meeting, MeetingTopic $topic, MeetingTopicAction $action): JsonResponse
    {
        Gate::authorize('manage', $meeting);

        $topic->loadMissing('section:id,meeting_id');

        abort_unless((int) $topic->section->meeting_id === (int) $meeting->id, 404);
        abort_unless((int) $action->meeting_topic_id === (int) $topic->id, 404);
        abort_if($meeting->closed_at !== null, 422, 'Ce staff est deja cloture.');

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'owner_id' => ['nullable', 'integer', 'exists:users,id'],
            'due_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'status' => ['required', Rule::in(['a_faire', 'en_cours', 'termine'])],
        ]);

        $this->ensureOwnerBelongsToMeeting($meeting, $validated['owner_id'] ?? null);

        $action->forceFill([
            'title' => trim((string) $validated['title']),
            'owner_id' => $validated['owner_id'] ?? null,
            'due_at' => $validated['due_at'] ?? null,
            'notes' => filled($validated['notes'] ?? null) ? trim((string) $validated['notes']) : null,
            'status' => $validated['status'],
        ])->save();

        $action->loadMissing('owner:id,name,email');

        $meeting->refresh();
        $this->broadcastSafely(new MeetingStateUpdated($meeting, 'topic-action-updated'));

        return response()->json([
            'action' => $this->mapAction($action),
        ]);
    }

    public function storeTask(Request $request, Meeting $meeting, MeetingTopic $topic): JsonResponse
    {
        Gate::authorize('manage', $meeting);

        $topic->loadMissing('section:id,meeting_id');

        abort_unless((int) $topic->section->meeting_id === (int) $meeting->id, 404);
        abort_if($meeting->closed_at !== null, 422, 'Ce staff est deja cloture.');

        $validated = $request->validate([
            'source_type' => ['required', Rule::in(['decision', 'action'])],
            'action_id' => ['nullable', 'integer', 'exists:meeting_topic_actions,id'],
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'owner_id' => ['nullable', 'integer', 'exists:users,id'],
            'due_date' => ['nullable', 'date'],
            'reminder_at' => ['nullable', 'date'],
            'priority' => ['required', Rule::in(['low', 'normal', 'high', 'urgent'])],
        ]);

        $action = null;

        if ($validated['source_type'] === 'action') {
            abort_if(blank($validated['action_id'] ?? null), 422, 'Selectionnez une action a convertir en tache.');

            $action = $topic->actions()
                ->whereKey((int) $validated['action_id'])
                ->first();

            abort_unless($action instanceof MeetingTopicAction, 404);
        }

        $ownerId = $validated['owner_id'] ?? $action?->owner_id ?? null;

        abort_if(! $ownerId, 422, 'Un responsable est requis pour creer une tache de suivi.');

        $this->ensureOwnerBelongsToMeeting($meeting, $ownerId);

        $decisionSummary = filled($topic->decision_summary ?? null)
            ? trim((string) $topic->decision_summary)
            : null;

        $title = filled($validated['title'] ?? null)
            ? trim((string) $validated['title'])
            : ($action?->title ?: Str::limit('Decision - '.$topic->title, 255, ''));

        $description = filled($validated['description'] ?? null)
            ? trim((string) $validated['description'])
            : ($action?->notes ?: $decisionSummary);

        abort_if(
            $validated['source_type'] === 'decision' && blank($description),
            422,
            'Ajoutez une decision avant de la convertir en tache.'
        );

        $task = MessageTask::query()->create([
            'message_id' => null,
            'owner_id' => (int) $ownerId,
            'meeting_id' => $meeting->id,
            'meeting_topic_id' => $topic->id,
            'meeting_topic_action_id' => $action?->id,
            'title' => $title,
            'description' => $description,
            'due_date' => $validated['due_date'] ?? $action?->due_at?->toDateTimeString(),
            'reminder_at' => $validated['reminder_at'] ?? null,
            'priority' => $validated['priority'],
            'is_completed' => false,
        ]);

        return response()->json([
            'task' => [
                'id' => $task->id,
                'title' => $task->title,
                'show_url' => route('tasks.show', $task),
            ],
        ], 201);
    }

    private function ensureOwnerBelongsToMeeting(Meeting $meeting, int|string|null $ownerId): void
    {
        if (! $ownerId) {
            return;
        }

        $ownerId = (int) $ownerId;

        if ($ownerId === (int) $meeting->organizer_id) {
            return;
        }

        $isParticipant = $meeting->participants()
            ->where('users.id', $ownerId)
            ->exists();

        abort_if(! $isParticipant, 422, 'Le responsable selectionne doit participer a ce staff.');
    }

    private function mapTopic(MeetingTopic $topic): array
    {
        return [
            'id' => $topic->id,
            'title' => $topic->title,
            'expected_duration' => $topic->expected_duration,
            'status' => $topic->status,
            'decision_summary' => $topic->decision_summary,
            'order' => $topic->order,
            'actions' => $topic->actions
                ->map(fn (MeetingTopicAction $action): array => $this->mapAction($action))
                ->values(),
        ];
    }

    private function mapAction(MeetingTopicAction $action): array
    {
        return [
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
        ];
    }
}
