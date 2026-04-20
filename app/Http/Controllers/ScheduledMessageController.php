<?php

namespace App\Http\Controllers;

use App\Events\NotificationCreated;
use App\Models\Message;
use App\Models\PersonalReminder;
use App\Models\RecurringMessage;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ScheduledMessageController extends Controller
{
    public function index(Request $request): Response
    {
        $userId = (int) $request->user()->id;

        $scheduledMessages = Message::query()
            ->with('receiver:id,name,email')
            ->where('sender_id', $userId)
            ->where('status', 'scheduled')
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '>', now())
            ->orderBy('scheduled_at')
            ->get([
                'id',
                'receiver_id',
                'sujet',
                'contenu',
                'scheduled_at',
                'status',
                'created_at',
            ])
            ->map(fn (Message $message) => [
                'id' => $message->id,
                'subject' => $message->sujet,
                'body' => $message->contenu,
                'excerpt' => Str::limit((string) $message->contenu, 120),
                'scheduled_at' => optional($message->scheduled_at)?->toIso8601String(),
                'status' => $message->status,
                'created_at' => optional($message->created_at)?->toIso8601String(),
                'receiver' => $message->receiver
                    ? [
                        'id' => $message->receiver->id,
                        'name' => $message->receiver->name,
                        'email' => $message->receiver->email,
                    ]
                    : null,
            ])
            ->values();

        $recurringMessages = RecurringMessage::query()
            ->with([
                'receiver:id,name,email',
                'user:id,name,email',
            ])
            ->where('user_id', $userId)
            ->orderByDesc('is_active')
            ->orderBy('time_of_day')
            ->get()
            ->map(fn (RecurringMessage $message) => [
                'id' => $message->id,
                'body' => $message->body,
                'excerpt' => Str::limit((string) $message->body, 120),
                'frequency' => $message->frequency,
                'time_of_day' => $message->time_of_day,
                'is_active' => $message->is_active,
                'created_at' => optional($message->created_at)?->toIso8601String(),
                'receiver' => $message->receiver
                    ? [
                        'id' => $message->receiver->id,
                        'name' => $message->receiver->name,
                        'email' => $message->receiver->email,
                    ]
                    : null,
            ])
            ->values();

        $personalReminders = PersonalReminder::query()
            ->where('user_id', $userId)
            ->where('is_completed', false)
            ->orderBy('remind_at')
            ->get()
            ->map(fn (PersonalReminder $reminder) => [
                'id' => $reminder->id,
                'content' => $reminder->content,
                'remind_at' => optional($reminder->remind_at)?->toIso8601String(),
                'is_completed' => $reminder->is_completed,
                'created_at' => optional($reminder->created_at)?->toIso8601String(),
            ])
            ->values();

        $recipients = User::query()
            ->with('role:id,nom_role')
            ->whereKeyNot($userId)
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role_id'])
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role_id' => $user->role_id,
                'role' => $user->role
                    ? [
                        'id' => $user->role->id,
                        'nom_role' => $user->role->nom_role,
                    ]
                    : null,
            ])
            ->values();

        return Inertia::render('Planifications/Index', [
            'scheduledMessages' => $scheduledMessages,
            'recurringMessages' => $recurringMessages,
            'personalReminders' => $personalReminders,
            'recipients' => $recipients,
            'roles' => Role::query()
                ->select('id', 'nom_role')
                ->orderBy('nom_role')
                ->get(),
        ]);
    }

    public function storeScheduledMessage(Request $request): RedirectResponse
    {
        $userId = (int) $request->user()->id;
        $validated = $request->validate($this->scheduledMessageCreateRules($userId));
        $scheduledAt = Carbon::parse($validated['scheduled_at']);
        $receiverIds = collect($validated['receiver_ids'] ?? [])
            ->map(fn ($receiverId) => (int) $receiverId)
            ->unique()
            ->values()
            ->all();
        $messageGroupUuid = count($receiverIds) > 1 ? (string) Str::uuid() : null;

        DB::transaction(function () use ($messageGroupUuid, $receiverIds, $scheduledAt, $userId, $validated): void {
            foreach ($receiverIds as $receiverId) {
                Message::query()->create([
                    'sender_id' => $userId,
                    'receiver_id' => $receiverId,
                    'receiver_ids' => $receiverIds,
                    'sujet' => trim((string) $validated['sujet']),
                    'contenu' => trim((string) $validated['contenu']),
                    'fichier' => null,
                    'lu_le' => null,
                    'read_at' => null,
                    'lu' => false,
                    'spam' => false,
                    'important' => false,
                    'sent_at' => null,
                    'requires_receipt' => false,
                    'is_tracked' => false,
                    'receipt_requested_at' => null,
                    'scheduled_at' => $scheduledAt,
                    'status' => 'scheduled',
                    'is_delivered' => false,
                    'archived' => false,
                    'type_message' => 'normal',
                    'envoye' => false,
                    'deadline_reponse' => null,
                    'can_be_redirected' => false,
                    'message_group_uuid' => $messageGroupUuid,
                    'parent_id' => null,
                    'forwarded_from_message_id' => null,
                    'original_receiver_id' => null,
                ]);
            }
        });

        return redirect()
            ->route('planifications.index')
            ->with('success', count($receiverIds) > 1
                ? 'Messages programmes avec succes.'
                : 'Message programme avec succes.');
    }

    public function updateScheduledMessage(Request $request, Message $message): RedirectResponse
    {
        $this->authorizeScheduledMessage($request->user()->id, $message);

        $validated = $request->validate($this->scheduledMessageUpdateRules((int) $request->user()->id));

        $message->update([
            'receiver_id' => (int) $validated['receiver_id'],
            'receiver_ids' => [(int) $validated['receiver_id']],
            'sujet' => trim((string) $validated['sujet']),
            'contenu' => trim((string) $validated['contenu']),
            'scheduled_at' => Carbon::parse($validated['scheduled_at']),
            'status' => 'scheduled',
            'sent_at' => null,
            'is_delivered' => false,
            'envoye' => false,
        ]);

        return redirect()
            ->route('planifications.index')
            ->with('success', 'Message programme mis a jour avec succes.');
    }

    public function destroyScheduledMessage(Request $request, Message $message): RedirectResponse
    {
        $this->authorizeScheduledMessage($request->user()->id, $message);

        $message->delete();

        return redirect()
            ->route('planifications.index')
            ->with('success', 'Message programme supprime avec succes.');
    }

    public function sendScheduledMessageNow(Request $request, Message $message): RedirectResponse
    {
        $this->authorizeScheduledMessage($request->user()->id, $message);

        $now = now();

        $message->update([
            'scheduled_at' => null,
            'status' => 'sent',
            'sent_at' => $now,
            'is_delivered' => true,
            'envoye' => true,
            'receipt_requested_at' => $message->requires_receipt
                ? ($message->receipt_requested_at ?? $now)
                : null,
        ]);

        $this->broadcastSafely(
            new NotificationCreated((int) $message->receiver_id, 'message', (int) $message->id)
        );

        return redirect()
            ->route('planifications.index')
            ->with('success', 'Message envoye immediatement avec succes.');
    }

    public function storeRecurringMessage(Request $request): RedirectResponse
    {
        $validated = $request->validate($this->recurringMessageCreateRules((int) $request->user()->id));
        $receiverIds = collect($validated['receiver_ids'] ?? [])
            ->map(fn ($receiverId) => (int) $receiverId)
            ->unique()
            ->values()
            ->all();

        DB::transaction(function () use ($receiverIds, $request, $validated): void {
            foreach ($receiverIds as $receiverId) {
                RecurringMessage::query()->create([
                    'user_id' => (int) $request->user()->id,
                    'receiver_id' => $receiverId,
                    'body' => trim((string) $validated['body']),
                    'frequency' => $validated['frequency'],
                    'time_of_day' => $validated['time_of_day'],
                    'is_active' => (bool) ($validated['is_active'] ?? true),
                ]);
            }
        });

        return redirect()
            ->route('planifications.index')
            ->with('success', count($receiverIds) > 1
                ? 'Messages recurrents crees avec succes.'
                : 'Message recurrent cree avec succes.');
    }

    public function updateRecurringMessage(Request $request, RecurringMessage $recurringMessage): RedirectResponse
    {
        $this->authorizeOwnedRecurringMessage($request->user()->id, $recurringMessage);
        $validated = $request->validate($this->recurringMessageUpdateRules((int) $request->user()->id));

        $recurringMessage->update([
            'receiver_id' => (int) $validated['receiver_id'],
            'body' => trim((string) $validated['body']),
            'frequency' => $validated['frequency'],
            'time_of_day' => $validated['time_of_day'],
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        return redirect()
            ->route('planifications.index')
            ->with('success', 'Message recurrent mis a jour avec succes.');
    }

    public function destroyRecurringMessage(Request $request, RecurringMessage $recurringMessage): RedirectResponse
    {
        $this->authorizeOwnedRecurringMessage($request->user()->id, $recurringMessage);

        $recurringMessage->delete();

        return redirect()
            ->route('planifications.index')
            ->with('success', 'Message recurrent supprime avec succes.');
    }

    public function storePersonalReminder(Request $request): RedirectResponse
    {
        $validated = $request->validate($this->personalReminderRules(true));

        PersonalReminder::query()->create([
            'user_id' => (int) $request->user()->id,
            'content' => trim((string) $validated['content']),
            'remind_at' => Carbon::parse($validated['remind_at']),
            'is_completed' => (bool) ($validated['is_completed'] ?? false),
        ]);

        return redirect()
            ->route('planifications.index')
            ->with('success', 'Rappel personnel cree avec succes.');
    }

    public function updatePersonalReminder(Request $request, PersonalReminder $personalReminder): RedirectResponse
    {
        $this->authorizeOwnedReminder($request->user()->id, $personalReminder);
        $validated = $request->validate($this->personalReminderRules(false));

        $personalReminder->update([
            'content' => trim((string) $validated['content']),
            'remind_at' => Carbon::parse($validated['remind_at']),
            'is_completed' => (bool) ($validated['is_completed'] ?? false),
        ]);

        return redirect()
            ->route('planifications.index')
            ->with('success', 'Rappel personnel mis a jour avec succes.');
    }

    public function destroyPersonalReminder(Request $request, PersonalReminder $personalReminder): RedirectResponse
    {
        $this->authorizeOwnedReminder($request->user()->id, $personalReminder);

        $personalReminder->delete();

        return redirect()
            ->route('planifications.index')
            ->with('success', 'Rappel personnel supprime avec succes.');
    }

    private function scheduledMessageCreateRules(int $userId): array
    {
        return [
            'receiver_ids' => ['required', 'array', 'min:1'],
            'receiver_ids.*' => ['required', 'integer', 'distinct', 'exists:users,id', Rule::notIn([$userId])],
            'sujet' => ['required', 'string', 'max:255'],
            'contenu' => ['required', 'string'],
            'scheduled_at' => ['required', 'date', 'after:now'],
        ];
    }

    private function scheduledMessageUpdateRules(int $userId): array
    {
        return [
            'receiver_id' => ['required', 'integer', 'exists:users,id', Rule::notIn([$userId])],
            'sujet' => ['required', 'string', 'max:255'],
            'contenu' => ['required', 'string'],
            'scheduled_at' => ['required', 'date', 'after:now'],
        ];
    }

    private function recurringMessageCreateRules(int $userId): array
    {
        return [
            'receiver_ids' => ['required', 'array', 'min:1'],
            'receiver_ids.*' => ['required', 'integer', 'distinct', 'exists:users,id', Rule::notIn([$userId])],
            'body' => ['required', 'string', 'max:5000'],
            'frequency' => ['required', Rule::in(['daily', 'weekly', 'monthly'])],
            'time_of_day' => ['required', 'date_format:H:i'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    private function recurringMessageUpdateRules(int $userId): array
    {
        return [
            'receiver_id' => ['required', 'integer', 'exists:users,id', Rule::notIn([$userId])],
            'body' => ['required', 'string', 'max:5000'],
            'frequency' => ['required', Rule::in(['daily', 'weekly', 'monthly'])],
            'time_of_day' => ['required', 'date_format:H:i'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    private function personalReminderRules(bool $requireFutureDate): array
    {
        $remindAtRules = ['required', 'date'];

        if ($requireFutureDate) {
            $remindAtRules[] = 'after:now';
        }

        return [
            'content' => ['required', 'string', 'max:5000'],
            'remind_at' => $remindAtRules,
            'is_completed' => ['nullable', 'boolean'],
        ];
    }

    private function authorizeScheduledMessage(int $userId, Message $message): void
    {
        abort_unless(
            (int) $message->sender_id === (int) $userId
                && $message->status === 'scheduled'
                && $message->scheduled_at !== null
                && $message->scheduled_at->isFuture(),
            403
        );
    }

    private function authorizeOwnedRecurringMessage(int $userId, RecurringMessage $recurringMessage): void
    {
        abort_unless((int) $recurringMessage->user_id === (int) $userId, 403);
    }

    private function authorizeOwnedReminder(int $userId, PersonalReminder $personalReminder): void
    {
        abort_unless((int) $personalReminder->user_id === (int) $userId, 403);
    }
}
