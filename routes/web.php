<?php

use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EventInvitationController;
use App\Http\Controllers\LikeController;
use App\Http\Controllers\MessageActionController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\PublicationController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ScheduledMessageController;
use App\Http\Controllers\SupportTicketController;
use App\Models\Department;
use App\Models\Establishment;
use App\Models\Message;
use App\Models\Role;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserSettingController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
});

Route::get('/dashboard', [DashboardController::class, 'index'])->middleware(['auth'])->name('dashboard');

Route::post('/language', function (Request $request) {
    $validated = $request->validate([
        'locale' => ['required', 'string', Rule::in(['fr', 'ar'])],
    ]);

    $request->session()->put('locale', $validated['locale']);

    return back();
})->name('language.switch');

Route::middleware(['auth'])->group(function () {
    Route::get('/events/invitations', [EventInvitationController::class, 'index'])->name('events.invitations');
    Route::get('/events/create', [EventInvitationController::class, 'create'])->name('events.create');
    Route::get('/events/{event}', [EventInvitationController::class, 'show'])->name('events.show');
    Route::get('/events/invitations/{invitation}/pdf', [EventInvitationController::class, 'downloadPdf'])->name('events.invitations.pdf');
    Route::patch('/events/invitations/{invitation}/status', [EventInvitationController::class, 'rsvp'])->name('events.invitations.rsvp');
    Route::patch('/events/{event}/cancel', [EventInvitationController::class, 'cancelEvent'])->name('events.cancel');
    Route::patch('/events/{event}/postpone', [EventInvitationController::class, 'postponeEvent'])->name('events.postpone');
    Route::post('/events', [EventInvitationController::class, 'store'])->name('events.store');
    Route::post('/publications', [PublicationController::class, 'store'])->name('publications.store');
    Route::post('/support/tickets', [SupportTicketController::class, 'store'])->name('support-tickets.store');
    Route::post('/publications/{publication}/like', [LikeController::class, 'toggle'])->name('publications.like.toggle');
    Route::post('/publications/{publication}/comments', [CommentController::class, 'store'])->name('publications.comments.store');
    Route::get('/inbox', [MessageController::class, 'inbox'])->name('messages.inbox');
    Route::get('/messages/group', [MessageController::class, 'groupMessages'])->name('messages.group');
    Route::get('/messages/create', [MessageController::class, 'create'])->name('messages.create');
    Route::get('/messages/composeparam', [MessageController::class, 'composeParam'])->name('messages.composeparam');
    Route::get('/messages/tracked', [MessageController::class, 'trackedIndex'])->name('messages.tracked');
    Route::get('/planifications', [ScheduledMessageController::class, 'index'])->name('planifications.index');
    Route::post('/planifications/messages', [ScheduledMessageController::class, 'storeScheduledMessage'])->name('planifications.messages.store');
    Route::post('/planifications/messages/{message}/send-now', [ScheduledMessageController::class, 'sendScheduledMessageNow'])->name('planifications.messages.send-now');
    Route::put('/planifications/messages/{message}', [ScheduledMessageController::class, 'updateScheduledMessage'])->name('planifications.messages.update');
    Route::delete('/planifications/messages/{message}', [ScheduledMessageController::class, 'destroyScheduledMessage'])->name('planifications.messages.destroy');
    Route::post('/planifications/recurrents', [ScheduledMessageController::class, 'storeRecurringMessage'])->name('planifications.recurrents.store');
    Route::put('/planifications/recurrents/{recurringMessage}', [ScheduledMessageController::class, 'updateRecurringMessage'])->name('planifications.recurrents.update');
    Route::delete('/planifications/recurrents/{recurringMessage}', [ScheduledMessageController::class, 'destroyRecurringMessage'])->name('planifications.recurrents.destroy');
    Route::post('/planifications/rappels', [ScheduledMessageController::class, 'storePersonalReminder'])->name('planifications.reminders.store');
    Route::put('/planifications/rappels/{personalReminder}', [ScheduledMessageController::class, 'updatePersonalReminder'])->name('planifications.reminders.update');
    Route::delete('/planifications/rappels/{personalReminder}', [ScheduledMessageController::class, 'destroyPersonalReminder'])->name('planifications.reminders.destroy');
    Route::post('/messages', [MessageController::class, 'store'])->name('messages.store');
    Route::get('/messages/{message}', [MessageController::class, 'show'])->name('messages.show');
    Route::post('/messages/{message}/acknowledge', [MessageActionController::class, 'acknowledge'])->name('messages.acknowledge');
    Route::post('/messages/{message}/ping', [MessageActionController::class, 'ping'])->name('messages.ping');
    Route::post('/messages/{message}/report', [ReportController::class, 'store'])->name('messages.reports.store');
    Route::post('/messages/{message}/reply-all', [MessageController::class, 'replyAll'])->name('messages.reply_all');
    Route::post('/messages/{message}/reply-recipient/{recipient}', [MessageController::class, 'replyRecipient'])->name('messages.reply_recipient');
    Route::post('/messages/{message}/replies', [MessageController::class, 'storeReply'])->name('replies.store');
    Route::get('/sent', [MessageController::class, 'sent'])->name('messages.sent');
    Route::get('/sent/{message}', [MessageController::class, 'showSent'])->name('messages.sent.show');
    Route::get('/drafts', [MessageController::class, 'drafts'])->name('drafts.index');
    Route::get('/drafts/{draft}/edit', [MessageController::class, 'editDraft'])->name('drafts.edit');
    Route::post('/drafts', [MessageController::class, 'storeDraft'])->name('drafts.store');
    Route::post('/drafts/{draft}', [MessageController::class, 'updateDraft'])->name('drafts.update');
    Route::post('/drafts/{draft}/send', [MessageController::class, 'sendDraft'])->name('drafts.send');
    Route::get('/contacts', function (Request $request) {
        $search = trim((string) $request->string('search'));
        $departmentId = $request->integer('department');
        $roleId = $request->integer('role');
        $status = (string) $request->string('status');
        $favoriteContactIds = $request->user()->favoriteContacts()->pluck('users.id')->map(fn ($id) => (int) $id)->all();

        $users = User::query()
            ->with([
                'department:id,name',
                'role:id,nom_role',
            ])
            ->select([
                'id',
                'name',
                'username',
                'email',
                'department_id',
                'role_id',
                'is_online',
                'is_blocked',
            ])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($departmentId > 0, fn ($query) => $query->where('department_id', $departmentId))
            ->when($roleId > 0, fn ($query) => $query->where('role_id', $roleId))
            ->when($status !== '', function ($query) use ($status) {
                if ($status === 'online') {
                    $query->where('is_online', true)->where('is_blocked', false);
                }

                if ($status === 'offline') {
                    $query->where('is_online', false)->where('is_blocked', false);
                }

                if ($status === 'blocked') {
                    $query->where('is_blocked', true);
                }
            })
            ->orderBy('name')
            ->paginate(12)
            ->withQueryString();

        $users->setCollection(
            $users->getCollection()->map(function (User $user) use ($favoriteContactIds) {
                return [
                    ...$user->toArray(),
                    'is_favorite' => in_array((int) $user->id, $favoriteContactIds, true),
                ];
            })
        );

        return Inertia::render('Contacts/Index', [
            'stats' => [
                'users' => User::count(),
                'departments' => Department::count(),
                'establishments' => Establishment::count(),
            ],
            'filters' => [
                'search' => $search,
                'department' => $departmentId > 0 ? (string) $departmentId : '',
                'role' => $roleId > 0 ? (string) $roleId : '',
                'status' => $status,
            ],
            'filterOptions' => [
                'departments' => Department::query()
                    ->select('id', 'name')
                    ->orderBy('name')
                    ->get(),
                'roles' => Role::query()
                    ->select('id', 'nom_role')
                    ->orderBy('nom_role')
                    ->get(),
            ],
            'users' => $users,
        ]);
    })->name('contacts.index');
    Route::post('/contacts/{user}/favorite', [ProfileController::class, 'favorite'])->name('contacts.favorite.store');
    Route::delete('/contacts/{user}/favorite', [ProfileController::class, 'unfavorite'])->name('contacts.favorite.destroy');
    Route::get('/contacts/{user}', [ProfileController::class, 'show'])->name('contacts.show');
    Route::get('/archive', [MessageController::class, 'archiveIndex'])->name('messages.archive');
    Route::post('/messages/archive/bulk', [MessageController::class, 'bulkArchive'])->name('messages.archive.bulk');
    Route::post('/messages/{message}/archive', [MessageController::class, 'archive'])->name('messages.archive.store');
    Route::post('/messages/{message}/unarchive', [MessageController::class, 'unarchive'])->name('messages.archive.restore');
    Route::post('/messages/{message}/important', [MessageController::class, 'toggleImportant'])->name('messages.important.toggle');
    Route::get('/notifications', [MessageController::class, 'notifications'])->name('notifications.index');
    Route::post('/notifications/read', [MessageController::class, 'markNotificationsRead'])->name('notifications.read');
    Route::resource('departments', DepartmentController::class)->except(['show']);
    Route::resource('roles', RoleController::class)->except(['show']);
});

Route::middleware(['auth', 'admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/', [AdminController::class, 'index'])->name('dashboard');
        Route::get('/users', [AdminController::class, 'users'])->name('users.index');
        Route::get('/users/{user}', [AdminController::class, 'showUser'])->name('users.show');
        Route::patch('/users/{user}/profile', [AdminController::class, 'updateUserProfile'])->name('users.profile.update');
        Route::patch('/users/{user}/status', [AdminController::class, 'blockUser'])->name('users.block');
        Route::patch('/users/{user}/role', [AdminController::class, 'changeRole'])->name('users.change-role');
        Route::get('/support', [AdminController::class, 'support'])->name('support.index');
        Route::post('/support/{ticket}/respond', [AdminController::class, 'respondSupport'])->name('support.respond');
        Route::get('/reports', [AdminController::class, 'reports'])->name('reports.index');
        Route::patch('/reports/{reportedMessage}', [AdminController::class, 'updateReportStatus'])->name('reports.update');
        Route::delete('/reports/{reportedMessage}/message', [AdminController::class, 'destroyReportedMessageSource'])->name('reports.message.destroy');
        Route::get('/audit/messages', [AdminController::class, 'audit'])->name('audit.messages');
        Route::get('/publications', [AdminController::class, 'publications'])->name('publications.index');
        Route::get('/publications/{publication}', [AdminController::class, 'showPublication'])->name('publications.show');
        Route::patch('/publications/{publication}', [AdminController::class, 'updatePublication'])->name('publications.update');
        Route::patch('/publications/{publication}/archive', [AdminController::class, 'togglePublicationArchive'])->name('publications.archive');
        Route::delete('/publications/{publication}', [AdminController::class, 'destroyPublication'])->name('publications.destroy');
    });

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::patch('/profile/settings', [UserSettingController::class, 'update'])->name('profile.settings.update');
    Route::put('/profile/signature', [ProfileController::class, 'updateSignature'])->name('profile.signature.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
