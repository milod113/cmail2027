<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Events\ChatMessageCreated;
use App\Events\ChatMessagesRead;
use App\Events\NotificationCreated;
use App\Http\Controllers\Controller;
use App\Models\ChatMessage;
use App\Models\User;
use App\Notifications\NewChatMessageNotification;
use App\Support\Attachments;
use App\Support\ChatPayload;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Chat instantané (mêmes conversations que le web) : texte et messages vocaux.
 *
 * Temps réel : l'événement ChatMessageCreated est diffusé par Reverb sur le
 * canal privé `user.{id}` des deux participants ; l'application s'y abonne
 * (voir `realtime`) et, à défaut, interroge `messages?after=` régulièrement.
 */
class ChatController extends Controller
{
    private const PAGE = 40;

    /** Paramètres de connexion au serveur temps réel (Reverb, protocole Pusher). */
    public function realtime(): JsonResponse
    {
        $key = config('reverb.apps.apps.0.key') ?? config('broadcasting.connections.reverb.key');

        return response()->json([
            'enabled' => config('broadcasting.default') === 'reverb' && filled($key),
            'key' => $key,
            'port' => (int) (config('broadcasting.connections.reverb.options.port') ?? 6001),
            'scheme' => config('broadcasting.connections.reverb.options.scheme') ?? 'http',
        ]);
    }

    /** Conversations récentes : dernier message et nombre de non-lus. */
    public function conversations(Request $request): JsonResponse
    {
        $me = (int) $request->user()->id;

        $last = ChatMessage::query()
            ->selectRaw('CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS other_id, MAX(id) AS last_id', [$me])
            ->where(fn (Builder $q) => $q->where('sender_id', $me)->orWhere('receiver_id', $me))
            ->groupBy('other_id')
            ->orderByDesc('last_id')
            ->limit(100)
            ->get();

        $messages = ChatMessage::query()->whereIn('id', $last->pluck('last_id'))->get()->keyBy('id');
        $users = User::query()->with('profile:id,user_id,photo')->whereIn('id', $last->pluck('other_id'))->get(['id', 'name', 'email'])->keyBy('id');
        $unread = ChatMessage::query()
            ->where('receiver_id', $me)->whereNull('read_at')
            ->groupBy('sender_id')
            ->pluck(DB::raw('COUNT(*) AS n'), 'sender_id');

        $data = $last->map(function ($row) use ($messages, $users, $unread, $me) {
            $u = $users->get($row->other_id);
            $m = $messages->get($row->last_id);
            if (! $u || ! $m) {
                return null;
            }

            return [
                'user' => $this->userPayload($u),
                'last_message' => [
                    'id' => $m->id,
                    'type' => $m->type ?: 'text',
                    'preview' => ChatPayload::preview($m),
                    'created_at' => optional($m->created_at)?->toIso8601String(),
                    'mine' => (int) $m->sender_id === $me,
                    'read_at' => optional($m->read_at)?->toIso8601String(),
                ],
                'unread_count' => (int) ($unread[$row->other_id] ?? 0),
            ];
        })->filter()->values();

        return response()->json([
            'data' => $data,
            'unread_total' => (int) $data->sum('unread_count'),
        ]);
    }

    /**
     * Messages d'une conversation, du plus ancien au plus récent.
     * `before=<id>` : page précédente ; `after=<id>` : nouveaux messages seulement.
     */
    public function messages(Request $request, User $user): JsonResponse
    {
        $me = (int) $request->user()->id;
        abort_if($me === (int) $user->id, 403);

        $query = $this->between($me, (int) $user->id)->with(['sender:id,name,email', 'receiver:id,name,email']);

        if ($request->filled('after')) {
            $rows = $query->where('id', '>', $request->integer('after'))->orderBy('id')->limit(200)->get();
            $hasMore = false;
        } else {
            if ($request->filled('before')) {
                $query->where('id', '<', $request->integer('before'));
            }
            $rows = $query->orderByDesc('id')->limit(self::PAGE + 1)->get();
            $hasMore = $rows->count() > self::PAGE;
            $rows = $rows->take(self::PAGE)->reverse()->values();
        }

        return response()->json([
            'data' => $rows->map(fn (ChatMessage $m) => ChatPayload::map($m, $me, signed: true))->values(),
            'has_more' => $hasMore,
            'user' => $this->userPayload($user->loadMissing('profile:id,user_id,photo')),
        ]);
    }

    /** Envoi d'un message texte (`body`) ou vocal (`audio` + `duration_ms`). */
    public function send(Request $request, User $user): JsonResponse
    {
        $me = $request->user();
        abort_if((int) $me->id === (int) $user->id, 403);

        $validated = $request->validate([
            'body' => ['nullable', 'string', 'max:5000', 'required_without:audio'],
            // m4a / aac / ogg / webm / mp3 / wav ; 3 minutes en AAC ≈ 3 Mo
            'audio' => ['nullable', 'file', 'max:8192', 'mimes:m4a,mp4,aac,ogg,oga,opus,webm,mp3,wav', 'required_without:body'],
            'duration_ms' => ['nullable', 'integer', 'min:0', 'max:'.((ChatMessage::MAX_VOICE_SECONDS + 5) * 1000)],
        ]);

        $voice = $request->hasFile('audio');
        $body = trim((string) ($validated['body'] ?? ''));
        abort_if(! $voice && $body === '', 422, 'Message vide.');

        $chat = ChatMessage::query()->create([
            'sender_id' => $me->id,
            'receiver_id' => $user->id,
            'type' => $voice ? 'voice' : 'text',
            'body' => $voice ? null : $body,
            'audio_path' => $voice ? Attachments::store($request->file('audio'), 'chat-audio') : null,
            'duration_ms' => $voice ? (int) ($validated['duration_ms'] ?? 0) : null,
        ]);
        $chat->load(['sender:id,name,email', 'receiver:id,name,email']);

        $user->notify(new NewChatMessageNotification($chat));
        $this->broadcastSafely(new ChatMessageCreated(ChatPayload::map($chat, (int) $me->id), (int) $me->id, (int) $user->id));
        $this->broadcastSafely(new NotificationCreated((int) $user->id, 'message', (int) $chat->id));

        return response()->json(['message' => ChatPayload::map($chat, (int) $me->id, signed: true)], 201);
    }

    /** Marque comme lus les messages reçus de ce contact (et prévient l'expéditeur). */
    public function markRead(Request $request, User $user): JsonResponse
    {
        $me = $request->user();

        $lastId = (int) ChatMessage::query()
            ->where('sender_id', $user->id)->where('receiver_id', $me->id)
            ->whereNull('read_at')->max('id');

        $updated = 0;
        if ($lastId > 0) {
            $updated = ChatMessage::query()
                ->where('sender_id', $user->id)->where('receiver_id', $me->id)
                ->whereNull('read_at')->where('id', '<=', $lastId)
                ->update(['read_at' => now()]);

            $me->unreadNotifications()
                ->where('data->subtype', 'chat_message')
                ->where('data->sender_id', $user->id)
                ->get()
                ->markAsRead();

            $this->broadcastSafely(new ChatMessagesRead((int) $user->id, (int) $me->id, $lastId));
        }

        return response()->json(['updated' => $updated]);
    }

    // ------------------------------------------------------------------ outils

    private function between(int $a, int $b): Builder
    {
        return ChatMessage::query()->where(fn (Builder $q) => $q
            ->where(fn (Builder $x) => $x->where('sender_id', $a)->where('receiver_id', $b))
            ->orWhere(fn (Builder $x) => $x->where('sender_id', $b)->where('receiver_id', $a)));
    }

    private function userPayload(User $u): array
    {
        $photo = $u->profile?->photo;

        return [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'photo_url' => $photo ? \Illuminate\Support\Facades\Storage::disk('public')->url($photo) : null,
        ];
    }
}
