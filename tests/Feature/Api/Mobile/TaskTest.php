<?php

use App\Models\Message;
use App\Models\MessageTask;
use App\Models\User;

function mobileTask(array $attributes = []): MessageTask
{
    return MessageTask::query()->create(array_merge([
        'message_id' => 1,
        'title' => 'Tâche de test',
        'priority' => 'high',
        'is_completed' => false,
    ], $attributes));
}

test('tasks endpoints require authentication', function () {
    $this->getJson('/api/mobile/tasks')->assertUnauthorized();
});

test('index lists tasks linked to the user messages or owned tasks', function () {
    $user = User::factory()->create();
    $sender = User::factory()->create();

    $received = Message::query()->create([
        'sender_id' => $sender->id,
        'receiver_id' => $user->id,
        'sujet' => 'Sujet reçu',
        'contenu' => 'Contenu',
        'is_delivered' => true,
        'archived' => false,
        'sent_at' => now(),
    ]);
    $own = Message::query()->create([
        'sender_id' => $user->id,
        'receiver_id' => $sender->id,
        'sujet' => 'Sujet envoyé',
        'contenu' => 'Contenu',
        'archived' => false,
        'sent_at' => now(),
    ]);
    $other = Message::query()->create([
        'sender_id' => $sender->id,
        'receiver_id' => $sender->id,
        'sujet' => 'Sujet tiers',
        'contenu' => 'Contenu',
        'archived' => false,
        'sent_at' => now(),
    ]);

    mobileTask(['message_id' => $received->id, 'title' => 'A faire reçu']);
    mobileTask(['message_id' => $own->id, 'title' => 'A faire envoyé', 'is_completed' => true]);
    mobileTask(['message_id' => $other->id, 'title' => 'Tâche invisible']);
    mobileTask(['message_id' => $received->id, 'owner_id' => $user->id, 'title' => 'A faire délégated']);

    $token = $user->createToken('mobile', ['mobile'])->plainTextToken;

    $this->withToken($token)
        ->getJson('/api/mobile/tasks')
        ->assertOk()
        ->assertJsonStructure([
            'data' => [[
                'id',
                'title',
                'priority',
                'status',
                'is_completed',
                'due_date',
                'message',
            ]],
        ])
        ->assertJsonCount(3, 'data');
});

test('which a message the user is not involved with cannot be shown', function () {
    $outsider = User::factory()->create();
    $sender = User::factory()->create();
    $receiver = User::factory()->create();

    $hidden = Message::query()->create([
        'sender_id' => $sender->id,
        'receiver_id' => $receiver->id,
        'sujet' => 'Confidentiel',
        'contenu' => 'Contenu',
        'archived' => false,
        'sent_at' => now(),
    ]);
    $task = mobileTask(['message_id' => $hidden->id]);

    $token = $outsider->createToken('mobile', ['mobile'])->plainTextToken;

    $this->withToken($token)
        ->getJson("/api/mobile/tasks/{$task->id}")
        ->assertForbidden();
});

test('toggle-status flips the completion state', function () {
    $user = User::factory()->create();
    $sender = User::factory()->create();

    $message = Message::query()->create([
        'sender_id' => $sender->id,
        'receiver_id' => $user->id,
        'sujet' => 'Sujet',
        'contenu' => 'Contenu',
        'is_delivered' => true,
        'archived' => false,
        'sent_at' => now(),
    ]);
    $task = mobileTask(['message_id' => $message->id, 'is_completed' => false]);

    $token = $user->createToken('mobile', ['mobile'])->plainTextToken;

    $this->withToken($token)
        ->patchJson("/api/mobile/tasks/{$task->id}/toggle-status")
        ->assertOk()
        ->assertJsonPath('task.is_completed', true);

    $this->withToken($token)
        ->patchJson("/api/mobile/tasks/{$task->id}/toggle-status")
        ->assertOk()
        ->assertJsonPath('task.is_completed', false);
});

test('a task can be created from an accessible message', function () {
    $user = User::factory()->create();
    $sender = User::factory()->create();

    $message = Message::query()->create([
        'sender_id' => $sender->id,
        'receiver_id' => $user->id,
        'sujet' => 'Sujet',
        'contenu' => 'Contenu',
        'is_delivered' => true,
        'archived' => false,
        'sent_at' => now(),
    ]);

    $token = $user->createToken('mobile', ['mobile'])->plainTextToken;

    $this->withToken($token)
        ->postJson("/api/mobile/messages/{$message->id}/tasks", [
            'title' => 'Relancer les équipes',
            'description' => 'À faire avant vendredi',
            'priority' => 'high',
            'due_date' => now()->addDays(2)->toISOString(),
        ])
        ->assertCreated()
        ->assertJsonPath('data.title', 'Relancer les équipes')
        ->assertJsonPath('data.is_completed', false);
});