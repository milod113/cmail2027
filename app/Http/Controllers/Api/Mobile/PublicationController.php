<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Publication;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Publications côté mobile : « j'aime » et commentaires (mêmes règles que le web).
 */
class PublicationController extends Controller
{
    /** Ajoute ou retire le « j'aime » de l'utilisateur. */
    public function like(Request $request, Publication $publication): JsonResponse
    {
        abort_if($publication->archived, 404);
        $userId = (int) $request->user()->id;

        $existing = $publication->likes()->where('user_id', $userId)->first();
        if ($existing) {
            $existing->delete();
        } else {
            $publication->likes()->firstOrCreate(['user_id' => $userId]);
        }

        return response()->json([
            'liked' => $existing === null,
            'likes_count' => $publication->likes()->count(),
        ]);
    }

    /** Commentaires d'une publication, du plus ancien au plus récent. */
    public function comments(Request $request, Publication $publication): JsonResponse
    {
        abort_if($publication->archived, 404);

        $comments = $publication->comments()
            ->reorder()
            ->with('user:id,name')
            ->oldest()
            ->get()
            ->map(fn (Comment $c) => $this->commentPayload($c, (int) $request->user()->id));

        return response()->json(['data' => $comments]);
    }

    /** Ajoute un commentaire. */
    public function comment(Request $request, Publication $publication): JsonResponse
    {
        abort_if($publication->archived, 404);

        $validated = $request->validate([
            'content' => ['required', 'string', 'max:2000'],
        ]);

        $comment = $publication->comments()->create([
            'user_id' => $request->user()->id,
            'content' => trim($validated['content']),
        ]);
        $comment->load('user:id,name');

        return response()->json([
            'comment' => $this->commentPayload($comment, (int) $request->user()->id),
            'comments_count' => $publication->comments()->count(),
        ], 201);
    }

    private function commentPayload(Comment $c, int $userId): array
    {
        return [
            'id' => $c->id,
            'content' => $c->content,
            'created_at' => optional($c->created_at)?->toIso8601String(),
            'author' => $c->user ? ['id' => $c->user->id, 'name' => $c->user->name] : null,
            'mine' => (int) $c->user_id === $userId,
        ];
    }
}
