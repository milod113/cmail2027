<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Models\EventInvitation;
use App\Models\GlobalAnnouncement;
use App\Models\Message;
use App\Models\MessageTask;
use App\Models\User;
use App\Support\MessageAccess;
use App\Support\RichTextSanitizer;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Écran d'accueil mobile : statut, « À traiter » et annonces de la direction,
 * en un seul appel.
 */
class HomeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user()->loadMissing(['settings', 'profile', 'role', 'department']);
        $userId = (int) $user->id;

        return response()->json([
            'status' => $this->status($user),
            'unread_messages' => MessageAccess::inboxQuery($userId)->where('lu', false)->count(),
            'todo' => [
                'receipts' => $this->receiptsToConfirm($userId),
                'invitations' => $this->pendingInvitations($userId),
                'tasks' => $this->dueTasks($userId),
            ],
            'announcements' => $this->announcements($user),
        ]);
    }

    /** Marquer une annonce comme lue (même règle que le web). */
    public function readAnnouncement(Request $request, GlobalAnnouncement $announcement): JsonResponse
    {
        $this->updatePivot($request->user(), $announcement, ['is_read' => true, 'read_at' => now()]);

        return response()->json(['message' => 'Annonce lue.']);
    }

    /** Accusé de lecture d'une annonce (même règle que le web). */
    public function acknowledgeAnnouncement(Request $request, GlobalAnnouncement $announcement): JsonResponse
    {
        $this->updatePivot($request->user(), $announcement, [
            'is_read' => true,
            'read_at' => now(),
            'is_acknowledged' => true,
            'acknowledged_at' => now(),
        ]);

        return response()->json(['message' => 'Accusé de lecture enregistré.']);
    }

    // ------------------------------------------------------------------ sections

    private function status(User $user): array
    {
        $s = $user->settings;
        $delegate = $s?->redirect_messages && $s?->delegate_user_id
            ? User::query()->find($s->delegate_user_id, ['id', 'name'])
            : null;

        return [
            'is_out_of_office' => (bool) ($s?->is_out_of_office ?? false),
            'delegate_name' => $delegate?->name,
            'grade' => $user->profile?->grade,
            'photo_url' => $user->profile?->photo ? \Illuminate\Support\Facades\Storage::disk('public')->url($user->profile->photo) : null,
        ];
    }

    /** Messages reçus dont la réception doit être confirmée. */
    private function receiptsToConfirm(int $userId): array
    {
        $query = MessageAccess::inboxQuery($userId)
            ->whereNull('acknowledged_at')
            ->where(fn ($q) => $q->where('requires_receipt', true)->orWhere('important', true)->orWhere('is_important', true))
            ->where(fn ($q) => $q->where('requires_receipt', true)->orWhere('lu', false)); // un important déjà lu sans accusé demandé n'est plus « à traiter »

        $items = (clone $query)
            ->with('sender:id,name')
            ->orderByDesc('sent_at')
            ->limit(5)
            ->get(['id', 'sender_id', 'sujet', 'sent_at', 'created_at', 'requires_receipt'])
            ->map(fn (Message $m) => [
                'id' => $m->id,
                'title' => $m->sujet,
                'subtitle' => 'De '.($m->sender?->name ?? 'Inconnu'),
                'date' => optional($m->sent_at ?? $m->created_at)?->toIso8601String(),
                'kind' => $m->requires_receipt ? 'receipt' : 'important',
            ])
            ->values();

        return ['count' => (clone $query)->count(), 'items' => $items];
    }

    /** Invitations à venir encore sans réponse. */
    private function pendingInvitations(int $userId): array
    {
        if (! Schema::hasTable('event_invitations')) {
            return ['count' => 0, 'items' => []];
        }

        $query = EventInvitation::query()
            ->where('user_id', $userId)
            ->where('status', 'pending')
            ->whereHas('event', fn ($q) => $q->where('status', '!=', 'canceled')->where('end_time', '>=', now()));

        $items = (clone $query)
            ->with('event:id,title,start_time,type,location,organizer_id', 'event.organizer:id,name')
            ->get()
            ->sortBy(fn ($i) => $i->event?->start_time)
            ->take(5)
            ->map(fn (EventInvitation $i) => [
                'id' => $i->event->id,
                'title' => $i->event->title,
                'subtitle' => 'Par '.($i->event->organizer?->name ?? 'Inconnu').' · '.($i->event->type === 'online' ? 'En ligne' : ($i->event->location ?? '')),
                'date' => optional($i->event->start_time)?->toIso8601String(),
                'kind' => 'invitation',
            ])
            ->values();

        return ['count' => (clone $query)->count(), 'items' => $items];
    }

    /** Tâches en retard ou à échéance aujourd'hui (non terminées). */
    private function dueTasks(int $userId): array
    {
        if (! Schema::hasTable('message_tasks')) {
            return ['count' => 0, 'items' => []];
        }

        $query = MessageTask::query()
            ->where('is_completed', false)
            ->whereNotNull('due_date')
            ->where('due_date', '<=', now()->endOfDay())
            ->where(function (Builder $q) use ($userId) {
                $q->where('owner_id', $userId)
                    ->orWhereHas('message', function (Builder $m) use ($userId) {
                        $m->where(function (Builder $r) use ($userId) {
                            $r->where('sender_id', $userId)->orWhere('receiver_id', $userId);
                            if (Schema::hasColumn('messages', 'receiver_ids')) {
                                $r->orWhereJsonContains('receiver_ids', $userId);
                            }
                        });
                    });
            });

        $items = (clone $query)
            ->orderBy('due_date')
            ->limit(5)
            ->get(['id', 'title', 'due_date', 'priority'])
            ->map(fn (MessageTask $t) => [
                'id' => $t->id,
                'title' => $t->title,
                'subtitle' => $t->due_date->isPast() ? 'En retard' : "Aujourd'hui",
                'date' => $t->due_date->toIso8601String(),
                'kind' => $t->due_date->isPast() ? 'task_overdue' : 'task_today',
                'priority' => $t->priority,
            ])
            ->values();

        return ['count' => (clone $query)->count(), 'items' => $items];
    }

    /** Annonces actives destinées à l'utilisateur (épinglées, puis urgentes → normales). */
    private function announcements(User $user): array
    {
        if (! Schema::hasTable('global_announcements')) {
            return [];
        }

        $rank = ['urgent' => 0, 'important' => 1, 'normal' => 2];

        return GlobalAnnouncement::query()
            ->with('creator:id,name')
            ->published()
            ->currentlyActive()
            ->whereHas('recipients', fn (Builder $q) => $q->where('users.id', $user->id))
            ->get()
            ->map(function (GlobalAnnouncement $a) use ($user) {
                $pivot = DB::table('global_announcement_user')
                    ->where('global_announcement_id', $a->id)
                    ->where('user_id', $user->id)
                    ->first();
                $text = RichTextSanitizer::plainText($a->content);

                return [
                    'id' => $a->id,
                    'title' => $a->title,
                    'content' => $text,
                    'excerpt' => Str::limit(preg_replace('/\s+/', ' ', $text), 160),
                    'priority' => $a->priority,
                    'is_pinned' => (bool) $a->is_pinned,
                    'requires_acknowledgement' => (bool) $a->requires_acknowledgement,
                    'published_at' => optional($a->published_at ?? $a->created_at)?->toIso8601String(),
                    'ends_at' => optional($a->ends_at)?->toIso8601String(),
                    'author' => $a->creator?->name,
                    'is_read' => (bool) ($pivot->is_read ?? false),
                    'is_acknowledged' => (bool) ($pivot->is_acknowledged ?? false),
                ];
            })
            ->sort(function ($x, $y) use ($rank) {
                return [! $x['is_pinned'], $rank[$x['priority']] ?? 3, -strtotime((string) $x['published_at'])]
                    <=> [! $y['is_pinned'], $rank[$y['priority']] ?? 3, -strtotime((string) $y['published_at'])];
            })
            ->values()
            ->all();
    }

    private function updatePivot(User $user, GlobalAnnouncement $announcement, array $values): void
    {
        $exists = DB::table('global_announcement_user')
            ->where('global_announcement_id', $announcement->id)
            ->where('user_id', $user->id);

        abort_unless((clone $exists)->exists(), 403, "Cette annonce ne vous est pas destinée.");

        $exists->update($values + ['updated_at' => now()]);
    }
}
