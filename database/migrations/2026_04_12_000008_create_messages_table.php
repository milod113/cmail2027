<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('receiver_id')->constrained('users')->cascadeOnDelete();
            $table->string('sujet');
            $table->longText('contenu');
            $table->string('fichier')->nullable();
            $table->timestamp('lu_le')->nullable();
            $table->boolean('lu')->default(false);
            $table->boolean('spam')->default(false);
            $table->boolean('important')->default(false);
            $table->timestamp('sent_at')->nullable();
            $table->boolean('requires_receipt')->default(false);
            $table->timestamp('receipt_requested_at')->nullable();
            $table->timestamp('scheduled_at')->nullable();
            $table->boolean('archived')->default(false);
            $table->string('type_message')->default('normal');
            $table->boolean('envoye')->default(false);
            $table->timestamp('deadline_reponse')->nullable();
            $table->boolean('can_be_redirected')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
