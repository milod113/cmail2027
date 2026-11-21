<?php

namespace App\Http\Controllers;

use App\Models\Position;
use App\Models\User;
use App\Models\UserPosition;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserPositionController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('UserPositions/Index', [
            'assignments' => UserPosition::query()
                ->with([
                    'user:id,name,email',
                    'position:id,title,department_id',
                    'position.department:id,name,parent_id,category,level_type',
                    'position.department.parent:id,name',
                ])
                ->orderByDesc('is_primary')
                ->orderByDesc('is_active')
                ->orderBy('created_at', 'desc')
                ->get([
                    'id',
                    'user_id',
                    'position_id',
                    'is_primary',
                    'is_acting',
                    'starts_at',
                    'ends_at',
                    'is_active',
                ]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('UserPositions/Create', [
            'users' => User::query()->orderBy('name')->get(['id', 'name', 'email']),
            'positions' => Position::query()
                ->with(['department:id,name,parent_id'])
                ->active()
                ->orderBy('title')
                ->get(['id', 'title', 'department_id']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'position_id' => ['required', 'exists:positions,id'],
            'is_primary' => ['required', 'boolean'],
            'is_acting' => ['required', 'boolean'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['required', 'boolean'],
        ]);

        if ($validated['is_primary']) {
            UserPosition::query()
                ->where('user_id', $validated['user_id'])
                ->update(['is_primary' => false]);
        }

        UserPosition::create($validated);

        return redirect()
            ->route('user-positions.index')
            ->with('success', 'Affectation creee avec succes.');
    }

    public function edit(UserPosition $userPosition): Response
    {
        return Inertia::render('UserPositions/Edit', [
            'assignment' => [
                'id' => $userPosition->id,
                'user_id' => $userPosition->user_id,
                'position_id' => $userPosition->position_id,
                'is_primary' => $userPosition->is_primary,
                'is_acting' => $userPosition->is_acting,
                'starts_at' => optional($userPosition->starts_at)?->format('Y-m-d'),
                'ends_at' => optional($userPosition->ends_at)?->format('Y-m-d'),
                'is_active' => $userPosition->is_active,
            ],
            'users' => User::query()->orderBy('name')->get(['id', 'name', 'email']),
            'positions' => Position::query()
                ->with(['department:id,name,parent_id'])
                ->orderBy('title')
                ->get(['id', 'title', 'department_id']),
        ]);
    }

    public function update(Request $request, UserPosition $userPosition): RedirectResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'position_id' => ['required', 'exists:positions,id'],
            'is_primary' => ['required', 'boolean'],
            'is_acting' => ['required', 'boolean'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['required', 'boolean'],
        ]);

        if ($validated['is_primary']) {
            UserPosition::query()
                ->where('user_id', $validated['user_id'])
                ->where('id', '!=', $userPosition->id)
                ->update(['is_primary' => false]);
        }

        $userPosition->update($validated);

        return redirect()
            ->route('user-positions.index')
            ->with('success', 'Affectation mise a jour avec succes.');
    }

    public function destroy(UserPosition $userPosition): RedirectResponse
    {
        $userPosition->delete();

        return redirect()
            ->route('user-positions.index')
            ->with('success', 'Affectation supprimee avec succes.');
    }
}
