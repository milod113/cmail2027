<?php

use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\LikeController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\PublicationController;
use App\Models\Department;
use App\Models\Establishment;
use App\Models\Publication;
use App\Models\Role;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RoleController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard', [
        'publications' => Publication::query()->feed()->get(),
    ]);
})->middleware(['auth'])->name('dashboard');

Route::post('/language', function (Request $request) {
    $validated = $request->validate([
        'locale' => ['required', 'string', Rule::in(['fr', 'ar'])],
    ]);

    $request->session()->put('locale', $validated['locale']);

    return back();
})->name('language.switch');

Route::middleware(['auth'])->group(function () {
    Route::post('/publications', [PublicationController::class, 'store'])->name('publications.store');
    Route::post('/publications/{publication}/like', [LikeController::class, 'toggle'])->name('publications.like.toggle');
    Route::post('/publications/{publication}/comments', [CommentController::class, 'store'])->name('publications.comments.store');
    Route::get('/inbox', [MessageController::class, 'inbox'])->name('messages.inbox');
    Route::get('/messages/group', [MessageController::class, 'groupMessages'])->name('messages.group');
    Route::get('/messages/create', [MessageController::class, 'create'])->name('messages.create');
    Route::post('/messages', [MessageController::class, 'store'])->name('messages.store');
    Route::get('/messages/{message}', [MessageController::class, 'show'])->name('messages.show');
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
    Route::get('/contacts/{user}', [ProfileController::class, 'show'])->name('contacts.show');
    Route::get('/archive', [MessageController::class, 'archiveIndex'])->name('messages.archive');
    Route::post('/messages/archive/bulk', [MessageController::class, 'bulkArchive'])->name('messages.archive.bulk');
    Route::post('/messages/{message}/archive', [MessageController::class, 'archive'])->name('messages.archive.store');
    Route::post('/messages/{message}/unarchive', [MessageController::class, 'unarchive'])->name('messages.archive.restore');
    Route::get('/notifications', [MessageController::class, 'notifications'])->name('notifications.index');
    Route::post('/notifications/read', [MessageController::class, 'markNotificationsRead'])->name('notifications.read');
    Route::resource('departments', DepartmentController::class)->except(['show']);
    Route::resource('roles', RoleController::class)->except(['show']);
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
