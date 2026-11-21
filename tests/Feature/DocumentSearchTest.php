<?php

use App\Jobs\ProcessDocumentOcrJob;
use App\Models\AttachmentText;
use App\Models\Message;
use App\Models\Role;
use App\Models\User;
use App\Support\MessageEmailNotifier;
use App\Support\MessageSearch;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;

/**
 * Recherche dans les documents scannés (OCR) : déclenchement, confidentialité, extraits.
 *
 * Note : l'index FULLTEXT d'InnoDB ne voit pas les lignes d'une transaction non validée
 * (RefreshDatabase) ; ces tests utilisent donc un mot court (« Q7 », recherche LIKE).
 * La recherche plein texte a été vérifiée sur la base réelle.
 */
beforeEach(function () {
    expect(DB::getDatabaseName())->toBe('cmail_test');
    MessageEmailNotifier::$enabled = false;
    config(['ocr.enabled' => true]);
    Queue::fake();

    $role = Role::query()->create(['nom_role' => 'User']);
    $mk = fn (string $n) => User::factory()->create(['role_id' => $role->id, 'name' => $n, 'email' => strtolower($n).'@test.dz']);
    $this->alice = $mk('Alice');
    $this->bob = $mk('Bob');
    $this->eve = $mk('Eve');

    $this->msg = fn (array $x = []) => Message::query()->create($x + [
        'sender_id' => $this->alice->id, 'receiver_id' => $this->bob->id, 'receiver_ids' => [$this->bob->id],
        'sujet' => 'Ordonnance', 'contenu' => 'Voir le document joint.', 'fichier' => 'messages/ordo.pdf',
        'sent_at' => now(), 'status' => 'sent', 'is_delivered' => true, 'envoye' => true, 'type_message' => 'normal',
    ]);
});

it("met le document en file d'analyse OCR à l'envoi, une seule fois par fichier", function () {
    ($this->msg)();
    ($this->msg)(['receiver_id' => $this->eve->id]); // même fichier (envoi groupé / transfert)

    Queue::assertPushed(ProcessDocumentOcrJob::class, 1);
    expect(AttachmentText::query()->where('path', 'messages/ordo.pdf')->value('ocr_status'))->toBe('pending');
});

it("n'analyse pas les fichiers sans texte exploitable (vidéo, archive…)", function () {
    ($this->msg)(['fichier' => 'messages/video.mp4']);
    ($this->msg)(['fichier' => 'messages/archive.zip']);
    Queue::assertNothingPushed();
});

it('trouve le message par le texte du document, avec extrait et badge', function () {
    ($this->msg)();
    AttachmentText::query()->where('path', 'messages/ordo.pdf')->update([
        'ocr_status' => 'completed',
        'ocr_text' => "ORDONNANCE\nPatient : M. X\nProtocole Q7 : Albumine humaine 20% deux flacons\nDr Kaddour",
    ]);

    Sanctum::actingAs($this->bob, ['*']);
    $r = $this->getJson('/api/mobile/messages/search?q=Q7')->assertOk();

    expect($r->json('data'))->toHaveCount(1);
    expect($r->json('data.0.matched_in_ocr'))->toBeTrue();
    expect($r->json('data.0.snippet'))->toContain('Protocole Q7');
    expect(mb_strlen($r->json('data.0.snippet')))->toBeLessThan(170);
});

it("ne montre jamais le message d'une conversation à laquelle on ne participe pas", function () {
    ($this->msg)();
    AttachmentText::query()->where('path', 'messages/ordo.pdf')->update(['ocr_status' => 'completed', 'ocr_text' => 'Protocole Q7']);

    Sanctum::actingAs($this->eve, ['*']);
    $this->getJson('/api/mobile/messages/search?q=Q7')->assertOk()->assertJsonCount(0, 'data');
});

it("n'utilise pas un texte d'analyse non terminée", function () {
    ($this->msg)();
    AttachmentText::query()->where('path', 'messages/ordo.pdf')->update(['ocr_status' => 'processing', 'ocr_text' => 'Protocole Q7']);

    Sanctum::actingAs($this->bob, ['*']);
    $this->getJson('/api/mobile/messages/search?q=Q7')->assertOk()->assertJsonCount(0, 'data');
});

it("exclut les messages que l'utilisateur a supprimés", function () {
    ($this->msg)()->forceFill(['receiver_deleted_at' => now()])->save();
    AttachmentText::query()->where('path', 'messages/ordo.pdf')->update(['ocr_status' => 'completed', 'ocr_text' => 'Protocole Q7']);

    Sanctum::actingAs($this->bob, ['*']);
    $this->getJson('/api/mobile/messages/search?q=Q7')->assertOk()->assertJsonCount(0, 'data');
});

it('exige au moins 2 caractères', function () {
    Sanctum::actingAs($this->bob, ['*']);
    $this->getJson('/api/mobile/messages/search?q=a')->assertUnprocessable();
});

it("construit l'extrait sans tenir compte des accents (français et arabe)", function () {
    $text = 'Début du document. Prescription : Héparine sodique 5000 UI deux fois par jour. Fin.';
    expect(MessageSearch::snippet($text, 'heparine'))->toContain('Héparine sodique');
    expect(MessageSearch::snippet($text, 'insuline'))->toBeNull();

    $ar = 'وصفة طبية للمريض: الألبومين البشري قارورتان';
    expect(MessageSearch::snippet($ar, 'الالبومين'))->toContain('الألبومين'); // أ = ا
});

it('nettoie le texte reconnu', function () {
    expect(ProcessDocumentOcrJob::clean("  Ligne   1 \r\n\n\n\n Ligne\t2  \f"))->toBe("Ligne 1\n\nLigne 2");
});
