<?php

use App\Models\ChatMessage;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    config(['broadcasting.default' => 'null']); // pas de serveur Reverb pendant les tests
    Storage::fake('attachments');
});

test('a text message is sent and appears in both histories', function () {
    $me = User::factory()->create();
    $other = User::factory()->create();
    Sanctum::actingAs($me);

    $this->postJson("/api/mobile/chats/{$other->id}/messages", ['body' => '  Bonjour  '])
        ->assertCreated()
        ->assertJsonPath('message.type', 'text')
        ->assertJsonPath('message.body', 'Bonjour')
        ->assertJsonPath('message.direction', 'outgoing');

    Sanctum::actingAs($other);
    $this->getJson("/api/mobile/chats/{$me->id}/messages")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.direction', 'incoming');
});

test('a voice message is stored privately with its duration', function () {
    $me = User::factory()->create();
    $other = User::factory()->create();
    Sanctum::actingAs($me);

    $res = $this->post("/api/mobile/chats/{$other->id}/messages", [
        'audio' => UploadedFile::fake()->create('vocal.m4a', 120, 'audio/mp4'),
        'duration_ms' => 4200,
    ], ['Accept' => 'application/json'])->assertCreated();

    $res->assertJsonPath('message.type', 'voice')->assertJsonPath('message.duration_ms', 4200);
    expect($res->json('message.audio_url'))->toContain('/attachments/chat/');

    $chat = ChatMessage::query()->latest('id')->first();
    Storage::disk('attachments')->assertExists($chat->audio_path);
});

test('an empty message is rejected', function () {
    Sanctum::actingAs(User::factory()->create());
    $other = User::factory()->create();

    $this->postJson("/api/mobile/chats/{$other->id}/messages", ['body' => ''])->assertUnprocessable();
});

test('one cannot chat with oneself', function () {
    Sanctum::actingAs($me = User::factory()->create());

    $this->postJson("/api/mobile/chats/{$me->id}/messages", ['body' => 'test'])->assertForbidden();
});

test('pagination with before and polling with after', function () {
    $me = User::factory()->create();
    $other = User::factory()->create();
    foreach (range(1, 45) as $i) {
        ChatMessage::query()->create(['sender_id' => $other->id, 'receiver_id' => $me->id, 'body' => "m$i"]);
    }
    Sanctum::actingAs($me);

    $page = $this->getJson("/api/mobile/chats/{$other->id}/messages")->assertOk();
    $page->assertJsonCount(40, 'data')->assertJsonPath('has_more', true)->assertJsonPath('data.39.body', 'm45');

    $firstId = $page->json('data.0.id');
    $this->getJson("/api/mobile/chats/{$other->id}/messages?before={$firstId}")
        ->assertJsonCount(5, 'data')->assertJsonPath('has_more', false);

    $lastId = $page->json('data.39.id');
    $this->getJson("/api/mobile/chats/{$other->id}/messages?after={$lastId}")->assertJsonCount(0, 'data');
});

test('conversations list unread counts and mark read clears them', function () {
    $me = User::factory()->create();
    $other = User::factory()->create();
    ChatMessage::query()->create(['sender_id' => $other->id, 'receiver_id' => $me->id, 'body' => 'un']);
    ChatMessage::query()->create(['sender_id' => $other->id, 'receiver_id' => $me->id, 'body' => 'deux']);
    Sanctum::actingAs($me);

    $this->getJson('/api/mobile/chats')
        ->assertOk()
        ->assertJsonPath('data.0.user.id', $other->id)
        ->assertJsonPath('data.0.unread_count', 2)
        ->assertJsonPath('data.0.last_message.preview', 'deux')
        ->assertJsonPath('unread_total', 2);

    $this->postJson("/api/mobile/chats/{$other->id}/read")->assertOk()->assertJsonPath('updated', 2);
    $this->getJson('/api/mobile/chats')->assertJsonPath('unread_total', 0);
});

test('only the two participants can open a voice message', function () {
    $a = User::factory()->create();
    $b = User::factory()->create();
    $intruder = User::factory()->create();
    Storage::disk('attachments')->put('chat-audio/x.m4a', 'audio');
    $chat = ChatMessage::query()->create([
        'sender_id' => $a->id, 'receiver_id' => $b->id, 'type' => 'voice',
        'audio_path' => 'chat-audio/x.m4a', 'duration_ms' => 1000,
    ]);

    $this->actingAs($b)->get("/attachments/chat/{$chat->id}/x.m4a")->assertOk();
    $this->actingAs($intruder)->get("/attachments/chat/{$chat->id}/x.m4a")->assertForbidden();
});

test('the app can join only its own private realtime channel', function () {
    config(['broadcasting.default' => 'reverb']);
    Sanctum::actingAs($me = User::factory()->create());
    $other = User::factory()->create();

    $this->postJson('/api/mobile/broadcasting/auth', [
        'socket_id' => '1234.5678',
        'channel_name' => "private-user.{$me->id}",
    ])->assertOk()->assertJsonStructure(['auth']);

    $this->postJson('/api/mobile/broadcasting/auth', [
        'socket_id' => '1234.5678',
        'channel_name' => "private-user.{$other->id}",
    ])->assertForbidden();
});

test('chat notifications are included in the mobile poll', function () {
    $me = User::factory()->create();
    $other = User::factory()->create();
    Sanctum::actingAs($me);
    $first = $this->getJson('/api/mobile/notifications/poll')->assertOk();
    $cursor = $first->json('latest_chat_id');

    ChatMessage::query()->create(['sender_id' => $other->id, 'receiver_id' => $me->id, 'body' => 'Salut']);

    $this->getJson("/api/mobile/notifications/poll?after_id=0&after_chat_id={$cursor}")
        ->assertOk()
        ->assertJsonCount(1, 'chats')
        ->assertJsonPath('chats.0.sender_id', $other->id)
        ->assertJsonPath('chats.0.preview', 'Salut');
});
