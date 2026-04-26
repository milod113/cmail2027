<?php

namespace App\Http\Controllers;

use App\Events\NoteCreated;
use App\Models\Meeting;
use App\Models\MeetingNote;
use App\Models\MeetingTopic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class MeetingNoteController extends Controller
{
    public function store(Request $request, Meeting $meeting, MeetingTopic $topic): JsonResponse
    {
        Gate::authorize('view', $meeting);

        $topic->loadMissing('section:id,meeting_id');

        abort_unless((int) $topic->section->meeting_id === (int) $meeting->id, 404);

        $validated = $request->validate([
            'content' => ['required', 'string', 'max:20000'],
            'is_private' => ['required', 'boolean'],
        ]);

        $note = MeetingNote::query()->create([
            'meeting_topic_id' => $topic->id,
            'user_id' => $request->user()->id,
            'content' => trim((string) $validated['content']),
            'is_private' => (bool) $validated['is_private'],
        ]);

        $note->loadMissing('user:id,name,email');

        $this->broadcastSafely(new NoteCreated($note));

        return response()->json([
            'note' => [
                'id' => $note->id,
                'meeting_id' => $meeting->id,
                'meeting_topic_id' => $note->meeting_topic_id,
                'content' => $note->content,
                'is_private' => (bool) $note->is_private,
                'created_at' => optional($note->created_at)?->toIso8601String(),
                'user' => $note->user
                    ? [
                        'id' => $note->user->id,
                        'name' => $note->user->name,
                        'email' => $note->user->email,
                    ]
                    : null,
            ],
        ], 201);
    }
}
