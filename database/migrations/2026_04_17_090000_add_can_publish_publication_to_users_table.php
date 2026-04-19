<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('can_publish_publication')
                ->default(false)
                ->after('is_super_admin');
        });

        DB::table('users')
            ->where('is_super_admin', true)
            ->update(['can_publish_publication' => true]);

        $publishRoleIds = DB::table('roles')
            ->whereIn(DB::raw('LOWER(nom_role)'), ['admin', 'superadmin', 'directeur'])
            ->pluck('id');

        if ($publishRoleIds->isNotEmpty()) {
            DB::table('users')
                ->whereIn('role_id', $publishRoleIds->all())
                ->update(['can_publish_publication' => true]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('can_publish_publication');
        });
    }
};
