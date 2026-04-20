<?php

namespace App\Http\Controllers;

use App\Support\RichTextSanitizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class PublicationController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('create-publication');

        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'content' => ['required', 'string', 'max:20000'],
            'photo' => ['nullable', 'image', 'max:5120'],
        ]);

        $sanitizedContent = RichTextSanitizer::sanitize($validated['content']);

        if (RichTextSanitizer::plainText($sanitizedContent) === '') {
            throw ValidationException::withMessages([
                'content' => 'Le contenu de la publication est obligatoire.',
            ]);
        }

        $photoPath = $request->file('photo')?->store('publications', 'public');

        $request->user()->publications()->create([
            'title' => filled($validated['title'] ?? null) ? trim((string) $validated['title']) : null,
            'content' => $sanitizedContent,
            'photo_path' => $photoPath,
        ]);

        return back()->with('success', 'Publication créée avec succès.');
    }
}
