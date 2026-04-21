<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PresenceController extends Controller
{
    public function ping(Request $request): JsonResponse
    {
        $user = $request->user();

        $user->forceFill([
            'is_online' => true,
            'last_seen_at' => now(),
        ])->save();

        return response()->json([
            'ok' => true,
            'last_seen_at' => optional($user->last_seen_at)->toIso8601String(),
        ]);
    }
}
