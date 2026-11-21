<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Establishment;
use App\Models\OrganizationCategory;
use App\Models\OrganizationLevel;
use App\Models\OrganizationalUnit;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrganizationalUnitController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('OrganizationalUnits/Index', [
            'units' => OrganizationalUnit::query()
                ->with([
                    'organizationCategory:id,name,code',
                    'establishment:id,name',
                    'organizationLevel:id,name,rank',
                    'department:id,name',
                    'parent:id,name',
                    'manager:id,name,email',
                ])
                ->withCount('positions')
                ->orderBy('organization_level_id')
                ->orderBy('name')
                ->get([
                    'id',
                    'establishment_id',
                    'organization_level_id',
                    'organization_category_id',
                    'department_id',
                    'parent_id',
                    'manager_user_id',
                    'name',
                    'code',
                    'is_active',
                    'description',
                ]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('OrganizationalUnits/Create', [
            'categories' => OrganizationCategory::query()->active()->orderBy('name')->get(['id', 'name', 'code']),
            'establishments' => Establishment::query()->select('id', 'name')->orderBy('name')->get(),
            'levels' => OrganizationLevel::query()->active()->with('organizationCategory:id,name,code')->orderBy('rank')->get(['id', 'organization_category_id', 'name', 'code', 'rank']),
            'departments' => Department::query()->select('id', 'name')->orderBy('name')->get(),
            'parentUnits' => OrganizationalUnit::query()
                ->with(['organizationLevel:id,name,rank', 'organizationCategory:id,name,code'])
                ->orderBy('name')
                ->get(['id', 'name', 'organization_level_id', 'organization_category_id']),
            'managers' => User::query()->select('id', 'name', 'email')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'organization_category_id' => ['required', 'exists:organization_categories,id'],
            'establishment_id' => ['nullable', 'exists:establishments,id'],
            'organization_level_id' => ['required', 'exists:organization_levels,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'parent_id' => ['nullable', 'exists:organizational_units,id'],
            'manager_user_id' => ['nullable', 'exists:users,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:255', 'unique:organizational_units,code'],
            'is_active' => ['required', 'boolean'],
            'description' => ['nullable', 'string'],
        ]);

        OrganizationalUnit::create($validated);

        return redirect()
            ->route('organizational-units.index')
            ->with('success', 'Unite organisationnelle creee avec succes.');
    }

    public function edit(OrganizationalUnit $organizationalUnit): Response
    {
        return Inertia::render('OrganizationalUnits/Edit', [
            'unit' => $organizationalUnit->only([
                'id',
                'establishment_id',
                'organization_level_id',
                'organization_category_id',
                'department_id',
                'parent_id',
                'manager_user_id',
                'name',
                'code',
                'is_active',
                'description',
            ]),
            'categories' => OrganizationCategory::query()->active()->orderBy('name')->get(['id', 'name', 'code']),
            'establishments' => Establishment::query()->select('id', 'name')->orderBy('name')->get(),
            'levels' => OrganizationLevel::query()->active()->with('organizationCategory:id,name,code')->orderBy('rank')->get(['id', 'organization_category_id', 'name', 'code', 'rank']),
            'departments' => Department::query()->select('id', 'name')->orderBy('name')->get(),
            'parentUnits' => OrganizationalUnit::query()
                ->where('id', '!=', $organizationalUnit->id)
                ->with(['organizationLevel:id,name,rank', 'organizationCategory:id,name,code'])
                ->orderBy('name')
                ->get(['id', 'name', 'organization_level_id', 'organization_category_id']),
            'managers' => User::query()->select('id', 'name', 'email')->orderBy('name')->get(),
        ]);
    }

    public function update(Request $request, OrganizationalUnit $organizationalUnit): RedirectResponse
    {
        $validated = $request->validate([
            'organization_category_id' => ['required', 'exists:organization_categories,id'],
            'establishment_id' => ['nullable', 'exists:establishments,id'],
            'organization_level_id' => ['required', 'exists:organization_levels,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'parent_id' => ['nullable', 'exists:organizational_units,id'],
            'manager_user_id' => ['nullable', 'exists:users,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:255', 'unique:organizational_units,code,'.$organizationalUnit->id],
            'is_active' => ['required', 'boolean'],
            'description' => ['nullable', 'string'],
        ]);

        if (($validated['parent_id'] ?? null) === $organizationalUnit->id) {
            return redirect()
                ->route('organizational-units.edit', $organizationalUnit)
                ->withErrors(['parent_id' => 'Une unite ne peut pas etre son propre parent.']);
        }

        $organizationalUnit->update($validated);

        return redirect()
            ->route('organizational-units.index')
            ->with('success', 'Unite organisationnelle mise a jour avec succes.');
    }

    public function destroy(OrganizationalUnit $organizationalUnit): RedirectResponse
    {
        if ($organizationalUnit->children()->exists() || $organizationalUnit->positions()->exists()) {
            return redirect()
                ->route('organizational-units.index')
                ->with('success', 'Impossible de supprimer une unite contenant des enfants ou des postes.');
        }

        $organizationalUnit->delete();

        return redirect()
            ->route('organizational-units.index')
            ->with('success', 'Unite organisationnelle supprimee avec succes.');
    }
}
