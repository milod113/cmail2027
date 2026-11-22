<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Support\MessageAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * Notifications sans Firebase : l'application mobile interroge cet endpoint
 * à intervalle régulier (réseau local de l'établissement) et affiche des
 * notifications locales pour les nouveaux messages reçus.
 */
class NotificationController extends Controller
{
    /**
     * Return the received messages newer than `after_id`.
     *
     * Sans `after_id` (premier appel après connexion), seul le curseur est
     * renvoyé afin de ne pas notifier tout l'historique.
     */
    public function poll(Request $request): JsonResponse
    {
        $user = $request->user();
        $afterId = $request->integer('after_id');
        $hasCursor = $request->filled('after_id');
        $serverTime = now();
        // Messages programmés : ils sont livrés plus tard mais gardent leur ancien id.
        // On les rattrape grâce à leur date de livraison (sent_at) > `since`.
        $since = $request->filled('since') ? rescue(fn () => Carbon::parse($request->string('since')->toString()), null, false) : null;

        $latestId = (int) MessageAccess::inboxQuery($user->id)->max('id');
        $unreadCount = MessageAccess::inboxQuery($user->id)->where('lu', false)->count();

        $items = [];

        if ($hasCursor) {
            $items = MessageAccess::inboxQuery($user->id)
                ->with('sender:id,name')
                ->where(function ($query) use ($afterId, $since) {
                    $query->where('id', '>', $afterId);
                    if ($since !== null) {
                        $query->orWhere(fn ($q) => $q->whereNotNull('scheduled_at')->where('sent_at', '>', $since));
                    }
                })
                ->where('spam', false)
                // Les 20 PLUS RÉCENTS (puis remis dans l'ordre) : après une longue coupure ou un
                // gros arrivage, le téléphone saute au dernier message au lieu de dérouler des
                // centaines d'anciennes notifications, 20 à la fois.
                ->orderByDesc('id')
                ->limit(20)
                ->get(['id', 'sender_id', 'sujet', 'contenu', 'parent_id', 'important', 'is_important', 'fichier'])
                ->reverse()
                ->values()
                ->map(fn ($message) => [
                    'id' => $message->id,
                    // Une réponse s'ouvre sur le message racine du fil.
                    'open_id' => $message->parent_id ?? $message->id,
                    'is_reply' => $message->parent_id !== null,
                    'subject' => $message->sujet,
                    'excerpt' => Str::limit(trim(preg_replace('/\s+/', ' ', (string) $message->contenu)), 120),
                    'sender_name' => $message->sender?->name,
                    'is_important' => (bool) ($message->important || $message->is_important),
                    'has_attachment' => filled($message->fichier),
                ])
                ->all();
        }

        // Nouvelles invitations à des événements (curseur séparé).
        $invitations = [];
        $latestInvitationId = 0;
        if (\Illuminate\Support\Facades\Schema::hasTable('event_invitations')) {
            $latestInvitationId = (int) \App\Models\EventInvitation::query()->where('user_id', $user->id)->max('id');
            if ($request->filled('after_invitation_id')) {
                $invitations = \App\Models\EventInvitation::query()
                    ->with('event:id,title,start_time,organizer_id,type,location', 'event.organizer:id,name')
                    ->where('user_id', $user->id)
                    ->where('id', '>', $request->integer('after_invitation_id'))
                    ->orderBy('id')
                    ->limit(20)
                    ->get()
                    ->filter(fn ($i) => $i->event !== null)
                    ->map(fn ($i) => [
                        'id' => $i->id,
                        'event_id' => $i->event->id,
                        'title' => $i->event->title,
                        'organizer_name' => $i->event->organizer?->name,
                        'start_time' => optional($i->event->start_time)?->toIso8601String(),
                        'where' => $i->event->type === 'online' ? 'En ligne' : $i->event->location,
                    ])
                    ->values()
                    ->all();
            }
        }

        // Relances reçues depuis le dernier passage (l'expéditeur me rappelle de confirmer / répondre)
        $relances = [];
        if ($since !== null && \Illuminate\Support\Facades\Schema::hasColumn('messages', 'last_pinged_at')) {
            $relances = MessageAccess::inboxQuery($user->id)
                ->with('sender:id,name')
                ->whereNotNull('last_pinged_at')
                ->where('last_pinged_at', '>', $since)
                ->orderBy('last_pinged_at')
                ->limit(20)
                ->get(['id', 'sender_id', 'sujet', 'requires_receipt', 'important', 'is_important', 'acknowledged_at', 'deadline_reponse'])
                ->map(fn ($m) => [
                    'id' => $m->id,
                    'subject' => $m->sujet,
                    'sender_name' => $m->sender?->name,
                    'kind' => ($m->requires_receipt || $m->important || $m->is_important) && $m->acknowledged_at === null ? 'receipt' : 'reply',
                    'deadline' => optional($m->deadline_reponse)?->toIso8601String(),
                ])
                ->all();
        }

        // Messages instantanés (chat) reçus : curseur séparé `after_chat_id`
        $chats = [];
        $latestChatId = 0;
        if (\Illuminate\Support\Facades\Schema::hasTable('chat_messages')) {
            $latestChatId = (int) \App\Models\ChatMessage::query()->where('receiver_id', $user->id)->max('id');
            if ($request->filled('after_chat_id')) {
                $chats = \App\Models\ChatMessage::query()
                    ->with('sender:id,name')
                    ->where('receiver_id', $user->id)
                    ->whereNull('read_at')
                    ->where('id', '>', $request->integer('after_chat_id'))
                    ->orderByDesc('id')
                    ->limit(20)
                    ->get()
                    ->reverse()
                    ->values()
                    ->map(fn ($c) => [
                        'id' => $c->id,
                        'sender_id' => (int) $c->sender_id,
                        'sender_name' => $c->sender?->name,
                        'preview' => \App\Support\ChatPayload::preview($c),
                    ])
                    ->all();
            }
        }

        return response()->json([
            'relances' => $relances,
            'latest_chat_id' => $latestChatId,
            'chats' => $chats,
            'latest_invitation_id' => $latestInvitationId,
            'invitations' => $invitations,
            'latest_id' => $latestId,
            'server_time' => $serverTime->toIso8601String(),
            'unread_count' => $unreadCount,
            'items' => $items,
        ]);
    }
}
