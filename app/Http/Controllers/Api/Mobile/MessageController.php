<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Http\Resources\MessageResource;
use App\Http\Resources\ReplyResource;
use App\Models\Message;
use App\Models\User;
use App\Support\MessageAccess;
use App\Support\MessageThreads;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class MessageController extends Controller
{
    /**
     * Send a new message from the mobile app.
     *
     * Mirrors the web "store" flow: multi-destinataires (receiver_ids + groupe
     * uuid), signature automatique, accusé, planification et suivi de lecture.
     */
    public function send(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'receiver_ids' => ['required', 'array', 'min:1'],
            'receiver_ids.*' => ['required', 'integer', 'distinct', 'exists:users,id', Rule::notIn([$user->id])],
            'sujet' => ['required', 'string', 'max:255'],
            'contenu' => ['required', 'string'],
            'fichier' => ['nullable', 'file', 'max:10240'],
            'existing_attachment_path' => ['nullable', 'string', 'max:255'],
            'important' => ['required', 'boolean'],
            'requires_receipt' => ['required', 'boolean'],
            'is_tracked' => ['required', 'boolean'],
            'scheduled_at' => ['nullable', 'date'],
            // Date limite de réponse (même champ que le web) — dans le futur
            'deadline_reponse' => ['nullable', 'date', 'after:now'],
            'type_message' => ['nullable', 'string', 'max:100'],
            'can_be_redirected' => ['required', 'boolean'],
            'forwarded_from_message_id' => ['nullable', 'integer'],
            // Envoi d'un brouillon : il est supprimé une fois le message parti
            'draft_id' => ['nullable', 'integer'],
            'draft_without_file' => ['nullable', 'boolean'], // pièce jointe du brouillon retirée
            'original_receiver_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $forwardedFromId = $validated['forwarded_from_message_id'] ?? null;
        if ($forwardedFromId !== null) {
            $source = Message::query()->findOrFail($forwardedFromId);
            abort_unless(
                MessageAccess::canAccess($user->id, $source),
                403,
                "Vous n'avez pas accès au message d'origine."
            );
            // Même règle que le web : l'expéditeur, ou si le transfert est autorisé.
            abort_unless(
                (int) $source->sender_id === (int) $user->id || $source->can_be_redirected,
                403,
                'Ce message ne peut pas être transféré.'
            );
        }

        $storedFile = $this->resolveMobileAttachment($request, $forwardedFromId);

        $draft = filled($validated['draft_id'] ?? null)
            ? \App\Models\MessageDraft::query()->where('sender_id', $user->id)->findOrFail((int) $validated['draft_id'])
            : null;
        $draftFileToDelete = null;
        if ($draft && $storedFile === null && filled($draft->fichier) && ! $request->boolean('draft_without_file')) {
            if (str_starts_with((string) $draft->fichier, 'message-drafts/')) {
                // Fichier propre au brouillon : copié vers les messages, l'original sera supprimé
                $copy = 'messages/'.Str::random(40).'.'.pathinfo($draft->fichier, PATHINFO_EXTENSION);
                if (\App\Support\Attachments::copy($draft->fichier, $copy)) {
                    $storedFile = $copy;
                    $draftFileToDelete = $draft->fichier;
                }
            } elseif ($forwardedFromId !== null) {
                $storedFile = $draft->fichier; // pièce d'origine d'un transfert, conservée
            }
        }

        $scheduledAt = filled($validated['scheduled_at'] ?? null)
            ? Carbon::parse($validated['scheduled_at'])
            : null;
        $isScheduled = $scheduledAt !== null && $scheduledAt->isFuture();
        $sentAt = $isScheduled ? null : now();
        $receiptRequestedAt = $validated['requires_receipt'] && ! $isScheduled ? now() : null;
        $messageGroupUuid = count($validated['receiver_ids']) > 1 ? (string) Str::uuid() : null;
        $content = $this->appendSignatureToMessage($user, (string) $validated['contenu']);
        $created = [];

        foreach ($validated['receiver_ids'] as $receiverId) {
            $payload = [
                'sender_id' => $user->id,
                'receiver_id' => $receiverId,
                'original_receiver_id' => $validated['original_receiver_id'] ?? null,
                'sujet' => $validated['sujet'],
                'contenu' => $content,
                'fichier' => $storedFile,
                'lu_le' => null,
                'lu' => false,
                'spam' => false,
                'important' => $validated['important'],
                'is_important' => $validated['important'],
                'sent_at' => $sentAt,
                'requires_receipt' => $validated['requires_receipt'],
                'is_tracked' => $validated['is_tracked'],
                'receipt_requested_at' => $receiptRequestedAt,
                'scheduled_at' => $scheduledAt,
                'is_delivered' => ! $isScheduled,
                'read_at' => null,
                'archived' => false,
                'type_message' => $validated['type_message'] ?? 'normal',
                'envoye' => ! $isScheduled,
                // Indispensable : le job ProcessScheduledMessages ne livre que les messages
                // en statut « scheduled » (la colonne vaut « sent » par défaut).
                'status' => $isScheduled ? 'scheduled' : 'sent',
                'deadline_reponse' => $validated['deadline_reponse'] ?? null,
                'can_be_redirected' => $validated['can_be_redirected'],
                'message_group_uuid' => $messageGroupUuid,
                'forwarded_from_message_id' => $forwardedFromId,
            ];

            if (Schema::hasColumn('messages', 'receiver_ids')) {
                $payload['receiver_ids'] = array_values($validated['receiver_ids']);
            }

            $created[] = Message::create($payload);
        }

        if ($draft) {
            // Le fichier propre au brouillon n'a plus d'utilité (copié ou retiré)
            if (str_starts_with((string) $draft->fichier, 'message-drafts/')) {
                \App\Support\Attachments::delete($draft->fichier);
            }
            $draft->delete();
        }

        return response()->json([
            'message' => $isScheduled
                ? 'Message programmé avec succès.'
                : 'Message envoyé avec succès.',
            'scheduled' => $isScheduled,
            'message_ids' => collect($created)->pluck('id')->all(),
        ], 201);
    }

    /**
     * Append the user's formatted signature to the content (no duplicates).
     */
    /**
     * Resolve the stored file path for a message:
     * uploaded file, or the forwarded message's existing file (trusted path).
     */
    private function resolveMobileAttachment(Request $request, ?int $forwardedFromId): ?string
    {
        if ($request->hasFile('fichier')) {
            return \App\Support\Attachments::store($request->file('fichier'), 'messages');
        }

        $existing = trim((string) $request->string('existing_attachment_path'));

        if ($existing !== '' && $forwardedFromId !== null) {
            $source = Message::query()->find($forwardedFromId);

            if ($source && $source->fichier === $existing) {
                return $existing;
            }
        }

        return null;
    }

    private function appendSignatureToMessage(User $user, string $content): string
    {
        $signature = trim($this->normalizeMessageText((string) $user->formatted_signature));

        if ($signature === '') {
            return $content;
        }

        $trimmedContent = rtrim($this->normalizeMessageText($content));

        if ($trimmedContent === '') {
            return $signature;
        }

        if (str_ends_with($trimmedContent, $signature)) {
            return $content;
        }

        return $trimmedContent."\n\n".$signature;
    }

    private function normalizeMessageText(string $value): string
    {
        return str_replace(["\r\n", "\r"], "\n", $value);
    }

    /**
     * List the authenticated user's received messages.
     */
    public function inbox(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();
        $search = trim((string) $request->string('search'));
        $unread = $request->boolean('unread');
        $important = $request->boolean('important');
        $awaiting = $request->boolean('awaiting'); // réponse attendue (date limite) non faite
        $receipt = $request->boolean('receipt');   // accusé de réception à confirmer

        $messages = MessageAccess::inboxQuery($user->id)
            ->with([
                'sender' => fn ($query) => $query
                    ->with('role:id,nom_role')
                    ->select('id', 'name', 'email', 'role_id'),
            ])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('sujet', 'like', "%{$search}%")
                        ->orWhere('contenu', 'like', "%{$search}%")
                        ->orWhereHas('sender', function ($senderQuery) use ($search) {
                            $senderQuery
                                ->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            })
            ->when($unread, fn ($query) => $query->where('lu', false))
            ->when($awaiting, fn ($query) => $query
                ->whereNotNull('deadline_reponse')
                ->whereRaw('NOT '.self::REPLIED_BY_ME_SQL, [$user->id, $user->id]))
            ->when($receipt, fn ($query) => $query
                ->where('requires_receipt', true)
                ->whereNull('acknowledged_at'))
            ->when($important, function ($query) {
                $query->where(function ($importanceQuery) {
                    $importanceQuery
                        ->where('important', true)
                        ->orWhere('is_important', true);
                });
            })
            ->select('messages.*')
            ->selectRaw(self::REPLIED_BY_ME_SQL.' as replied_by_me', [$user->id, $user->id])
            ->latest('sent_at')
            ->latest()
            ->paginate(15)
            ->withQueryString();

        // Compteurs des filtres (pastilles de l'écran Réception)
        $base = fn () => MessageAccess::inboxQuery($user->id);
        $counts = [
            'all' => $base()->count(),
            'unread' => $base()->where('lu', false)->count(),
            'important' => $base()->where(fn ($q) => $q->where('important', true)->orWhere('is_important', true))->count(),
            'awaiting' => $base()->whereNotNull('deadline_reponse')->whereRaw('NOT '.self::REPLIED_BY_ME_SQL, [$user->id, $user->id])->count(),
            'receipt' => $base()->where('requires_receipt', true)->whereNull('acknowledged_at')->count(),
        ];

        return MessageResource::collection($messages)->additional(['counts' => $counts]);
    }

    /**
     * Vrai si l'utilisateur a répondu : réponse rattachée à ce message, ou au fil
     * du message groupé (même message_group_uuid), ou réponse « web » (table reponses).
     */
    // Deux EXISTS séparés (plutôt qu'un OR) : chacun utilise son index
    // (sender_id, parent_id) / (sender_id, message_group_uuid). Lier l'id utilisateur 2 fois.
    private const REPLIED_BY_ME_SQL = '(EXISTS (SELECT 1 FROM messages r WHERE r.sender_id = ? AND r.parent_id = messages.id)
            OR (messages.message_group_uuid IS NOT NULL AND EXISTS (SELECT 1 FROM messages r2 WHERE r2.sender_id = ?
                AND r2.parent_id IS NOT NULL AND r2.message_group_uuid = messages.message_group_uuid)))';

    /**
     * Recherche dans les messages de l'utilisateur : objet, texte, et texte extrait
     * des documents scannés (OCR). Uniquement les messages dont il est expéditeur ou
     * destinataire (et qu'il n'a pas supprimés).
     *
     * GET /api/mobile/messages/search?q=albumine
     */
    public function search(Request $request): JsonResponse
    {
        $validated = $request->validate(['q' => ['required', 'string', 'min:2', 'max:100']]);
        $q = trim($validated['q']);
        $uid = (int) $request->user()->id;
        $like = '%'.addcslashes($q, '%_\\').'%';

        $rows = Message::query()
            ->with(['sender:id,name,email', 'receiver:id,name,email'])
            ->where('archived', false)
            ->where('spam', false)
            ->where(function ($w) use ($uid) {
                $w->where(fn ($r) => $r->where('receiver_id', $uid)->where('is_delivered', true)->whereNull('receiver_deleted_at'))
                    ->orWhere(fn ($s) => $s->where('sender_id', $uid)->whereNull('sender_deleted_at'));
            })
            ->where(function ($w) use ($q, $like) {
                $w->where('sujet', 'like', $like)
                    ->orWhere('contenu', 'like', $like)
                    ->orWhere(fn ($d) => \App\Support\MessageSearch::whereDocumentMatches($d, $q));
            })
            ->orderByRaw('COALESCE(sent_at, created_at) DESC')
            ->limit(200)
            ->get();

        // Un envoi groupé = une seule ligne pour son expéditeur
        $rows = $rows->unique(fn (Message $m) => (int) $m->sender_id === $uid && $m->type_message !== 'reply' && filled($m->message_group_uuid)
            ? 'g:'.$m->message_group_uuid
            : 'm:'.$m->id)->take(50)->values();

        $docs = \App\Models\AttachmentText::query()
            ->whereIn('path', $rows->pluck('fichier')->filter()->unique())
            ->where('ocr_status', 'completed')
            ->get(['path', 'ocr_text', 'method'])
            ->keyBy('path');
        $texts = $docs->map(fn ($d) => $d->ocr_text);

        $data = $rows->map(function (Message $m) use ($q, $uid, $texts, $docs) {
            $ocr = $m->fichier ? ($texts[$m->fichier] ?? null) : null;
            $inText = \App\Support\MessageSearch::contains($m->sujet, $q) || \App\Support\MessageSearch::contains($m->contenu, $q);
            $ocrSnippet = \App\Support\MessageSearch::snippet($ocr, $q);
            // Trouvé par l'index du document mais mot non localisable (ex. forme proche) : début du document
            if ($ocrSnippet === null && $ocr !== null && ! $inText) {
                $ocrSnippet = \App\Support\MessageSearch::head($ocr);
            }
            $matchedInOcr = $ocrSnippet !== null;
            $isSent = (int) $m->sender_id === $uid;

            return [
                'id' => $m->id,
                'open_id' => $m->parent_id ?? $m->id, // une réponse s'ouvre sur son fil
                'subject' => $m->sujet,
                'is_sent' => $isSent,
                'is_reply' => $m->parent_id !== null,
                'is_read' => (bool) $m->lu,
                'is_important' => (bool) ($m->important || $m->is_important),
                'sent_at' => optional($m->sent_at ?? $m->created_at)?->toIso8601String(),
                'sender' => $m->sender ? ['id' => $m->sender->id, 'name' => $m->sender->name, 'email' => $m->sender->email] : null,
                'receiver' => $m->receiver ? ['id' => $m->receiver->id, 'name' => $m->receiver->name, 'email' => $m->receiver->email] : null,
                'has_attachment' => filled($m->fichier),
                'attachment_name' => $m->fichier ? basename($m->fichier) : null,
                'matched_in_ocr' => $matchedInOcr,
                // scan = texte reconnu par OCR ; document = texte lu dans un PDF / Word / Excel…
                'document_kind' => $matchedInOcr ? (($docs[$m->fichier]->method ?? 'ocr') === 'ocr' ? 'scan' : 'document') : null,
                'snippet' => $matchedInOcr
                    ? $ocrSnippet
                    : (\App\Support\MessageSearch::snippet($m->contenu, $q) ?? \App\Support\MessageSearch::head($m->contenu)),
                'terms' => \App\Support\MessageSearch::terms($q),
            ];
        });

        return response()->json(['data' => $data, 'query' => $q]);
    }

    /**
     * List the authenticated user's sent messages.
     */
    public function sent(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();
        $search = trim((string) $request->string('search'));
        // Filtres vus côté expéditeur
        $filter = (string) $request->string('filter'); // unread | awaiting | receipt | important | scheduled

        $base = fn () => Message::query()
            ->where('sender_id', $user->id)
            ->where('archived', false)
            ->whereNull('sender_archived_at')->whereNull('sender_deleted_at')
            ->whereNull('parent_id'); // les réponses de fil n'encombrent pas les envoyés filtrés

        $apply = function ($query, string $f) {
            return match ($f) {
                // Pas encore ouvert par le destinataire (message déjà parti)
                'unread' => $query->where('is_delivered', true)->where('lu', false),
                // Date limite fixée, le destinataire n'a pas répondu
                'awaiting' => $query->whereNotNull('deadline_reponse')->whereRaw('NOT '.self::RECIPIENT_REPLIED_SQL),
                // Accusé demandé, pas encore confirmé
                'receipt' => $query->where('is_delivered', true)->where('requires_receipt', true)->whereNull('acknowledged_at'),
                'important' => $query->where(fn ($q) => $q->where('important', true)->orWhere('is_important', true)),
                'scheduled' => $query->where('status', 'scheduled'),
                default => $query,
            };
        };

        $messages = Message::query()
            ->with([
                'receiver' => fn ($query) => $query
                    ->with('role:id,nom_role')
                    ->select('id', 'name', 'email', 'role_id'),
                'originalReceiver:id,name,email',
                'escalatedTo:id,name,email',
            ])
            ->where('sender_id', $user->id)
            ->where('archived', false)
            ->whereNull('sender_archived_at')->whereNull('sender_deleted_at')
            ->when($filter !== '', fn ($q) => $apply($q->whereNull('parent_id'), $filter))
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('sujet', 'like', "%{$search}%")
                        ->orWhere('contenu', 'like', "%{$search}%")
                        ->orWhereHas('receiver', function ($receiverQuery) use ($search) {
                            $receiverQuery
                                ->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            })
            ->select('messages.*')
            ->selectRaw(\App\Support\MessageFollowUp::RECIPIENT_REPLIED_SQL.' as recipient_replied')
            ->latest('sent_at')
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $counts = ['all' => Message::query()
            ->where('sender_id', $user->id)
            ->where('archived', false)
            ->whereNull('sender_archived_at')->whereNull('sender_deleted_at')
            ->count()];
        foreach (['unread', 'awaiting', 'receipt', 'important', 'scheduled'] as $f) {
            $counts[$f] = $apply($base(), $f)->count();
        }

        return MessageResource::collection($messages)->additional(['counts' => $counts]);
    }

    /**
     * Vrai si le destinataire a répondu (réponse sur ce message ou sur le fil du groupe),
     * ou via la table « reponses » du web.
     */
    private const RECIPIENT_REPLIED_SQL = '(EXISTS (SELECT 1 FROM messages r WHERE r.sender_id = messages.receiver_id AND r.parent_id IS NOT NULL
            AND (r.parent_id = messages.id OR (messages.message_group_uuid IS NOT NULL AND r.message_group_uuid = messages.message_group_uuid)))
        OR EXISTS (SELECT 1 FROM reponses rp WHERE rp.message_id = messages.id AND rp.user_id = messages.receiver_id))';

    /**
     * Confirm reception of a message (accusé de réception).
     *
     * Même règle que le web (MessageActionController::acknowledge) : seul le
     * destinataire confirme, une seule fois. Autorisé pour les messages
     * importants (règle web) ou pour lesquels un accusé a été demandé.
     */
    public function acknowledge(Request $request, Message $message): JsonResponse
    {
        $userId = (int) $request->user()->id;

        abort_unless((int) $message->receiver_id === $userId, 403, 'Seul le destinataire peut confirmer la réception.');
        abort_unless(
            $message->requires_receipt || $message->important || $message->is_important,
            422,
            "Ce message ne demande pas d'accusé de réception."
        );

        $already = $message->acknowledged_at !== null;

        if (! $already) {
            $message->forceFill(['acknowledged_at' => now()])->save();
        }

        return response()->json([
            'message' => $already ? 'Réception déjà confirmée.' : 'Réception confirmée.',
            'acknowledged_at' => $message->acknowledged_at?->toIso8601String(),
        ]);
    }

    private function canAcknowledge(Message $message, int $userId): bool
    {
        return (int) $message->receiver_id === $userId
            && $message->acknowledged_at === null
            && ($message->requires_receipt || $message->important || $message->is_important);
    }

    /**
     * Show a single message the user is allowed to read.
     */
    public function show(Request $request, Message $message): JsonResponse
    {
        $user = $request->user();

        if (! MessageAccess::canAccess($user->id, $message)) {
            abort(403, "Vous n'avez pas accès à ce message.");
        }

        if ((int) $message->receiver_id === (int) $user->id && ! $message->is_delivered) {
            throw new ModelNotFoundException;
        }

        if ($message->receiver_id === $user->id && ! $message->lu) {
            $message->update([
                'lu' => true,
                'lu_le' => now(),
            ]);
        }

        if ((int) $message->receiver_id === (int) $user->id) {
            $this->markAsRead($message);
        }

        $message->load([
            'sender:id,name,email',
            'receiver:id,name,email',
        ]);

        // Réponses du fil : celles rattachées à la racine du groupe (règle du web)
        // et à cette copie, en ne gardant QUE les échanges de l'utilisateur.
        // Sans ce filtre, un destinataire verrait les réponses des autres destinataires.
        $root = MessageThreads::root($message);
        $userId = (int) $user->id;
        $replies = MessageThreads::childReplies(array_values(array_unique([$root->id, $message->id])))
            ->filter(fn (Message $reply) => (int) $reply->sender_id === $userId || (int) $reply->receiver_id === $userId)
            ->reject(fn (Message $reply) => (int) $reply->id === (int) $message->id)
            ->values();
        $message->setRelation('replies', $replies);

        $payload = (new MessageResource($message))->toArray($request);
        $payload['group_id'] = MessageThreads::isGroupOwnedBy($root, $userId) ? $root->id : null;
        $payload['can_acknowledge'] = $this->canAcknowledge($message, $userId);
        // Suivi : l'expéditeur peut-il relancer ? Le destinataire a-t-il déjà signalé ?
        $payload['follow_up'] = (int) $message->sender_id === $userId ? \App\Support\MessageFollowUp::kind($message) : null;
        $payload['can_ping_in'] = (int) $message->sender_id === $userId ? \App\Support\MessageFollowUp::cooldownLeft($message) : 0;
        $payload['reported_by_me'] = \App\Models\ReportedMessage::query()
            ->where('message_id', $message->id)->where('reporter_id', $userId)->exists();
        $payload['replied_by_me'] = (bool) DB::selectOne(
            'SELECT '.self::REPLIED_BY_ME_SQL.' AS v FROM messages WHERE messages.id = ?',
            [$userId, $userId, $message->id]
        )?->v;
        $payload['can_forward'] = (int) $message->sender_id === $userId || (bool) $message->can_be_redirected;
        // Rangement personnel (menu « Archiver / Désarchiver »)
        $side = $message->sideFor($userId);
        $payload['is_archived_for_me'] = $side !== null && $message->{$side.'_archived_at'} !== null;

        return response()->json($payload);
    }

    /**
     * Reply to a threaded message from the mobile app.
     *
     * Crée une réponse rattachée au fil (parent_id de la racine), pour le
     * correspondant du message : le destinataire si l'utilisateur est
     * l'expéditeur, l'expéditeur s'il est destinataire.
     */
    public function reply(Request $request, Message $message): JsonResponse
    {
        $user = $request->user();

        if (! MessageAccess::canAccess($user->id, $message)) {
            abort(403, "Vous n'avez pas accès à ce message.");
        }

        if ((int) $message->receiver_id === (int) $user->id && ! $message->is_delivered) {
            throw new ModelNotFoundException;
        }

        // Même racine que le web (premier message du groupe), pour que le
        // directeur voie aussi les réponses faites depuis le mobile.
        $rootMessage = MessageThreads::root($message);

        if ((int) $message->sender_id !== (int) $user->id) {
            $receiverId = (int) $message->sender_id;
        } else {
            $receiverId = (int) $message->receiver_id;
        }

        abort_unless($receiverId > 0, 422, "Aucun correspondant cible pour cette réponse.");

        $validated = $request->validate([
            'contenu' => ['required', 'string'],
            'fichier' => ['nullable', 'file', 'max:10240'],
        ]);

        $storedFile = $request->hasFile('fichier')
            ? \App\Support\Attachments::store($request->file('fichier'), 'messages')
            : null;

        $payload = [
            'sender_id' => $user->id,
            'receiver_id' => $receiverId,
            'sujet' => $this->replySubject($rootMessage->sujet),
            'contenu' => $validated['contenu'],
            'fichier' => $storedFile,
            'lu_le' => null,
            'lu' => false,
            'spam' => false,
            'important' => false,
            'is_important' => false,
            'sent_at' => now(),
            'requires_receipt' => false,
            'receipt_requested_at' => null,
            'scheduled_at' => null,
            'is_delivered' => true,
            'read_at' => null,
            'archived' => false,
            'type_message' => 'reply',
            'envoye' => true,
            'deadline_reponse' => null,
            'can_be_redirected' => false,
            'message_group_uuid' => $rootMessage->message_group_uuid,
            'parent_id' => $rootMessage->id,
            'forwarded_from_message_id' => null,
            'receiver_ids' => [$receiverId],
        ];

        $reply = Message::create($payload);

        return response()->json([
            'message' => 'Réponse envoyée avec succès.',
            'reply' => new ReplyResource($reply),
        ], 201);
    }

    /**
     * Resolve the root message of a thread.
     */
    private function resolveThreadRoot(Message $message): Message
    {
        while ($message->parent_id !== null) {
            $message = $message->parent()->firstOrFail();
        }

        return $message;
    }

    /**
     * Prefix a subject with "RE:" unless already prefixed.
     */
    private function replySubject(?string $subject): string
    {
        $subject = trim((string) $subject);

        if ($subject === '') {
            return 'RE: Message sans sujet';
        }

        if (str_starts_with(mb_strtolower($subject), 're:')) {
            return $subject;
        }

        return "RE: {$subject}";
    }

    /**
     * Track the read timestamp for tracked messages (mirrors the web controller).
     */
    private function markAsRead(Message $message): void
    {
        if (! $message->is_tracked || $message->read_at !== null) {
            return;
        }

        $message->forceFill([
            'read_at' => now(),
        ])->save();
    }
}
