<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class UserSettingController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'is_out_of_office' => ['required', 'boolean'],
            'ooo_message' => ['nullable', 'string', 'max:5000'],
            'redirect_messages' => ['required', 'boolean'],
            'delegate_user_id' => ['nullable', 'integer', 'exists:users,id', 'not_in:'.$user->id],
        ]);

        if (! $validated['is_out_of_office']) {
            $validated['redirect_messages'] = false;
            $validated['delegate_user_id'] = null;
        }

        if (! $validated['redirect_messages']) {
            $validated['delegate_user_id'] = null;
        }

        if ($validated['redirect_messages'] && $validated['delegate_user_id']) {
            $delegate = User::query()
                ->with('userSetting')
                ->findOrFail($validated['delegate_user_id']);

            $delegateSettings = $delegate->userSetting;

            if (
                $delegateSettings?->is_out_of_office
                && $delegateSettings?->redirect_messages
                && $delegateSettings?->delegate_user_id
            ) {
                throw ValidationException::withMessages([
                    'delegate_user_id' => 'Ce collègue est déjà absent avec une redirection active. Choisissez un autre remplaçant.',
                ]);
            }
        }

        UserSetting::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'is_out_of_office' => $validated['is_out_of_office'],
                'ooo_message' => $validated['ooo_message'] ?? null,
                'redirect_messages' => $validated['redirect_messages'],
                'delegate_user_id' => $validated['delegate_user_id'] ?? null,
            ],
        );

        return back()->with('success', 'Paramètres d’absence enregistrés avec succès.');
    }
}
