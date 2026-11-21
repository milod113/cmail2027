<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Texte extrait (OCR) des pièces jointes des messages.
 *
 * Une ligne par FICHIER (chemin), pas par message : un même document envoyé à
 * plusieurs destinataires (message groupé, transfert) n'est analysé qu'une fois.
 * Lien avec les messages : attachment_texts.path = messages.fichier.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attachment_texts', function (Blueprint $table) {
            $table->id();
            $table->string('path', 255)->unique();
            $table->enum('ocr_status', ['pending', 'processing', 'completed', 'failed', 'skipped'])->default('pending')->index();
            $table->longText('ocr_text')->nullable();
            $table->string('method', 20)->nullable(); // ocr | text_layer
            $table->unsignedSmallInteger('pages')->nullable();
            $table->text('error')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
        });

        // Index plein texte (MySQL / MariaDB InnoDB) pour MATCH ... AGAINST
        if (in_array(DB::getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement('ALTER TABLE attachment_texts ADD FULLTEXT INDEX attachment_texts_ocr_text_fulltext (ocr_text)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('attachment_texts');
    }
};
