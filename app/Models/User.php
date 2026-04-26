<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

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
        'can_publish_publication',
        'can_organize_event',
        'can_organize_meetings',
        'last_seen_at',
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
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'formatted_signature',
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
            'can_publish_publication' => 'boolean',
            'can_organize_event' => 'boolean',
            'can_organize_meetings' => 'boolean',
            'last_seen_at' => 'datetime',
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

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function sentChatMessages(): HasMany
    {
        return $this->hasMany(ChatMessage::class, 'sender_id');
    }

    public function receivedChatMessages(): HasMany
    {
        return $this->hasMany(ChatMessage::class, 'receiver_id');
    }

    public function recurringMessages(): HasMany
    {
        return $this->hasMany(RecurringMessage::class);
    }

    public function receivedRecurringMessages(): HasMany
    {
        return $this->hasMany(RecurringMessage::class, 'receiver_id');
    }

    public function personalReminders(): HasMany
    {
        return $this->hasMany(PersonalReminder::class);
    }

    public function profile(): HasOne
    {
        return $this->hasOne(Profile::class);
    }

    public function settings(): HasOne
    {
        return $this->hasOne(UserSetting::class);
    }

    public function userSetting(): HasOne
    {
        return $this->hasOne(UserSetting::class);
    }

    public function getFormattedSignatureAttribute(): string
    {
        $settings = $this->settings;

        if (! $settings?->use_auto_signature) {
            return '';
        }

        $lines = [];

        if ($roleName = trim((string) optional($this->role)->nom_role)) {
            $lines[] = $roleName;
        }

        $lines[] = "**{$this->name}**";

        if ($title = optional($this->profile)->grade) {
            $lines[] = $title;
        }

        if ($department = optional($this->department)->name) {
            $lines[] = $department;
        }

        if ($phone = optional($this->profile)->telephone) {
            $lines[] = "📞 {$phone}";
        }

        if ($custom = trim((string) $settings->custom_signature)) {
            $lines[] = $custom;
        }

        return trim(implode("\n\n", array_filter($lines)));
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

    public function appFeedbacks(): HasMany
    {
        return $this->hasMany(AppFeedback::class);
    }

    public function reportedMessages(): HasMany
    {
        return $this->hasMany(ReportedMessage::class, 'reporter_id');
    }

    public function organizedEvents(): HasMany
    {
        return $this->hasMany(Event::class, 'organizer_id');
    }

    public function eventInvitations(): HasMany
    {
        return $this->hasMany(EventInvitation::class);
    }

    public function invitedEvents(): BelongsToMany
    {
        return $this->belongsToMany(Event::class, 'event_invitations')
            ->withPivot(['status', 'qr_code_uuid'])
            ->withTimestamps();
    }

    public function organizedMeetings(): HasMany
    {
        return $this->hasMany(Meeting::class, 'organizer_id');
    }

    public function participatingMeetings(): BelongsToMany
    {
        return $this->belongsToMany(Meeting::class, 'meeting_participants')
            ->using(MeetingParticipant::class)
            ->withPivot(['joined_at'])
            ->withTimestamps();
    }

    public function meetingNotes(): HasMany
    {
        return $this->hasMany(MeetingNote::class);
    }

    public function assignedMeetingTopicActions(): HasMany
    {
        return $this->hasMany(MeetingTopicAction::class, 'owner_id');
    }

    public function favoriteContacts(): BelongsToMany
    {
        return $this->belongsToMany(self::class, 'favorite_contacts', 'user_id', 'favorite_contact_id')
            ->withTimestamps();
    }

    public function favoritedByUsers(): BelongsToMany
    {
        return $this->belongsToMany(self::class, 'favorite_contacts', 'favorite_contact_id', 'user_id')
            ->withTimestamps();
    }

    /**
     * Spatie Permission support (if installed) + local fallback.
     */
    public function hasOrganizerRole(): bool
    {
        if (method_exists($this, 'hasRole')) {
            return (bool) $this->hasRole('organizer');
        }

        $roleName = Str::lower((string) optional($this->role)->nom_role);

        return $roleName === 'organizer';
    }

    public function canOrganizeEvents(): bool
    {
        return (bool) $this->can_organize_event || $this->hasOrganizerRole();
    }

    public function canOrganizeMeetings(): bool
    {
        return (bool) $this->can_organize_meetings;
    }
}
