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
                'user' => fn () => $request->user()
                    ? [
                        ...$request->user()->toArray(),
                        'role' => $request->user()->role?->nom_role,
                        'role_details' => $request->user()->role
                            ? $request->user()->role->only(['id', 'nom_role'])
                            : null,
                    ]
                    : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
            ],
            'current_locale' => $locale,
            'translations' => File::exists($translationPath)
                ? json_decode($this->ensureUtf8(File::get($translationPath)), true, 512, JSON_THROW_ON_ERROR)
                : [],
        ];
    }

    /**
     * Ensure the file content is properly UTF-8 encoded.
     */
    private function ensureUtf8(string $content): string
    {
        $encoding = mb_detect_encoding($content, mb_detect_order(), true);
        
        if ($encoding === false || $encoding !== 'UTF-8') {
            return mb_convert_encoding($content, 'UTF-8', $encoding ?: 'Windows-1252');
        }
        
        return $content;
    }
}
