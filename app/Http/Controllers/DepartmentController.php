<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Establishment;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $category = trim((string) $request->string('category'));

        return Inertia::render('Departments/Index', [
            'departments' => Department::query()
                ->with([
                    'establishment:id,name',
                    'parent:id,name',
                    'manager:id,name,email',
                ])
                ->select([
                    'id',
                    'name',
                    'establishment_id',
                    'parent_id',
                    'category',
                    'level_type',
                    'manager_user_id',
                    'is_active',
                    'sort_order',
                    'description',
                ])
                ->when($category !== '' && in_array($category, ['administratif', 'medical', 'chirurgical'], true), fn ($query) => $query->where('category', $category))
                ->when($search !== '', function ($query) use ($search) {
                    $query->where(function ($subQuery) use ($search) {
                        $subQuery
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('category', 'like', "%{$search}%")
                            ->orWhere('level_type', 'like', "%{$search}%")
                            ->orWhere('description', 'like', "%{$search}%")
                            ->orWhereHas('establishment', fn ($establishmentQuery) => $establishmentQuery->where('name', 'like', "%{$search}%"))
                            ->orWhereHas('parent', fn ($parentQuery) => $parentQuery->where('name', 'like', "%{$search}%"))
                            ->orWhereHas('manager', fn ($managerQuery) => $managerQuery
                                ->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%"));
                    });
                })
                ->orderBy('category')
                ->orderBy('level_type')
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(),
            'filters' => [
                'search' => $search,
                'category' => $category,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Departments/Create', [
            'establishments' => Establishment::query()
                ->select('id', 'name')
                ->orderBy('name')
                ->get(),
            'parentDepartments' => Department::query()
                ->select('id', 'name', 'category', 'level_type')
                ->orderBy('name')
                ->get(),
            'managers' => User::query()
                ->select('id', 'name', 'email')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'establishment_id' => ['required', 'exists:establishments,id'],
            'parent_id' => ['nullable', 'exists:departments,id'],
            'category' => ['required', 'string', 'in:administratif,medical,chirurgical'],
            'level_type' => ['required', 'string', 'max:50'],
            'manager_user_id' => ['nullable', 'exists:users,id'],
            'is_active' => ['required', 'boolean'],
            'sort_order' => ['required', 'integer', 'min:0'],
            'description' => ['nullable', 'string'],
        ]);

        Department::create($validated);

        return redirect()
            ->route('departments.index')
            ->with('success', 'Department created successfully.');
    }

    public function edit(Department $department): Response
    {
        return Inertia::render('Departments/Edit', [
            'department' => $department->only([
                'id',
                'name',
                'establishment_id',
                'parent_id',
                'category',
                'level_type',
                'manager_user_id',
                'is_active',
                'sort_order',
                'description',
            ]),
            'establishments' => Establishment::query()
                ->select('id', 'name')
                ->orderBy('name')
                ->get(),
            'parentDepartments' => Department::query()
                ->where('id', '!=', $department->id)
                ->select('id', 'name', 'category', 'level_type')
                ->orderBy('name')
                ->get(),
            'managers' => User::query()
                ->select('id', 'name', 'email')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function update(Request $request, Department $department): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'establishment_id' => ['required', 'exists:establishments,id'],
            'parent_id' => ['nullable', 'exists:departments,id'],
            'category' => ['required', 'string', 'in:administratif,medical,chirurgical'],
            'level_type' => ['required', 'string', 'max:50'],
            'manager_user_id' => ['nullable', 'exists:users,id'],
            'is_active' => ['required', 'boolean'],
            'sort_order' => ['required', 'integer', 'min:0'],
            'description' => ['nullable', 'string'],
        ]);

        if (($validated['parent_id'] ?? null) === $department->id) {
            return redirect()
                ->route('departments.edit', $department)
                ->withErrors(['parent_id' => 'Un departement ne peut pas etre son propre parent.']);
        }

        $department->update($validated);

        return redirect()
            ->route('departments.index')
            ->with('success', 'Department updated successfully.');
    }

    public function destroy(Department $department): RedirectResponse
    {
        if ($department->children()->exists()) {
            return redirect()
                ->route('departments.index')
                ->with('success', 'Impossible de supprimer un departement qui contient des sous-elements.');
        }

        $department->delete();

        return redirect()
            ->route('departments.index')
            ->with('success', 'Department deleted successfully.');
    }
}
