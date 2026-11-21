<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('message_escalation_rules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('scope_type', [
                'global',
                'role',
                'department',
                'organizational_unit',
                'position',
                'priority',
            ])->default('global');
            $table->unsignedBigInteger('scope_id')->nullable();
            $table->unsignedInteger('escalate_after_minutes');
            $table->enum('target_type', [
                'manager_user',
                'parent_unit_manager',
                'reports_to_position',
                'specific_user',
                'specific_position',
            ]);
            $table->unsignedBigInteger('target_id')->nullable();
            $table->boolean('stop_after_first_hop')->default(false);
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['scope_type', 'scope_id', 'is_active'], 'message_escalation_scope_idx');
            $table->index(['target_type', 'target_id', 'is_active'], 'message_escalation_target_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_escalation_rules');
    }
};
