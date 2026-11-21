<?php

use App\Models\Message;
use App\Models\User;

function mobileMessage(array $attributes = []): Message
{
    return Message::query()->create(array_merge([
        'sender_id' => 1,
        'receiver_id' => 2,
        'sujet' => 'Sujet de test',
        'contenu' => 'Contenu de test',
        'is_delivered' => true,
        'archived' => false,
        'lu' => false,
        'sent_at' => now(),
    ], $attributes));
}

test('inbox endpoint requires authentication', function () {
    $this->getJson('/api/mobile/messages/inbox')->assertUnauthorized();
});

test('inbox returns only delivered, non-archived received messages', function () {
    $user = User::factory()->create();
    $sender = User::factory()->create();

    mobileMessage(['sender_id' => $sender->id, 'receiver_id' => $user->id]);
    mobileMessage(['sender_id' => $sender->id, 'receiver_id' => $user->id, 'archived' => true]);
    mobileMessage(['sender_id' => $sender->id, 'receiver_id' => $user->id, 'is_delivered' => false]);
    mobileMessage(['sender_id' => $user->id, 'receiver_id' => $sender->id]);

    $token = $user->createToken('mobile', ['mobile'])->plainTextToken;

    $this->withToken($token)
        ->getJson('/api/mobile/messages/inbox')
        ->assertOk()
        ->assertJsonStructure([
            'data' => [[
                'id',
                'subject',
                'excerpt',
                'content',
                'sender',
                'receiver_ids',
                'is_read',
                'sent_at',
            ]],
            'meta' => ['current_page', 'last_page', 'total'],
        ])
        ->assertJsonCount(1, 'data');
});

test('inbox supports unread and search filters', function () {
    $user = User::factory()->create();
    $sender = User::factory()->create();

    mobileMessage(['sender_id' => $sender->id, 'receiver_id' => $user->id, 'sujet' => 'Urgent sujet']);
    mobileMessage(['sender_id' => $sender->id, 'receiver_id' => $user->id, 'sujet' => 'Autre sujet', 'lu' => true]);

    $token = $user->createToken('mobile', ['mobile'])->plainTextToken;

    $this->withToken($token)
        ->getJson('/api/mobile/messages/inbox?search=Urgent')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.subject', 'Urgent sujet');

    $this->withToken($token)
        ->getJson('/api/mobile/messages/inbox?unread=1')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

test('a message a user is not involved with cannot be read', function () {
    $sender = User::factory()->create();
    $receiver = User::factory()->create();
    $outsider = User::factory()->create();

    $message = mobileMessage(['sender_id' => $sender->id, 'receiver_id' => $receiver->id]);

    $token = $outsider->createToken('mobile', ['mobile'])->plainTextToken;

    $this->withToken($token)
        ->getJson("/api/mobile/messages/{$message->id}")
        ->assertForbidden();
});

test('a sender can read their own message', function () {
    $sender = User::factory()->create();
    $receiver = User::factory()->create();

    $message = mobileMessage(['sender_id' => $sender->id, 'receiver_id' => $receiver->id]);

    $token = $sender->createToken('mobile', ['mobile'])->plainTextToken;

    $this->withToken($token)
        ->getJson("/api/mobile/messages/{$message->id}")
        ->assertOk()
        ->assertJsonPath('id', $message->id)
        ->assertJsonPath('sender.id', $sender->id);
});

test('a json recipient can read the message', function () {
    $sender = User::factory()->create();
    $primary = User::factory()->create();
    $cc = User::factory()->create();

    $message = mobileMessage([
        'sender_id' => $sender->id,
        'receiver_id' => $primary->id,
        'receiver_ids' => [$primary->id, $cc->id],
    ]);

    $token = $cc->createToken('mobile', ['mobile'])->plainTextToken;

    $this->withToken($token)
        ->getJson("/api/mobile/messages/{$message->id}")
        ->assertOk()
        ->assertJsonPath('receiver_ids', [$primary->id, $cc->id]);
});

test('reading a received message marks it as read', function () {
    $sender = User::factory()->create();
    $receiver = User::factory()->create();

    $message = mobileMessage(['sender_id' => $sender->id, 'receiver_id' => $receiver->id]);

    $token = $receiver->createToken('mobile', ['mobile'])->plainTextToken;

    $this->withToken($token)
        ->getJson("/api/mobile/messages/{$message->id}")
        ->assertOk();

    $this->assertTrue($message->fresh()->lu);
    $this->assertNotNull($message->fresh()->lu_le);
});

test('an unknown message returns 404', function () {
    $user = User::factory()->create();
    $token = $user->createToken('mobile', ['mobile'])->plainTextToken;

    $this->withToken($token)
        ->getJson('/api/mobile/messages/999999')
        ->assertNotFound();
});

test('replies require authentication', function () {
    $sender = User::factory()->create();
    $receiver = User::factory()->create();

    $root = mobileMessage(['sender_id' => $sender->id, 'receiver_id' => $receiver->id]);

    $this->postJson("/api/mobile/messages/{$root->id}/replies", [
        'contenu' => 'Test',
    ])->assertUnauthorized();
});

test('a reply can be sent back to the sender of a received message', function () {
    $sender = User::factory()->create();
    $receiver = User::factory()->create();

    $root = mobileMessage([
        'sender_id' => $sender->id,
        'receiver_id' => $receiver->id,
        'message_group_uuid' => 'grp-test',
    ]);

    $token = $receiver->createToken('mobile', ['mobile'])->plainTextToken;

    $this->withToken($token)
        ->postJson("/api/mobile/messages/{$root->id}/replies", [
            'contenu' => 'Voici ma réponse.',
        ])
        ->assertCreated()
        ->assertJsonStructure([
            'reply' => [
                'id',
                'content',
                'created_at',
                'sender' => ['id', 'name', 'email', 'role'],
                'attachment_url',
                'attachment_name',
            ],
        ]);

    $reply = Message::query()->where('parent_id', $root->id)->firstOrFail();
    expect($reply->sender_id)->toBe($receiver->id);
    expect($reply->receiver_id)->toBe($sender->id);
    expect($reply->sujet)->toBe('RE: '.$root->sujet);
    expect($reply->type_message)->toBe('reply');
    expect($reply->envoye)->toBeTrue();
    expect($reply->is_delivered)->toBeTrue();
    expect($reply->message_group_uuid)->toBe('grp-test');
    expect($reply->contenu)->toBe('Voici ma réponse.');
});

test('a reply cannot be sent without content', function () {
    $sender = User::factory()->create();
    $receiver = User::factory()->create();

    $root = mobileMessage(['sender_id' => $sender->id, 'receiver_id' => $receiver->id]);

    $token = $receiver->createToken('mobile', ['mobile'])->plainTextToken;

    $this->withToken($token)
        ->postJson("/api/mobile/messages/{$root->id}/replies", [
            'contenu' => '',
        ])
        ->assertUnprocessable();
});

test('an outsider cannot reply to a message', function () {
    $sender = User::factory()->create();
    $receiver = User::factory()->create();
    $outsider = User::factory()->create();

    $root = mobileMessage(['sender_id' => $sender->id, 'receiver_id' => $receiver->id]);

    $token = $outsider->createToken('mobile', ['mobile'])->plainTextToken;

    $this->withToken($token)
        ->postJson("/api/mobile/messages/{$root->id}/replies", [
            'contenu' => 'Test',
        ])
        ->assertForbidden();
});

test('a reply to a reply is attached to the thread root', function () {
    $sender = User::factory()->create();
    $receiver = User::factory()->create();

    $root = mobileMessage([
        'sender_id' => $sender->id,
        'receiver_id' => $receiver->id,
        'message_group_uuid' => 'grp-test',
    ]);

    $first = Message::query()->create([
        'sender_id' => $receiver->id,
        'receiver_id' => $sender->id,
        'sujet' => 'RE: '.$root->sujet,
        'contenu' => 'Première réponse.',
        'parent_id' => $root->id,
        'is_delivered' => true,
        'archived' => false,
        'sent_at' => now(),
    ]);

    $token = $sender->createToken('mobile', ['mobile'])->plainTextToken;

    $this->withToken($token)
        ->postJson("/api/mobile/messages/{$first->id}/replies", [
            'contenu' => 'Deuxième réponse.',
        ])
        ->assertCreated();

    $second = Message::query()->where('contenu', 'Deuxième réponse.')->firstOrFail();
    expect($second->parent_id)->toBe($root->id);
    expect($second->message_group_uuid)->toBe('grp-test');
    expect($second->receiver_id)->toBe($receiver->id);
    expect($second->type_message)->toBe('reply');
});

test('reading a message returns its replies', function () {
    $sender = User::factory()->create();
    $receiver = User::factory()->create();

    $root = mobileMessage(['sender_id' => $sender->id, 'receiver_id' => $receiver->id]);

    Message::query()->create([
        'sender_id' => $receiver->id,
        'receiver_id' => $sender->id,
        'sujet' => 'RE: '.$root->sujet,
        'contenu' => 'Réponse insérée.',
        'parent_id' => $root->id,
        'is_delivered' => true,
        'archived' => false,
        'sent_at' => now(),
    ]);

    $token = $receiver->createToken('mobile', ['mobile'])->plainTextToken;

    $this->withToken($token)
        ->getJson("/api/mobile/messages/{$root->id}")
        ->assertOk()
        ->assertJsonStructure([
            'replies' => [[
                'id',
                'content',
                'created_at',
                'sender' => ['id', 'name', 'email', 'role'],
            ]],
        ])
        ->assertJsonPath('replies.0.content', 'Réponse insérée.')
        ->assertJsonPath('id', $root->id);
});
