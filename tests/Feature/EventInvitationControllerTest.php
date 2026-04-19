<?php

namespace Tests\Feature;

use App\Mail\EventInvitationPdfMail;
use App\Mail\OrganizerEventInvitationSummaryMail;
use App\Models\Event;
use App\Models\EventInvitation;
use App\Models\Role;
use App\Models\User;
use App\Notifications\EventPostponedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class EventInvitationControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_organizer_event_creation_sends_invitation_emails_and_summary(): void
    {
        Mail::fake();

        $compiledViewPath = storage_path('framework/testing/views');
        $dompdfTempPath = storage_path('framework/testing/dompdf');

        File::ensureDirectoryExists($compiledViewPath);
        File::ensureDirectoryExists($dompdfTempPath);

        config()->set('broadcasting.default', 'log');
        config()->set('view.compiled', $compiledViewPath);
        config()->set('dompdf.options.tempDir', $dompdfTempPath);

        $role = Role::query()->create([
            'nom_role' => 'User',
        ]);

        $organizer = User::factory()->create([
            'role_id' => $role->id,
            'can_organize_event' => true,
        ]);

        $invitee = User::factory()->create([
            'role_id' => $role->id,
        ]);

        $response = $this
            ->actingAs($organizer)
            ->post(route('events.store'), [
                'title' => 'Reunion coordination',
                'description' => 'Point rapide',
                'type' => 'online',
                'meeting_link' => 'https://example.test/meeting',
                'location' => null,
                'start_time' => now()->addDay()->format('Y-m-d H:i:s'),
                'end_time' => now()->addDay()->addHour()->format('Y-m-d H:i:s'),
                'invitee_ids' => [$invitee->id],
            ]);

        $response
            ->assertRedirect(route('events.invitations'))
            ->assertSessionHas('success');

        $event = Event::query()->first();
        $this->assertNotNull($event);
        $this->assertSame($organizer->id, $event->organizer_id);

        $invitation = EventInvitation::query()->first();
        $this->assertNotNull($invitation);
        $this->assertSame($invitee->id, $invitation->user_id);

        Mail::assertSent(EventInvitationPdfMail::class, function (EventInvitationPdfMail $mail) use ($invitee, $invitation) {
            return $mail->hasTo($invitee->email)
                && $mail->invitation->is($invitation);
        });

        Mail::assertSent(OrganizerEventInvitationSummaryMail::class, function (OrganizerEventInvitationSummaryMail $mail) use ($organizer, $event) {
            return $mail->hasTo($organizer->email)
                && $mail->event->is($event)
                && $mail->sentCount === 1
                && $mail->failedCount === 0;
        });
    }

    public function test_organizer_can_postpone_event_and_notify_pending_and_confirmed_invitees(): void
    {
        Notification::fake();

        config()->set('broadcasting.default', 'log');

        $role = Role::query()->create([
            'nom_role' => 'User',
        ]);

        $organizer = User::factory()->create([
            'role_id' => $role->id,
            'can_organize_event' => true,
        ]);

        $confirmedInvitee = User::factory()->create([
            'role_id' => $role->id,
        ]);

        $pendingInvitee = User::factory()->create([
            'role_id' => $role->id,
        ]);

        $rejectedInvitee = User::factory()->create([
            'role_id' => $role->id,
        ]);

        $event = Event::query()->create([
            'organizer_id' => $organizer->id,
            'title' => 'Reunion de service',
            'description' => 'Point hebdomadaire',
            'type' => 'online',
            'meeting_link' => 'https://example.test/meeting',
            'status' => 'scheduled',
            'status_reason' => null,
            'start_time' => now()->addDay(),
            'end_time' => now()->addDay()->addHour(),
        ]);

        EventInvitation::query()->create([
            'event_id' => $event->id,
            'user_id' => $confirmedInvitee->id,
            'status' => 'confirmed',
            'qr_code_uuid' => '11111111-1111-1111-1111-111111111111',
        ]);

        EventInvitation::query()->create([
            'event_id' => $event->id,
            'user_id' => $pendingInvitee->id,
            'status' => 'pending',
            'qr_code_uuid' => '22222222-2222-2222-2222-222222222222',
        ]);

        EventInvitation::query()->create([
            'event_id' => $event->id,
            'user_id' => $rejectedInvitee->id,
            'status' => 'rejected',
            'qr_code_uuid' => '33333333-3333-3333-3333-333333333333',
        ]);

        $response = $this
            ->actingAs($organizer)
            ->patch(route('events.postpone', $event), [
                'start_time' => now()->addDays(3)->format('Y-m-d H:i:s'),
                'end_time' => now()->addDays(3)->addHour()->format('Y-m-d H:i:s'),
                'status_reason' => 'Indisponibilite de la salle',
            ]);

        $response
            ->assertRedirect()
            ->assertSessionHas('success');

        $event->refresh();

        $this->assertSame('postponed', $event->status);
        $this->assertSame('Indisponibilite de la salle', $event->status_reason);

        $this->assertNull(EventInvitation::query()->where('user_id', $confirmedInvitee->id)->value('qr_code_uuid'));
        $this->assertNull(EventInvitation::query()->where('user_id', $pendingInvitee->id)->value('qr_code_uuid'));
        $this->assertNull(EventInvitation::query()->where('user_id', $rejectedInvitee->id)->value('qr_code_uuid'));

        Notification::assertSentTo($confirmedInvitee, EventPostponedNotification::class);
        Notification::assertSentTo($pendingInvitee, EventPostponedNotification::class);
        Notification::assertNotSentTo($rejectedInvitee, EventPostponedNotification::class);
    }
}
