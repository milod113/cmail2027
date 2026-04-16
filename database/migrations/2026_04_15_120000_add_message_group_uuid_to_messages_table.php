<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->uuid('message_group_uuid')->nullable()->after('can_be_redirected');
            $table->index('message_group_uuid');
        });

        if (! Schema::hasColumn('messages', 'receiver_ids')) {
            return;
        }

        $messages = DB::table('messages')
            ->select([
                'id',
                'sender_id',
                'receiver_ids',
                'sujet',
                'contenu',
                'type_message',
                'sent_at',
                'scheduled_at',
                'created_at',
            ])
            ->whereNotNull('receiver_ids')
            ->orderBy('id')
            ->get();

        $groupedIds = [];

        foreach ($messages->groupBy(function ($message) {
            $receiverIds = collect(json_decode($message->receiver_ids ?? '[]', true) ?: [])
                ->filter()
                ->map(fn ($id) => (int) $id)
                ->sort()
                ->values()
                ->all();

            return implode('|', [
                $message->sender_id,
                json_encode($receiverIds),
                $message->sujet,
                $message->contenu,
                $message->type_message ?? '',
                $message->sent_at ?? $message->scheduled_at ?? $message->created_at,
            ]);
        }) as $group) {
            if ($group->count() < 2) {
                continue;
            }

            $uuid = (string) Str::uuid();

            foreach ($group as $message) {
                $groupedIds[$message->id] = $uuid;
            }
        }

        foreach (array_chunk($groupedIds, 200, true) as $chunk) {
            foreach ($chunk as $id => $uuid) {
                DB::table('messages')
                    ->where('id', $id)
                    ->update(['message_group_uuid' => $uuid]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex(['message_group_uuid']);
            $table->dropColumn('message_group_uuid');
        });
    }
};
