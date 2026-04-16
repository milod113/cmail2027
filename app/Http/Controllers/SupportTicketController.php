<?php

namespace App\Http\Controllers;

use App\Models\SupportTicket;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SupportTicketController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'category' => ['required', 'string', 'in:bug,login,suggestion,network'],
            'impact' => ['required', 'string', 'in:low,normal,blocking'],
            'description' => ['required', 'string', 'max:5000'],
            'screenshot' => ['nullable', 'image', 'max:10240'],
            'page_url' => ['nullable', 'string', 'max:2000'],
            'user_agent' => ['nullable', 'string', 'max:1200'],
            'browser' => ['nullable', 'string', 'max:120'],
            'platform' => ['nullable', 'string', 'max:120'],
            'screen_resolution' => ['nullable', 'string', 'max:40'],
        ]);

        $screenshotPath = $request->hasFile('screenshot')
            ? $request->file('screenshot')->store('support-tickets', 'public')
            : null;

        SupportTicket::query()->create([
            'user_id' => $request->user()->id,
            'category' => $validated['category'],
            'impact' => $validated['impact'],
            'description' => $validated['description'],
            'screenshot_path' => $screenshotPath,
            'status' => 'open',
            'page_url' => $validated['page_url'] ?? null,
            'user_agent' => $validated['user_agent'] ?? null,
            'browser' => $validated['browser'] ?? null,
            'platform' => $validated['platform'] ?? null,
            'screen_resolution' => $validated['screen_resolution'] ?? null,
        ]);

        return back()->with('success', "Votre signalement a bien ete envoye a l'equipe informatique.");
    }
}
