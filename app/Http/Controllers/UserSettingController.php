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
                $delegateSettings?->is_out_of_office &&
                $delegateSettings?->redirect_messages &&
                $delegateSettings?->delegate_user_id
            ) {
                throw ValidationException::withMessages([
                    'delegate_user_id' => 'Ce collegue est deja absent avec une redirection active. Choisissez un autre remplacant.',
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

        return back()->with('success', 'Parametres d absence enregistres avec succes.');
    }

    public function updateEscalation(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'escalation_enabled' => ['required', 'boolean'],
            'backup_user_id' => ['nullable', 'integer', 'exists:users,id', 'not_in:'.$user->id],
            'escalation_timeout' => ['required', 'integer', 'min:1', 'max:1440'],
        ]);

        if (! $validated['escalation_enabled']) {
            $validated['backup_user_id'] = null;
        }

        UserSetting::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'escalation_enabled' => $validated['escalation_enabled'],
                'backup_user_id' => $validated['backup_user_id'] ?? null,
                'escalation_timeout' => $validated['escalation_timeout'],
            ],
        );

        return back()->with('success', 'Parametres d escalation enregistres avec succes.');
    }
}
