import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    Clock3,
    MapPin,
    Plus,
    Trash2,
    Users,
    Video,
    Sparkles,
    Wand2,
    Settings,
    UserPlus,
    ListChecks,
    Clock,
    Calendar,
    X,
    ChevronDown,
    Loader2,
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ParticipantOption = {
    id: number;
    name: string;
    email: string;
    role_name: string | null;
    department_name: string | null;
};

type TopicDraft = {
    id: string;
    title: string;
    expected_duration: string;
    status: 'en_attente' | 'en_cours' | 'traite';
};

type SectionDraft = {
    id: string;
    title: string;
    topics: TopicDraft[];
};

type CreateMeetingProps = {
    participants: ParticipantOption[];
};

function toDatetimeLocal(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    const hour = String(value.getHours()).padStart(2, '0');
    const minute = String(value.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hour}:${minute}`;
}

function createTopic(): TopicDraft {
    return {
        id: `${Date.now()}-${Math.random()}`,
        title: '',
        expected_duration: '',
        status: 'en_attente',
    };
}

function createSection(): SectionDraft {
    return {
        id: `${Date.now()}-${Math.random()}`,
        title: '',
        topics: [createTopic()],
    };
}

export default function Create({ participants }: CreateMeetingProps) {
    const startDefault = useMemo(() => {
        const nextHour = new Date();
        nextHour.setMinutes(0, 0, 0);
        nextHour.setHours(nextHour.getHours() + 1);
        return nextHour;
    }, []);

    const endDefault = useMemo(() => {
        const nextTwoHours = new Date(startDefault);
        nextTwoHours.setHours(nextTwoHours.getHours() + 1);
        return nextTwoHours;
    }, [startDefault]);

    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('__all__');
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<'details' | 'agenda' | 'participants'>('details');

    const { data, setData, post, processing, errors } = useForm<{
        title: string;
        type: 'presentiel' | 'distanciel';
        location_or_link: string;
        start_time: string;
        end_time: string;
        status: 'planifie' | 'en_cours' | 'termine' | 'annule';
        participant_ids: number[];
        sections: SectionDraft[];
    }>({
        title: '',
        type: 'presentiel',
        location_or_link: '',
        start_time: toDatetimeLocal(startDefault),
        end_time: toDatetimeLocal(endDefault),
        status: 'planifie',
        participant_ids: [],
        sections: [createSection()],
    });

    const roleOptions = useMemo(() => {
        const roles = participants.map((participant) => participant.role_name?.trim() || 'Sans role');
        return Array.from(new Set(roles)).sort((a, b) => a.localeCompare(b));
    }, [participants]);

    const visibleParticipants = participants.filter((participant) => {
        const normalizedSearch = search.trim().toLowerCase();
        const participantRole = participant.role_name?.trim() || 'Sans role';

        if (roleFilter !== '__all__' && participantRole !== roleFilter) {
            return false;
        }

        if (!normalizedSearch) return true;

        return (
            participant.name.toLowerCase().includes(normalizedSearch) ||
            participant.email.toLowerCase().includes(normalizedSearch) ||
            (participant.role_name ?? '').toLowerCase().includes(normalizedSearch) ||
            (participant.department_name ?? '').toLowerCase().includes(normalizedSearch)
        );
    });

    const toggleParticipant = (participantId: number) => {
        setData(
            'participant_ids',
            data.participant_ids.includes(participantId)
                ? data.participant_ids.filter((id) => id !== participantId)
                : [...data.participant_ids, participantId]
        );
    };

    const selectAllVisibleParticipants = () => {
        const visibleIds = visibleParticipants.map((participant) => participant.id);
        setData('participant_ids', Array.from(new Set([...data.participant_ids, ...visibleIds])));
    };

    const deselectAllVisibleParticipants = () => {
        const visibleIds = new Set(visibleParticipants.map((participant) => participant.id));
        setData('participant_ids', data.participant_ids.filter((id) => !visibleIds.has(id)));
    };

    const addSection = () => {
        const newSection = createSection();
        setData('sections', [...data.sections, newSection]);
        setExpandedSections(prev => new Set(prev).add(newSection.id));
    };

    const removeSection = (sectionId: string) => {
        if (data.sections.length === 1) return;
        setData('sections', data.sections.filter((section) => section.id !== sectionId));
        setExpandedSections(prev => {
            const next = new Set(prev);
            next.delete(sectionId);
            return next;
        });
    };

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(sectionId)) {
                next.delete(sectionId);
            } else {
                next.add(sectionId);
            }
            return next;
        });
    };

    const updateSection = (sectionId: string, title: string) => {
        setData(
            'sections',
            data.sections.map((section) =>
                section.id === sectionId ? { ...section, title } : section
            )
        );
    };

    const addTopic = (sectionId: string) => {
        setData(
            'sections',
            data.sections.map((section) =>
                section.id === sectionId
                    ? { ...section, topics: [...section.topics, createTopic()] }
                    : section
            )
        );
    };

    const removeTopic = (sectionId: string, topicId: string) => {
        setData(
            'sections',
            data.sections.map((section) => {
                if (section.id !== sectionId || section.topics.length === 1) return section;
                return {
                    ...section,
                    topics: section.topics.filter((topic) => topic.id !== topicId),
                };
            })
        );
    };

    const updateTopic = (
        sectionId: string,
        topicId: string,
        field: keyof TopicDraft,
        value: string
    ) => {
        setData(
            'sections',
            data.sections.map((section) => {
                if (section.id !== sectionId) return section;
                return {
                    ...section,
                    topics: section.topics.map((topic) =>
                        topic.id === topicId ? { ...topic, [field]: value } : topic
                    ),
                };
            })
        );
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(route('meetings.store'), { preserveScroll: true });
    };

    const totalDuration = useMemo(() => {
        return data.sections.reduce(
            (total, section) =>
                total +
                section.topics.reduce(
                    (sum, topic) => sum + (parseInt(topic.expected_duration) || 0),
                    0
                ),
            0
        );
    }, [data.sections]);

    return (
        <AuthenticatedLayout
            title="Creer un staff medical"
            description="Composez un ordre du jour structure et invitez les participants concernes."
        >
            <Head title="Creer un staff medical" />

            <form onSubmit={submit} className="space-y-8">
                {/* Hero Section with Gradient */}
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

                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <Link
                                    href={route('meetings.index')}
                                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Retour aux staffs
                                </Link>
                            </motion.div>
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl"
                            >
                                Nouveau staff medical
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="mt-4 max-w-2xl text-base text-indigo-100"
                            >
                                Preparez un ordre du jour par sections et sujets, puis partagez un espace de notes
                                collaboratif securise avec l'equipe.
                            </motion.p>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className="grid gap-3 sm:grid-cols-3"
                        >
                            {[
                                { label: 'Participants', value: data.participant_ids.length, icon: Users },
                                { label: 'Sections', value: data.sections.length, icon: ListChecks },
                                { label: 'Sujets', value: data.sections.reduce((t, s) => t + s.topics.length, 0), icon: Sparkles },
                            ].map((stat, idx) => (
                                <div
                                    key={idx}
                                    className="group relative overflow-hidden rounded-2xl bg-white/10 p-4 backdrop-blur-sm transition hover:bg-white/20"
                                >
                                    <stat.icon className="absolute right-3 top-3 h-8 w-8 text-white/20 transition group-hover:scale-110" />
                                    <p className="text-xs uppercase tracking-[0.18em] text-indigo-200">{stat.label}</p>
                                    <p className="mt-2 text-3xl font-bold text-white">{stat.value}</p>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </motion.section>

                {/* Tab Navigation */}
                <div className="flex gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
                    {[
                        { id: 'details', label: 'Details', icon: Settings },
                        { id: 'agenda', label: 'Agenda', icon: Calendar },
                        { id: 'participants', label: 'Participants', icon: UserPlus },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                                activeTab === tab.id
                                    ? 'bg-white text-indigo-600 shadow-lg dark:bg-slate-900 dark:text-indigo-400'
                                    : 'text-slate-600 hover:bg-white/50 dark:text-slate-400 dark:hover:bg-slate-700'
                            }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
                    <div className="space-y-8">
                        {/* Details Tab */}
                        <AnimatePresence mode="wait">
                            {activeTab === 'details' && (
                                <motion.div
                                    key="details"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900"
                                >
                                    <div className="mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
                                                <Sparkles className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                                    Informations du staff
                                                </h2>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    Configurez les parametres principaux de votre reunion
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                Titre du staff
                                            </label>
                                            <div className="relative mt-2">
                                                <input
                                                    type="text"
                                                    value={data.title}
                                                    onChange={(event) => setData('title', event.target.value)}
                                                    className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-sm text-slate-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                    placeholder="Ex: Staff hebdomadaire chirurgie digestive"
                                                />
                                                <Sparkles className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                            </div>
                                            {errors.title && <p className="mt-2 text-sm text-rose-600">{errors.title}</p>}
                                        </div>

                                        <div className="grid gap-6 md:grid-cols-2">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                    Type de reunion
                                                </label>
                                                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                                                    {[
                                                        { type: 'presentiel', label: 'Presentiel', icon: MapPin },
                                                        { type: 'distanciel', label: 'Distanciel', icon: Video },
                                                    ].map((option) => (
                                                        <button
                                                            key={option.type}
                                                            type="button"
                                                            onClick={() => setData('type', option.type as any)}
                                                            className={`group relative overflow-hidden rounded-2xl border-2 p-4 text-left transition-all ${
                                                                data.type === option.type
                                                                    ? 'border-indigo-500 bg-indigo-50 shadow-lg dark:bg-indigo-500/10'
                                                                    : 'border-slate-200 bg-white hover:border-indigo-200 dark:border-slate-700 dark:bg-slate-800'
                                                            }`}
                                                        >
                                                            <option.icon
                                                                className={`h-5 w-5 ${
                                                                    data.type === option.type
                                                                        ? 'text-indigo-600'
                                                                        : 'text-slate-400 group-hover:text-indigo-500'
                                                                }`}
                                                            />
                                                            <p
                                                                className={`mt-3 font-semibold ${
                                                                    data.type === option.type
                                                                        ? 'text-indigo-900 dark:text-indigo-300'
                                                                        : 'text-slate-900 dark:text-white'
                                                                }`}
                                                            >
                                                                {option.label}
                                                            </p>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                    Statut
                                                </label>
                                                <div className="relative mt-2">
                                                    <select
                                                        value={data.status}
                                                        onChange={(event) =>
                                                            setData('status', event.target.value as typeof data.status)
                                                        }
                                                        className="block w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                    >
                                                        <option value="planifie">Planifie</option>
                                                        <option value="en_cours">En cours</option>
                                                        <option value="termine">Termine</option>
                                                        <option value="annule">Annule</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid gap-6 md:grid-cols-2">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                    Date et heure de debut
                                                </label>
                                                <div className="relative mt-2">
                                                    <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        type="datetime-local"
                                                        value={data.start_time}
                                                        onChange={(event) => setData('start_time', event.target.value)}
                                                        className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-sm text-slate-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                    Date et heure de fin
                                                </label>
                                                <div className="relative mt-2">
                                                    <Clock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        type="datetime-local"
                                                        value={data.end_time}
                                                        onChange={(event) => setData('end_time', event.target.value)}
                                                        className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-sm text-slate-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                {data.type === 'distanciel' ? 'Lien de reunion' : 'Lieu'}
                                            </label>
                                            <div className="relative mt-2">
                                                <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    value={data.location_or_link}
                                                    onChange={(event) => setData('location_or_link', event.target.value)}
                                                    className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-sm text-slate-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                    placeholder={
                                                        data.type === 'distanciel' ? 'https://...' : 'Salle de reunion / unite'
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Agenda Tab */}
                            {activeTab === 'agenda' && (
                                <motion.div
                                    key="agenda"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900"
                                >
                                    <div className="mb-8 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                                                <ListChecks className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                                    Ordre du jour
                                                </h2>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    Structurez votre reunion en sections et sujets
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={addSection}
                                            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Nouvelle section
                                        </button>
                                    </div>

                                    {totalDuration > 0 && (
                                        <div className="mb-6 rounded-2xl bg-indigo-50 p-4 dark:bg-indigo-500/10">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">
                                                    Duree totale estimee
                                                </span>
                                                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                                    {totalDuration} min
                                                </span>
                                            </div>
                                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-indigo-200 dark:bg-indigo-800">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all"
                                                    style={{ width: `${Math.min(100, (totalDuration / 480) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-6">
                                        <AnimatePresence>
                                            {data.sections.map((section, sectionIndex) => (
                                                <motion.div
                                                    key={section.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -20 }}
                                                    className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-800/50"
                                                >
                                                    <div className="mb-4 flex items-center justify-between">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleSection(section.id)}
                                                            className="flex items-center gap-3 flex-1"
                                                        >
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-md">
                                                                {sectionIndex + 1}
                                                            </div>
                                                            <div className="flex-1 text-left">
                                                                <h3 className="font-semibold text-slate-900 dark:text-white">
                                                                    {section.title || `Section ${sectionIndex + 1}`}
                                                                </h3>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                    {section.topics.length} sujet(s)
                                                                </p>
                                                            </div>
                                                            <ChevronDown
                                                                className={`h-5 w-5 text-slate-400 transition-transform ${
                                                                    expandedSections.has(section.id) ? 'rotate-180' : ''
                                                                }`}
                                                            />
                                                        </button>
                                                        {data.sections.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeSection(section.id)}
                                                                className="ml-2 rounded-xl p-2 text-rose-600 transition hover:bg-rose-50 dark:text-rose-400"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>

                                                    <AnimatePresence>
                                                        {expandedSections.has(section.id) && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="mt-4 space-y-4">
                                                                    <div>
                                                                        <input
                                                                            type="text"
                                                                            value={section.title}
                                                                            onChange={(event) =>
                                                                                updateSection(section.id, event.target.value)
                                                                            }
                                                                            className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                                                            placeholder="Titre de la section"
                                                                        />
                                                                    </div>

                                                                    <div className="space-y-3">
                                                                        {section.topics.map((topic, topicIndex) => (
                                                                            <div
                                                                                key={topic.id}
                                                                                className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
                                                                            >
                                                                                <div className="mb-3 flex items-center justify-between">
                                                                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                                                        Sujet {topicIndex + 1}
                                                                                    </span>
                                                                                    {section.topics.length > 1 && (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() =>
                                                                                                removeTopic(section.id, topic.id)
                                                                                            }
                                                                                            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800"
                                                                                        >
                                                                                            <X className="h-4 w-4" />
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                                <div className="grid gap-3 md:grid-cols-[1fr_120px]">
                                                                                    <input
                                                                                        type="text"
                                                                                        value={topic.title}
                                                                                        onChange={(event) =>
                                                                                            updateTopic(
                                                                                                section.id,
                                                                                                topic.id,
                                                                                                'title',
                                                                                                event.target.value
                                                                                            )
                                                                                        }
                                                                                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800"
                                                                                        placeholder="Intitule du sujet"
                                                                                    />
                                                                                    <input
                                                                                        type="number"
                                                                                        min={1}
                                                                                        max={480}
                                                                                        value={topic.expected_duration}
                                                                                        onChange={(event) =>
                                                                                            updateTopic(
                                                                                                section.id,
                                                                                                topic.id,
                                                                                                'expected_duration',
                                                                                                event.target.value
                                                                                            )
                                                                                        }
                                                                                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800"
                                                                                        placeholder="Duree (min)"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => addTopic(section.id)}
                                                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-indigo-300 py-2.5 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 dark:border-indigo-500/30 dark:text-indigo-400"
                                                                    >
                                                                        <Plus className="h-4 w-4" />
                                                                        Ajouter un sujet
                                                                    </button>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            )}

                            {/* Participants Tab */}
                            {activeTab === 'participants' && (
                                <motion.div
                                    key="participants"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900"
                                >
                                    <div className="mb-8 flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-600 text-white shadow-lg">
                                            <UserPlus className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                                Participants
                                            </h2>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                Invitez les personnes concernees par ce staff
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex gap-3">
                                            <div className="relative flex-1">
                                                <input
                                                    type="text"
                                                    value={search}
                                                    onChange={(event) => setSearch(event.target.value)}
                                                    placeholder="Rechercher..."
                                                    className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-sm transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800"
                                                />
                                                <Users className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                            </div>
                                            <select
                                                value={roleFilter}
                                                onChange={(event) => setRoleFilter(event.target.value)}
                                                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800"
                                            >
                                                <option value="__all__">Tous les roles</option>
                                                {roleOptions.map((role) => (
                                                    <option key={role} value={role}>
                                                        {role}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={selectAllVisibleParticipants}
                                                className="flex-1 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400"
                                            >
                                                Tout selectionner
                                            </button>
                                            <button
                                                type="button"
                                                onClick={deselectAllVisibleParticipants}
                                                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                            >
                                                Tout deselectionner
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-6 max-h-[500px] space-y-2 overflow-y-auto">
                                        <AnimatePresence>
                                            {visibleParticipants.map((participant) => {
                                                const selected = data.participant_ids.includes(participant.id);
                                                return (
                                                    <motion.button
                                                        key={participant.id}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 20 }}
                                                        type="button"
                                                        onClick={() => toggleParticipant(participant.id)}
                                                        className={`group relative w-full rounded-2xl p-4 text-left transition-all ${
                                                            selected
                                                                ? 'border-2 border-indigo-500 bg-gradient-to-r from-indigo-50 to-white shadow-lg dark:from-indigo-500/10 dark:to-transparent'
                                                                : 'border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800'
                                                        }`}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <p className="font-semibold text-slate-900 dark:text-white">
                                                                    {participant.name}
                                                                </p>
                                                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                                    {participant.email}
                                                                </p>
                                                                <div className="mt-2 flex gap-2">
                                                                    {participant.role_name && (
                                                                        <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300">
                                                                            {participant.role_name}
                                                                        </span>
                                                                    )}
                                                                    {participant.department_name && (
                                                                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                                                            {participant.department_name}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {selected && (
                                                                <CheckCircle2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                                            )}
                                                        </div>
                                                    </motion.button>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Sidebar - Always Visible */}
                    <aside className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="sticky top-6 space-y-6"
                        >
                            <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 p-6 text-white shadow-2xl">
                                <h3 className="text-lg font-semibold">Resume du staff</h3>
                                <div className="mt-6 space-y-4">
                                    <div className="flex items-center justify-between border-b border-white/20 pb-3">
                                        <span className="text-sm text-indigo-100">Participants</span>
                                        <span className="font-semibold">{data.participant_ids.length}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-white/20 pb-3">
                                        <span className="text-sm text-indigo-100">Sections</span>
                                        <span className="font-semibold">{data.sections.length}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-white/20 pb-3">
                                        <span className="text-sm text-indigo-100">Sujets</span>
                                        <span className="font-semibold">
                                            {data.sections.reduce((t, s) => t + s.topics.length, 0)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-white/20 pb-3">
                                        <span className="text-sm text-indigo-100">Duree estimee</span>
                                        <span className="font-semibold">{totalDuration} min</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-indigo-100">Type</span>
                                        <span className="font-semibold">
                                            {data.type === 'distanciel' ? 'Distanciel' : 'Presentiel'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Creation en cours...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="h-5 w-5 transition group-hover:rotate-12" />
                                        Creer le staff
                                    </>
                                )}
                            </button>
                        </motion.div>
                    </aside>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
