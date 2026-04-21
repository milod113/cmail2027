<?php

namespace App\Http\Controllers;

use App\Models\AppFeedback;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'rating' => ['required', 'integer', 'between:1,5'],
            'comment' => ['nullable', 'string', 'max:5000'],
        ]);

        AppFeedback::query()->create([
            'user_id' => $request->user()->id,
            'rating' => $validated['rating'],
            'comment' => filled($validated['comment'] ?? null) ? trim((string) $validated['comment']) : null,
        ]);

        $request->user()
            ->unreadNotifications()
            ->where('data->type', 'feedback_request')
            ->get()
            ->markAsRead();

        return back()->with('success', 'Merci pour votre avis sur Cmail.');
    }
}
