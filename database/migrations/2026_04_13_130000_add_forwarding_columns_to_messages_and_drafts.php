<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->foreignId('forwarded_from_message_id')
                ->nullable()
                ->after('can_be_redirected')
                ->constrained('messages')
                ->nullOnDelete();
        });

        Schema::table('message_drafts', function (Blueprint $table) {
            $table->foreignId('forwarded_from_message_id')
                ->nullable()
                ->after('can_be_redirected')
                ->constrained('messages')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('message_drafts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('forwarded_from_message_id');
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->dropConstrainedForeignId('forwarded_from_message_id');
        });
    }
};
