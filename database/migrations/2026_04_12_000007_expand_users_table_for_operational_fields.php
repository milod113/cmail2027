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
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->nullable()->unique()->after('name');
            $table->foreignId('department_id')
                ->nullable()
                ->after('username')
                ->constrained('departments')
                ->nullOnDelete();
            $table->boolean('is_blocked')->default(false)->after('remember_token');
            $table->boolean('is_online')->default(false)->after('is_blocked');
            $table->boolean('acknowledged_notice')->default(false)->after('is_online');
            $table->foreignId('replaces_user_id')
                ->nullable()
                ->after('acknowledged_notice')
                ->constrained('users')
                ->nullOnDelete();
            $table->boolean('can_read')->default(false)->after('replaces_user_id');
            $table->boolean('can_respond')->default(false)->after('can_read');
            $table->boolean('can_transfer')->default(false)->after('can_respond');
            $table->foreignId('redirect_user_id')
                ->nullable()
                ->after('can_transfer')
                ->constrained('users')
                ->nullOnDelete();
            $table->text('custom_message')->nullable()->after('redirect_user_id');
            $table->text('gmail_token')->nullable()->after('custom_message');
            $table->text('gmail_refresh_token')->nullable()->after('gmail_token');
            $table->integer('gmail_expires_in')->nullable()->after('gmail_refresh_token');
            $table->string('imap_username')->nullable()->after('gmail_expires_in');
            $table->text('imap_password')->nullable()->after('imap_username');
            $table->boolean('is_directeur_de_garde')->default(false)->after('imap_password');
            $table->boolean('is_super_admin')->default(false)->after('is_directeur_de_garde');
            $table->date('remplacement_debut')->nullable()->after('is_super_admin');
            $table->date('remplacement_fin')->nullable()->after('remplacement_debut');
        });

        $users = DB::table('users')->select('id', 'name', 'email')->get();

        foreach ($users as $user) {
            $base = Str::slug(Str::before((string) $user->email, '@'), '.');
            $base = $base !== '' ? $base : 'user-'.$user->id;
            $username = $base;
            $suffix = 1;

            while (
                DB::table('users')
                    ->where('username', $username)
                    ->where('id', '!=', $user->id)
                    ->exists()
            ) {
                $username = $base.'-'.$suffix;
                $suffix++;
            }

            DB::table('users')
                ->where('id', $user->id)
                ->update(['username' => $username]);
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('department_id');
            $table->dropConstrainedForeignId('replaces_user_id');
            $table->dropConstrainedForeignId('redirect_user_id');
            $table->dropUnique('users_username_unique');
            $table->dropColumn([
                'username',
                'is_blocked',
                'is_online',
                'acknowledged_notice',
                'can_read',
                'can_respond',
                'can_transfer',
                'custom_message',
                'gmail_token',
                'gmail_refresh_token',
                'gmail_expires_in',
                'imap_username',
                'imap_password',
                'is_directeur_de_garde',
                'is_super_admin',
                'remplacement_debut',
                'remplacement_fin',
            ]);
        });
    }
};
