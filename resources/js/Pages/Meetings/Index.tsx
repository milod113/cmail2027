import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import {
    CalendarDays,
    CheckCircle2,
    Clock3,
    MapPin,
    Plus,
    Users,
    Video,
    TrendingUp,
    Calendar,
    Clock,
    Users as UsersIcon,
    ChevronRight,
    Sparkles,
    BarChart3,
    Activity,
    Star,
    Eye,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

type MeetingItem = {
    id: number;
    title: string;
    type: 'presentiel' | 'distanciel';
    location_or_link: string | null;
    start_time: string | null;
    end_time: string | null;
    status: 'planifie' | 'en_cours' | 'termine' | 'annule';
    participants_count: number;
    organizer: {
        id: number;
        name: string;
        email: string;
    } | null;
    participants_preview: Array<{
        id: number;
        name: string;
        email: string;
    }>;
    is_organizer: boolean;
    show_url: string;
};

type MeetingsIndexProps = {
    canOrganizeMeetings: boolean;
    meetings: MeetingItem[];
};

function formatDateTime(value: string | null): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatRelativeTime(dateStr: string | null): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (diffHours < 0) return 'Passé';
    if (diffHours === 0) return 'Dans moins d\'une heure';
    if (diffHours === 1) return 'Dans 1 heure';
    if (diffHours < 24) return `Dans ${diffHours} heures`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Demain';
    return `Dans ${diffDays} jours`;
}

function statusMeta(status: MeetingItem['status']) {
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
                icon: Calendar,
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

export default function Index({ canOrganizeMeetings, meetings }: MeetingsIndexProps) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const liveMeetings = meetings.filter((meeting) => meeting.status === 'en_cours').length;
    const upcomingMeetings = meetings.filter((meeting) => meeting.status === 'planifie').length;
    const completedMeetings = meetings.filter((meeting) => meeting.status === 'termine').length;

    const stats = [
        { label: 'Total', value: meetings.length, icon: BarChart3, gradient: 'from-indigo-500 to-purple-500' },
        { label: 'Planifiés', value: upcomingMeetings, icon: CalendarDays, gradient: 'from-cyan-500 to-sky-500' },
        { label: 'En cours', value: liveMeetings, icon: Activity, gradient: 'from-emerald-500 to-teal-500' },
        { label: 'Terminés', value: completedMeetings, icon: CheckCircle2, gradient: 'from-slate-500 to-slate-600' },
    ];

    return (
        <AuthenticatedLayout
            title="Staffs medicaux"
            description="Organisez, consultez et suivez les reunions de service en toute confidentialite."
            actions={
                canOrganizeMeetings ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Link
                            href={route('meetings.create')}
                            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:shadow-xl"
                        >
                            <Plus className="h-4 w-4" />
                            Nouveau staff
                        </Link>
                    </motion.div>
                ) : null
            }
        >
            <Head title="Staffs medicaux" />

            <div className="space-y-8">
                {/* Hero Section with Animated Stats */}
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
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm"
                            >
                                <Sparkles className="h-3.5 w-3.5" />
                                Module reunions cliniques
                            </motion.div>
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl"
                            >
                                Pilotage des staffs medicaux
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="mt-4 max-w-2xl text-base text-indigo-100"
                            >
                                Retrouvez les reunions auxquelles vous participez, ouvrez les ordres du jour
                                structures et collaborez en temps reel sur chaque point.
                            </motion.p>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[480px]"
                        >
                            {stats.map((stat, idx) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 + idx * 0.1 }}
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
                </motion.section>

                {/* View Toggle and Filters */}
                <div className="flex items-center justify-between">
                    <div className="flex gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                                viewMode === 'grid'
                                    ? 'bg-white text-indigo-600 shadow-md dark:bg-slate-900 dark:text-indigo-400'
                                    : 'text-slate-600 hover:bg-white/50 dark:text-slate-400'
                            }`}
                        >
                            Grille
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                                viewMode === 'list'
                                    ? 'bg-white text-indigo-600 shadow-md dark:bg-slate-900 dark:text-indigo-400'
                                    : 'text-slate-600 hover:bg-white/50 dark:text-slate-400'
                            }`}
                        >
                            Liste
                        </button>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <TrendingUp className="h-4 w-4" />
                        <span>{meetings.length} réunion(s) au total</span>
                    </div>
                </div>

                {/* Meetings Grid/List */}
                <AnimatePresence mode="wait">
                    {meetings.length > 0 ? (
                        <motion.section
                            key={viewMode}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={viewMode === 'grid'
                                ? "grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
                                : "space-y-4"
                            }
                        >
                            {meetings.map((meeting, idx) => {
                                const status = statusMeta(meeting.status);
                                const StatusIcon = status.icon;
                                const relativeTime = formatRelativeTime(meeting.start_time);

                                return (
                                    <motion.div
                                        key={meeting.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        whileHover={{ y: -4 }}
                                    >
                                        <Link
                                            href={meeting.show_url}
                                            className="group block overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl transition-all hover:shadow-2xl hover:shadow-indigo-500/10 dark:border-slate-800 dark:bg-slate-900"
                                        >
                                            {/* Header with gradient bar */}
                                            <div className={`relative bg-gradient-to-r ${status.gradient} p-5`}>
                                                <div
                                                    className="absolute inset-0 opacity-20"
                                                    style={{
                                                        backgroundImage:
                                                            'url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')',
                                                    }}
                                                ></div>

                                                <div className="relative flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm`}>
                                                                <StatusIcon className="h-3 w-3" />
                                                                {status.label}
                                                            </span>
                                                            {meeting.is_organizer && (
                                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-100 backdrop-blur-sm">
                                                                    <Star className="h-3 w-3" />
                                                                    Organisateur
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h2 className="mt-3 text-xl font-bold text-white line-clamp-2">
                                                            {meeting.title}
                                                        </h2>
                                                        {meeting.status === 'planifie' && relativeTime && (
                                                            <p className="mt-2 text-xs text-white/80">
                                                                {relativeTime}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
                                                        {meeting.type === 'distanciel' ? (
                                                            <Video className="h-5 w-5 text-white" />
                                                        ) : (
                                                            <MapPin className="h-5 w-5 text-white" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-5 space-y-4">
                                                {/* Time and Participants */}
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
                                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                                            <Clock3 className="h-4 w-4 text-indigo-500" />
                                                            <span className="text-xs font-semibold">Creneau</span>
                                                        </div>
                                                        <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                                                            {formatDateTime(meeting.start_time)}
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            Fin: {formatDateTime(meeting.end_time)}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
                                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                                            <UsersIcon className="h-4 w-4 text-indigo-500" />
                                                            <span className="text-xs font-semibold">Participants</span>
                                                        </div>
                                                        <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                                                            {meeting.participants_count} invite(s)
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            Organisé par {meeting.organizer?.name?.split(' ')[0] ?? 'Inconnu'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Location */}
                                                <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 p-3 dark:from-indigo-500/10 dark:to-purple-500/10">
                                                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                                        {meeting.type === 'distanciel' ? (
                                                            <Video className="h-4 w-4 text-indigo-500" />
                                                        ) : (
                                                            <MapPin className="h-4 w-4 text-indigo-500" />
                                                        )}
                                                        {meeting.type === 'distanciel' ? 'Lien de reunion' : 'Lieu'}
                                                    </div>
                                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 break-all">
                                                        {meeting.location_or_link || 'Non renseigné'}
                                                    </p>
                                                </div>

                                                {/* Participants preview */}
                                                <div>
                                                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                                        <Users className="h-4 w-4 text-indigo-500" />
                                                        Équipe concernée
                                                    </div>
                                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                                        {meeting.participants_preview.slice(0, 3).map((participant) => (
                                                            <span
                                                                key={participant.id}
                                                                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                                            >
                                                                {participant.name.split(' ')[0]}
                                                            </span>
                                                        ))}
                                                        {meeting.participants_count > 3 && (
                                                            <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                                                                +{meeting.participants_count - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* View details link */}
                                                <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                                                    <span className="text-xs text-slate-400">Cliquez pour voir les détails</span>
                                                    <ChevronRight className="h-4 w-4 text-indigo-500 transition group-hover:translate-x-1" />
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </motion.section>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-16 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900"
                        >
                            <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center dark:from-indigo-500/20 dark:to-purple-500/20">
                                <CalendarDays className="h-10 w-10 text-indigo-500" />
                            </div>
                            <h2 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">
                                Aucun staff disponible
                            </h2>
                            <p className="mt-3 text-base text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                                Vous verrez ici les reunions dont vous etes organisateur ou participant.
                                {canOrganizeMeetings && " Commencez par creer votre premier staff medical !"}
                            </p>
                            {canOrganizeMeetings && (
                                <Link
                                    href={route('meetings.create')}
                                    className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl"
                                >
                                    <Plus className="h-4 w-4" />
                                    Créer mon premier staff
                                </Link>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </AuthenticatedLayout>
    );
}
