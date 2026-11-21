<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\User;
use App\Support\Attachments;
use App\Support\MessageAccess;
use App\Support\MessageThreads;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Messages groupés (un envoi → plusieurs destinataires) pour l'application mobile.
 *
 * Même périmètre que la page web « Messages groupés » et la vue de suivi
 * MessageView : statut de lecture et réponses par destinataire, réponse à
 * tous ou à un seul destinataire.
 */
class GroupMessageController extends Controller
{
    /**
     * Liste des messages groupés envoyés ou reçus par l'utilisateur.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! Schema::hasColumn('messages', 'receiver_ids')) {
            return response()->json(['data' => []]);
        }

        $search = trim((string) $request->string('search'));
        $scope = (string) $request->string('scope'); // '', 'sent', 'received'

        $groups = Message::query()
            ->with('sender:id,name,email')
            ->whereNull('parent_id')
            ->where('archived', false)
            ->where(function ($query) use ($user, $scope) {
                if ($scope !== 'received') {
                    $query->orWhere(fn ($q) => $q->where('sender_id', $user->id)
                        ->whereNull('sender_archived_at')->whereNull('sender_deleted_at'));
                }
                if ($scope !== 'sent') {
                    $query->orWhere(fn ($q) => $q->where('receiver_id', $user->id)->where('is_delivered', true)
                        ->whereNull('receiver_archived_at')->whereNull('receiver_deleted_at'));
                }
            })
            ->whereRaw('JSON_LENGTH(receiver_ids) >= 2')
            ->when($search !== '', fn ($query) => $query->where(function ($q) use ($search) {
                $q->where('sujet', 'like', "%{$search}%")->orWhere('contenu', 'like', "%{$search}%");
            }))
            ->orderByDesc('id')
            ->limit(300)
            ->get()
            ->groupBy(fn (Message $message) => filled($message->message_group_uuid)
                ? 'uuid:'.$message->message_group_uuid
                : 'id:'.$message->id)
            ->take(100);

        // Statistiques des groupes envoyés calculées en une fois (évite ~4 requêtes par groupe)
        $sentUuids = $groups->map(fn (Collection $g) => $g->first())
            ->filter(fn (Message $m) => filled($m->message_group_uuid))
            ->filter(fn (Message $m, $key) => $groups[$key]->contains(fn (Message $x) => (int) $x->sender_id === (int) $user->id))
            ->pluck('message_group_uuid')->unique()->values()->all();
        $batchStats = $this->batchStats($sentUuids, (int) $user->id);

        $data = $groups->map(function (Collection $group) use ($user, $batchStats) {
            /** @var Message $preferred */
            $preferred = $group->firstWhere('receiver_id', $user->id)
                ?? $group->firstWhere('sender_id', $user->id)
                ?? $group->first();

            $isSender = (int) $preferred->sender_id === (int) $user->id;
            $receiverIds = collect($preferred->receiver_ids ?? [])->filter()->map(fn ($id) => (int) $id)->unique();

            $item = [
                'id' => $preferred->id,
                'subject' => $preferred->sujet,
                'excerpt' => Str::limit(trim(preg_replace('/\s+/', ' ', (string) $preferred->contenu)), 140),
                'is_sender' => $isSender,
                'is_read' => $isSender ? true : (bool) $preferred->lu,
                'is_important' => $group->contains(fn (Message $m) => $m->important || $m->is_important),
                'has_attachment' => filled($preferred->fichier),
                'recipient_count' => $receiverIds->count(),
                'sent_at' => optional($preferred->sent_at ?? $preferred->created_at)?->toIso8601String(),
                'sender' => $preferred->sender ? [
                    'id' => $preferred->sender->id,
                    'name' => $preferred->sender->name,
                    'email' => $preferred->sender->email,
                ] : null,
                'stats' => null,
            ];

            if ($isSender) {
                $item['stats'] = $batchStats[$preferred->message_group_uuid ?? ''] ?? $this->stats(MessageThreads::root($preferred), (int) $user->id);
            }

            return $item;
        })->values();

        return response()->json(['data' => $data]);
    }

    /**
     * Vue de suivi d'un message groupé (réservée à l'expéditeur).
     */
    public function show(Request $request, Message $message): JsonResponse
    {
        $user = $request->user();
        $root = MessageThreads::root($message);

        abort_unless(MessageThreads::isGroupOwnedBy($root, (int) $user->id), 403, "Ce message n'est pas un envoi groupé de votre part.");

        $root->loadMissing('sender:id,name,email');
        $copies = MessageThreads::copies($root);
        $copyIds = $copies->pluck('id')->all();
        $replies = MessageThreads::childReplies(array_values(array_unique([...$copyIds, $root->id])));
        $legacy = MessageThreads::legacyReplies($copyIds);
        $directorId = (int) $root->sender_id;

        $recipients = $copies
            ->filter(fn (Message $copy) => $copy->receiver !== null)
            ->map(function (Message $copy) use ($replies, $legacy, $directorId, $root) {
                $recipientId = (int) $copy->receiver_id;
                $pair = collect([$directorId, $recipientId])->sort()->values()->all();

                $tracked = $replies
                    ->filter(fn (Message $reply) => collect([(int) $reply->sender_id, (int) $reply->receiver_id])->sort()->values()->all() === $pair)
                    ->map(fn (Message $reply) => [
                        'id' => 'm'.$reply->id,
                        'content' => $reply->contenu,
                        'created_at' => optional($reply->sent_at ?? $reply->created_at)?->toIso8601String(),
                        'from_me' => (int) $reply->sender_id === $directorId,
                        'sender' => $reply->sender ? ['id' => $reply->sender->id, 'name' => $reply->sender->name] : null,
                        'attachment_url' => Attachments::signedUrl('message', $reply->id, $reply->fichier, $directorId),
                        'attachment_name' => $reply->fichier ? basename($reply->fichier) : null,
                    ]);

                $old = collect($legacy->get($copy->id, []))->map(fn ($reply) => [
                    'id' => 'r'.$reply->id,
                    'content' => $reply->contenu,
                    'created_at' => $reply->created_at ? Carbon::parse($reply->created_at)->toIso8601String() : null,
                    'from_me' => (int) $reply->user_id === $directorId,
                    'sender' => ['id' => (int) $reply->user_id, 'name' => $reply->user_name],
                    'attachment_url' => Attachments::signedUrl('legacy', (int) $reply->id, $reply->fichier, $directorId),
                    'attachment_name' => $reply->fichier ? basename($reply->fichier) : null,
                ]);

                $thread = $tracked->concat($old)->sortBy('created_at')->values();
                $theirReplies = $thread->where('from_me', false);
                $last = $theirReplies->last();

                return [
                    'recipient' => [
                        'id' => $recipientId,
                        'name' => $copy->receiver->name,
                        'email' => $copy->receiver->email,
                        'role' => optional($copy->receiver->role)->nom_role,
                    ],
                    'message_id' => $copy->id,
                    // Relance : faut-il relancer ce destinataire ? depuis quand l'a-t-on fait ?
                    'follow_up' => \App\Support\MessageFollowUp::kind($copy, $theirReplies->count() > 0),
                    'pinged_at' => optional($copy->last_pinged_at)?->toIso8601String(),
                    'can_ping_in' => \App\Support\MessageFollowUp::cooldownLeft($copy),
                    'is_read' => (bool) $copy->lu,
                    'acknowledged_at' => optional($copy->acknowledged_at)?->toIso8601String(),
                    'read_at' => optional($copy->lu_le ?? $copy->read_at)?->toIso8601String(),
                    'reply_count' => $theirReplies->count(),
                    'last_reply_at' => $last['created_at'] ?? null,
                    'last_reply_excerpt' => $last ? Str::limit((string) $last['content'], 110) : null,
                    'thread' => $thread->all(),
                ];
            })
            ->values();

        return response()->json([
            'id' => $root->id,
            'subject' => $root->sujet,
            'content' => $root->contenu,
            'sent_at' => optional($root->sent_at ?? $root->created_at)?->toIso8601String(),
            'is_important' => (bool) ($root->important || $root->is_important),
            'requires_receipt' => (bool) $root->requires_receipt,
            'attachment_url' => Attachments::signedUrl('message', $root->id, $root->fichier, (int) $request->user()->id),
            'attachment_name' => $root->fichier ? basename($root->fichier) : null,
            'sender' => $root->sender ? ['id' => $root->sender->id, 'name' => $root->sender->name, 'email' => $root->sender->email] : null,
            'stats' => [
                'recipients' => $recipients->count(),
                'read' => $recipients->where('is_read', true)->count(),
                'replied' => $recipients->where('reply_count', '>', 0)->count(),
                'acknowledged' => $recipients->whereNotNull('acknowledged_at')->count(),
            ],
            'recipients' => $recipients,
        ]);
    }

    /**
     * Répondre à tous les destinataires du groupe.
     */
    public function replyAll(Request $request, Message $message): JsonResponse
    {
        $user = $request->user();
        $root = MessageThreads::root($message);
        abort_unless(MessageThreads::isGroupOwnedBy($root, (int) $user->id), 403);

        $validated = $request->validate([
            'contenu' => ['required', 'string'],
            'fichier' => ['nullable', 'file', 'max:10240'],
        ]);
        $file = $request->hasFile('fichier') ? Attachments::store($request->file('fichier'), 'messages') : null;

        $receiverIds = MessageThreads::copies($root)->pluck('receiver_id')->filter()->map(fn ($id) => (int) $id)->unique()->values()->all();

        foreach ($receiverIds as $receiverId) {
            $this->createReply($root, (int) $user->id, $receiverId, $validated['contenu'], $file, $receiverIds);
        }

        return response()->json([
            'message' => 'Réponse envoyée à tous les destinataires.',
            'count' => count($receiverIds),
        ], 201);
    }

    /**
     * Répondre à un seul destinataire du groupe.
     */
    public function replyRecipient(Request $request, Message $message, User $recipient): JsonResponse
    {
        $user = $request->user();
        $root = MessageThreads::root($message);
        abort_unless(MessageThreads::isGroupOwnedBy($root, (int) $user->id), 403);
        abort_unless(
            MessageThreads::copies($root)->contains(fn (Message $copy) => (int) $copy->receiver_id === (int) $recipient->id),
            404
        );

        $validated = $request->validate([
            'contenu' => ['required', 'string'],
            'fichier' => ['nullable', 'file', 'max:10240'],
        ]);
        $file = $request->hasFile('fichier') ? Attachments::store($request->file('fichier'), 'messages') : null;

        $this->createReply($root, (int) $user->id, (int) $recipient->id, $validated['contenu'], $file, [(int) $recipient->id]);

        return response()->json(['message' => 'Réponse envoyée au destinataire.'], 201);
    }

    /**
     * Mêmes statistiques que [stats] pour plusieurs groupes (par message_group_uuid),
     * en 3 requêtes : copies, réponses enfants, réponses « web » (table reponses).
     *
     * @return array<string, array> uuid => stats
     */
    private function batchStats(array $uuids, int $directorId): array
    {
        if (empty($uuids)) {
            return [];
        }

        $copiesByUuid = Message::query()
            ->whereIn('message_group_uuid', $uuids)
            ->whereNull('parent_id')
            ->orderBy('id')
            ->get(['id', 'message_group_uuid', 'receiver_id', 'lu', 'acknowledged_at', 'requires_receipt'])
            ->groupBy('message_group_uuid');
        $allCopyIds = $copiesByUuid->flatten(1)->pluck('id')->all();

        $replySenders = Message::query()
            ->whereIn('parent_id', $allCopyIds)
            ->get(['parent_id', 'sender_id'])
            ->groupBy('parent_id');
        $legacy = Schema::hasTable('reponses')
            ? DB::table('reponses')->whereIn('message_id', $allCopyIds)->get(['message_id', 'user_id'])->groupBy('message_id')
            : collect();

        $out = [];
        foreach ($copiesByUuid as $uuid => $copies) {
            $ids = $copies->pluck('id');
            $repliers = $ids->flatMap(fn ($id) => ($replySenders[$id] ?? collect())->pluck('sender_id'))
                ->concat($ids->flatMap(fn ($id) => ($legacy[$id] ?? collect())->pluck('user_id')))
                ->map(fn ($id) => (int) $id)
                ->reject(fn ($id) => $id === $directorId);
            $receiverIds = $copies->pluck('receiver_id')->map(fn ($id) => (int) $id);

            $out[$uuid] = [
                'recipients' => $copies->count(),
                'read' => $copies->where('lu', true)->count(),
                'acknowledged' => $copies->whereNotNull('acknowledged_at')->count(),
                'requires_receipt' => (bool) $copies->first()->requires_receipt,
                'replied' => $repliers->unique()->intersect($receiverIds)->count(),
            ];
        }

        return $out;
    }

    /**
     * Statistiques rapides pour la liste (lus / ont répondu).
     */
    private function stats(Message $root, int $directorId): array
    {
        $copies = MessageThreads::copies($root);
        $copyIds = $copies->pluck('id')->all();

        $repliedIds = MessageThreads::childReplies(array_values(array_unique([...$copyIds, $root->id])))
            ->where('sender_id', '!=', $directorId)
            ->pluck('sender_id')
            ->map(fn ($id) => (int) $id);

        $legacyRepliers = MessageThreads::legacyReplies($copyIds)
            ->flatten(1)
            ->pluck('user_id')
            ->map(fn ($id) => (int) $id)
            ->reject(fn ($id) => $id === $directorId);

        $receiverIds = $copies->pluck('receiver_id')->map(fn ($id) => (int) $id);

        return [
            'recipients' => $copies->count(),
            'read' => $copies->where('lu', true)->count(),
            'acknowledged' => $copies->whereNotNull('acknowledged_at')->count(),
            'requires_receipt' => (bool) $root->requires_receipt,
            'replied' => $repliedIds->concat($legacyRepliers)->unique()->intersect($receiverIds)->count(),
        ];
    }

    private function createReply(Message $root, int $senderId, int $receiverId, string $content, ?string $file, array $receiverIds): Message
    {
        $payload = [
            'sender_id' => $senderId,
            'receiver_id' => $receiverId,
            'sujet' => str_starts_with(mb_strtolower(trim((string) $root->sujet)), 're:') ? $root->sujet : 'RE: '.$root->sujet,
            'contenu' => $content,
            'fichier' => $file,
            'lu_le' => null,
            'lu' => false,
            'spam' => false,
            'important' => false,
            'sent_at' => now(),
            'requires_receipt' => false,
            'receipt_requested_at' => null,
            'scheduled_at' => null,
            'is_delivered' => true,
            'archived' => false,
            'type_message' => 'reply',
            'envoye' => true,
            'deadline_reponse' => null,
            'can_be_redirected' => false,
            'message_group_uuid' => $root->message_group_uuid,
            'parent_id' => $root->id,
            'forwarded_from_message_id' => null,
        ];

        if (Schema::hasColumn('messages', 'receiver_ids')) {
            $payload['receiver_ids'] = array_values($receiverIds);
        }

        return Message::create($payload);
    }
}
