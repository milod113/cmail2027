<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Roles/Index', [
            'roles' => Role::query()
                ->withCount('users')
                ->orderBy('nom_role')
                ->get(['id', 'nom_role', 'is_protected', 'is_unique']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Roles/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nom_role' => ['required', 'string', 'max:255', 'unique:roles,nom_role'],
            'is_protected' => ['required', 'boolean'],
            'is_unique' => ['required', 'boolean'],
        ]);

        Role::create($validated);

        return redirect()
            ->route('roles.index')
            ->with('success', 'Role created successfully.');
    }

    public function edit(Role $role): Response
    {
        return Inertia::render('Roles/Edit', [
            'role' => $role->only(['id', 'nom_role', 'is_protected', 'is_unique']),
        ]);
    }

    public function update(Request $request, Role $role): RedirectResponse
    {
        if ($role->is_protected) {
            return redirect()
                ->route('roles.index')
                ->with('success', 'Protected roles cannot be modified.');
        }

        $validated = $request->validate([
            'nom_role' => ['required', 'string', 'max:255', 'unique:roles,nom_role,'.$role->id],
            'is_protected' => ['required', 'boolean'],
            'is_unique' => ['required', 'boolean'],
        ]);

        $role->update($validated);

        return redirect()
            ->route('roles.index')
            ->with('success', 'Role updated successfully.');
    }

    public function destroy(Role $role): RedirectResponse
    {
        if ($role->is_protected) {
            return redirect()
                ->route('roles.index')
                ->with('success', 'Protected roles cannot be deleted.');
        }

        if ($role->users()->exists()) {
            return redirect()
                ->route('roles.index')
                ->with('success', 'Role cannot be deleted while assigned to users.');
        }

        $role->delete();

        return redirect()
            ->route('roles.index')
            ->with('success', 'Role deleted successfully.');
    }
}
