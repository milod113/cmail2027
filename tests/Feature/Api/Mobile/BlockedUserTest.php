<?php

use App\Models\User;

/**
 * Compte bloqué par l'administrateur : plus d'accès à l'application mobile,
 * même pour un téléphone déjà connecté.
 */
test('un téléphone déjà connecté perd l\'accès dès que le compte est bloqué', function () {
    $user = User::factory()->create();
    $token = $user->createToken('mobile', ['mobile'])->plainTextToken;

    // Avant le blocage : accès normal
    $this->withToken($token)->getJson('/api/mobile/me')->assertOk();

    // L'administrateur bloque le compte
    $user->forceFill(['is_blocked' => true])->save();
    $this->app['auth']->forgetGuards(); // requêtes réelles = utilisateur relu en base à chaque appel

    $this->withToken($token)->getJson('/api/mobile/me')
        ->assertUnauthorized()
        ->assertJson(['blocked' => true]);

    // Le jeton est détruit : même débloqué, il faut se reconnecter
    expect($user->tokens()->count())->toBe(0);
    $user->forceFill(['is_blocked' => false])->save();
    $this->app['auth']->forgetGuards();
    $this->withToken($token)->getJson('/api/mobile/me')->assertUnauthorized();
});

test('le blocage depuis l\'administration déconnecte tous les appareils', function () {
    $admin = User::factory()->create(['is_super_admin' => true]);
    $target = User::factory()->create();
    $target->createToken('telephone-1', ['mobile']);
    $target->createToken('telephone-2', ['mobile']);
    expect($target->tokens()->count())->toBe(2);

    $this->actingAs($admin)
        ->patch(route('admin.users.block', $target), ['is_active' => false])
        ->assertRedirect();

    expect($target->fresh()->is_blocked)->toBeTrue();
    expect($target->tokens()->count())->toBe(0);
});

test('le blocage n\'affecte pas les autres utilisateurs', function () {
    $blocked = User::factory()->create(['is_blocked' => true]);
    $ok = User::factory()->create();
    $token = $ok->createToken('mobile', ['mobile'])->plainTextToken;

    $this->withToken($token)->getJson('/api/mobile/me')->assertOk();
    expect($blocked->is_blocked)->toBeTrue();
});
