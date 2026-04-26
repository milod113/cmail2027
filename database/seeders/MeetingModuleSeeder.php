<?php

namespace Database\Seeders;

use App\Models\Meeting;
use App\Models\MeetingNote;
use App\Models\MeetingSection;
use App\Models\MeetingTopic;
use App\Models\MeetingTopicAction;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class MeetingModuleSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::query()
            ->orderBy('id')
            ->take(6)
            ->get();

        if ($users->count() < 3) {
            $this->command?->warn('MeetingModuleSeeder skipped: at least 3 users are required.');
            return;
        }

        $organizer = $users->first();
        $participants = $users->slice(1, 4)->values();

        $organizer->forceFill([
            'can_organize_meetings' => true,
        ])->save();

        $this->seedPlannedMeeting($organizer, $participants);
        $this->seedOpenedMeeting($organizer, $participants);
    }

    private function seedPlannedMeeting(User $organizer, Collection $participants): void
    {
        DB::transaction(function () use ($organizer, $participants): void {
            $meeting = Meeting::query()->updateOrCreate(
                [
                    'title' => 'Staff medical - coordination des admissions',
                    'organizer_id' => $organizer->id,
                ],
                [
                    'type' => 'presentiel',
                    'location_or_link' => 'Salle de conference A - CHU Tlemcen',
                    'start_time' => Carbon::now()->addDay()->setTime(9, 0),
                    'end_time' => Carbon::now()->addDay()->setTime(10, 30),
                    'opened_at' => null,
                    'closed_at' => null,
                    'status' => 'planifie',
                ]
            );

            $meeting->participants()->sync(
                $participants->mapWithKeys(fn (User $participant): array => [
                    $participant->id => ['joined_at' => null],
                ])->all()
            );

            $this->replaceAgenda($meeting, [
                [
                    'title' => 'Admissions prioritaires',
                    'topics' => [
                        ['title' => 'Cas urgents a programmer', 'expected_duration' => 20, 'status' => 'en_attente'],
                        ['title' => 'Disponibilite des lits', 'expected_duration' => 15, 'status' => 'en_attente'],
                    ],
                ],
                [
                    'title' => 'Coordination inter-services',
                    'topics' => [
                        ['title' => 'Flux laboratoire et imagerie', 'expected_duration' => 20, 'status' => 'en_attente'],
                        ['title' => 'Point bloc operatoire', 'expected_duration' => 15, 'status' => 'en_attente'],
                    ],
                ],
            ]);
        });
    }

    private function seedOpenedMeeting(User $organizer, Collection $participants): void
    {
        DB::transaction(function () use ($organizer, $participants): void {
            $openedAt = Carbon::now()->subMinutes(25);

            $meeting = Meeting::query()->updateOrCreate(
                [
                    'title' => 'Staff medical - suivi infectiologie',
                    'organizer_id' => $organizer->id,
                ],
                [
                    'type' => 'distanciel',
                    'location_or_link' => 'https://meet.cmail.test/staff-infectio',
                    'start_time' => Carbon::now()->subMinutes(30),
                    'end_time' => Carbon::now()->addMinutes(45),
                    'opened_at' => $openedAt,
                    'closed_at' => null,
                    'status' => 'en_cours',
                ]
            );

            $meeting->participants()->sync(
                $participants->mapWithKeys(function (User $participant, int $index) use ($openedAt): array {
                    return [
                        $participant->id => [
                            'joined_at' => $index < 2 ? $openedAt->copy()->addMinutes($index + 2) : null,
                        ],
                    ];
                })->all()
            );

            $this->replaceAgenda($meeting, [
                [
                    'title' => 'Situations cliniques actives',
                    'topics' => [
                        ['title' => 'Patients a risque infectieux eleve', 'expected_duration' => 25, 'status' => 'en_cours'],
                        ['title' => 'Validation des conduites a tenir', 'expected_duration' => 20, 'status' => 'en_attente'],
                    ],
                ],
                [
                    'title' => 'Mesures de prevention',
                    'topics' => [
                        ['title' => 'Rappels protocoles internes', 'expected_duration' => 15, 'status' => 'en_attente'],
                    ],
                ],
            ]);

            $meeting->load([
                'sections.topics',
                'participants',
            ]);

            $firstTopic = $meeting->sections->first()?->topics->first();

            if (! $firstTopic) {
                return;
            }

            MeetingNote::query()->where('meeting_topic_id', $firstTopic->id)->delete();

            $joinedParticipants = $participants->take(2)->values();

            foreach ($joinedParticipants as $index => $participant) {
                MeetingNote::query()->create([
                    'meeting_topic_id' => $firstTopic->id,
                    'user_id' => $participant->id,
                    'content' => $index === 0
                        ? 'Patient en chambre 12: surveillance renforcee et bilan de controle a programmer.'
                        : 'Accord sur l isolement preventif et suivi biologique sur 48 heures.',
                    'is_private' => false,
                    'created_at' => $openedAt->copy()->addMinutes(5 + ($index * 4)),
                    'updated_at' => $openedAt->copy()->addMinutes(5 + ($index * 4)),
                ]);
            }

            $firstTopic->forceFill([
                'decision_summary' => 'Maintien de l isolement preventif, bilan infectieux de controle et reevaluation collegiale demain matin.',
            ])->save();

            MeetingTopicAction::query()->where('meeting_topic_id', $firstTopic->id)->delete();

            MeetingTopicAction::query()->create([
                'meeting_topic_id' => $firstTopic->id,
                'owner_id' => $organizer->id,
                'title' => 'Valider la conduite therapeutique avec la pharmacie clinique',
                'notes' => 'Retour attendu avant la fin de la journee pour harmoniser la prescription.',
                'due_at' => Carbon::now()->addHours(6),
                'status' => 'en_cours',
            ]);

            MeetingTopicAction::query()->create([
                'meeting_topic_id' => $firstTopic->id,
                'owner_id' => $participants->first()?->id,
                'title' => 'Programmer un bilan biologique de controle a H+48',
                'notes' => 'Prevenir le laboratoire et tracer le rendez-vous dans le dossier.',
                'due_at' => Carbon::now()->addDay()->setTime(8, 30),
                'status' => 'a_faire',
            ]);
        });
    }

    private function replaceAgenda(Meeting $meeting, array $sections): void
    {
        $meeting->sections()->delete();

        foreach ($sections as $sectionIndex => $sectionData) {
            $section = MeetingSection::query()->create([
                'meeting_id' => $meeting->id,
                'title' => $sectionData['title'],
                'order' => $sectionIndex + 1,
            ]);

            foreach ($sectionData['topics'] as $topicIndex => $topicData) {
                MeetingTopic::query()->create([
                    'meeting_section_id' => $section->id,
                    'title' => $topicData['title'],
                    'expected_duration' => $topicData['expected_duration'],
                    'status' => $topicData['status'],
                    'order' => $topicIndex + 1,
                ]);
            }
        }
    }
}
