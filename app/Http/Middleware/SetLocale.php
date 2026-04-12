<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $defaultLocale = in_array(config('app.locale'), ['fr', 'ar'], true)
            ? config('app.locale')
            : 'fr';
        $locale = $request->session()->get('locale', $defaultLocale);

        if (! in_array($locale, ['fr', 'ar'], true)) {
            $locale = $defaultLocale;
        }

        app()->setLocale($locale);

        return $next($request);
    }
}
