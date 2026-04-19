<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Models\Profile;
use App\Models\User;
use App\Models\UserSetting;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $profile = $user->profile ?: new Profile();

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            'profile' => $profile,
            'userSettings' => $user->userSetting ?? new UserSetting([
                'is_out_of_office' => false,
                'ooo_message' => null,
                'redirect_messages' => false,
                'delegate_user_id' => null,
                'custom_signature' => null,
                'use_auto_signature' => true,
            ]),
            'colleagues' => User::query()
                ->whereKeyNot($user->id)
                ->orderBy('name')
                ->get(['id', 'name', 'email']),
        ]);
    }

    /**
     * Display another user's profile in read-only mode.
     */
    public function show(User $user): Response
    {
        $user->load([
            'department:id,name',
            'role:id,nom_role',
            'profile:user_id,matricule,grade,telephone,adresse,photo',
        ]);

        return Inertia::render('Contacts/Show', [
            'contact' => [
                ...$user->toArray(),
                'is_favorite' => $this->isFavoriteContact(request()->user(), $user),
            ],
        ]);
    }

    public function favorite(Request $request, User $user): RedirectResponse
    {
        abort_if((int) $request->user()->id === (int) $user->id, 403);

        $request->user()->favoriteContacts()->syncWithoutDetaching([$user->id]);

        return back()->with('success', 'Contact ajoute aux favoris.');
    }

    public function unfavorite(Request $request, User $user): RedirectResponse
    {
        abort_if((int) $request->user()->id === (int) $user->id, 403);

        $request->user()->favoriteContacts()->detach($user->id);

        return back()->with('success', 'Contact retire des favoris.');
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();

        // Update user basic info
        $user->fill($request->validated());

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        // Update or create profile
        $profileData = $request->only(['matricule', 'grade', 'telephone', 'adresse']);

        // Handle photo upload
        if ($request->hasFile('photo')) {
            $photo = $request->file('photo');
            $photoPath = $photo->store('profiles/photos', 'public');
            $profileData['photo'] = $photoPath;

            // Delete old photo if exists
            if ($user->profile && $user->profile->photo) {
                Storage::disk('public')->delete($user->profile->photo);
            }
        }

        $profile = $user->profile;
        if ($profile) {
            $profile->update($profileData);
        } else {
            $profileData['user_id'] = $user->id;
            Profile::create($profileData);
        }

        return Redirect::route('profile.edit')->with('success', 'Profile updated successfully.');
    }

    public function updateSignature(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'use_auto_signature' => ['required', 'boolean'],
            'custom_signature' => ['nullable', 'string', 'max:5000'],
        ]);

        $user->settings()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'custom_signature' => $validated['custom_signature'] ?? null,
                'use_auto_signature' => $validated['use_auto_signature'],
            ],
        );

        return Redirect::route('profile.edit')->with('success', 'Signature automatique mise à jour avec succès.');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        // Delete user's profile photo if exists
        if ($user->profile && $user->profile->photo) {
            Storage::disk('public')->delete($user->profile->photo);
        }

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }

    private function isFavoriteContact(User $owner, User $contact): bool
    {
        return $owner->favoriteContacts()
            ->where('favorite_contact_id', $contact->id)
            ->exists();
    }
}
