<?php

namespace App\Http\Middleware;

use App\Models\UserSetting;
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
                'user' => fn () => $this->resolveAuthUser($request),
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

    /**
     * Resolve authenticated user payload shared with Inertia.
     *
     * @return array<string, mixed>|null
     */
    private function resolveAuthUser(Request $request): ?array
    {
        $user = $request->user();

        if (! $user) {
            return null;
        }

        $user->loadMissing([
            'role:id,nom_role',
            'department:id,name',
            'userSetting.delegateUser:id,name,email',
        ]);

        $settings = $user->userSetting;

        $hasActiveDelegation = (bool) (
            $settings?->is_out_of_office
            && $settings?->redirect_messages
            && $settings?->delegate_user_id
        );

        return [
            ...$user->toArray(),
            'role' => $user->role?->nom_role,
            'role_details' => $user->role
                ? $user->role->only(['id', 'nom_role'])
                : null,
            'department_name' => $user->department?->name,
            'settings' => $settings
                ? [
                    'id' => $settings->id,
                    'custom_signature' => $settings->custom_signature,
                    'use_auto_signature' => $settings->use_auto_signature,
                    'is_out_of_office' => $settings->is_out_of_office,
                    'ooo_message' => $settings->ooo_message,
                    'redirect_messages' => $settings->redirect_messages,
                    'delegate_user_id' => $settings->delegate_user_id,
                    'delegate_user' => $settings->delegateUser
                        ? [
                            'id' => $settings->delegateUser->id,
                            'name' => $settings->delegateUser->name,
                            'email' => $settings->delegateUser->email,
                        ]
                        : null,
                ]
                : null,
            'signature' => $user->formatted_signature,
            'delegation_reminder' => $hasActiveDelegation
                ? [
                    'is_active' => true,
                    'delegate_user' => $settings?->delegateUser
                        ? [
                            'id' => $settings->delegateUser->id,
                            'name' => $settings->delegateUser->name,
                            'email' => $settings->delegateUser->email,
                        ]
                        : null,
                ]
                : null,
        ];
    }
}
