<?php

use App\Models\User;
use Illuminate\Support\Str;

test('mobile login returns a bearer token and the user', function () {
    $user = User::factory()->create();

    $response = $this->postJson('/api/mobile/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $response
        ->assertOk()
        ->assertJsonStructure([
            'token',
            'token_type',
            'user' => ['id', 'name', 'email'],
        ])
        ->assertJson(['token_type' => 'Bearer']);

    $this->assertDatabaseHas('personal_access_tokens', [
        'tokenable_id' => $user->id,
        'tokenable_type' => User::class,
    ]);
});

test('mobile login rejects invalid credentials', function () {
    $user = User::factory()->create();

    $this->postJson('/api/mobile/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('email');
});

test('blocked mobile users cannot login', function () {
    $user = User::factory()->create(['is_blocked' => true]);

    $this->postJson('/api/mobile/login', [
        'email' => $user->email,
        'password' => 'password',
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('email');
});

test('authenticated mobile user can fetch their own data via /me', function () {
    $user = User::factory()->create();
    $token = $user->createToken('mobile', ['mobile'])->plainTextToken;

    $this->withToken($token)
        ->getJson('/api/mobile/me')
        ->assertOk()
        ->assertJson(['id' => $user->id, 'email' => $user->email]);
});

test('authenticated mobile user can access the profile endpoint', function () {
    $user = User::factory()->create();
    $token = $user->createToken('mobile', ['mobile'])->plainTextToken;

    $this->withToken($token)
        ->getJson('/api/mobile/profile')
        ->assertOk()
        ->assertJsonPath('email', $user->email);
});

test('mobile logout revokes the current token', function () {
    $user = User::factory()->create();
    $token = $user->createToken('mobile', ['mobile'])->plainTextToken;

    $this->withToken($token)
        ->postJson('/api/mobile/logout')
        ->assertOk()
        ->assertJsonStructure(['message']);

    $this->assertDatabaseCount('personal_access_tokens', 0);
});

test('an unknown or revoked token is rejected', function () {
    $user = User::factory()->create();

    $this->withToken($user->id.'|'.Str::random(40))
        ->getJson('/api/mobile/me')
        ->assertUnauthorized();
});

test('mobile endpoints require authentication', function () {
    $this->getJson('/api/mobile/me')->assertUnauthorized();
    $this->postJson('/api/mobile/logout')->assertUnauthorized();
    $this->getJson('/api/mobile/profile')->assertUnauthorized();
});
