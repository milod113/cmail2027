<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Http\Resources\MessageResource;
use App\Models\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/**
 * Rangement de la messagerie mobile : archiver, désarchiver, supprimer (pour soi),
 * restaurer, marquer lu / non lu — sur un ou plusieurs messages.
 *
 * Tout est PERSONNEL : seul le côté de l'utilisateur (expéditeur ou destinataire)
 * est modifié ; l'autre participant garde le message intact.
 */
class MessageActionController extends Controller
{
    public function bulk(Request $request): JsonResponse
    {
        $userId = (int) $request->user()->id;

        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:200'],
            'ids.*' => ['integer', 'distinct'],
            'action' => ['required', Rule::in(['archive', 'unarchive', 'delete', 'restore', 'read', 'unread'])],
        ]);

        $messages = Message::query()->whereIn('id', $validated['ids'])->get();
        $done = 0;
        $now = now();

        foreach ($messages as $message) {
            $side = $message->sideFor($userId);
            if ($side === null) {
                continue; // message d'un autre utilisateur : ignoré
            }

            $changes = match ($validated['action']) {
                'archive' => [$side.'_archived_at' => $now],
                'unarchive' => [$side.'_archived_at' => null],
                // Supprimer pour soi : le message sort aussi des archives.
                'delete' => [$side.'_deleted_at' => $now],
                // Restaurer (annulation d'une suppression) : retour à l'état précédent.
                'restore' => [$side.'_deleted_at' => null],
                // Lu / non lu : uniquement pour le destinataire.
                'read' => $side === 'receiver' ? ['lu' => true, 'lu_le' => $message->lu_le ?? $now] : [],
                'unread' => $side === 'receiver' ? ['lu' => false, 'lu_le' => null] : [],
            };

            if ($changes !== []) {
                $message->forceFill($changes)->save();
                $done++;
            }
        }

        $labels = [
            'archive' => 'archivé',
            'unarchive' => 'désarchivé',
            'delete' => 'supprimé',
            'restore' => 'restauré',
            'read' => 'marqué comme lu',
            'unread' => 'marqué comme non lu',
        ];
        $label = $labels[$validated['action']];

        return response()->json([
            'message' => $done > 1 ? "{$done} messages {$label}s." : ($done === 1 ? "Message {$label}." : 'Aucun message modifié.'),
            'count' => $done,
        ]);
    }

    /**
     * Mes archives (messages archivés de mon côté, envoyés ou reçus).
     */
    public function archived(Request $request): AnonymousResourceCollection
    {
        $userId = (int) $request->user()->id;
        $search = trim((string) $request->string('search'));

        $messages = Message::query()
            ->with(['sender:id,name,email', 'receiver:id,name,email'])
            ->archivedFor($userId)
            ->when($search !== '', fn ($q) => $q->where(fn ($s) => $s
                ->where('sujet', 'like', "%{$search}%")
                ->orWhere('contenu', 'like', "%{$search}%")))
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        return MessageResource::collection($messages);
    }
}
