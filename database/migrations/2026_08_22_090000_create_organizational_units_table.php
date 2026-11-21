<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizational_units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('establishment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('organization_level_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code')->nullable()->unique();
            $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('organizational_units')->nullOnDelete();
            $table->foreignId('manager_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['parent_id', 'is_active']);
            $table->index(['department_id', 'is_active']);
            $table->index(['establishment_id', 'organization_level_id', 'is_active'], 'org_units_establishment_level_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organizational_units');
    }
};
