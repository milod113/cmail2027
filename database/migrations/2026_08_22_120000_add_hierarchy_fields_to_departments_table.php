<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            if (! Schema::hasColumn('departments', 'parent_id')) {
                $table->foreignId('parent_id')
                    ->nullable()
                    ->after('establishment_id')
                    ->constrained('departments')
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('departments', 'category')) {
                $table->string('category', 50)
                    ->default('administratif')
                    ->after('parent_id');
            }

            if (! Schema::hasColumn('departments', 'level_type')) {
                $table->string('level_type', 50)
                    ->default('service')
                    ->after('category');
            }

            if (! Schema::hasColumn('departments', 'manager_user_id')) {
                $table->foreignId('manager_user_id')
                    ->nullable()
                    ->after('level_type')
                    ->constrained('users')
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('departments', 'is_active')) {
                $table->boolean('is_active')
                    ->default(true)
                    ->after('manager_user_id');
            }

            if (! Schema::hasColumn('departments', 'sort_order')) {
                $table->unsignedInteger('sort_order')
                    ->default(0)
                    ->after('is_active');
            }

            if (! Schema::hasColumn('departments', 'description')) {
                $table->text('description')
                    ->nullable()
                    ->after('sort_order');
            }
        });
    }

    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            if (Schema::hasColumn('departments', 'description')) {
                $table->dropColumn('description');
            }
            if (Schema::hasColumn('departments', 'sort_order')) {
                $table->dropColumn('sort_order');
            }
            if (Schema::hasColumn('departments', 'is_active')) {
                $table->dropColumn('is_active');
            }
            if (Schema::hasColumn('departments', 'manager_user_id')) {
                $table->dropConstrainedForeignId('manager_user_id');
            }
            if (Schema::hasColumn('departments', 'level_type')) {
                $table->dropColumn('level_type');
            }
            if (Schema::hasColumn('departments', 'category')) {
                $table->dropColumn('category');
            }
            if (Schema::hasColumn('departments', 'parent_id')) {
                $table->dropConstrainedForeignId('parent_id');
            }
        });
    }
};
