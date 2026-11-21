<?php

use App\Models\User;

test('contacts endpoint requires authentication', function () {
    $this->getJson('/api/mobile/contacts')->assertUnauthorized();
});

test('authenticated user can list contacts with pagination', function () {
    $user = User::factory()->create();
    User::factory()->count(3)->create();

    $token = $user->createToken('mobile', ['mobile'])->plainTextToken;

    $this->withToken($token)
        ->getJson('/api/mobile/contacts')
        ->assertOk()
        ->assertJsonStructure([
            'data' => [['id', 'name', 'username', 'email', 'is_online', 'is_favorite']],
            'meta' => ['current_page', 'last_page', 'total'],
        ])
        ->assertJsonCount(3, 'data')
        ->assertJsonMissing(['data' => [['id' => $user->id]]])
        ->assertJsonPath('meta.total', 3);
});

test('contacts can be searched by name', function () {
    $user = User::factory()->create();
    $contact = User::factory()->create(['name' => 'Unique Contact Name']);

    $token = $user->createToken('mobile', ['mobile'])->plainTextToken;

    $this->withToken($token)
        ->getJson('/api/mobile/contacts?search=Unique')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Unique Contact Name');
});

test('contacts expose the favorite flag of the authenticated user', function () {
    $user = User::factory()->create();
    $contact = User::factory()->create(['name' => 'Favorite Person']);
    $user->favoriteContacts()->attach($contact->id);

    $token = $user->createToken('mobile', ['mobile'])->plainTextToken;

    $this->withToken($token)
        ->getJson('/api/mobile/contacts?search=Favorite')
        ->assertOk()
        ->assertJsonPath('data.0.is_favorite', true);
});
