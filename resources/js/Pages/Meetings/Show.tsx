import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    CalendarDays,
    Clock3,
    Lock,
    MapPin,
    MessageSquare,
    Send,
    Users,
    Video,
    ChevronRight,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    Eye,
    UserCheck,
    Timer,
    BookOpen,
    Shield,
    Globe,
    Award,
    TrendingUp,
    FileText,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type MeetingUser = {
    id: number;
    name: string;
    email: string;
    is_present?: boolean;
};

type MeetingNote = {
    id: number;
    meeting_id?: number;
    meeting_topic_id: number;
    content: string;
    is_private: boolean;
    created_at: string | null;
    user: MeetingUser | null;
};

type MeetingTopic = {
    id: number;
    title: string;
    expected_duration: number | null;
    status: 'en_attente' | 'en_cours' | 'traite';
    order: number;
    notes: MeetingNote[];
};

type MeetingSection = {
    id: number;
    title: string;
    order: number;
    topics: MeetingTopic[];
};

type MeetingDetails = {
    id: number;
    title: string;
    type: 'presentiel' | 'distanciel';
    location_or_link: string | null;
    start_time: string | null;
    end_time: string | null;
    status: 'planifie' | 'en_cours' | 'termine' | 'annule';
    organizer: MeetingUser | null;
    participants: MeetingUser[];
    sections: MeetingSection[];
};

type MeetingShowProps = {
    meeting: MeetingDetails;
};

function formatDateTime(value: string | null): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatDate(value: string | null): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}

function noteTime(value: string | null): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function statusMeta(status: MeetingDetails['status']) {
    switch (status) {
        case 'en_cours':
            return {
                label: 'En cours',
                icon: Activity,
                className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
                gradient: 'from-emerald-600 to-teal-600',
            };
        case 'termine':
            return {
                label: 'Terminé',
                icon: CheckCircle2,
                className: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
                gradient: 'from-slate-600 to-slate-700',
            };
        case 'annule':
            return {
                label: 'Annulé',
                icon: AlertCircle,
                className: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300',
                gradient: 'from-rose-600 to-red-600',
            };
        default:
            return {
                label: 'Planifié',
                icon: CalendarDays,
                className: 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300',
                gradient: 'from-cyan-600 to-sky-600',
            };
    }
}

function topicStatusMeta(status: MeetingTopic['status']) {
    switch (status) {
        case 'en_cours':
            return { icon: Activity, color: 'emerald' };
        case 'traite':
            return { icon: CheckCircle2, color: 'indigo' };
        default:
            return { icon: Clock3, color: 'slate' };
    }
}

export default function Show({ meeting }: MeetingShowProps) {
    const [meetingState, setMeetingState] = useState<MeetingDetails>(meeting);
    const [activeSectionId, setActiveSectionId] = useState<number | null>(meeting.sections[0]?.id ?? null);
    const [activeTopicId, setActiveTopicId] = useState<number | null>(meeting.sections[0]?.topics[0]?.id ?? null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const {
        data,
        setData,
        processing,
        reset,
        errors,
        setError,
        clearErrors,
    } = useForm({
        content: '',
        is_private: false,
    });

    useEffect(() => {
        setMeetingState(meeting);
        setActiveSectionId(meeting.sections[0]?.id ?? null);
        setActiveTopicId(meeting.sections[0]?.topics[0]?.id ?? null);
    }, [meeting]);

    const activeSection = useMemo(
        () => meetingState.sections.find((section) => section.id === activeSectionId) ?? meetingState.sections[0] ?? null,
        [meetingState.sections, activeSectionId],
    );

    const activeTopic = useMemo(
        () => activeSection?.topics.find((topic) => topic.id === activeTopicId) ?? activeSection?.topics[0] ?? null,
        [activeSection, activeTopicId],
    );

    useEffect(() => {
        if (!activeSection && meetingState.sections[0]) {
            setActiveSectionId(meetingState.sections[0].id);
            setActiveTopicId(meetingState.sections[0].topics[0]?.id ?? null);
        }
    }, [activeSection, meetingState.sections]);

    useEffect(() => {
        if (!window.Echo) return;

        const channelName = `meeting.${meetingState.id}`;

        const appendIncomingNote = (incoming: { note: MeetingNote }) => {
            setMeetingState((current) => ({
                ...current,
                sections: current.sections.map((section) => ({
                    ...section,
                    topics: section.topics.map((topic) => {
                        if (topic.id !== incoming.note.meeting_topic_id) return topic;
                        if (topic.notes.some((noteItem) => noteItem.id === incoming.note.id)) return topic;
                        return { ...topic, notes: [...topic.notes, incoming.note] };
                    }),
                })),
            }));
        };

        window.Echo.private(channelName).listen('.NoteCreated', appendIncomingNote);

        return () => {
            window.Echo?.leave?.(channelName);
            window.Echo?.leaveChannel?.(`private-${channelName}`);
        };
    }, [meetingState.id]);

    const submitNote = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!activeTopic) return;
        clearErrors();

        try {
            const response = await window.axios.post(route('meetings.notes.store', {
                meeting: meetingState.id,
                topic: activeTopic.id,
            }), {
                content: data.content,
                is_private: data.is_private,
            });

            const nextNote = response.data.note as MeetingNote;

            setMeetingState((current) => ({
                ...current,
                sections: current.sections.map((section) => ({
                    ...section,
                    topics: section.topics.map((topic) => topic.id === nextNote.meeting_topic_id
                        ? { ...topic, notes: [...topic.notes, nextNote] }
                        : topic),
                })),
            }));

            reset('content');
            setData('is_private', false);
        } catch (error: any) {
            const validationErrors = error?.response?.data?.errors;
            if (validationErrors?.content?.[0]) {
                setError('content', validationErrors.content[0]);
                return;
            }
            setError('content', 'Impossible d enregistrer la note pour le moment.');
        }
    };

    const status = statusMeta(meetingState.status);
    const StatusIcon = status.icon;
    const totalTopics = meetingState.sections.reduce((acc, s) => acc + s.topics.length, 0);
    const totalNotes = meetingState.sections.reduce((acc, s) => acc + s.topics.reduce((sum, t) => sum + t.notes.length, 0), 0);
    const presentCount = meetingState.participants.filter(p => p.is_present).length;

    return (
        <AuthenticatedLayout
            title={meetingState.title}
            description="Ordre du jour structure et prise de notes collaborative en temps reel."
            actions={
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Link
                        href={route('meetings.index')}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        Retour aux staffs
                    </Link>
                </motion.div>
            }
        >
            <Head title={meetingState.title} />

            <div className="space-y-8">
                {/* Hero Section */}
                <motion.section
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 p-8 shadow-2xl"
                >
                    <div
                        className="absolute inset-0 opacity-20"
                        style={{
                            backgroundImage:
                                'url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')',
                        }}
                    ></div>

                    <div className="relative grid gap-8 lg:grid-cols-[1fr_auto]">
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <motion.span
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className={`inline-flex items-center gap-2 rounded-full border ${status.className} px-3 py-1.5 text-xs font-semibold backdrop-blur-sm`}
                                >
                                    <StatusIcon className="h-3.5 w-3.5" />
                                    {status.label}
                                </motion.span>
                                <motion.span
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.15 }}
                                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm"
                                >
                                    {meetingState.type === 'distanciel' ? (
                                        <Video className="h-3.5 w-3.5" />
                                    ) : (
                                        <MapPin className="h-3.5 w-3.5" />
                                    )}
                                    {meetingState.type === 'distanciel' ? 'Distanciel' : 'Présentiel'}
                                </motion.span>
                                {meetingState.organizer && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-100 backdrop-blur-sm"
                                    >
                                        <Award className="h-3.5 w-3.5" />
                                        Organisé par {meetingState.organizer.name.split(' ')[0]}
                                    </motion.span>
                                )}
                            </div>

                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl"
                            >
                                {meetingState.title}
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                                className="mt-3 text-indigo-100"
                            >
                                {formatDate(meetingState.start_time)}
                            </motion.p>
                        </div>

                        {/* Stats Cards */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                            className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[480px]"
                        >
                            {[
                                { label: 'Sections', value: meetingState.sections.length, icon: BookOpen, gradient: 'from-indigo-500 to-purple-500' },
                                { label: 'Sujets', value: totalTopics, icon: FileText, gradient: 'from-cyan-500 to-sky-500' },
                                { label: 'Notes', value: totalNotes, icon: MessageSquare, gradient: 'from-emerald-500 to-teal-500' },
                                { label: 'Présents', value: presentCount, icon: UserCheck, gradient: 'from-amber-500 to-orange-500' },
                            ].map((stat, idx) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 + idx * 0.1 }}
                                    className="group relative overflow-hidden rounded-2xl bg-white/10 p-4 backdrop-blur-sm transition hover:bg-white/20"
                                >
                                    <stat.icon className="absolute right-3 top-3 h-8 w-8 text-white/20 transition group-hover:scale-110" />
                                    <p className="text-xs uppercase tracking-[0.18em] text-indigo-200">{stat.label}</p>
                                    <p className="mt-2 text-3xl font-bold text-white">{stat.value}</p>
                                    <div className={`mt-2 h-1 w-full rounded-full bg-gradient-to-r ${stat.gradient} opacity-0 transition group-hover:opacity-100`} />
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Meeting Details Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-200">
                                <CalendarDays className="h-4 w-4" />
                                Début
                            </div>
                            <p className="mt-2 text-white">{formatDateTime(meetingState.start_time)}</p>
                        </div>
                        <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-200">
                                <Clock3 className="h-4 w-4" />
                                Fin
                            </div>
                            <p className="mt-2 text-white">{formatDateTime(meetingState.end_time)}</p>
                        </div>
                        <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
                            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-200">
                                {meetingState.type === 'distanciel' ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                                {meetingState.type === 'distanciel' ? 'Lien de réunion' : 'Lieu'}
                            </div>
                            <p className="mt-2 text-white break-all">{meetingState.location_or_link || 'Non renseigné'}</p>
                        </div>
                    </motion.div>
                </motion.section>

                {/* Main Content */}
                <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                    {/* Sidebar - Sections */}
                    <motion.aside
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9 }}
                        className="space-y-6"
                    >
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        Sections
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {meetingState.sections.length} section(s)
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                                    <BookOpen className="h-5 w-5 text-white" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                {meetingState.sections.map((section, idx) => (
                                    <motion.button
                                        key={section.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 1 + idx * 0.05 }}
                                        type="button"
                                        onClick={() => {
                                            setActiveSectionId(section.id);
                                            setActiveTopicId(section.topics[0]?.id ?? null);
                                        }}
                                        className={`group relative w-full rounded-2xl border p-4 text-left transition-all ${
                                            activeSection?.id === section.id
                                                ? 'border-indigo-400 bg-gradient-to-r from-indigo-50 to-white shadow-lg shadow-indigo-500/10 dark:from-indigo-500/10 dark:to-transparent dark:border-indigo-500'
                                                : 'border-slate-200 bg-white hover:border-indigo-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
                                                        {idx + 1}
                                                    </span>
                                                    <p className="font-semibold text-slate-900 dark:text-white line-clamp-2">
                                                        {section.title || `Section ${idx + 1}`}
                                                    </p>
                                                </div>
                                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                                    {section.topics.length} sujet(s)
                                                </p>
                                            </div>
                                            {activeSection?.id === section.id && (
                                                <ChevronRight className="h-5 w-5 text-indigo-500" />
                                            )}
                                        </div>
                                        {activeSection?.id === section.id && (
                                            <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-300`} style={{ width: '100%' }} />
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Participants Card */}
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        Participants
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {meetingState.participants.length} personne(s)
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                                    <Users className="h-5 w-5 text-white" />
                                </div>
                            </div>

                            <div className="max-h-[400px] space-y-2 overflow-y-auto">
                                {meetingState.participants.map((participant, idx) => (
                                    <motion.div
                                        key={participant.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 1.1 + idx * 0.02 }}
                                        className={`rounded-xl p-3 transition ${
                                            participant.is_present
                                                ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20'
                                                : 'bg-slate-50 dark:bg-slate-800'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                    {participant.name}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                    {participant.email}
                                                </p>
                                            </div>
                                            {participant.is_present && (
                                                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Présent
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.aside>

                    {/* Right Content - Topics and Notes */}
                    <div className="space-y-6">
                        {/* Topics Tabs */}
                        {activeSection && activeSection.topics.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1 }}
                                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
                            >
                                <div className="mb-6">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                        {activeSection.title}
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        Sélectionnez un sujet pour afficher et ajouter des notes
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {activeSection.topics.map((topic, idx) => {
                                        const topicStatus = topicStatusMeta(topic.status);
                                        const TopicIcon = topicStatus.icon;
                                        return (
                                            <motion.button
                                                key={topic.id}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 1.1 + idx * 0.05 }}
                                                type="button"
                                                onClick={() => setActiveTopicId(topic.id)}
                                                className={`group relative rounded-2xl px-5 py-3 text-left transition-all ${
                                                    activeTopic?.id === topic.id
                                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <TopicIcon className={`h-4 w-4 ${activeTopic?.id === topic.id ? 'text-white' : `text-${topicStatus.color}-500`}`} />
                                                    <span className="text-sm font-medium">{topic.title}</span>
                                                    {topic.expected_duration && (
                                                        <span className={`text-xs ml-2 px-2 py-0.5 rounded-full ${
                                                            activeTopic?.id === topic.id
                                                                ? 'bg-white/20 text-white'
                                                                : 'bg-white text-slate-600 dark:bg-slate-700'
                                                        }`}>
                                                            {topic.expected_duration} min
                                                        </span>
                                                    )}
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* Notes Section */}
                        {activeTopic ? (
                            <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
                                {/* Notes List */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.2 }}
                                    className="rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
                                >
                                    <div className="border-b border-slate-200 p-5 dark:border-slate-800">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                                    {activeTopic.title}
                                                </h3>
                                                <div className="mt-2 flex gap-2">
                                                    {activeTopic.expected_duration && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                            <Timer className="h-3 w-3" />
                                                            {activeTopic.expected_duration} min
                                                        </span>
                                                    )}
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-xs text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                                                        <MessageSquare className="h-3 w-3" />
                                                        {activeTopic.notes.length} note(s)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="max-h-[500px] space-y-4 overflow-y-auto p-5">
                                        <AnimatePresence>
                                            {activeTopic.notes.length > 0 ? (
                                                activeTopic.notes.map((note, idx) => (
                                                    <motion.div
                                                        key={note.id}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: idx * 0.03 }}
                                                        className="flex gap-3 group"
                                                    >
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-md">
                                                            {note.user?.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'NA'}
                                                        </div>
                                                        <div className="min-w-0 flex-1 rounded-2xl bg-slate-50 p-4 transition group-hover:shadow-md dark:bg-slate-800">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                                    {note.user?.name ?? 'Utilisateur'}
                                                                </p>
                                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                    {noteTime(note.created_at)}
                                                                </span>
                                                                {note.is_private ? (
                                                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                                                                        <Lock className="h-3 w-3" />
                                                                        Privée
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                                                                        <Globe className="h-3 w-3" />
                                                                        Publique
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                                                                {note.content}
                                                            </p>
                                                        </div>
                                                    </motion.div>
                                                ))
                                            ) : (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center dark:border-slate-700"
                                                >
                                                    <MessageSquare className="mx-auto h-12 w-12 text-slate-400" />
                                                    <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                                                        Aucune note pour ce sujet.
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        Commencez par ajouter une note ci-dessous
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>

                                {/* Add Note Form */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1.3 }}
                                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                                            <Send className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                                Ajouter une note
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Les notes publiques sont visibles par tous
                                            </p>
                                        </div>
                                    </div>

                                    <form onSubmit={submitNote} className="space-y-4">
                                        <textarea
                                            value={data.content}
                                            onChange={(event) => setData('content', event.target.value)}
                                            rows={6}
                                            className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                            placeholder="Saisir une observation, une décision, un suivi clinique..."
                                        />
                                        {errors.content && (
                                            <p className="text-sm text-rose-600">{errors.content}</p>
                                        )}

                                        <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 cursor-pointer transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                                            <input
                                                type="checkbox"
                                                checked={data.is_private}
                                                onChange={(event) => setData('is_private', event.target.checked)}
                                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <div className="flex-1">
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    Note privée
                                                </span>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    Visible uniquement par l'équipe d'organisation
                                                </p>
                                            </div>
                                            {data.is_private ? (
                                                <Shield className="h-4 w-4 text-amber-500" />
                                            ) : (
                                                <Globe className="h-4 w-4 text-indigo-500" />
                                            )}
                                        </label>

                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="submit"
                                            disabled={processing}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {processing ? (
                                                <>
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                    Envoi...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="h-4 w-4" />
                                                    Publier la note
                                                </>
                                            )}
                                        </motion.button>
                                    </form>
                                </motion.div>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center dark:border-slate-700"
                            >
                                <MessageSquare className="mx-auto h-16 w-16 text-slate-400" />
                                <h3 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
                                    Aucun sujet disponible
                                </h3>
                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                    Cette section ne contient pas encore de sujet.
                                </p>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

// Add missing import for Activity
import { Activity } from 'lucide-react';
