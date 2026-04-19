<?php

namespace App\Http\Controllers;

use App\Events\NotificationCreated;
use App\Models\Message;
use App\Models\ReportedMessage;
use App\Models\User;
use App\Notifications\NewReportedMessageNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class ReportController extends Controller
{
    public function store(Request $request, Message $message): RedirectResponse
    {
        abort_unless($this->canReportMessage($request->user()->id, $message), 403);

        $validated = $request->validate([
            'reason_category' => ['required', 'string', 'in:spam,harassment,technical,other'],
            'comment' => ['nullable', 'string', 'max:5000'],
        ]);

        $report = ReportedMessage::query()->create([
            'message_id' => $message->id,
            'reporter_id' => $request->user()->id,
            'reason_category' => $validated['reason_category'],
            'comment' => filled($validated['comment'] ?? null) ? trim((string) $validated['comment']) : null,
            'status' => 'pending',
        ]);

        $report->loadMissing([
            'message:id,sujet,contenu,sender_id,receiver_id',
            'reporter:id,name,email,role_id',
        ]);

        $supportUsers = User::query()
            ->with('role:id,nom_role')
            ->where(function ($query) {
                $query
                    ->where('is_super_admin', true)
                    ->orWhereHas('role', function ($roleQuery) {
                        $roleQuery->whereIn('nom_role', [
                            'admin',
                            'Admin',
                            'superadmin',
                            'SuperAdmin',
                            'support',
                            'Support',
                            'support technique',
                            'Support Technique',
                        ]);
                    });
            })
            ->whereKeyNot($request->user()->id)
            ->get();

        if ($supportUsers->isNotEmpty()) {
            foreach ($supportUsers as $supportUser) {
                $supportUser->notify(new NewReportedMessageNotification($report));

                $this->broadcastSafely(
                    new NotificationCreated((int) $supportUser->id, 'system', (int) $report->id)
                );
            }
        }

        return back()->with('success', 'Votre signalement a bien ete transmis au support technique.');
    }

    private function canReportMessage(int $userId, Message $message): bool
    {
        if ((int) $message->sender_id === $userId) {
            return false;
        }

        if ((int) $message->receiver_id === $userId) {
            return true;
        }

        if (! Schema::hasColumn('messages', 'receiver_ids')) {
            return false;
        }

        return collect($message->receiver_ids ?? [])
            ->map(fn ($id) => (int) $id)
            ->contains($userId);
    }
}
