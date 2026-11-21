<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('global_announcements')) {
            Schema::create('global_announcements', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->longText('content');
                $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
                $table->string('audience_type')->default('all');
                $table->foreignId('role_id')->nullable()->constrained('roles')->nullOnDelete();
                $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
                $table->string('priority')->default('normal');
                $table->timestamp('starts_at')->nullable();
                $table->timestamp('ends_at')->nullable();
                $table->boolean('is_published')->default(false);
                $table->boolean('requires_acknowledgement')->default(false);
                $table->boolean('is_pinned')->default(true);
                $table->timestamp('published_at')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('global_announcement_user')) {
            Schema::create('global_announcement_user', function (Blueprint $table) {
                $table->id();
                $table->foreignId('global_announcement_id')->constrained('global_announcements')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->boolean('is_read')->default(false);
                $table->timestamp('read_at')->nullable();
                $table->boolean('is_acknowledged')->default(false);
                $table->timestamp('acknowledged_at')->nullable();
                $table->timestamps();

                $table->unique(['global_announcement_id', 'user_id'], 'announcement_user_unique');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('global_announcement_user');
        Schema::dropIfExists('global_announcements');
    }
};
