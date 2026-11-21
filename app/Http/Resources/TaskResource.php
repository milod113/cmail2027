<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    /**
     * Transform a MessageTask into a mobile-friendly payload.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $message = $this->whenLoaded('message', fn () => $this->message);

        return [
            'id' => (int) $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'priority' => $this->priority,
            'status' => $this->is_completed ? 'completed' : 'pending',
            'is_completed' => (bool) $this->is_completed,
            'due_date' => $this->when(
                $this->due_date !== null,
                fn () => $this->due_date->toIso8601String(),
                null,
            ),
            'reminder_at' => $this->when(
                $this->reminder_at !== null,
                fn () => $this->reminder_at->toIso8601String(),
                null,
            ),
            'created_at' => $this->when(
                $this->created_at !== null,
                fn () => $this->created_at->toIso8601String(),
                null,
            ),
            'message' => $message ? [
                'id' => (int) $message->id,
                'subject' => $message->sujet,
                'sender_name' => $message->sender?->name,
            ] : null,
            'meeting' => $this->whenLoaded('meeting', fn () => $this->meeting ? [
                'id' => (int) $this->meeting->id,
                'title' => $this->meeting->title,
                'topic_title' => $this->meetingTopic?->title,
                'action_title' => $this->meetingTopicAction?->title,
            ] : null),
        ];
    }
}