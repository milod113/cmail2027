<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\MessageTask;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('Tasks/Index', [
            'tasks' => $this->buildVisibleTasksCollection((int) $request->user()->id),
        ]);
    }

    public function archives(Request $request): Response
    {
        return Inertia::render('Tasks/Archives', [
            'tasks' => collect(),
        ]);
    }

    public function calendar(Request $request): Response
    {
        return Inertia::render('Tasks/Calendar', [
            'tasks' => $this->buildVisibleTasksCollection((int) $request->user()->id),
        ]);
    }

    public function show(Request $request, MessageTask $task): Response
    {
        $task->loadMissing([
            'message:id,sender_id,receiver_id,receiver_ids,sujet',
            'meeting:id,title',
            'meetingTopic:id,title',
            'meetingTopicAction:id,title',
        ]);

        $this->authorizeTaskAccess((int) $request->user()->id, $task);

        return Inertia::render('Tasks/Show', [
            'task' => $this->serializeTask($task, (int) $request->user()->id),
        ]);
    }

    public function storeFromMessage(Request $request, Message $message): RedirectResponse
    {
        $user = $request->user();

        $this->authorizeMessageAccess((int) $user->id, $message);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'due_date' => ['nullable', 'date'],
            'reminder_at' => ['nullable', 'date'],
            'priority' => ['required', 'in:low,normal,high,urgent'],
        ]);

        MessageTask::query()->create([
            'message_id' => $message->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'due_date' => $validated['due_date'] ?? null,
            'reminder_at' => $validated['reminder_at'] ?? null,
            'priority' => $validated['priority'],
            'is_completed' => false,
        ]);

        return back()->with('success', 'Tache professionnelle creee depuis le message.');
    }

    public function toggleStatus(Request $request, MessageTask $task): RedirectResponse
    {
        $task->loadMissing([
            'message:id,sender_id,receiver_id,receiver_ids,sujet',
        ]);

        $this->authorizeTaskAccess((int) $request->user()->id, $task);

        $task->update([
            'is_completed' => ! $task->is_completed,
        ]);

        return back()->with('success', 'Statut de la tache mis a jour.');
    }

    public function archive(Request $request, MessageTask $task): RedirectResponse
    {
        abort(404);
    }

    public function restore(Request $request, MessageTask $task): RedirectResponse
    {
        abort(404);
    }

    public function destroy(Request $request, MessageTask $task): RedirectResponse
    {
        abort(404);
    }

    private function buildVisibleTasksCollection(int $userId)
    {
        return $this->visibleTasksQuery($userId)
            ->orderByRaw('CASE WHEN is_completed = 0 THEN 0 ELSE 1 END')
            ->orderByRaw('CASE WHEN due_date IS NULL THEN 1 ELSE 0 END')
            ->orderBy('due_date')
            ->latest('id')
            ->get()
            ->map(fn (MessageTask $task) => $this->serializeTask($task, $userId))
            ->values();
    }

    private function visibleTasksQuery(int $userId): Builder
    {
        return MessageTask::query()
            ->with([
                'message:id,sender_id,receiver_id,receiver_ids,sujet',
                'meeting:id,title',
                'meetingTopic:id,title',
                'meetingTopicAction:id,title',
            ])
            ->where(function (Builder $query) use ($userId) {
                $query
                    ->whereHas('message', function (Builder $messageQuery) use ($userId) {
                        $messageQuery->where(function (Builder $authorizedMessageQuery) use ($userId) {
                            $authorizedMessageQuery
                                ->where('sender_id', $userId)
                                ->orWhere('receiver_id', $userId);

                            if (Schema::hasColumn('messages', 'receiver_ids')) {
                                $authorizedMessageQuery->orWhereJsonContains('receiver_ids', $userId);
                            }
                        });
                    })
                    ->orWhere('owner_id', $userId);
            });
    }

    private function serializeTask(MessageTask $task, int $userId): array
    {
        $message = $task->message;
        $isSender = $message && (int) $message->sender_id === $userId;
        $isMeetingTask = $task->meeting_id !== null;

        return [
            'id' => $task->id,
            'kind' => $isMeetingTask ? 'meeting_task' : 'message_task',
            'message_id' => $task->message_id,
            'title' => $task->title,
            'description' => $task->description,
            'priority' => $task->priority,
            'status' => $task->is_completed ? 'completed' : 'pending',
            'is_completed' => $task->is_completed,
            'due_date' => optional($task->due_date)?->toIso8601String(),
            'reminder_at' => optional($task->reminder_at)?->toIso8601String(),
            'created_at' => optional($task->created_at)?->toIso8601String(),
            'archived_at' => null,
            'show_url' => route('tasks.show', $task),
            'toggle_url' => route('tasks.toggle-status', $task),
            'message' => $message
                ? [
                    'id' => $message->id,
                    'sujet' => $message->sujet,
                    'view_url' => $isSender
                        ? route('messages.sent.show', $message)
                        : route('messages.show', $message),
                ]
                : null,
            'meeting' => $task->meeting
                ? [
                    'id' => $task->meeting->id,
                    'title' => $task->meeting->title,
                    'view_url' => route('meetings.show', $task->meeting),
                    'topic_title' => $task->meetingTopic?->title,
                    'action_title' => $task->meetingTopicAction?->title,
                ]
                : null,
        ];
    }

    private function authorizeTaskAccess(int $userId, MessageTask $task): void
    {
        if ((int) ($task->owner_id ?? 0) === $userId) {
            return;
        }

        abort_unless($task->message instanceof Message, 404);
        $this->authorizeMessageAccess($userId, $task->message);
    }

    private function authorizeMessageAccess(int $userId, Message $message): void
    {
        $hasJsonRecipient = Schema::hasColumn('messages', 'receiver_ids')
            && in_array($userId, $message->receiver_ids ?? [], true);

        abort_unless(
            (int) $message->sender_id === $userId
                || (int) $message->receiver_id === $userId
                || $hasJsonRecipient,
            403
        );
    }
}
