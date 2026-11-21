<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * API mobile : un compte bloqué par l'administrateur perd immédiatement l'accès,
 * même s'il est déjà connecté sur un téléphone (son jeton est supprimé).
 *
 * Répond 401 pour que l'application se déconnecte et affiche le motif.
 */
class EnsureUserNotBlocked
{
    public const MESSAGE = 'Votre compte a été bloqué par l\'administrateur. Veuillez contacter le support technique.';

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->is_blocked) {
            // Tous les appareils de cet utilisateur sont déconnectés
            $user->tokens()->delete();

            return response()->json(['message' => self::MESSAGE, 'blocked' => true], 401);
        }

        return $next($request);
    }
}
