<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\MessageDraft;
use App\Models\User;
use App\Support\Attachments;
use App\Support\MessageAccess;
use App\Support\MessageThreads;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Distribution sécurisée des pièces jointes (documents médicaux).
 *
 *   GET /attachments/{type}/{id}/{name?}
 *
 * Accès accordé seulement :
 *  - avec un lien SIGNÉ valide (application mobile, valable quelques heures), ou
 *  - à un utilisateur connecté (session web ou jeton) faisant partie des personnes
 *    concernées par le message (expéditeur, destinataire, ou participant du fil).
 * Sinon : 403 (ou 404 si le fichier n'existe pas). Aucun chemin interne n'est révélé.
 */
class AttachmentController extends Controller
{
    public function show(Request $request, string $type, int $id, ?string $name = null): StreamedResponse
    {
        abort_unless(in_array($type, Attachments::TYPES, true), 404);

        [$path, $authorize] = $this->resolve($type, $id);
        $signed = $request->hasValidRelativeSignature();

        $user = null;
        if ($signed) {
            // Lien remis par l'API mobile : valable pour la personne à qui il a été donné.
            $uid = $request->integer('u') ?: null;
            $user = $uid ? User::query()->find($uid) : null;
            abort_if($path === null, 404);
            abort_unless($user === null || $authorize($user), 403);
        } else {
            abort_if($request->has('signature'), 403, 'Lien expiré ou invalide.');
            $user = $request->user() ?? $request->user('sanctum');
            abort_unless($user !== null, 401);
            // Fichier inexistant ET fichier interdit : même réponse (on ne révèle pas quels numéros existent)
            abort_unless($path !== null && $authorize($user), 403);
        }

        $disk = Attachments::diskOf($path);
        abort_if($disk === null, 404);

        Log::channel('single')->info('Pièce jointe consultée', [
            'type' => $type,
            'id' => $id,
            'user_id' => $user?->id,
            'ip' => $request->ip(),
        ]);

        $filename = basename($path);
        $inline = Attachments::inlineMime($path);
        $headers = [
            'Content-Type' => $inline ?? 'application/octet-stream',
            'X-Content-Type-Options' => 'nosniff',
            'Content-Security-Policy' => "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
            // Document médical : jamais mis en cache (navigateur ou proxy)
            'Cache-Control' => 'private, no-store, max-age=0',
            'Pragma' => 'no-cache',
            'Content-Disposition' => ($inline ? 'inline' : 'attachment').'; filename="'.addslashes($filename).'"',
        ];

        return Storage::disk($disk)->response($path, $filename, $headers);
    }

    /**
     * Chemin du fichier + règle d'autorisation selon le type de cible.
     *
     * @return array{0: ?string, 1: \Closure(User): bool}
     */
    private function resolve(string $type, int $id): array
    {
        if ($type === 'message') {
            $message = Message::query()->find($id);
            if (! $message) {
                return [null, fn () => false];
            }

            return [$message->fichier, fn (User $u) => $this->canSeeMessage($u->id, $message)];
        }

        if ($type === 'legacy') {
            // Réponse faite depuis l'ancien site (table reponses) : accès = accès au message d'origine
            if (! Schema::hasTable('reponses')) {
                return [null, fn () => false];
            }
            $row = DB::table('reponses')->where('id', $id)->first();
            $message = $row ? Message::query()->find($row->message_id) : null;
            if (! $row || ! $message) {
                return [null, fn () => false];
            }

            return [$row->fichier, fn (User $u) => $this->canSeeMessage($u->id, $message)];
        }

        if ($type === 'chat') {
            // Message vocal du chat : réservé aux deux participants de la conversation
            $chat = \App\Models\ChatMessage::query()->find($id);
            if (! $chat) {
                return [null, fn () => false];
            }

            return [$chat->audio_path, fn (User $u) => in_array((int) $u->id, [(int) $chat->sender_id, (int) $chat->receiver_id], true)];
        }

        // Pièce jointe d'un brouillon : réservée à son auteur
        $draft = MessageDraft::query()->find($id);
        if (! $draft) {
            return [null, fn () => false];
        }

        return [$draft->fichier, fn (User $u) => (int) $draft->sender_id === (int) $u->id];
    }

    /**
     * Personne concernée par le message : expéditeur ou destinataire de cette ligne.
     */
    private function canSeeMessage(int $userId, Message $message): bool
    {
        if (MessageAccess::canAccess($userId, $message)) {
            return true;
        }
        // Réponse : l'expéditeur du message d'origine peut aussi la consulter
        // (réponse d'un destinataire d'un envoi groupé). Les autres destinataires du
        // groupe n'y ont PAS accès : c'est une conversation entre deux personnes.
        if ($message->parent_id !== null) {
            return (int) MessageThreads::root($message)->sender_id === $userId;
        }

        return false;
    }
}
