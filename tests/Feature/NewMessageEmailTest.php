<?php

use App\Jobs\ProcessScheduledMessages;
use App\Models\Message;
use App\Models\Role;
use App\Models\User;
use App\Notifications\NewMessageEmailNotification;
use App\Support\MessageEmailNotifier;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

/**
 * E-mail « nouveau message » : envoyé au destinataire à la livraison, jamais le contenu.
 * (Base dédiée `cmail_test`, voir phpunit.xml.)
 */
beforeEach(function () {
    expect(DB::getDatabaseName())->toBe('cmail_test');
    Notification::fake();
    Cache::flush();
    MessageEmailNotifier::$enabled = true;

    $role = Role::query()->create(['nom_role' => 'User']);
    $mk = fn (string $n, array $x = []) => User::factory()->create(['role_id' => $role->id, 'name' => $n, 'email' => strtolower($n).'@test.dz'] + $x);
    $this->alice = $mk('Alice');
    $this->bob = $mk('Bob');

    $this->send = fn (array $x = []) => Message::query()->create($x + [
        'sender_id' => $this->alice->id, 'receiver_id' => $this->bob->id, 'receiver_ids' => [$this->bob->id],
        'sujet' => 'Bilan patient', 'contenu' => 'SECRET MEDICAL : résultats confidentiels',
        'sent_at' => now(), 'status' => 'sent', 'is_delivered' => true, 'envoye' => true, 'type_message' => 'normal',
    ]);
});

it('envoie un e-mail au destinataire quand un message est livré', function () {
    ($this->send)();
    Notification::assertSentTo($this->bob, NewMessageEmailNotification::class);
    Notification::assertNotSentTo($this->alice, NewMessageEmailNotification::class);
});

it("l'e-mail (HTML et texte) ne contient jamais le texte du message", function () {
    $m = ($this->send)(['important' => true, 'requires_receipt' => true, 'deadline_reponse' => now()->addDay()]);
    $n = new NewMessageEmailNotification($m->id);
    $mail = $n->toMail($this->bob);
    $data = $n->viewData($this->bob);
    $html = view('emails.new-message', $data)->render();
    $text = view('emails.new-message-text', $data)->render();

    expect($mail->subject)->toContain('Alice')->toContain('[Important]');
    foreach ([$html, $text] as $out) {
        expect($out)->toContain('Bilan patient')->toContain('accusé de réception')->toContain('Réponse attendue');
        expect($out)->not->toContain('SECRET MEDICAL');
    }
});

it("message programmé : e-mail seulement à la livraison", function () {
    ($this->send)(['status' => 'scheduled', 'is_delivered' => false, 'envoye' => false, 'sent_at' => null, 'scheduled_at' => now()->subMinute()]);
    Notification::assertNothingSent();

    (new ProcessScheduledMessages)->handle();
    Notification::assertSentToTimes($this->bob, NewMessageEmailNotification::class, 1);
});

it('pas d\'e-mail si le destinataire a désactivé l\'option', function () {
    $this->bob->settings()->create(['email_notifications' => false]);
    ($this->send)();
    Notification::assertNothingSent();
});

it('pas d\'e-mail pour un compte bloqué, une adresse invalide ou un message à soi-même', function () {
    $this->bob->forceFill(['is_blocked' => true])->save();
    ($this->send)();
    $this->bob->forceFill(['is_blocked' => false, 'email' => 'pas-une-adresse'])->save();
    ($this->send)();
    ($this->send)(['receiver_id' => $this->alice->id]);
    Notification::assertNothingSent();
});

it('un seul e-mail par message, même si la livraison est signalée deux fois', function () {
    $m = ($this->send)();
    MessageEmailNotifier::delivered($m);
    Notification::assertSentToTimes($this->bob, NewMessageEmailNotification::class, 1);
});

it("le réglage se change depuis l'application mobile", function () {
    \Laravel\Sanctum\Sanctum::actingAs($this->bob, ['*']);
    $this->getJson('/api/mobile/profile')->assertJsonPath('settings.email_notifications', true);

    $this->putJson('/api/mobile/profile/email-notifications', ['enabled' => false])
        ->assertOk()
        ->assertJsonPath('profile.settings.email_notifications', false);

    ($this->send)();
    Notification::assertNothingSent();
});
