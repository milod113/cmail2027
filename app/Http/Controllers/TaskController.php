<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\Task;
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
            'tasks' => $this->buildTasksCollection((int) $request->user()->id, archived: false),
        ]);
    }

    public function archives(Request $request): Response
    {
        return Inertia::render('Tasks/Archives', [
            'tasks' => $this->buildTasksCollection((int) $request->user()->id, archived: true),
        ]);
    }

    public function storeFromMessage(Request $request, Message $message): RedirectResponse
    {
        $user = $request->user();

        $this->authorizeMessageAccess((int) $user->id, $message);

        $title = trim((string) $message->sujet) !== ''
            ? 'Tache: '.trim((string) $message->sujet)
            : 'Tache depuis message #'.$message->id;

        Task::query()->create([
            'user_id' => $user->id,
            'message_id' => $message->id,
            'title' => $title,
            'description' => trim((string) $message->contenu) !== '' ? $message->contenu : null,
            'status' => 'pending',
        ]);

        return back()->with('success', 'Tache creee depuis le message.');
    }

    public function toggleStatus(Request $request, Task $task): RedirectResponse
    {
        $this->authorizeTaskOwnership($request, $task);
        abort_if($task->archived_at !== null, 403);

        $task->update([
            'status' => $task->status === 'completed' ? 'pending' : 'completed',
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

    private function authorizeTaskOwnership(Request $request, Task $task): void
    {
        abort_unless((int) $task->user_id === (int) $request->user()->id, 403);
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
