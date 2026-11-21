<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Position;
use App\Models\Role;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PositionController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Positions/Index', [
            'positions' => Position::query()
                ->with([
                    'department:id,name,parent_id,category,level_type',
                    'department.parent:id,name',
                    'role:id,nom_role',
                    'reportsToPosition:id,title',
                ])
                ->withCount('activeUserPositions')
                ->orderBy('department_id')
                ->orderBy('hierarchy_order')
                ->orderBy('title')
                ->get([
                    'id',
                    'title',
                    'code',
                    'department_id',
                    'role_id',
                    'reports_to_position_id',
                    'is_head',
                    'is_active',
                    'hierarchy_order',
                    'description',
                ]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Positions/Create', [
            'departments' => Department::query()
                ->with('parent:id,name')
                ->orderBy('name')
                ->get(['id', 'name', 'parent_id', 'category', 'level_type']),
            'roles' => Role::query()->orderBy('nom_role')->get(['id', 'nom_role']),
            'reportingPositions' => Position::query()
                ->with('department:id,name')
                ->orderBy('title')
                ->get(['id', 'title', 'department_id']),
            // Codes deja pris : permet au frontend d'anticiper l'unicite du code suggere.
            'existingCodes' => Position::query()
                ->whereNotNull('code')
                ->pluck('code')
                ->all(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:255', 'unique:positions,code'],
            'department_id' => ['required', 'exists:departments,id'],
            'role_id' => ['nullable', 'exists:roles,id'],
            'reports_to_position_id' => ['nullable', 'exists:positions,id'],
            'is_head' => ['required', 'boolean'],
            'is_active' => ['required', 'boolean'],
            'hierarchy_order' => ['required', 'integer', 'min:0'],
            'description' => ['nullable', 'string'],
        ]);

        Position::create($validated);

        return redirect()
            ->route('positions.index')
            ->with('success', 'Poste cree avec succes.');
    }

    public function edit(Position $position): Response
    {
        return Inertia::render('Positions/Edit', [
            'position' => $position->only([
                'id',
                'title',
                'code',
                'department_id',
                'role_id',
                'reports_to_position_id',
                'is_head',
                'is_active',
                'hierarchy_order',
                'description',
            ]),
            'departments' => Department::query()
                ->with('parent:id,name')
                ->orderBy('name')
                ->get(['id', 'name', 'parent_id', 'category', 'level_type']),
            'roles' => Role::query()->orderBy('nom_role')->get(['id', 'nom_role']),
            'reportingPositions' => Position::query()
                ->where('id', '!=', $position->id)
                ->with('department:id,name')
                ->orderBy('title')
                ->get(['id', 'title', 'department_id']),
            // Codes des autres postes (le poste courant est exclu) pour l'aide a l'unicite.
            'existingCodes' => Position::query()
                ->whereNotNull('code')
                ->where('id', '!=', $position->id)
                ->pluck('code')
                ->all(),
        ]);
    }

    public function update(Request $request, Position $position): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:255', 'unique:positions,code,'.$position->id],
            'department_id' => ['required', 'exists:departments,id'],
            'role_id' => ['nullable', 'exists:roles,id'],
            'reports_to_position_id' => ['nullable', 'exists:positions,id'],
            'is_head' => ['required', 'boolean'],
            'is_active' => ['required', 'boolean'],
            'hierarchy_order' => ['required', 'integer', 'min:0'],
            'description' => ['nullable', 'string'],
        ]);

        if (($validated['reports_to_position_id'] ?? null) === $position->id) {
            return redirect()
                ->route('positions.edit', $position)
                ->withErrors(['reports_to_position_id' => 'Un poste ne peut pas remonter vers lui-meme.']);
        }

        $position->update($validated);

        return redirect()
            ->route('positions.index')
            ->with('success', 'Poste mis a jour avec succes.');
    }

    public function destroy(Position $position): RedirectResponse
    {
        if ($position->directReports()->exists() || $position->userPositions()->exists()) {
            return redirect()
                ->route('positions.index')
                ->with('success', 'Impossible de supprimer un poste lie a des sous-postes ou affectations.');
        }

        $position->delete();

        return redirect()
            ->route('positions.index')
            ->with('success', 'Poste supprime avec succes.');
    }
}
