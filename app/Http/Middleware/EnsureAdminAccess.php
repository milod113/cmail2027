<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminAccess
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(403);
        }

        $user->loadMissing('role:id,nom_role');

        $roleName = Str::lower((string) optional($user->role)->nom_role);
        $isAdminRole = in_array($roleName, ['admin', 'superadmin'], true);

        abort_unless((bool) $user->is_super_admin || $isAdminRole, 403);

        return $next($request);
    }
}
