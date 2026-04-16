<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'department_id',
        'role_id',
        'is_blocked',
        'is_online',
        'acknowledged_notice',
        'replaces_user_id',
        'can_read',
        'can_respond',
        'can_transfer',
        'redirect_user_id',
        'custom_message',
        'gmail_token',
        'gmail_refresh_token',
        'gmail_expires_in',
        'imap_username',
        'imap_password',
        'is_directeur_de_garde',
        'is_super_admin',
        'remplacement_debut',
        'remplacement_fin',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_blocked' => 'boolean',
            'is_online' => 'boolean',
            'acknowledged_notice' => 'boolean',
            'can_read' => 'boolean',
            'can_respond' => 'boolean',
            'can_transfer' => 'boolean',
            'is_directeur_de_garde' => 'boolean',
            'is_super_admin' => 'boolean',
            'remplacement_debut' => 'date',
            'remplacement_fin' => 'date',
            'notifications_read_at' => 'datetime',
        ];
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function replacesUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'replaces_user_id');
    }

    public function redirectUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'redirect_user_id');
    }

    public function sentMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function receivedMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'receiver_id');
    }

    public function profile(): HasOne
    {
        return $this->hasOne(Profile::class);
    }

    public function userSetting(): HasOne
    {
        return $this->hasOne(UserSetting::class);
    }

    public function publications(): HasMany
    {
        return $this->hasMany(Publication::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function likes(): HasMany
    {
        return $this->hasMany(Like::class);
    }

    public function supportTickets(): HasMany
    {
        return $this->hasMany(SupportTicket::class);
    }
}
