<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Mobile\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Authenticate a mobile user and issue a Sanctum Bearer token.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::query()
            ->where('email', $request->string('email')->toString())
            ->first();

        if (! $user || ! Hash::check($request->string('password')->toString(), $user->password)) {
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        if ($user->is_blocked) {
            throw ValidationException::withMessages([
                'email' => __('Votre compte est bloqué. Veuillez contacter le support technique.'),
            ]);
        }

        $user->loadMissing(['role', 'department', 'profile']);

        $token = $user->createToken($request->input('device_name', 'mobile'), ['mobile'])->plainTextToken;

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => new UserResource($user),
        ]);
    }

    /**
     * Revoke the current mobile token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => __('Déconnexion réussie.')]);
    }

    /**
     * Return the currently authenticated mobile user.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json(new UserResource($request->user()->loadMissing(['role', 'department', 'profile'])));
    }
}
