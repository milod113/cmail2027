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
        Schema::create('support_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('category', 50);
            $table->string('impact', 20)->default('normal');
            $table->text('description');
            $table->string('screenshot_path')->nullable();
            $table->string('status', 30)->default('open');
            $table->text('page_url')->nullable();
            $table->text('user_agent')->nullable();
            $table->string('browser', 120)->nullable();
            $table->string('platform', 120)->nullable();
            $table->string('screen_resolution', 40)->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index(['category', 'impact']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('support_tickets');
    }
};
