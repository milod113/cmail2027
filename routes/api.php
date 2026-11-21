<?php

use App\Http\Controllers\Api\Mobile\AuthController;
use App\Http\Controllers\Api\Mobile\ContactController;
use App\Http\Controllers\Api\Mobile\DraftController;
use App\Http\Controllers\Api\Mobile\EventController;
use App\Http\Controllers\Api\Mobile\GroupMessageController;
use App\Http\Controllers\Api\Mobile\HomeController;
use App\Http\Controllers\Api\Mobile\MessageActionController;
use App\Http\Controllers\Api\Mobile\MessageController;
use App\Http\Controllers\Api\Mobile\MessageFollowUpController;
use App\Http\Controllers\Api\Mobile\NotificationController;
use App\Http\Controllers\Api\Mobile\ProfileController;
use App\Http\Controllers\Api\Mobile\ScheduledMessageController;
use App\Http\Controllers\Api\Mobile\TaskController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Mobile API Routes
|--------------------------------------------------------------------------
|
| Routes exposées à l'application mobile Flutter, préfixées /api/mobile.
| Authentification par token Bearer (Sanctum), indépendante des sessions web.
|
*/

Route::prefix('mobile')->name('mobile.')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:5,1')
        ->name('login');

    // Billet PDF d'invitation : lien temporaire signé (ouvert dans le navigateur, sans token).
    Route::get('/events/invitations/{invitation}/pdf', [EventController::class, 'pdf'])
        ->middleware('signed')
        ->name('events.pdf');

    Route::middleware(['auth:sanctum', 'not.blocked'])->group(function () {
        // Invitations / événements
        Route::get('/events', [EventController::class, 'index'])->name('events.index');
        Route::get('/events/invitees', [EventController::class, 'invitees'])->name('events.invitees');
        Route::post('/events', [EventController::class, 'store'])->name('events.store');
        Route::patch('/events/invitations/{invitation}/status', [EventController::class, 'rsvp'])->name('events.rsvp');
        Route::get('/events/invitations/{invitation}/pdf-link', [EventController::class, 'pdfLink'])->name('events.pdf-link');
        Route::get('/events/{event}', [EventController::class, 'show'])->name('events.show');
        Route::patch('/events/{event}/cancel', [EventController::class, 'cancel'])->name('events.cancel');
        Route::patch('/events/{event}/postpone', [EventController::class, 'postpone'])->name('events.postpone');

        Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
        Route::get('/me', [AuthController::class, 'me'])->name('me');
        // Accueil + annonces de la direction
        Route::get('/home', [HomeController::class, 'index'])->name('home');
        Route::post('/announcements/{announcement}/read', [HomeController::class, 'readAnnouncement'])->name('announcements.read');
        Route::post('/announcements/{announcement}/acknowledge', [HomeController::class, 'acknowledgeAnnouncement'])->name('announcements.acknowledge');
        Route::get('/notifications/poll', [NotificationController::class, 'poll'])
            ->middleware('throttle:120,1')
            ->name('notifications.poll');
        Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
        Route::put('/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password.update');
        // POST (et non PATCH) : la photo est envoyée en multipart, que PHP ne lit pas en PATCH.
        Route::post('/profile', [ProfileController::class, 'update'])->name('profile.update');
        Route::put('/profile/signature', [ProfileController::class, 'updateSignature'])->name('profile.signature.update');
        Route::put('/profile/email-notifications', [ProfileController::class, 'updateEmailNotifications'])->name('profile.email-notifications.update');
        Route::put('/profile/out-of-office', [ProfileController::class, 'updateOutOfOffice'])->name('profile.ooo.update');
        Route::put('/profile/escalation', [ProfileController::class, 'updateEscalation'])->name('profile.escalation.update');

        Route::get('/contacts', [ContactController::class, 'index'])->name('contacts.index');
        Route::get('/contacts/filters', [ContactController::class, 'filters'])->name('contacts.filters');
        Route::get('/contacts/{user}', [ContactController::class, 'show'])->name('contacts.show');
        Route::get('/contacts/{user}/messages', [ContactController::class, 'conversation'])->name('contacts.messages');
        Route::post('/contacts/{user}/favorite', [ContactController::class, 'favorite'])->name('contacts.favorite');
        Route::delete('/contacts/{user}/favorite', [ContactController::class, 'unfavorite'])->name('contacts.unfavorite');
        // Dictée vocale : transcription locale (whisper.cpp) en file d'attente
        Route::post('/dictations', [\App\Http\Controllers\Api\Mobile\DictationController::class, 'store'])->middleware('throttle:20,1')->name('dictations.store');
        Route::get('/dictations/{dictation}', [\App\Http\Controllers\Api\Mobile\DictationController::class, 'show'])->name('dictations.show');
        Route::delete('/dictations/{dictation}', [\App\Http\Controllers\Api\Mobile\DictationController::class, 'destroy'])->name('dictations.destroy');

        // Recherche (objet, texte et contenu des documents scannés) — avant /messages/{message}
        Route::get('/messages/search', [MessageController::class, 'search'])->middleware('throttle:60,1')->name('messages.search');
        Route::get('/messages/inbox', [MessageController::class, 'inbox'])->name('messages.inbox');
        Route::get('/messages/sent', [MessageController::class, 'sent'])->name('messages.sent');
        Route::post('/messages/send', [MessageController::class, 'send'])->name('messages.send');

        // Messages groupés (suivi des réponses par destinataire)
        Route::get('/messages/groups', [GroupMessageController::class, 'index'])->name('messages.groups.index');
        Route::get('/messages/{message}/group', [GroupMessageController::class, 'show'])->name('messages.groups.show');
        Route::post('/messages/{message}/group/reply-all', [GroupMessageController::class, 'replyAll'])->name('messages.groups.reply-all');
        Route::post('/messages/{message}/group/reply/{recipient}', [GroupMessageController::class, 'replyRecipient'])->name('messages.groups.reply-recipient');
        // Envois programmés (équivalent de la page web « Planifications »)
        Route::get('/messages/scheduled', [ScheduledMessageController::class, 'index'])->name('messages.scheduled.index');
        // Rangement : archiver / supprimer (pour soi) / restaurer / lu-non lu
        Route::get('/messages/archived', [MessageActionController::class, 'archived'])->name('messages.archived');
        Route::post('/messages/actions', [MessageActionController::class, 'bulk'])->name('messages.actions');
        // Brouillons (partagés avec le web)
        Route::get('/drafts', [DraftController::class, 'index'])->name('drafts.index');
        Route::post('/drafts', [DraftController::class, 'store'])->name('drafts.store');
        Route::get('/drafts/{draft}', [DraftController::class, 'show'])->name('drafts.show');
        // POST (et non PUT) : la pièce jointe est envoyée en multipart
        Route::post('/drafts/{draft}', [DraftController::class, 'update'])->name('drafts.update');
        Route::delete('/drafts/{draft}', [DraftController::class, 'destroy'])->name('drafts.destroy');

        // Relance d'un destinataire + signalement d'un message
        Route::post('/messages/{message}/ping', [MessageFollowUpController::class, 'ping'])->name('messages.ping');
        Route::post('/messages/{message}/group/ping', [MessageFollowUpController::class, 'groupPing'])->name('messages.groups.ping');
        Route::post('/messages/{message}/report', [MessageFollowUpController::class, 'report'])->name('messages.report');
        Route::patch('/messages/{message}/schedule', [ScheduledMessageController::class, 'reschedule'])->name('messages.scheduled.update');
        Route::post('/messages/{message}/send-now', [ScheduledMessageController::class, 'sendNow'])->name('messages.scheduled.send-now');
        Route::delete('/messages/{message}/schedule', [ScheduledMessageController::class, 'cancel'])->name('messages.scheduled.cancel');

        Route::get('/messages/{message}', [MessageController::class, 'show'])->name('messages.show');
        Route::post('/messages/{message}/replies', [MessageController::class, 'reply'])->name('messages.reply');
        Route::post('/messages/{message}/acknowledge', [MessageController::class, 'acknowledge'])->name('messages.acknowledge');

        Route::get('/tasks', [TaskController::class, 'index'])->name('tasks.index');
        Route::get('/tasks/{task}', [TaskController::class, 'show'])->name('tasks.show');
        Route::patch('/tasks/{task}/toggle-status', [TaskController::class, 'toggleStatus'])->name('tasks.toggle-status');
        Route::post('/messages/{message}/tasks', [TaskController::class, 'storeFromMessage'])->name('tasks.store-from-message');
    });
});
