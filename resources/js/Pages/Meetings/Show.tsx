import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    Award,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    Clock3,
    FileCheck2,
    FileText,
    Globe,
    Lock,
    MapPin,
    MessageSquare,
    PlayCircle,
    Send,
    Shield,
    Sparkles,
    Timer,
    UserCheck,
    Users,
    Video,
    ClipboardPlus,
    ListTodo,
    CircleSlash,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { FormEvent, useEffect, useMemo, useState } from 'react';

type MeetingUser = {
    id: number;
    name: string;
    email: string;
    joined_at?: string | null;
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

type MeetingTopicAction = {
    id: number;
    meeting_topic_id: number;
    title: string;
    notes: string | null;
    status: 'a_faire' | 'en_cours' | 'termine';
    due_at: string | null;
    owner: MeetingUser | null;
};

type MeetingTopic = {
    id: number;
    title: string;
    expected_duration: number | null;
    status: 'en_attente' | 'en_cours' | 'traite';
    decision_summary: string | null;
    order: number;
    notes: MeetingNote[];
    actions: MeetingTopicAction[];
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
    opened_at: string | null;
    closed_at: string | null;
    status: 'planifie' | 'en_cours' | 'termine' | 'annule';
    viewer: {
        id: number;
        is_organizer: boolean;
        joined_at: string | null;
        can_open: boolean;
        can_close: boolean;
        can_manage: boolean;
        can_write_notes: boolean;
    };
    organizer: MeetingUser | null;
    participants: MeetingUser[];
    sections: MeetingSection[];
};

type ActionOwner = {
    id: number;
    name: string;
    email: string;
};

type MeetingShowProps = {
    meeting: MeetingDetails;
    actionOwners: ActionOwner[];
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
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}

function formatShortDateTime(value: string | null): string {
    if (!value) return 'Aucune echeance';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Aucune echeance';
    return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function toDatetimeLocal(value: string | null): string {
    if (!value) return '';
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hour}:${minute}`;
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
                label: 'Termine',
                icon: CheckCircle2,
                className: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
                gradient: 'from-slate-600 to-slate-700',
            };
        case 'annule':
            return {
                label: 'Annule',
                icon: AlertCircle,
                className: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300',
                gradient: 'from-rose-600 to-red-600',
            };
        default:
            return {
                label: 'Planifie',
                icon: CalendarDays,
                className: 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300',
                gradient: 'from-cyan-600 to-sky-600',
            };
    }
}

function topicStatusMeta(status: MeetingTopic['status']) {
    switch (status) {
        case 'en_cours':
            return {
                label: 'En cours',
                icon: Activity,
                chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
                iconClass: 'text-emerald-500 dark:text-emerald-300',
            };
        case 'traite':
            return {
                label: 'Traite',
                icon: CheckCircle2,
                chip: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
                iconClass: 'text-indigo-500 dark:text-indigo-300',
            };
        default:
            return {
                label: 'En attente',
                icon: Clock3,
                chip: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
                iconClass: 'text-slate-500 dark:text-slate-400',
            };
    }
}

function actionStatusMeta(status: MeetingTopicAction['status']) {
    switch (status) {
        case 'en_cours':
            return {
                label: 'En cours',
                chip: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
            };
        case 'termine':
            return {
                label: 'Terminee',
                chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
            };
        default:
            return {
                label: 'A faire',
                chip: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
            };
    }
}

function extractErrorMessage(error: any, fallback: string): string {
    return error?.response?.data?.message
        || error?.response?.data?.errors?.title?.[0]
        || error?.response?.data?.errors?.owner_id?.[0]
        || error?.response?.data?.errors?.decision_summary?.[0]
        || fallback;
}

export default function Show({ meeting, actionOwners }: MeetingShowProps) {
    const [meetingState, setMeetingState] = useState<MeetingDetails>(meeting);
    const [activeSectionId, setActiveSectionId] = useState<number | null>(meeting.sections[0]?.id ?? null);
    const [activeTopicId, setActiveTopicId] = useState<number | null>(meeting.sections[0]?.topics[0]?.id ?? null);
    const [openingMeeting, setOpeningMeeting] = useState(false);
    const [closingMeeting, setClosingMeeting] = useState(false);
    const [joiningMeeting, setJoiningMeeting] = useState(false);
    const [savingDecision, setSavingDecision] = useState(false);
    const [creatingAction, setCreatingAction] = useState(false);
    const [updatingActionId, setUpdatingActionId] = useState<number | null>(null);
    const [convertingDecision, setConvertingDecision] = useState(false);
    const [convertingActionId, setConvertingActionId] = useState<number | null>(null);
    const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string; href?: string } | null>(null);
    const [decisionForm, setDecisionForm] = useState({
        decision_summary: '',
        status: 'en_attente' as MeetingTopic['status'],
    });
    const [actionForm, setActionForm] = useState({
        title: '',
        owner_id: '',
        due_at: '',
        notes: '',
        status: 'a_faire' as MeetingTopicAction['status'],
    });
    const [decisionTaskForm, setDecisionTaskForm] = useState({
        title: '',
        owner_id: '',
        due_date: '',
        priority: 'high' as 'low' | 'normal' | 'high' | 'urgent',
    });

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

    const defaultOwnerId = useMemo(() => {
        const preferredOwner = actionOwners.find((owner) => owner.id === meetingState.viewer.id);
        return String(preferredOwner?.id ?? actionOwners[0]?.id ?? '');
    }, [actionOwners, meetingState.viewer.id]);

    useEffect(() => {
        setDecisionForm({
            decision_summary: activeTopic?.decision_summary ?? '',
            status: activeTopic?.status ?? 'en_attente',
        });
        setActionForm({
            title: '',
            owner_id: defaultOwnerId,
            due_at: '',
            notes: '',
            status: 'a_faire',
        });
        setDecisionTaskForm({
            title: activeTopic ? `Decision - ${activeTopic.title}` : '',
            owner_id: defaultOwnerId,
            due_date: '',
            priority: 'high',
        });
    }, [activeTopic?.id, activeTopic?.decision_summary, activeTopic?.status, activeTopic?.title, defaultOwnerId]);

    useEffect(() => {
        if (!window.Echo) return;

        const channelName = `meeting.${meetingState.id}`;

        const reloadMeeting = () => {
            router.reload({
                only: ['meeting', 'actionOwners'],
            });
        };

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

        const channel = window.Echo.private(channelName);
        channel.listen('.NoteCreated', appendIncomingNote);
        channel.listen('.MeetingOpened', reloadMeeting);
        channel.listen('.MeetingStateUpdated', reloadMeeting);

        return () => {
            window.Echo?.leave?.(channelName);
            window.Echo?.leaveChannel?.(`private-${channelName}`);
        };
    }, [meetingState.id]);

    const patchTopic = (topicId: number, updater: (topic: MeetingTopic) => MeetingTopic) => {
        setMeetingState((current) => ({
            ...current,
            sections: current.sections.map((section) => ({
                ...section,
                topics: section.topics.map((topic) => topic.id === topicId ? updater(topic) : topic),
            })),
        }));
    };

    const mergeTopicSnapshot = (snapshot: Partial<MeetingTopic> & { id: number }) => {
        patchTopic(snapshot.id, (topic) => ({
            ...topic,
            ...snapshot,
            notes: topic.notes,
            actions: snapshot.actions ?? topic.actions,
        }));
    };

    const submitNote = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!activeTopic) return;
        clearErrors();
        setFeedback(null);

        try {
            const response = await window.axios.post(route('meetings.notes.store', {
                meeting: meetingState.id,
                topic: activeTopic.id,
            }), {
                content: data.content,
                is_private: data.is_private,
            });

            const nextNote = response.data.note as MeetingNote;

            patchTopic(nextNote.meeting_topic_id, (topic) => ({
                ...topic,
                notes: [...topic.notes, nextNote],
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

    const startMeeting = () => {
        setOpeningMeeting(true);
        setFeedback(null);

        router.post(route('meetings.open', meetingState.id), {}, {
            preserveScroll: true,
            onFinish: () => setOpeningMeeting(false),
        });
    };

    const closeMeeting = () => {
        if (!window.confirm('Cloturer ce staff ? Les notes, decisions et actions seront figees.')) {
            return;
        }

        setClosingMeeting(true);
        setFeedback(null);

        router.post(route('meetings.close', meetingState.id), {}, {
            preserveScroll: true,
            onFinish: () => setClosingMeeting(false),
        });
    };

    const joinMeeting = async () => {
        setJoiningMeeting(true);
        setFeedback(null);

        try {
            const response = await window.axios.post(route('meetings.join', meetingState.id));
            const joinedAt = response.data.joined_at as string | null;

            setMeetingState((current) => ({
                ...current,
                viewer: {
                    ...current.viewer,
                    joined_at: joinedAt,
                    can_write_notes: joinedAt !== null && current.opened_at !== null && current.closed_at === null,
                },
                participants: current.participants.map((participant) =>
                    participant.id === current.viewer.id
                        ? { ...participant, joined_at: joinedAt }
                        : participant,
                ),
            }));
        } catch (error: any) {
            const message = error?.response?.data?.message;
            setError('content', message || 'Impossible de rejoindre le staff pour le moment.');
        } finally {
            setJoiningMeeting(false);
        }
    };

    const saveDecision = async () => {
        if (!activeTopic) return;

        setSavingDecision(true);
        setFeedback(null);

        try {
            const response = await window.axios.patch(route('meetings.topics.decision.update', {
                meeting: meetingState.id,
                topic: activeTopic.id,
            }), decisionForm);

            mergeTopicSnapshot(response.data.topic as MeetingTopic);
            setFeedback({
                tone: 'success',
                message: 'Decision et statut du sujet mis a jour.',
            });
        } catch (error: any) {
            setFeedback({
                tone: 'error',
                message: extractErrorMessage(error, 'Impossible d enregistrer la decision pour le moment.'),
            });
        } finally {
            setSavingDecision(false);
        }
    };

    const createAction = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!activeTopic) return;

        setCreatingAction(true);
        setFeedback(null);

        try {
            const response = await window.axios.post(route('meetings.topics.actions.store', {
                meeting: meetingState.id,
                topic: activeTopic.id,
            }), {
                title: actionForm.title,
                owner_id: actionForm.owner_id ? Number(actionForm.owner_id) : null,
                due_at: actionForm.due_at || null,
                notes: actionForm.notes || null,
                status: actionForm.status,
            });

            const createdAction = response.data.action as MeetingTopicAction;

            patchTopic(activeTopic.id, (topic) => ({
                ...topic,
                actions: [createdAction, ...topic.actions],
            }));

            setActionForm({
                title: '',
                owner_id: defaultOwnerId,
                due_at: '',
                notes: '',
                status: 'a_faire',
            });
            setFeedback({
                tone: 'success',
                message: 'Action de suivi ajoutee au sujet.',
            });
        } catch (error: any) {
            setFeedback({
                tone: 'error',
                message: extractErrorMessage(error, 'Impossible d ajouter cette action pour le moment.'),
            });
        } finally {
            setCreatingAction(false);
        }
    };

    const updateActionStatus = async (action: MeetingTopicAction, status: MeetingTopicAction['status']) => {
        if (!activeTopic) return;

        setUpdatingActionId(action.id);
        setFeedback(null);

        try {
            const response = await window.axios.patch(route('meetings.topics.actions.update', {
                meeting: meetingState.id,
                topic: activeTopic.id,
                action: action.id,
            }), {
                title: action.title,
                owner_id: action.owner?.id ?? null,
                due_at: action.due_at,
                notes: action.notes,
                status,
            });

            const updatedAction = response.data.action as MeetingTopicAction;

            patchTopic(activeTopic.id, (topic) => ({
                ...topic,
                actions: topic.actions.map((item) => item.id === updatedAction.id ? updatedAction : item),
            }));
        } catch (error: any) {
            setFeedback({
                tone: 'error',
                message: extractErrorMessage(error, 'Impossible de mettre a jour cette action.'),
            });
        } finally {
            setUpdatingActionId(null);
        }
    };

    const convertDecisionToTask = async () => {
        if (!activeTopic) return;

        setConvertingDecision(true);
        setFeedback(null);

        try {
            const response = await window.axios.post(route('meetings.topics.tasks.store', {
                meeting: meetingState.id,
                topic: activeTopic.id,
            }), {
                source_type: 'decision',
                title: decisionTaskForm.title,
                owner_id: decisionTaskForm.owner_id ? Number(decisionTaskForm.owner_id) : null,
                due_date: decisionTaskForm.due_date || null,
                priority: decisionTaskForm.priority,
            });

            setFeedback({
                tone: 'success',
                message: `Tache creee: ${response.data.task.title}`,
                href: response.data.task.show_url,
            });
        } catch (error: any) {
            setFeedback({
                tone: 'error',
                message: extractErrorMessage(error, 'Impossible de convertir cette decision en tache.'),
            });
        } finally {
            setConvertingDecision(false);
        }
    };

    const convertActionToTask = async (action: MeetingTopicAction) => {
        if (!activeTopic) return;

        setConvertingActionId(action.id);
        setFeedback(null);

        try {
            const response = await window.axios.post(route('meetings.topics.tasks.store', {
                meeting: meetingState.id,
                topic: activeTopic.id,
            }), {
                source_type: 'action',
                action_id: action.id,
                owner_id: action.owner?.id ?? null,
                due_date: action.due_at,
                priority: action.status === 'termine' ? 'normal' : 'high',
            });

            setFeedback({
                tone: 'success',
                message: `Tache creee: ${response.data.task.title}`,
                href: response.data.task.show_url,
            });
        } catch (error: any) {
            setFeedback({
                tone: 'error',
                message: extractErrorMessage(error, 'Impossible de convertir cette action en tache.'),
            });
        } finally {
            setConvertingActionId(null);
        }
    };

    const status = statusMeta(meetingState.status);
    const StatusIcon = status.icon;
    const totalTopics = meetingState.sections.reduce((acc, section) => acc + section.topics.length, 0);
    const totalNotes = meetingState.sections.reduce((acc, section) => acc + section.topics.reduce((sum, topic) => sum + topic.notes.length, 0), 0);
    const totalActions = meetingState.sections.reduce((acc, section) => acc + section.topics.reduce((sum, topic) => sum + topic.actions.length, 0), 0);
    const presentCount = meetingState.participants.filter((participant) => participant.joined_at).length;
    const isOpened = meetingState.opened_at !== null;
    const isClosed = meetingState.closed_at !== null;
    const canWriteNotes = meetingState.viewer.can_write_notes;
    const canManageMeeting = meetingState.viewer.can_manage;
    const showWaitingForOrganizer = !meetingState.viewer.is_organizer && !isOpened;
    const canJoinMeeting = !meetingState.viewer.is_organizer && isOpened && !isClosed && !meetingState.viewer.joined_at;

    return (
        <AuthenticatedLayout
            title={meetingState.title}
            description="Compte-rendu, decisions et actions de suivi dans un seul espace."
            actions={
                <div className="flex flex-wrap items-center gap-3">
                    {meetingState.viewer.can_open ? (
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={startMeeting}
                            disabled={openingMeeting}
                            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <PlayCircle className="h-4 w-4" />
                            {openingMeeting ? 'Ouverture...' : 'Start Meeting'}
                        </motion.button>
                    ) : null}

                    {meetingState.viewer.can_close ? (
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={closeMeeting}
                            disabled={closingMeeting}
                            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-500/20 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <FileCheck2 className="h-4 w-4" />
                            {closingMeeting ? 'Cloture...' : 'Close Meeting'}
                        </motion.button>
                    ) : null}

                    {canJoinMeeting ? (
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={joinMeeting}
                            disabled={joiningMeeting}
                            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <UserCheck className="h-4 w-4" />
                            {joiningMeeting ? 'Connexion...' : 'Join meeting'}
                        </motion.button>
                    ) : null}

                    <Link
                        href={route('meetings.index')}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        Retour aux staffs
                    </Link>
                </div>
            }
        >
            <Head title={meetingState.title} />

            <div className="space-y-8">
                <motion.section
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 p-8 shadow-2xl"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.14),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(99,102,241,0.22),_transparent_32%)]" />

                    <div className="relative grid gap-8 lg:grid-cols-[1fr_auto]">
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <span className={`inline-flex items-center gap-2 rounded-full border ${status.className} px-3 py-1.5 text-xs font-semibold`}>
                                    <StatusIcon className="h-3.5 w-3.5" />
                                    {status.label}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
                                    {meetingState.type === 'distanciel' ? (
                                        <Video className="h-3.5 w-3.5" />
                                    ) : (
                                        <MapPin className="h-3.5 w-3.5" />
                                    )}
                                    {meetingState.type === 'distanciel' ? 'Distanciel' : 'Presentiel'}
                                </span>
                                {meetingState.organizer ? (
                                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-100">
                                        <Award className="h-3.5 w-3.5" />
                                        Organise par {meetingState.organizer.name}
                                    </span>
                                ) : null}
                            </div>

                            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                {meetingState.title}
                            </h1>

                            <p className="mt-3 max-w-2xl text-indigo-100">
                                Finalisez le compte-rendu en temps reel, attribuez des responsables et transformez les decisions en suivi concret.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[480px]">
                            {[
                                { label: 'Sections', value: meetingState.sections.length, icon: BookOpen, gradient: 'from-indigo-500 to-purple-500' },
                                { label: 'Sujets', value: totalTopics, icon: FileText, gradient: 'from-cyan-500 to-sky-500' },
                                { label: 'Notes', value: totalNotes, icon: MessageSquare, gradient: 'from-emerald-500 to-teal-500' },
                                { label: 'Actions', value: totalActions, icon: ListTodo, gradient: 'from-amber-500 to-orange-500' },
                            ].map((stat) => (
                                <div
                                    key={stat.label}
                                    className="group relative overflow-hidden rounded-2xl bg-white/10 p-4 backdrop-blur-sm transition hover:bg-white/20"
                                >
                                    <stat.icon className="absolute right-3 top-3 h-8 w-8 text-white/20 transition group-hover:scale-110" />
                                    <p className="text-xs uppercase tracking-[0.18em] text-indigo-200">{stat.label}</p>
                                    <p className="mt-2 text-3xl font-bold text-white">{stat.value}</p>
                                    <div className={`mt-2 h-1 w-full rounded-full bg-gradient-to-r ${stat.gradient} opacity-0 transition group-hover:opacity-100`} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        <HeroInfoCard icon={CalendarDays} label="Date" value={formatDate(meetingState.start_time)} />
                        <HeroInfoCard icon={Clock3} label="Debut" value={formatDateTime(meetingState.start_time)} />
                        <HeroInfoCard icon={Timer} label="Fin" value={formatDateTime(meetingState.end_time)} />
                        <HeroInfoCard icon={PlayCircle} label="Ouverture" value={formatDateTime(meetingState.opened_at)} />
                        <HeroInfoCard
                            icon={meetingState.type === 'distanciel' ? Video : MapPin}
                            label={meetingState.type === 'distanciel' ? 'Lien' : 'Lieu'}
                            value={meetingState.location_or_link || 'Non renseigne'}
                        />
                    </div>
                </motion.section>

                {feedback ? (
                    <div className={`rounded-2xl border px-4 py-3 text-sm ${
                        feedback.tone === 'success'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200'
                            : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200'
                    }`}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <span>{feedback.message}</span>
                            {feedback.href ? (
                                <Link href={feedback.href} className="font-semibold underline underline-offset-4">
                                    Ouvrir la tache
                                </Link>
                            ) : null}
                        </div>
                    </div>
                ) : null}

                <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                    <aside className="space-y-6">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Sections</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{meetingState.sections.length} section(s)</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
                                    <BookOpen className="h-5 w-5" />
                                </div>
                            </div>

                            <div className="mt-6 space-y-3">
                                {meetingState.sections.map((section, index) => (
                                    <button
                                        key={section.id}
                                        type="button"
                                        onClick={() => {
                                            setActiveSectionId(section.id);
                                            setActiveTopicId(section.topics[0]?.id ?? null);
                                        }}
                                        className={`w-full rounded-2xl border p-4 text-left transition ${
                                            activeSection?.id === section.id
                                                ? 'border-indigo-300 bg-indigo-50 shadow-lg shadow-indigo-500/10 dark:border-indigo-500/40 dark:bg-indigo-500/10'
                                                : 'border-slate-200 bg-white hover:border-indigo-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-950 dark:hover:border-indigo-500/30 dark:hover:bg-slate-900'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
                                                {index + 1}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-900 dark:text-white">{section.title}</p>
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{section.topics.length} sujet(s)</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Participants</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{meetingState.participants.length} invite(s)</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                                    <Users className="h-5 w-5" />
                                </div>
                            </div>

                            <div className="mt-6 space-y-2">
                                {meetingState.participants.map((participant) => (
                                    <div
                                        key={participant.id}
                                        className={`rounded-2xl border p-3 ${
                                            participant.joined_at
                                                ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10'
                                                : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/70'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{participant.name}</p>
                                                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{participant.email}</p>
                                            </div>
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                                participant.joined_at
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                            }`}>
                                                {participant.joined_at ? <CheckCircle2 className="h-3 w-3" /> : <CircleSlash className="h-3 w-3" />}
                                                {participant.joined_at ? 'Present' : 'En attente'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Presence</h2>
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <SidebarStat label="Presents" value={presentCount} tone="emerald" />
                                <SidebarStat label="Notes" value={totalNotes} tone="indigo" />
                            </div>
                        </div>
                    </aside>

                    <div className="space-y-6">
                        {activeSection ? (
                            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{activeSection.title}</h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Selectionnez un sujet pour finaliser la decision et les actions associees.
                                </p>

                                <div className="mt-6 flex flex-wrap gap-2">
                                    {activeSection.topics.map((topic) => {
                                        const meta = topicStatusMeta(topic.status);
                                        const TopicIcon = meta.icon;
                                        const isActive = activeTopic?.id === topic.id;

                                        return (
                                            <button
                                                key={topic.id}
                                                type="button"
                                                onClick={() => setActiveTopicId(topic.id)}
                                                className={`rounded-2xl px-4 py-3 text-left transition ${
                                                    isActive
                                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <TopicIcon className={`h-4 w-4 ${isActive ? 'text-white' : meta.iconClass}`} />
                                                    <span className="font-medium">{topic.title}</span>
                                                </div>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                                        isActive ? 'bg-white/20 text-white' : meta.chip
                                                    }`}>
                                                        {meta.label}
                                                    </span>
                                                    {topic.expected_duration ? (
                                                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                                            isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-600 dark:bg-slate-950 dark:text-slate-300'
                                                        }`}>
                                                            {topic.expected_duration} min
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : null}

                        {activeTopic ? (
                            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
                                <div className="space-y-6">
                                    <div className="rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
                                        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div>
                                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{activeTopic.title}</h3>
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {activeTopic.expected_duration ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                                <Timer className="h-3 w-3" />
                                                                {activeTopic.expected_duration} min
                                                            </span>
                                                        ) : null}
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-xs text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                                                            <MessageSquare className="h-3 w-3" />
                                                            {activeTopic.notes.length} note(s)
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                                                            <ClipboardPlus className="h-3 w-3" />
                                                            {activeTopic.actions.length} action(s)
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="max-h-[620px] space-y-4 overflow-y-auto p-5">
                                            <AnimatePresence>
                                                {activeTopic.notes.length > 0 ? (
                                                    activeTopic.notes.map((note, index) => (
                                                        <motion.div
                                                            key={note.id}
                                                            initial={{ opacity: 0, y: 18 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: index * 0.03 }}
                                                            className="flex gap-3"
                                                        >
                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-md">
                                                                {note.user?.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'NA'}
                                                            </div>
                                                            <div className="min-w-0 flex-1 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/80">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                                        {note.user?.name ?? 'Utilisateur'}
                                                                    </p>
                                                                    <span className="text-xs text-slate-500 dark:text-slate-400">{noteTime(note.created_at)}</span>
                                                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                                                        note.is_private
                                                                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                                                                            : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                                                                    }`}>
                                                                        {note.is_private ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                                                                        {note.is_private ? 'Privee' : 'Publique'}
                                                                    </span>
                                                                </div>
                                                                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">
                                                                    {note.content}
                                                                </p>
                                                            </div>
                                                        </motion.div>
                                                    ))
                                                ) : (
                                                    <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center dark:border-slate-700">
                                                        <MessageSquare className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" />
                                                        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Aucune note pour ce sujet.</p>
                                                    </div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                                        <div className="mb-6 flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                                                <Send className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Ajouter une note</h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Les notes publiques sont visibles par tous les participants autorises.</p>
                                            </div>
                                        </div>

                                        {showWaitingForOrganizer ? (
                                            <InfoAlert
                                                icon={Timer}
                                                title="Waiting for organizer"
                                                description="La prise de notes reste verrouillee tant que l organisateur n a pas ouvert officiellement le staff."
                                                tone="amber"
                                            />
                                        ) : isClosed ? (
                                            <InfoAlert
                                                icon={Shield}
                                                title="Reunion cloturee"
                                                description="La fenetre officielle de saisie est fermee. Aucune nouvelle note ne peut etre enregistree."
                                                tone="slate"
                                            />
                                        ) : canWriteNotes ? (
                                            <form onSubmit={submitNote} className="space-y-4">
                                                <textarea
                                                    value={data.content}
                                                    onChange={(event) => setData('content', event.target.value)}
                                                    rows={6}
                                                    className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900 dark:focus:ring-indigo-500/10"
                                                    placeholder="Saisir une observation, une decision, un suivi clinique..."
                                                />
                                                {errors.content ? (
                                                    <p className="text-sm text-rose-600 dark:text-rose-400">{errors.content}</p>
                                                ) : null}

                                                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-900">
                                                    <input
                                                        type="checkbox"
                                                        checked={data.is_private}
                                                        onChange={(event) => setData('is_private', event.target.checked)}
                                                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900"
                                                    />
                                                    <div className="flex-1">
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Note privee</span>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">Visible uniquement par l auteur et l organisateur.</p>
                                                    </div>
                                                    {data.is_private ? (
                                                        <Shield className="h-4 w-4 text-amber-500" />
                                                    ) : (
                                                        <Globe className="h-4 w-4 text-indigo-500" />
                                                    )}
                                                </label>

                                                <button
                                                    type="submit"
                                                    disabled={processing}
                                                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {processing ? 'Envoi...' : 'Publier la note'}
                                                </button>
                                            </form>
                                        ) : (
                                            <InfoAlert
                                                icon={Shield}
                                                title="Lecture seule"
                                                description="Vous pourrez ecrire uniquement apres ouverture officielle et apres avoir rejoint le staff."
                                                tone="slate"
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
                                                <FileCheck2 className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Decision</h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Resume, statut et responsabilisation du sujet.</p>
                                            </div>
                                        </div>

                                        <div className="mt-6 space-y-4">
                                            <textarea
                                                value={decisionForm.decision_summary}
                                                onChange={(event) => setDecisionForm((current) => ({
                                                    ...current,
                                                    decision_summary: event.target.value,
                                                }))}
                                                rows={5}
                                                disabled={!canManageMeeting}
                                                className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900 dark:focus:ring-indigo-500/10"
                                                placeholder="Decision finale, responsable, arbitrage ou conduite a tenir..."
                                            />

                                            <select
                                                value={decisionForm.status}
                                                onChange={(event) => setDecisionForm((current) => ({
                                                    ...current,
                                                    status: event.target.value as MeetingTopic['status'],
                                                }))}
                                                disabled={!canManageMeeting}
                                                className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900 dark:focus:ring-indigo-500/10"
                                            >
                                                <option value="en_attente">En attente</option>
                                                <option value="en_cours">En cours</option>
                                                <option value="traite">Traite</option>
                                            </select>

                                            {canManageMeeting ? (
                                                <button
                                                    type="button"
                                                    onClick={saveDecision}
                                                    disabled={savingDecision}
                                                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-900 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {savingDecision ? 'Enregistrement...' : 'Enregistrer la decision'}
                                                </button>
                                            ) : null}
                                        </div>

                                        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Conversion en tache</p>
                                            <div className="mt-4 space-y-3">
                                                <input
                                                    type="text"
                                                    value={decisionTaskForm.title}
                                                    onChange={(event) => setDecisionTaskForm((current) => ({
                                                        ...current,
                                                        title: event.target.value,
                                                    }))}
                                                    disabled={!canManageMeeting}
                                                    className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-indigo-500/10"
                                                    placeholder="Titre de la tache"
                                                />

                                                <div className="grid gap-3 md:grid-cols-2">
                                                    <select
                                                        value={decisionTaskForm.owner_id}
                                                        onChange={(event) => setDecisionTaskForm((current) => ({
                                                            ...current,
                                                            owner_id: event.target.value,
                                                        }))}
                                                        disabled={!canManageMeeting}
                                                        className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-indigo-500/10"
                                                    >
                                                        <option value="">Choisir un responsable</option>
                                                        {actionOwners.map((owner) => (
                                                            <option key={owner.id} value={owner.id}>
                                                                {owner.name}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    <select
                                                        value={decisionTaskForm.priority}
                                                        onChange={(event) => setDecisionTaskForm((current) => ({
                                                            ...current,
                                                            priority: event.target.value as 'low' | 'normal' | 'high' | 'urgent',
                                                        }))}
                                                        disabled={!canManageMeeting}
                                                        className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-indigo-500/10"
                                                    >
                                                        <option value="low">Priorite basse</option>
                                                        <option value="normal">Priorite normale</option>
                                                        <option value="high">Priorite haute</option>
                                                        <option value="urgent">Priorite urgente</option>
                                                    </select>
                                                </div>

                                                <input
                                                    type="datetime-local"
                                                    value={decisionTaskForm.due_date}
                                                    onChange={(event) => setDecisionTaskForm((current) => ({
                                                        ...current,
                                                        due_date: event.target.value,
                                                    }))}
                                                    disabled={!canManageMeeting}
                                                    className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-indigo-500/10"
                                                />

                                                {canManageMeeting ? (
                                                    <button
                                                        type="button"
                                                        onClick={convertDecisionToTask}
                                                        disabled={convertingDecision}
                                                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                                                    >
                                                        {convertingDecision ? 'Creation...' : 'Convertir la decision en tache'}
                                                    </button>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
                                                <ClipboardPlus className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Actions de suivi</h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Responsables, echeances et conversion en tache personnelle.</p>
                                            </div>
                                        </div>

                                        <div className="mt-6 space-y-3">
                                            {activeTopic.actions.length > 0 ? (
                                                activeTopic.actions.map((action) => {
                                                    const meta = actionStatusMeta(action.status);
                                                    const isBusy = updatingActionId === action.id || convertingActionId === action.id;

                                                    return (
                                                        <div key={action.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{action.title}</p>
                                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.chip}`}>
                                                                            {meta.label}
                                                                        </span>
                                                                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                                                                            {action.owner?.name ?? 'Sans responsable'}
                                                                        </span>
                                                                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                                                                            {formatShortDateTime(action.due_at)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {action.notes ? (
                                                                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{action.notes}</p>
                                                            ) : null}

                                                            {canManageMeeting ? (
                                                                <div className="mt-4 flex flex-wrap gap-2">
                                                                    {action.status !== 'a_faire' ? (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updateActionStatus(action, 'a_faire')}
                                                                            disabled={isBusy}
                                                                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                                                                        >
                                                                            Mettre a faire
                                                                        </button>
                                                                    ) : null}
                                                                    {action.status !== 'en_cours' ? (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updateActionStatus(action, 'en_cours')}
                                                                            disabled={isBusy}
                                                                            className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
                                                                        >
                                                                            Passer en cours
                                                                        </button>
                                                                    ) : null}
                                                                    {action.status !== 'termine' ? (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updateActionStatus(action, 'termine')}
                                                                            disabled={isBusy}
                                                                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
                                                                        >
                                                                            Marquer terminee
                                                                        </button>
                                                                    ) : null}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => convertActionToTask(action)}
                                                                        disabled={isBusy}
                                                                        className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                                                                    >
                                                                        {convertingActionId === action.id ? 'Creation...' : 'Convertir en tache'}
                                                                    </button>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center dark:border-slate-700">
                                                    <ClipboardPlus className="mx-auto h-10 w-10 text-slate-400 dark:text-slate-500" />
                                                    <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Aucune action de suivi sur ce sujet.</p>
                                                </div>
                                            )}
                                        </div>

                                        {canManageMeeting ? (
                                            <form onSubmit={createAction} className="mt-6 space-y-3 border-t border-slate-200 pt-6 dark:border-slate-800">
                                                <input
                                                    type="text"
                                                    value={actionForm.title}
                                                    onChange={(event) => setActionForm((current) => ({
                                                        ...current,
                                                        title: event.target.value,
                                                    }))}
                                                    className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900 dark:focus:ring-indigo-500/10"
                                                    placeholder="Nouvelle action de suivi"
                                                />

                                                <div className="grid gap-3 md:grid-cols-2">
                                                    <select
                                                        value={actionForm.owner_id}
                                                        onChange={(event) => setActionForm((current) => ({
                                                        ...current,
                                                        owner_id: event.target.value,
                                                    }))}
                                                        className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900 dark:focus:ring-indigo-500/10"
                                                    >
                                                        <option value="">Sans responsable</option>
                                                        {actionOwners.map((owner) => (
                                                            <option key={owner.id} value={owner.id}>
                                                                {owner.name}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    <select
                                                        value={actionForm.status}
                                                        onChange={(event) => setActionForm((current) => ({
                                                        ...current,
                                                        status: event.target.value as MeetingTopicAction['status'],
                                                    }))}
                                                        className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900 dark:focus:ring-indigo-500/10"
                                                    >
                                                        <option value="a_faire">A faire</option>
                                                        <option value="en_cours">En cours</option>
                                                        <option value="termine">Terminee</option>
                                                    </select>
                                                </div>

                                                <input
                                                    type="datetime-local"
                                                    value={actionForm.due_at}
                                                    onChange={(event) => setActionForm((current) => ({
                                                        ...current,
                                                        due_at: event.target.value,
                                                    }))}
                                                    className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900 dark:focus:ring-indigo-500/10"
                                                />

                                                <textarea
                                                    value={actionForm.notes}
                                                    onChange={(event) => setActionForm((current) => ({
                                                        ...current,
                                                        notes: event.target.value,
                                                    }))}
                                                    rows={3}
                                                    className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900 dark:focus:ring-indigo-500/10"
                                                    placeholder="Notes de suivi, contexte, livrable attendu..."
                                                />

                                                <button
                                                    type="submit"
                                                    disabled={creatingAction}
                                                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {creatingAction ? 'Ajout...' : 'Ajouter une action'}
                                                </button>
                                            </form>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center dark:border-slate-700">
                                <MessageSquare className="mx-auto h-16 w-16 text-slate-400 dark:text-slate-500" />
                                <h3 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">Aucun sujet disponible</h3>
                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Cette section ne contient pas encore de sujet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function HeroInfoCard({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof CalendarDays;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-200">
                <Icon className="h-4 w-4" />
                {label}
            </div>
            <p className="mt-2 break-words text-sm text-white">{value}</p>
        </div>
    );
}

function SidebarStat({
    label,
    value,
    tone,
}: {
    label: string;
    value: number;
    tone: 'emerald' | 'indigo';
}) {
    const toneClass = tone === 'emerald'
        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
        : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300';

    return (
        <div className={`rounded-2xl px-4 py-3 ${toneClass}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
    );
}

function InfoAlert({
    icon: Icon,
    title,
    description,
    tone,
}: {
    icon: typeof AlertCircle;
    title: string;
    description: string;
    tone: 'amber' | 'slate';
}) {
    const classes = tone === 'amber'
        ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100'
        : 'border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100';

    const iconClass = tone === 'amber' ? 'text-amber-600 dark:text-amber-300' : 'text-slate-600 dark:text-slate-300';

    return (
        <div className={`rounded-2xl border p-5 ${classes}`}>
            <div className="flex items-start gap-3">
                <Icon className={`mt-0.5 h-5 w-5 ${iconClass}`} />
                <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-1 text-sm opacity-90">{description}</p>
                </div>
            </div>
        </div>
    );
}
