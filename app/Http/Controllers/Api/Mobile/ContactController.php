<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContactResource;
use App\Http\Resources\MessageResource;
use App\Models\Message;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Schema;

class ContactController extends Controller
{
    /**
     * List users as lightweight contact cards for the mobile app.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();
        $search = trim((string) $request->string('search'));
        $departmentId = $request->integer('department');
        $roleId = $request->integer('role');
        $status = (string) $request->string('status');      // '', 'online', 'offline'
        $favoritesOnly = $request->boolean('favorites');
        $hasLastSeenAt = Schema::hasColumn('users', 'last_seen_at');

        $favoriteContactIds = $user->favoriteContacts()
            ->pluck('users.id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $request->attributes->set('favorite_contact_ids', $favoriteContactIds);

        $columns = [
            'id',
            'name',
            'username',
            'email',
            'department_id',
            'role_id',
            'is_online',
            'is_blocked',
        ];

        if ($hasLastSeenAt) {
            $columns[] = 'last_seen_at';
        }

        $contacts = User::query()
            ->whereKeyNot($user->id)
            ->with([
                'department:id,name',
                'role:id,nom_role',
                'profile:user_id,telephone,photo',
            ])
            ->select($columns)
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($departmentId > 0, fn ($query) => $query->where('department_id', $departmentId))
            ->when($roleId > 0, fn ($query) => $query->where('role_id', $roleId))
            ->when($favoritesOnly, fn ($query) => $query->whereIn('id', $favoriteContactIds ?: [0]))
            // Même définition du « en ligne » que la page web Contacts (vu il y a moins de 2 min).
            ->when($status === 'online' && $hasLastSeenAt, fn ($query) => $query
                ->where('is_online', true)
                ->where('is_blocked', false)
                ->where('last_seen_at', '>=', now()->subMinutes(2)))
            ->when($status === 'offline' && $hasLastSeenAt, fn ($query) => $query
                ->where('is_blocked', false)
                ->where(fn ($q) => $q->where('is_online', false)
                    ->orWhereNull('last_seen_at')
                    ->orWhere('last_seen_at', '<', now()->subMinutes(2))))
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return ContactResource::collection($contacts);
    }

    /**
     * Profil d'un contact + statistiques des échanges avec l'utilisateur connecté.
     */
    public function show(Request $request, User $user): JsonResponse
    {
        $me = $request->user();
        $request->attributes->set(
            'favorite_contact_ids',
            $me->favoriteContacts()->pluck('users.id')->map(fn ($id) => (int) $id)->all()
        );

        $user->loadMissing(['department:id,name', 'role:id,nom_role', 'profile']);

        $sent = $this->conversationQuery((int) $me->id, (int) $user->id)->where('sender_id', $me->id);
        $received = $this->conversationQuery((int) $me->id, (int) $user->id)->where('sender_id', $user->id);
        $last = $this->conversationQuery((int) $me->id, (int) $user->id)
            ->orderByDesc(DB::raw('COALESCE(sent_at, created_at)'))
            ->first(['id', 'sent_at', 'created_at']);

        return response()->json([
            'contact' => new ContactResource($user),
            'grade' => $user->profile?->grade,
            'stats' => [
                'sent' => (clone $sent)->count(),
                'received' => (clone $received)->count(),
                'unread' => (clone $received)->where('lu', false)->count(),
                'last_exchange_at' => optional($last?->sent_at ?? $last?->created_at)?->toIso8601String(),
            ],
        ]);
    }

    /**
     * Messages échangés entre l'utilisateur connecté et ce contact
     * (envoyés et reçus, réponses comprises), du plus récent au plus ancien.
     *
     * direction : '' (tous), 'sent', 'received'
     */
    public function conversation(Request $request, User $user): AnonymousResourceCollection
    {
        $me = $request->user();
        $direction = (string) $request->string('direction');
        $search = trim((string) $request->string('search'));

        $messages = $this->conversationQuery((int) $me->id, (int) $user->id)
            ->with(['sender:id,name,email', 'receiver:id,name,email'])
            ->when($direction === 'sent', fn ($q) => $q->where('sender_id', $me->id))
            ->when($direction === 'received', fn ($q) => $q->where('sender_id', $user->id))
            ->when($search !== '', fn ($q) => $q->where(fn ($s) => $s
                ->where('sujet', 'like', "%{$search}%")
                ->orWhere('contenu', 'like', "%{$search}%")))
            ->orderByDesc(DB::raw('COALESCE(sent_at, created_at)'))
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        return MessageResource::collection($messages);
    }

    /**
     * Messages entre deux utilisateurs : envoyés par l'un à l'autre, non archivés.
     * Un message reçu n'est visible qu'une fois délivré (pas les envois programmés
     * non partis) ; mes propres envois programmés restent visibles.
     */
    private function conversationQuery(int $meId, int $otherId): Builder
    {
        return Message::query()
            ->where('archived', false)
            ->where(function (Builder $q) use ($meId, $otherId) {
                $q->where(fn ($a) => $a->where('sender_id', $meId)->where('receiver_id', $otherId)->whereNull('sender_deleted_at'))
                    ->orWhere(fn ($b) => $b->where('sender_id', $otherId)->where('receiver_id', $meId)->where('is_delivered', true)->whereNull('receiver_deleted_at'));
            });
    }

    /**
     * Options de filtre (départements et rôles), comme la page web.
     */
    public function filters(): JsonResponse
    {
        return response()->json([
            'departments' => Department::query()->orderBy('name')->get(['id', 'name']),
            'roles' => Role::query()->orderBy('nom_role')->get(['id', 'nom_role']),
            'total' => User::query()->count(),
        ]);
    }

    /**
     * Ajouter un contact aux favoris (même logique que ProfileController::favorite).
     */
    public function favorite(Request $request, User $user): JsonResponse
    {
        abort_if((int) $request->user()->id === (int) $user->id, 403);
        $request->user()->favoriteContacts()->syncWithoutDetaching([$user->id]);

        return response()->json(['message' => 'Contact ajouté aux favoris.', 'is_favorite' => true]);
    }

    /**
     * Retirer un contact des favoris.
     */
    public function unfavorite(Request $request, User $user): JsonResponse
    {
        abort_if((int) $request->user()->id === (int) $user->id, 403);
        $request->user()->favoriteContacts()->detach($user->id);

        return response()->json(['message' => 'Contact retiré des favoris.', 'is_favorite' => false]);
    }
}
