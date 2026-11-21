<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('positions', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('code')->nullable()->unique();
            $table->foreignId('organizational_unit_id')->constrained()->cascadeOnDelete();
            $table->foreignId('role_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('reports_to_position_id')->nullable()->constrained('positions')->nullOnDelete();
            $table->boolean('is_head')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('hierarchy_order')->default(0);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['organizational_unit_id', 'is_active']);
            $table->index(['reports_to_position_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('positions');
    }
};
