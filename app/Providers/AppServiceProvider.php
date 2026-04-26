<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        Gate::define('create-publication', function (User $user): bool {
            if ((bool) $user->can_publish_publication) {
                return true;
            }

            $roleName = strtolower((string) optional($user->role)->nom_role);

            return in_array($roleName, ['admin', 'superadmin', 'directeur'], true);
        });

        Gate::define('organize-events', function (User $user): bool {
            return $user->canOrganizeEvents();
        });

        Gate::define('organize-meetings', function (User $user): bool {
            return $user->canOrganizeMeetings();
        });
    }
}
