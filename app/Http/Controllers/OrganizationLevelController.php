<?php

namespace App\Http\Controllers;

use App\Models\OrganizationCategory;
use App\Models\OrganizationLevel;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrganizationLevelController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('OrganizationLevels/Index', [
            'levels' => OrganizationLevel::query()
                ->with('organizationCategory:id,name,code')
                ->withCount('organizationalUnits')
                ->orderBy('rank')
                ->get(['id', 'organization_category_id', 'name', 'code', 'rank', 'is_active', 'description']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('OrganizationLevels/Create', [
            'categories' => OrganizationCategory::query()->active()->orderBy('name')->get(['id', 'name', 'code']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'organization_category_id' => ['required', 'exists:organization_categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:255', 'unique:organization_levels,code'],
            'rank' => ['required', 'integer', 'min:1'],
            'is_active' => ['required', 'boolean'],
            'description' => ['nullable', 'string'],
        ]);

        OrganizationLevel::create($validated);

        return redirect()
            ->route('organization-levels.index')
            ->with('success', 'Niveau organisationnel cree avec succes.');
    }

    public function edit(OrganizationLevel $organizationLevel): Response
    {
        return Inertia::render('OrganizationLevels/Edit', [
            'level' => $organizationLevel->only(['id', 'organization_category_id', 'name', 'code', 'rank', 'is_active', 'description']),
            'categories' => OrganizationCategory::query()->active()->orderBy('name')->get(['id', 'name', 'code']),
        ]);
    }

    public function update(Request $request, OrganizationLevel $organizationLevel): RedirectResponse
    {
        $validated = $request->validate([
            'organization_category_id' => ['required', 'exists:organization_categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:255', 'unique:organization_levels,code,'.$organizationLevel->id],
            'rank' => ['required', 'integer', 'min:1'],
            'is_active' => ['required', 'boolean'],
            'description' => ['nullable', 'string'],
        ]);

        $organizationLevel->update($validated);

        return redirect()
            ->route('organization-levels.index')
            ->with('success', 'Niveau organisationnel mis a jour avec succes.');
    }

    public function destroy(OrganizationLevel $organizationLevel): RedirectResponse
    {
        if ($organizationLevel->organizationalUnits()->exists()) {
            return redirect()
                ->route('organization-levels.index')
                ->with('success', 'Impossible de supprimer un niveau deja utilise par des unites.');
        }

        $organizationLevel->delete();

        return redirect()
            ->route('organization-levels.index')
            ->with('success', 'Niveau organisationnel supprime avec succes.');
    }
}
