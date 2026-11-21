<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\MessageDraft;
use App\Models\User;
use App\Support\Attachments;
use App\Support\MessageAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Brouillons (table message_drafts, partagée avec le web).
 *
 * Un brouillon peut être incomplet : destinataires, objet et texte sont facultatifs.
 * L'envoi se fait via POST /messages/send avec `draft_id` (le brouillon est alors supprimé).
 */
class DraftController extends Controller
{
    private const DIR = 'message-drafts';

    public function index(Request $request): JsonResponse
    {
        $drafts = MessageDraft::query()
            ->where('sender_id', $request->user()->id)
            ->latest('updated_at')
            ->get();

        $names = User::query()
            ->whereIn('id', $drafts->pluck('receiver_ids')->flatten()->filter()->unique())
            ->pluck('name', 'id');

        return response()->json([
            'data' => $drafts->map(fn (MessageDraft $d) => $this->summary($d, $names))->values(),
        ]);
    }

    public function show(Request $request, MessageDraft $draft): JsonResponse
    {
        $this->authorizeDraft($request, $draft);

        $names = User::query()->whereIn('id', $draft->receiver_ids ?? [])->pluck('name', 'id');

        return response()->json($this->detail($draft, $names));
    }

    public function store(Request $request): JsonResponse
    {
        $v = $this->validated($request);
        $forwarded = $this->resolveForwarded($request, $v['forwarded_from_message_id'] ?? null);

        $draft = MessageDraft::query()->create([
            'sender_id' => $request->user()->id,
            'receiver_ids' => array_values($v['receiver_ids'] ?? []),
            'sujet' => $v['sujet'] ?? '',
            'contenu' => $v['contenu'] ?? '',
            'fichier' => $this->newFilePath($request, $forwarded),
            'important' => (bool) ($v['important'] ?? false),
            'requires_receipt' => (bool) ($v['requires_receipt'] ?? false),
            'scheduled_at' => $v['scheduled_at'] ?? null,
            'type_message' => 'normal',
            'deadline_reponse' => $v['deadline_reponse'] ?? null,
            'can_be_redirected' => (bool) ($v['can_be_redirected'] ?? true),
            'forwarded_from_message_id' => $forwarded?->id,
        ]);

        return response()->json($this->detail($draft, $this->namesFor($draft)), 201);
    }

    public function update(Request $request, MessageDraft $draft): JsonResponse
    {
        $this->authorizeDraft($request, $draft);

        $v = $this->validated($request);
        $forwarded = $this->resolveForwarded($request, $v['forwarded_from_message_id'] ?? $draft->forwarded_from_message_id);

        $file = $draft->fichier;
        if ($request->hasFile('fichier')) {
            $this->deleteOwnedFile($draft->fichier);
            $file = Attachments::store($request->file('fichier'), self::DIR);
        } elseif ($request->boolean('remove_file')) {
            $this->deleteOwnedFile($draft->fichier);
            $file = null;
        } elseif ($file === null) {
            $file = $this->newFilePath($request, $forwarded);
        }

        $draft->update([
            'receiver_ids' => array_values($v['receiver_ids'] ?? []),
            'sujet' => $v['sujet'] ?? '',
            'contenu' => $v['contenu'] ?? '',
            'fichier' => $file,
            'important' => (bool) ($v['important'] ?? false),
            'requires_receipt' => (bool) ($v['requires_receipt'] ?? false),
            'scheduled_at' => $v['scheduled_at'] ?? null,
            'deadline_reponse' => $v['deadline_reponse'] ?? null,
            'can_be_redirected' => (bool) ($v['can_be_redirected'] ?? true),
            'forwarded_from_message_id' => $forwarded?->id,
        ]);

        return response()->json($this->detail($draft->fresh(), $this->namesFor($draft)));
    }

    public function destroy(Request $request, MessageDraft $draft): JsonResponse
    {
        $this->authorizeDraft($request, $draft);

        $this->deleteOwnedFile($draft->fichier);
        $draft->delete();

        return response()->json(['message' => 'Brouillon supprimé.']);
    }

    // ------------------------------------------------------------------ helpers

    private function authorizeDraft(Request $request, MessageDraft $draft): void
    {
        abort_unless((int) $draft->sender_id === (int) $request->user()->id, 403);
    }

    private function validated(Request $request): array
    {
        $userId = (int) $request->user()->id;

        return $request->validate([
            'receiver_ids' => ['nullable', 'array'],
            'receiver_ids.*' => ['integer', 'distinct', 'exists:users,id', Rule::notIn([$userId])],
            'sujet' => ['nullable', 'string', 'max:255'],
            'contenu' => ['nullable', 'string'],
            'fichier' => ['nullable', 'file', 'max:10240'],
            'existing_attachment_path' => ['nullable', 'string', 'max:255'],
            'remove_file' => ['nullable', 'boolean'],
            'important' => ['nullable', 'boolean'],
            'requires_receipt' => ['nullable', 'boolean'],
            'can_be_redirected' => ['nullable', 'boolean'],
            'scheduled_at' => ['nullable', 'date'],
            'deadline_reponse' => ['nullable', 'date'],
            'forwarded_from_message_id' => ['nullable', 'integer'],
        ]);
    }

    /** Message d'origine d'un transfert : accessible et transférable (mêmes règles que l'envoi). */
    private function resolveForwarded(Request $request, mixed $id): ?Message
    {
        if (! $id) {
            return null;
        }

        $source = Message::query()->findOrFail((int) $id);
        $userId = (int) $request->user()->id;
        abort_unless(MessageAccess::canAccess($userId, $source), 403, "Vous n'avez pas accès au message d'origine.");
        abort_unless((int) $source->sender_id === $userId || $source->can_be_redirected, 403, 'Ce message ne peut pas être transféré.');

        return $source;
    }

    /** Chemin de pièce jointe pour un nouveau brouillon : fichier envoyé, ou fichier d'origine d'un transfert. */
    private function newFilePath(Request $request, ?Message $forwarded): ?string
    {
        if ($request->hasFile('fichier')) {
            return Attachments::store($request->file('fichier'), self::DIR);
        }

        $existing = trim((string) $request->input('existing_attachment_path', ''));
        if ($existing !== '' && $forwarded && $forwarded->fichier === $existing) {
            return $existing;
        }

        return null;
    }

    /** Seuls les fichiers créés pour le brouillon sont supprimés (pas la pièce d'un message transféré). */
    private function deleteOwnedFile(?string $path): void
    {
        if ($path && str_starts_with($path, self::DIR.'/')) {
            Attachments::delete($path);
        }
    }

    private function namesFor(MessageDraft $draft)
    {
        return User::query()->whereIn('id', $draft->receiver_ids ?? [])->pluck('name', 'id');
    }

    private function summary(MessageDraft $d, $names): array
    {
        $ids = collect($d->receiver_ids ?? [])->map(fn ($id) => (int) $id);

        return [
            'id' => $d->id,
            'subject' => $d->sujet,
            'excerpt' => Str::limit(trim(preg_replace('/\s+/', ' ', (string) $d->contenu)), 140),
            'recipients' => $ids->take(3)->map(fn ($id) => ['id' => $id, 'name' => $names[$id] ?? 'Utilisateur'])->values(),
            'receiver_count' => $ids->count(),
            'has_attachment' => filled($d->fichier),
            'important' => (bool) $d->important,
            'requires_receipt' => (bool) $d->requires_receipt,
            'scheduled_at' => optional($d->scheduled_at)?->toIso8601String(),
            'deadline_reponse' => optional($d->deadline_reponse)?->toIso8601String(),
            'is_forward' => filled($d->forwarded_from_message_id),
            'updated_at' => optional($d->updated_at)?->toIso8601String(),
        ];
    }

    private function detail(MessageDraft $d, $names): array
    {
        $source = $d->forwarded_from_message_id
            ? Message::query()->with('sender:id,name,email')->find($d->forwarded_from_message_id)
            : null;

        return $this->summary($d, $names) + [
            'content' => (string) $d->contenu,
            'receiver_ids' => collect($d->receiver_ids ?? [])->map(fn ($id) => (int) $id)->values(),
            'can_be_redirected' => (bool) $d->can_be_redirected,
            'attachment_path' => $d->fichier,
            'attachment_url' => Attachments::signedUrl('draft', $d->id, $d->fichier, $d->sender_id),
            'attachment_name' => $d->fichier ? 'Pièce jointe.'.pathinfo($d->fichier, PATHINFO_EXTENSION) : null,
            'forwarded_from' => $source ? [
                'id' => $source->id,
                'subject' => $source->sujet,
                'sent_at' => optional($source->sent_at ?? $source->created_at)?->toIso8601String(),
                'attachment_path' => $source->fichier,
                'attachment_name' => $source->fichier ? basename($source->fichier) : null,
                'sender' => $source->sender ? ['id' => $source->sender->id, 'name' => $source->sender->name, 'email' => $source->sender->email] : null,
            ] : null,
        ];
    }
}
