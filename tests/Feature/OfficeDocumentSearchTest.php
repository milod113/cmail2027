<?php

use App\Jobs\ProcessDocumentOcrJob;
use App\Models\AttachmentText;
use App\Support\Attachments;
use App\Support\DocumentTextExtractor;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Pièces jointes bureautiques (Word, Excel, PowerPoint, LibreOffice, CSV, RTF) :
 * texte lu directement, sans OCR, puis cherchable comme les scans.
 */
beforeEach(fn () => expect(DB::getDatabaseName())->toBe('cmail_test'));

dataset('documents', [
    'Word (texte, tableau, en-tête)' => ['compte-rendu-hygiene.docx', ['nosocomiales', 'Néonatologie | Dr Zerrouki | 15/12/2026', 'Direction des Ressources Humaines']],
    'Excel (2 feuilles, nombres)' => ['stock-pharmacie.xlsx', ['Feuille : Pharmacie', 'Ceftriaxone 1g | 120 | Biopharm', 'Défibrillateur Zoll | 88412']],
    'PowerPoint' => ['plan-blanc.pptx', ['Plan blanc 2026', 'Triage des victimes par le SAMU']],
    'LibreOffice Writer' => ['note-parking.odt', ['Note de service', 'travaux de bitumage']],
    'CSV (Windows-1252)' => ['gardes.csv', ['HADJ;Pédiatrie']],
    'RTF (accents codés)' => ['courrier.rtf', ['demande de congé annuel', 'Service de radiologie']],
]);

it('lit le texte du document', function (string $file, array $expected) {
    $text = ProcessDocumentOcrJob::clean(DocumentTextExtractor::extract(base_path('tests/Fixtures/documents/'.$file)));
    foreach ($expected as $e) {
        expect($text)->toContain($e);
    }
})->with('documents');

it("analyse la pièce jointe en file d'attente et la rend cherchable", function () {
    Storage::fake(Attachments::DISK);
    config(['ocr.enabled' => true]);
    $path = Attachments::store(new UploadedFile(base_path('tests/Fixtures/documents/stock-pharmacie.xlsx'), 'stock.xlsx', null, null, true), 'messages');
    AttachmentText::query()->create(['path' => $path, 'ocr_status' => 'pending']);

    (new ProcessDocumentOcrJob($path))->handle();

    $row = AttachmentText::query()->where('path', $path)->first();
    expect($row->ocr_status)->toBe('completed');
    expect($row->method)->toBe('document');
    expect($row->ocr_text)->toContain('Amoxicilline');
});

it("garde l'extension d'origine (Word, PowerPoint) et bloque les extensions dangereuses", function () {
    $f = fn (string $n) => new UploadedFile(base_path('tests/Fixtures/documents/'.$n), $n, null, null, true);
    expect(Attachments::extensionFor($f('compte-rendu-hygiene.docx')))->toBe('docx');
    expect(Attachments::extensionFor($f('plan-blanc.pptx')))->toBe('pptx');
    expect(Attachments::extensionFor(UploadedFile::fake()->createWithContent('shell.php', '<?php echo 1;')))->not->toBe('php');
});

it('signale clairement un ancien format binaire (.doc) ou un fichier corrompu', function () {
    $tmp = tempnam(sys_get_temp_dir(), 'doc').'.docx';
    file_put_contents($tmp, 'pas une archive');
    expect(fn () => DocumentTextExtractor::extract($tmp))->toThrow(RuntimeException::class);
    @unlink($tmp);
});
