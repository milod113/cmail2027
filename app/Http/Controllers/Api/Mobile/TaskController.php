<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Http\Resources\TaskResource;
use App\Models\Message;
use App\Models\MessageTask;
use App\Support\MessageAccess;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class TaskController extends Controller
{
    /**
     * List the authenticated user's visible tasks (message + meeting tasks).
     *
     * Replicates the web TaskController without touching the web routes.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $userId = (int) $request->user()->id;

        $tasks = $this->visibleTasksQuery($userId)
            ->orderByRaw('CASE WHEN is_completed = 0 THEN 0 ELSE 1 END')
            ->orderByRaw('CASE WHEN due_date IS NULL THEN 1 ELSE 0 END')
            ->orderBy('due_date')
            ->latest('id')
            ->paginate(30);

        return TaskResource::collection($tasks);
    }

    /**
     * Show a single task the user is allowed to see.
     */
    public function show(Request $request, MessageTask $task): JsonResponse
    {
        $this->authorizeTaskAccess((int) $request->user()->id, $task);

        $task->loadMissing([
            'message:id,sender_id,receiver_id,receiver_ids,sujet,created_at',
            'message.sender:id,name,email',
            'meeting:id,title',
            'meetingTopic:id,title',
            'meetingTopicAction:id,title',
        ]);

        return response()->json(new TaskResource($task));
    }

    /**
     * Toggle the completion status of a task.
     */
    public function toggleStatus(Request $request, MessageTask $task): JsonResponse
    {
        $this->authorizeTaskAccess((int) $request->user()->id, $task);

        $task->update([
            'is_completed' => ! $task->is_completed,
        ]);

        return response()->json([
            'message' => $task->is_completed
                ? 'Tâche marquée comme terminée.'
                : 'Tâche réouverte.',
            'task' => new TaskResource($task->loadMissing([
                'message:id,sender_id,receiver_id,receiver_ids,sujet,created_at',
                'message.sender:id,name,email',
            ])),
        ]);
    }

    /**
     * Create a task from a message the user can access (mirrors the web flow).
     */
    public function storeFromMessage(Request $request, Message $message): JsonResponse
    {
        $user = $request->user();

        if (! MessageAccess::canAccess((int) $user->id, $message)) {
            abort(403, "Vous n'avez pas accès à ce message.");
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'due_date' => ['nullable', 'date'],
            'reminder_at' => ['nullable', 'date'],
            'priority' => ['required', 'in:low,normal,high,urgent'],
        ]);

        $task = MessageTask::query()->create([
            'message_id' => $message->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'due_date' => $validated['due_date'] ?? null,
            'reminder_at' => $validated['reminder_at'] ?? null,
            'priority' => $validated['priority'],
            'is_completed' => false,
        ]);

        $task->loadMissing([
            'message:id,sender_id,receiver_id,receiver_ids,sujet,created_at',
            'message.sender:id,name,email',
        ]);

        return (new TaskResource($task))->response()->setStatusCode(201);
    }

    /**
     * Base query for tasks the user may see.
     */
    private function visibleTasksQuery(int $userId): Builder
    {
        return MessageTask::query()
            ->with([
                'message:id,sender_id,receiver_id,receiver_ids,sujet,created_at',
                'message.sender:id,name,email',
                'meeting:id,title',
                'meetingTopic:id,title',
                'meetingTopicAction:id,title',
            ])
            ->where(function (Builder $query) use ($userId) {
                $query
                    ->where(function (Builder $messageQuery) use ($userId) {
                        $messageQuery->whereHas('message', function (Builder $authorized) use ($userId) {
                            $authorized->where(function (Builder $recipientQuery) use ($userId) {
                                $recipientQuery
                                    ->where('sender_id', $userId)
                                    ->orWhere('receiver_id', $userId);

                                if (Schema::hasColumn('messages', 'receiver_ids')) {
                                    $recipientQuery->orWhereJsonContains('receiver_ids', $userId);
                                }
                            });
                        });
                    })
                    ->orWhere('owner_id', $userId);
            });
    }

    /**
     * Ensure the user may access the given task.
     */
    private function authorizeTaskAccess(int $userId, MessageTask $task): void
    {
        if ((int) ($task->owner_id ?? 0) === $userId) {
            return;
        }

        $message = $task->message()->first();

        abort_unless($message instanceof Message, 404);

        if (! MessageAccess::canAccess($userId, $message)) {
            abort(403, "Vous n'avez pas accès à cette tâche.");
        }
    }
}