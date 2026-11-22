<?php

use App\Models\Publication;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

function makePublication(array $attrs = []): Publication
{
    return Publication::query()->create([
        'user_id' => User::factory()->create()->id,
        'title' => 'Annonce test',
        'content' => '<p>Contenu</p>',
        ...$attrs,
    ]);
}

test('like toggles on then off', function () {
    Sanctum::actingAs($user = User::factory()->create());
    $p = makePublication();

    $this->postJson("/api/mobile/publications/{$p->id}/like")
        ->assertOk()->assertJson(['liked' => true, 'likes_count' => 1]);
    $this->postJson("/api/mobile/publications/{$p->id}/like")
        ->assertOk()->assertJson(['liked' => false, 'likes_count' => 0]);
});

test('a comment can be added then listed', function () {
    Sanctum::actingAs($user = User::factory()->create());
    $p = makePublication();

    $this->postJson("/api/mobile/publications/{$p->id}/comments", ['content' => '  Bien reçu  '])
        ->assertCreated()
        ->assertJsonPath('comment.content', 'Bien reçu')
        ->assertJsonPath('comment.mine', true)
        ->assertJsonPath('comments_count', 1);

    $this->getJson("/api/mobile/publications/{$p->id}/comments")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.author.id', $user->id);
});

test('empty comments are rejected', function () {
    Sanctum::actingAs(User::factory()->create());
    $p = makePublication();

    $this->postJson("/api/mobile/publications/{$p->id}/comments", ['content' => ''])
        ->assertUnprocessable();
});

test('archived publications cannot be liked', function () {
    Sanctum::actingAs(User::factory()->create());
    $p = makePublication(['archived' => true]);

    $this->postJson("/api/mobile/publications/{$p->id}/like")->assertNotFound();
});

test('guests cannot like', function () {
    $p = makePublication();
    $this->postJson("/api/mobile/publications/{$p->id}/like")->assertUnauthorized();
});
