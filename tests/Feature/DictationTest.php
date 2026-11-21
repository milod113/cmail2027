<?php

use App\Jobs\TranscribeDictationJob;
use App\Models\Dictation;
use App\Models\Role;
use App\Models\User;
use App\Support\Attachments;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

/**
 * Dictée vocale : envoi de l'audio, transcription locale (whisper.cpp), confidentialité.
 */
beforeEach(function () {
    expect(DB::getDatabaseName())->toBe('cmail_test');
    Storage::fake(Attachments::DISK);
    $role = Role::query()->create(['nom_role' => 'User']);
    $this->bob = User::factory()->create(['role_id' => $role->id]);
    $this->eve = User::factory()->create(['role_id' => $role->id]);
    $this->wav = fn () => new UploadedFile(base_path('tests/Fixtures/audio/dictee-fr.wav'), 'dictee.wav', 'audio/wav', null, true);
});

it("accepte une dictée, la met en file et renvoie « en attente »", function () {
    Queue::fake();
    Sanctum::actingAs($this->bob, ['*']);

    $r = $this->post('/api/mobile/dictations', ['audio' => ($this->wav)(), 'language' => 'fr'], ['Accept' => 'application/json'])
        ->assertStatus(202)
        ->assertJson(['status' => 'pending', 'language' => 'fr', 'duration' => 14.5]);

    Queue::assertPushed(TranscribeDictationJob::class, 1);
    Storage::disk(Attachments::DISK)->assertExists(Dictation::query()->find($r->json('id'))->audio_path);
});

it('refuse un format non audio et une dictée trop longue', function () {
    Queue::fake();
    Sanctum::actingAs($this->bob, ['*']);
    config(['dictation.max_seconds' => 5]);

    $this->post('/api/mobile/dictations', ['audio' => UploadedFile::fake()->create('virus.exe', 10)], ['Accept' => 'application/json'])->assertStatus(422);
    $this->post('/api/mobile/dictations', ['audio' => ($this->wav)()], ['Accept' => 'application/json'])->assertStatus(422);
    Queue::assertNothingPushed();
});

it("ne montre jamais la dictée d'un autre utilisateur", function () {
    $d = Dictation::query()->create(['user_id' => $this->bob->id, 'status' => 'completed', 'text' => 'secret']);

    Sanctum::actingAs($this->eve, ['*']);
    $this->getJson("/api/mobile/dictations/{$d->id}")->assertNotFound();
    $this->deleteJson("/api/mobile/dictations/{$d->id}")->assertNotFound();
});

it('transcrit réellement en français et supprime l\'audio', function () {
    $bin = (string) config('dictation.whisper_path');
    if (! is_file($bin) || ! is_file((string) config('dictation.model_path'))) {
        $this->markTestSkipped('whisper.cpp non installé sur cette machine.');
    }

    $path = Storage::disk(Attachments::DISK)->putFileAs('dictations', ($this->wav)(), 'test.wav');
    $d = Dictation::query()->create(['user_id' => $this->bob->id, 'status' => 'pending', 'language' => 'fr', 'audio_path' => $path]);

    (new TranscribeDictationJob($d->id))->handle();
    $d->refresh();

    expect($d->status)->toBe('completed');
    expect($d->text)->toContain('réunion de coordination')->toContain('Cordialement');
    expect($d->audio_path)->toBeNull();
    Storage::disk(Attachments::DISK)->assertMissing($path);
});

it('nettoie les marqueurs de silence', function () {
    expect(TranscribeDictationJob::clean(" [BLANK_AUDIO] Bonjour   à tous. (musique) "))->toBe('Bonjour à tous.');
});
