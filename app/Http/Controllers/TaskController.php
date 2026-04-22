<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\MessageTask;
use App\Models\Task;
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
            'tasks' => $this->buildMessageTasksCollection((int) $request->user()->id),
        ]);
    }

    public function archives(Request $request): Response
    {
        return Inertia::render('Tasks/Archives', [
            'tasks' => $this->buildTasksCollection((int) $request->user()->id, archived: true),
        ]);
    }

    public function calendar(Request $request): Response
    {
        return Inertia::render('Tasks/Calendar', [
            'tasks' => $this->buildMessageTasksCollection((int) $request->user()->id),
        ]);
    }

    public function show(Request $request, MessageTask $task): Response
    {
        $task->loadMissing([
            'message:id,sender_id,receiver_id,receiver_ids,sujet',
        ]);

        $this->authorizeMessageTaskAccess((int) $request->user()->id, $task);

        return Inertia::render('Tasks/Show', [
            'task' => $this->serializeMessageTask($task, (int) $request->user()->id),
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

        $this->authorizeMessageTaskAccess((int) $request->user()->id, $task);

        $task->update([
            'is_completed' => ! $task->is_completed,
        ]);

        return back()->with('success', 'Statut de la tache mis a jour.');
    }

    public function archive(Request $request, Task $task): RedirectResponse
    {
        $this->authorizeTaskOwnership($request, $task);

        $task->update([
            'archived_at' => now(),
        ]);

        return back()->with('success', 'Tache archivee avec succes.');
    }

    public function restore(Request $request, Task $task): RedirectResponse
    {
        $this->authorizeTaskOwnership($request, $task);

        $task->update([
            'archived_at' => null,
        ]);

        return back()->with('success', 'Tache restauree avec succes.');
    }

    public function destroy(Request $request, Task $task): RedirectResponse
    {
        $this->authorizeTaskOwnership($request, $task);

        $task->delete();

        return back()->with('success', 'Tache supprimee avec succes.');
    }

    private function buildTasksCollection(int $userId, bool $archived)
    {
        return Task::query()
            ->with([
                'message:id,sujet',
            ])
            ->where('user_id', $userId)
            ->when($archived, fn ($query) => $query->archived(), fn ($query) => $query->active())
            ->when(! $archived, fn ($query) => $query->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END"))
            ->when($archived, fn ($query) => $query->latest('archived_at'))
            ->latest()
            ->get([
                'id',
                'user_id',
                'message_id',
                'title',
                'description',
                'status',
                'archived_at',
                'created_at',
            ])
            ->map(function (Task $task) {
                return [
                    'id' => $task->id,
                    'message_id' => $task->message_id,
                    'title' => $task->title,
                    'description' => $task->description,
                    'status' => $task->status,
                    'archived_at' => optional($task->archived_at)?->toIso8601String(),
                    'created_at' => optional($task->created_at)?->toIso8601String(),
                    'message' => $task->message
                        ? [
                            'id' => $task->message->id,
                            'sujet' => $task->message->sujet,
                        ]
                        : null,
                ];
            })
            ->values();
    }

    private function buildMessageTasksCollection(int $userId)
    {
        return $this->visibleMessageTasksQuery($userId)
            ->orderByRaw('CASE WHEN is_completed = 0 THEN 0 ELSE 1 END')
            ->orderByRaw('CASE WHEN due_date IS NULL THEN 1 ELSE 0 END')
            ->orderBy('due_date')
            ->latest('id')
            ->get()
            ->map(fn (MessageTask $task) => $this->serializeMessageTask($task, $userId))
            ->values();
    }

    private function visibleMessageTasksQuery(int $userId): Builder
    {
        return MessageTask::query()
            ->with([
                'message:id,sender_id,receiver_id,receiver_ids,sujet',
            ])
            ->whereHas('message', function (Builder $query) use ($userId) {
                $query->where(function (Builder $messageQuery) use ($userId) {
                    $messageQuery
                        ->where('sender_id', $userId)
                        ->orWhere('receiver_id', $userId);

                    if (Schema::hasColumn('messages', 'receiver_ids')) {
                        $messageQuery->orWhereJsonContains('receiver_ids', $userId);
                    }
                });
            });
    }

    private function serializeMessageTask(MessageTask $task, int $userId): array
    {
        $message = $task->message;
        $isSender = $message && (int) $message->sender_id === $userId;

        return [
            'id' => $task->id,
            'kind' => 'message_task',
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
        ];
    }

    private function authorizeTaskOwnership(Request $request, Task $task): void
    {
        abort_unless((int) $task->user_id === (int) $request->user()->id, 403);
    }

    private function authorizeMessageTaskAccess(int $userId, MessageTask $task): void
    {
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
