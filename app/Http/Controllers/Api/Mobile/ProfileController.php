<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Message;
use App\Models\MessageTask;
use App\Models\Profile;
use App\Models\User;
use App\Models\UserSetting;
use App\Support\MessageAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

/**
 * Profil de l'utilisateur connecté — mêmes fonctions que la page web Profil :
 * informations + photo, signature automatique, absence (redirection),
 * escalade, mot de passe.
 */
class ProfileController extends Controller
{
    /**
     * Profil complet + réglages + statistiques.
     */
    public function show(Request $request): JsonResponse
    {
        return response()->json($this->payload($request->user()));
    }

    /**
     * Mettre à jour les informations (même validation que ProfileUpdateRequest).
     * Envoyé en POST multipart quand une photo est jointe.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique(User::class)->ignore($user->id)],
            'matricule' => ['nullable', 'string', 'max:255', Rule::unique('profiles')->ignore($user->profile?->id)],
            'grade' => ['nullable', 'string', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:20'],
            'adresse' => ['nullable', 'string', 'max:1000'],
            'photo' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:2048'],
            'remove_photo' => ['nullable', 'boolean'],
        ]);

        $user->fill(['name' => $validated['name'], 'email' => $validated['email']]);
        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }
        $user->save();

        $profileData = [
            'matricule' => $validated['matricule'] ?? null,
            'grade' => $validated['grade'] ?? null,
            'telephone' => $validated['telephone'] ?? null,
            'adresse' => $validated['adresse'] ?? null,
        ];

        $oldPhoto = $user->profile?->photo;
        if ($request->hasFile('photo')) {
            $profileData['photo'] = $request->file('photo')->store('profiles/photos', 'public');
        } elseif ($request->boolean('remove_photo')) {
            $profileData['photo'] = null;
        }
        if (array_key_exists('photo', $profileData) && $oldPhoto) {
            Storage::disk('public')->delete($oldPhoto);
        }

        if ($user->profile) {
            $user->profile->update($profileData);
        } else {
            Profile::create($profileData + ['user_id' => $user->id]);
        }

        return response()->json([
            'message' => 'Profil mis à jour avec succès.',
            'profile' => $this->payload($user->fresh()),
        ]);
    }

    /**
     * Signature automatique (même règle que le web).
     */
    public function updateSignature(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'use_auto_signature' => ['required', 'boolean'],
            'custom_signature' => ['nullable', 'string', 'max:5000'],
        ]);

        $user->settings()->updateOrCreate(['user_id' => $user->id], [
            'custom_signature' => $validated['custom_signature'] ?? null,
            'use_auto_signature' => $validated['use_auto_signature'],
        ]);

        return response()->json([
            'message' => 'Signature automatique mise à jour avec succès.',
            'profile' => $this->payload($user->fresh()),
        ]);
    }

    /**
     * Recevoir (ou non) un e-mail à chaque nouveau message Cmail.
     */
    public function updateEmailNotifications(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate(['enabled' => ['required', 'boolean']]);

        $user->settings()->updateOrCreate(['user_id' => $user->id], [
            'email_notifications' => $validated['enabled'],
        ]);

        return response()->json([
            'message' => $validated['enabled']
                ? 'Vous recevrez un e-mail à chaque nouveau message.'
                : 'Les e-mails de nouveaux messages sont désactivés.',
            'profile' => $this->payload($user->fresh()),
        ]);
    }

    /**
     * Absence : message automatique + redirection vers un remplaçant
     * (copie fidèle de UserSettingController::update).
     */
    public function updateOutOfOffice(Request $request): JsonResponse
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
        if ($validated['redirect_messages'] && empty($validated['delegate_user_id'])) {
            throw ValidationException::withMessages([
                'delegate_user_id' => 'Choisissez le collègue qui recevra vos messages.',
            ]);
        }

        if ($validated['redirect_messages'] && $validated['delegate_user_id']) {
            $delegate = User::query()->with('userSetting')->findOrFail($validated['delegate_user_id']);
            $s = $delegate->userSetting;
            if ($s?->is_out_of_office && $s?->redirect_messages && $s?->delegate_user_id) {
                throw ValidationException::withMessages([
                    'delegate_user_id' => 'Ce collègue est déjà absent avec une redirection active. Choisissez un autre remplaçant.',
                ]);
            }
        }

        UserSetting::query()->updateOrCreate(['user_id' => $user->id], [
            'is_out_of_office' => $validated['is_out_of_office'],
            'ooo_message' => $validated['ooo_message'] ?? null,
            'redirect_messages' => $validated['redirect_messages'],
            'delegate_user_id' => $validated['delegate_user_id'] ?? null,
        ]);

        return response()->json([
            'message' => "Paramètres d'absence enregistrés avec succès.",
            'profile' => $this->payload($user->fresh()),
        ]);
    }

    /**
     * Escalade : collègue de secours si un message important reste sans réponse
     * (copie fidèle de UserSettingController::updateEscalation).
     */
    public function updateEscalation(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'escalation_enabled' => ['required', 'boolean'],
            'backup_user_id' => ['nullable', 'integer', 'exists:users,id', 'not_in:'.$user->id],
            'escalation_timeout' => ['required', 'integer', 'min:1', 'max:1440'],
        ]);

        if (! $validated['escalation_enabled']) {
            $validated['backup_user_id'] = null;
        } elseif (empty($validated['backup_user_id'])) {
            throw ValidationException::withMessages([
                'backup_user_id' => 'Choisissez un collègue de secours.',
            ]);
        }

        UserSetting::query()->updateOrCreate(['user_id' => $user->id], [
            'escalation_enabled' => $validated['escalation_enabled'],
            'backup_user_id' => $validated['backup_user_id'] ?? null,
            'escalation_timeout' => $validated['escalation_timeout'],
        ]);

        return response()->json([
            'message' => "Paramètres d'escalade enregistrés avec succès.",
            'profile' => $this->payload($user->fresh()),
        ]);
    }

    /**
     * Mot de passe. Le token Sanctum actuel reste valide (session mobile conservée).
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json([
            'message' => __('Votre mot de passe a été mis à jour avec succès.'),
        ]);
    }

    /**
     * Aperçu de la signature telle que User::getFormattedSignatureAttribute la construit,
     * même si elle n'est pas encore activée.
     */
    private function signaturePreview(User $user): string
    {
        $lines = [
            "**{$user->name}**",
            optional($user->profile)->grade,
            optional($user->department)->name,
            'CHU de Tlemcen',
        ];
        $contact = collect([$user->email, optional($user->profile)->telephone])->filter()->implode(' | ');
        if ($contact !== '') {
            $lines[] = $contact;
        }
        if ($custom = trim((string) $user->settings?->custom_signature)) {
            $lines[] = $custom;
        }

        return trim(implode("\n", array_filter($lines)));
    }

    private function payload(User $user): array
    {
        $user->loadMissing(['role', 'department', 'profile', 'settings']);
        $settings = $user->settings;
        $profile = $user->profile;

        $brief = fn (?int $id) => $id ? User::query()->find($id, ['id', 'name', 'email']) : null;
        $delegate = $brief($settings?->delegate_user_id);
        $backup = $brief($settings?->backup_user_id);

        $userId = (int) $user->id;

        return [
            'user' => new UserResource($user),
            'profile' => [
                'matricule' => $profile?->matricule,
                'grade' => $profile?->grade,
                'telephone' => $profile?->telephone,
                'adresse' => $profile?->adresse,
                'photo_url' => $profile?->photo ? Storage::disk('public')->url($profile->photo) : null,
            ],
            'settings' => [
                // État réel : sans réglage enregistré, aucune signature n'est ajoutée.
                'use_auto_signature' => (bool) ($settings?->use_auto_signature ?? false),
                // E-mail à chaque nouveau message (activé si aucun réglage enregistré)
                'email_notifications' => (bool) ($settings?->email_notifications ?? true),
                'custom_signature' => $settings?->custom_signature,
                'signature_preview' => $this->signaturePreview($user),
                'is_out_of_office' => (bool) ($settings?->is_out_of_office ?? false),
                'ooo_message' => $settings?->ooo_message,
                'redirect_messages' => (bool) ($settings?->redirect_messages ?? false),
                'delegate' => $delegate ? ['id' => $delegate->id, 'name' => $delegate->name, 'email' => $delegate->email] : null,
                'escalation_enabled' => (bool) ($settings?->escalation_enabled ?? false),
                'backup' => $backup ? ['id' => $backup->id, 'name' => $backup->name, 'email' => $backup->email] : null,
                'escalation_timeout' => (int) ($settings?->escalation_timeout ?? 15),
            ],
            'stats' => [
                'received' => MessageAccess::inboxQuery($userId)->count(),
                'unread' => MessageAccess::inboxQuery($userId)->where('lu', false)->count(),
                'sent' => Message::query()->where('sender_id', $userId)->count(),
                'tasks_pending' => Schema::hasTable('message_tasks')
                    ? MessageTask::query()
                        ->where('is_completed', false)
                        ->where(fn ($q) => $q->where('owner_id', $userId)
                            ->orWhereHas('message', fn ($m) => $m->where('sender_id', $userId)->orWhere('receiver_id', $userId)))
                        ->count()
                    : 0,
            ],
            'member_since' => optional($user->created_at)?->toIso8601String(),
        ];
    }
}
