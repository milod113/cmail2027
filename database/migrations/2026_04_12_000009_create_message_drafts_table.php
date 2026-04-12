<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('message_drafts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->json('receiver_ids')->nullable();
            $table->string('sujet')->nullable();
            $table->longText('contenu')->nullable();
            $table->string('fichier')->nullable();
            $table->boolean('important')->default(false);
            $table->boolean('requires_receipt')->default(false);
            $table->timestamp('scheduled_at')->nullable();
            $table->string('type_message')->default('normal');
            $table->timestamp('deadline_reponse')->nullable();
            $table->boolean('can_be_redirected')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_drafts');
    }
};
