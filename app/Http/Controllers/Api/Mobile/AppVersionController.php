<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

/**
 * Dernière version de l'application mobile disponible.
 *
 * Publier une mise à jour : copier le nouvel APK dans public/app/cmail.apk puis
 * augmenter « build » (et « version ») dans public/app/version.json.
 */
class AppVersionController extends Controller
{
    public function show(): JsonResponse
    {
        $meta = [];
        $file = public_path('app/version.json');
        if (is_file($file)) {
            $meta = json_decode((string) file_get_contents($file), true) ?: [];
        }

        $hasApk = is_file(public_path('app/cmail.apk'));

        return response()->json([
            'version' => (string) ($meta['version'] ?? '1.0.0'),
            'build' => (int) ($meta['build'] ?? 1),
            'notes' => $meta['notes'] ?? null,
            'force' => (bool) ($meta['force'] ?? false),
            'apk_url' => $hasApk ? url('app/cmail.apk') : null,
        ]);
    }
}
