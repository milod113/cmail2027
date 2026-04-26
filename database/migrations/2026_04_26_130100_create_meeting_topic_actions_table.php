<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('meeting_topic_actions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('meeting_topic_id')->constrained()->cascadeOnDelete();
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->text('notes')->nullable();
            $table->dateTime('due_at')->nullable();
            $table->enum('status', ['a_faire', 'en_cours', 'termine'])->default('a_faire');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meeting_topic_actions');
    }
};
