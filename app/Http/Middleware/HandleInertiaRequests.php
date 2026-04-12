<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $locale = in_array(app()->getLocale(), ['fr', 'ar'], true)
            ? app()->getLocale()
            : 'fr';
        $translationPath = lang_path("{$locale}.json");

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
            ],
            'current_locale' => $locale,
            'translations' => File::exists($translationPath)
                ? json_decode(File::get($translationPath), true, 512, JSON_THROW_ON_ERROR)
                : [],
        ];
    }
}
