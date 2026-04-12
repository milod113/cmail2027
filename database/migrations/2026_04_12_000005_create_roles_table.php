<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('nom_role')->unique();
            $table->boolean('is_protected')->default(false)->comment('Determines if the role is protected and cannot be deleted or modified');
            $table->boolean('is_unique')->default(false)->comment('If true, this role can only be assigned to one user');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
