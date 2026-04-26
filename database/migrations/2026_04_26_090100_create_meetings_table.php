<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('meetings', function (Blueprint $table): void {
            $table->id();
            $table->string('title');
            $table->enum('type', ['presentiel', 'distanciel']);
            $table->string('location_or_link')->nullable();
            $table->dateTime('start_time');
            $table->dateTime('end_time')->nullable();
            $table->foreignId('organizer_id')->constrained('users')->cascadeOnDelete();
            $table->enum('status', ['planifie', 'en_cours', 'termine', 'annule'])->default('planifie');
            $table->timestamps();

            $table->index(['organizer_id', 'start_time']);
            $table->index(['status', 'start_time']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meetings');
    }
};
