<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->string('category', 50)->default('information')->after('type_message')->index();
            $table->string('category_source', 20)->default('rules')->after('category');
            $table->decimal('category_confidence', 5, 2)->nullable()->after('category_source');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex(['category']);
            $table->dropColumn(['category', 'category_source', 'category_confidence']);
        });
    }
};
