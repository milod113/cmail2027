<?php

use App\Models\Message;
use App\Models\Role;
use App\Models\User;
use App\Support\Attachments;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Pièces jointes privées : seules les personnes concernées par le message peuvent les ouvrir.
 * (Ces tests tournent sur la base dédiée `cmail_test`, voir phpunit.xml.)
 */
beforeEach(function () {
    // Garde-fou : ne jamais exécuter ces tests (RefreshDatabase) sur la vraie base.
    expect(DB::getDatabaseName())->toBe('cmail_test');

    Storage::fake(Attachments::DISK);
    Storage::fake(Attachments::LEGACY_DISK);

    $role = Role::query()->create(['nom_role' => 'User']);
    $mk = fn (string $n) => User::factory()->create(['role_id' => $role->id, 'name' => $n, 'email' => strtolower($n).'@test.dz']);
    $this->alice = $mk('Alice'); // expéditrice
    $this->bob = $mk('Bob');     // destinataire
    $this->eve = $mk('Eve');     // étrangère au message

    $this->path = Attachments::store(UploadedFile::fake()->create('bilan.pdf', 50, 'application/pdf'), 'messages');
    $this->message = Message::query()->create([
        'sender_id' => $this->alice->id, 'receiver_id' => $this->bob->id,
        'receiver_ids' => [$this->bob->id], 'sujet' => 'Bilan', 'contenu' => 'Voir pièce jointe',
        'fichier' => $this->path, 'sent_at' => now(), 'status' => 'sent',
        'is_delivered' => true, 'envoye' => true, 'type_message' => 'normal',
    ]);
});

it('stocke les nouveaux fichiers en privé, jamais dans le dossier public', function () {
    Storage::disk(Attachments::DISK)->assertExists($this->path);
    Storage::disk(Attachments::LEGACY_DISK)->assertMissing($this->path);
});

it('refuse un visiteur non connecté', function () {
    $this->get(Attachments::webUrl('message', $this->message->id, $this->path))->assertStatus(401);
});

it('répond pareil pour un fichier interdit et un fichier inexistant (pas de fuite)', function () {
    $this->actingAs($this->eve)
        ->get(Attachments::webUrl('message', $this->message->id + 999, 'x.pdf'))
        ->assertForbidden();
});

it('refuse une personne étrangère au message', function () {
    $this->actingAs($this->eve)
        ->get(Attachments::webUrl('message', $this->message->id, $this->path))
        ->assertForbidden();
});

it('applique les mêmes règles avec un jeton mobile (Bearer)', function () {
    $url = Attachments::webUrl('message', $this->message->id, $this->path);

    \Laravel\Sanctum\Sanctum::actingAs($this->eve, ['*']);
    $this->getJson($url)->assertForbidden();

    \Laravel\Sanctum\Sanctum::actingAs($this->bob, ['*']);
    $this->get($url)->assertOk();
});

it("autorise l'expéditeur et le destinataire, sans mise en cache", function () {
    foreach ([$this->alice, $this->bob] as $u) {
        $r = $this->actingAs($u)->get(Attachments::webUrl('message', $this->message->id, $this->path));
        $r->assertOk();
        expect($r->headers->get('Content-Type'))->toContain('application/pdf');
        expect($r->headers->get('Cache-Control'))->toContain('no-store');
        expect($r->headers->get('X-Content-Type-Options'))->toBe('nosniff');
    }
});

it('autorise un lien signé valide et refuse un lien falsifié ou expiré', function () {
    $signed = Attachments::signedUrl('message', $this->message->id, $this->path, $this->bob->id);
    $this->get($signed)->assertOk();

    // signature modifiée
    $this->get(preg_replace('/signature=[a-f0-9]+/', 'signature=deadbeef', $signed))->assertForbidden();
    // identifiant modifié : la signature ne correspond plus à l'adresse
    $this->get(str_replace('/message/'.$this->message->id.'/', '/message/'.($this->message->id + 1).'/', $signed))
        ->assertForbidden();

    // lien expiré
    $this->travel(Attachments::SIGNED_TTL_HOURS + 1)->hours();
    $this->get($signed)->assertForbidden();
});

it("un lien signé n'ouvre pas le fichier à quelqu'un qui n'y a plus droit", function () {
    // lien remis à Eve (étrangère) : refusé même avec une signature valide
    $signed = Attachments::signedUrl('message', $this->message->id, $this->path, $this->eve->id);
    $this->get($signed)->assertForbidden();
});

it("l'ancien lien public /storage ne fonctionne plus après déplacement des anciens fichiers", function () {
    $legacy = 'messages/ancien.pdf';
    Storage::disk(Attachments::LEGACY_DISK)->put($legacy, 'pdf-ancien');
    $m = Message::query()->create([
        'sender_id' => $this->alice->id, 'receiver_id' => $this->bob->id, 'receiver_ids' => [$this->bob->id],
        'sujet' => 'Ancien', 'contenu' => 'x', 'fichier' => $legacy, 'sent_at' => now(), 'status' => 'sent',
        'is_delivered' => true, 'envoye' => true, 'type_message' => 'normal',
    ]);

    // Avant déplacement : lisible via la route sécurisée (compatibilité)
    $this->actingAs($this->bob)->get(Attachments::webUrl('message', $m->id, $legacy))->assertOk();

    $this->artisan('attachments:secure')->assertSuccessful();

    Storage::disk(Attachments::LEGACY_DISK)->assertMissing($legacy);   // plus de lien public
    Storage::disk(Attachments::DISK)->assertExists($legacy);
    $this->actingAs($this->bob)->get(Attachments::webUrl('message', $m->id, $legacy))->assertOk();
    $this->actingAs($this->eve)->get(Attachments::webUrl('message', $m->id, $legacy))->assertForbidden();
});

it("réserve la pièce jointe d'un brouillon à son auteur", function () {
    $p = Attachments::store(UploadedFile::fake()->create('brouillon.pdf', 10, 'application/pdf'), 'message-drafts');
    $d = \App\Models\MessageDraft::query()->create([
        'sender_id' => $this->alice->id, 'receiver_ids' => [], 'sujet' => '', 'contenu' => '', 'fichier' => $p,
    ]);
    $url = Attachments::webUrl('draft', $d->id, $p);
    $this->actingAs($this->alice)->get($url)->assertOk();
    $this->actingAs($this->bob)->get($url)->assertForbidden();
});

it('ne sert jamais un fichier HTML en ligne', function () {
    $p = Attachments::store(UploadedFile::fake()->createWithContent('page.html', '<script>alert(1)</script>'), 'messages');
    $m = Message::query()->create([
        'sender_id' => $this->alice->id, 'receiver_id' => $this->bob->id, 'receiver_ids' => [$this->bob->id],
        'sujet' => 'H', 'contenu' => 'x', 'fichier' => $p, 'sent_at' => now(), 'status' => 'sent',
        'is_delivered' => true, 'envoye' => true, 'type_message' => 'normal',
    ]);
    $r = $this->actingAs($this->bob)->get(Attachments::webUrl('message', $m->id, $p));
    $r->assertOk();
    expect($r->headers->get('Content-Disposition'))->toStartWith('attachment');
    expect($r->headers->get('Content-Type'))->not->toContain('html');
});
