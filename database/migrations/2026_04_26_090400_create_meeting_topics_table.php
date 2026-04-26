<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('meeting_topics', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('meeting_section_id')->constrained('meeting_sections')->cascadeOnDelete();
            $table->string('title');
            $table->unsignedInteger('expected_duration')->nullable();
            $table->enum('status', ['en_attente', 'en_cours', 'traite'])->default('en_attente');
            $table->unsignedInteger('order')->default(0);
            $table->timestamps();

            $table->index(['meeting_section_id', 'order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meeting_topics');
    }
};
