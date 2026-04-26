<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('message_tasks', function (Blueprint $table): void {
            $table->foreignId('owner_id')
                ->nullable()
                ->after('message_id')
                ->constrained('users')
                ->nullOnDelete();
            $table->foreignId('meeting_id')
                ->nullable()
                ->after('owner_id')
                ->constrained('meetings')
                ->cascadeOnDelete();
            $table->foreignId('meeting_topic_id')
                ->nullable()
                ->after('meeting_id')
                ->constrained('meeting_topics')
                ->cascadeOnDelete();
            $table->foreignId('meeting_topic_action_id')
                ->nullable()
                ->after('meeting_topic_id')
                ->constrained('meeting_topic_actions')
                ->nullOnDelete();
            $table->foreignId('message_id')
                ->nullable()
                ->change();

            $table->index(['owner_id', 'is_completed']);
            $table->index(['meeting_id', 'meeting_topic_id']);
        });
    }

    public function down(): void
    {
        Schema::table('message_tasks', function (Blueprint $table): void {
            $table->dropIndex(['owner_id', 'is_completed']);
            $table->dropIndex(['meeting_id', 'meeting_topic_id']);
            $table->dropConstrainedForeignId('meeting_topic_action_id');
            $table->dropConstrainedForeignId('meeting_topic_id');
            $table->dropConstrainedForeignId('meeting_id');
            $table->dropConstrainedForeignId('owner_id');
            $table->foreignId('message_id')
                ->nullable(false)
                ->change();
        });
    }
};
