<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class PublicationController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('create-publication');

        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'content' => ['required', 'string', 'max:5000'],
            'photo' => ['nullable', 'image', 'max:5120'],
        ]);

        $photoPath = $request->file('photo')?->store('publications', 'public');

        $request->user()->publications()->create([
            'title' => $validated['title'] ?? null,
            'content' => $validated['content'],
            'photo_path' => $photoPath,
        ]);

        return back()->with('success', 'Publication créée avec succès.');
    }
}
