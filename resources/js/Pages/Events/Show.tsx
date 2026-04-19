import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    CalendarDays,
    Clock3,
    MapPin,
    UsersRound,
    Video,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    MinusCircle,
    UserCheck,
    Calendar,
    Link2,
    MapPinned,
    Clock,
    User,
    Mail,
    TrendingUp,
    Loader2,
    Copy,
    Check,
    FileDown,
} from 'lucide-react';
import { type FormEvent, useState } from 'react';

type EventParticipant = {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
    } | null;
    status: 'pending' | 'confirmed' | 'rejected' | 'present';
    qr_code_uuid: string | null;
};

type ShowProps = {
    event: {
        id: number;
        title: string;
        description: string | null;
        type: 'in_person' | 'online';
        location: string | null;
        meeting_link: string | null;
        status: 'scheduled' | 'postponed' | 'canceled' | 'completed';
        status_reason: string | null;
        start_time: string | null;
        end_time: string | null;
        organizer: {
            id: number;
            name: string;
            email: string;
        } | null;
    };
    viewer: {
        is_organizer: boolean;
        is_admin: boolean;
        invitation_id: number | null;
        invitation_status: 'pending' | 'confirmed' | 'rejected' | 'present' | null;
    };
    stats: {
        total: number;
        pending: number;
        confirmed: number;
        rejected: number;
        present: number;
    };
    participants: EventParticipant[];
};

function formatDate(value: string | null): string {
    if (!value) return '-';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function formatTime(value: string | null): string {
    if (!value) return '-';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatFullDateTime(value: string | null): string {
    if (!value) return '-';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function toDateTimeLocalValue(value: string | null): string {
    if (!value) return '';

    const date = new Date(value);

    if (isNaN(date.getTime())) return '';

    const pad = (part: number) => String(part).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function statusConfig(status: EventParticipant['status'] | null) {
    switch (status) {
        case 'confirmed':
            return {
                bg: 'bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-500/10 dark:to-emerald-500/5',
                text: 'text-emerald-700 dark:text-emerald-300',
                border: 'border-emerald-200 dark:border-emerald-500/20',
                icon: CheckCircle2,
                label: 'Confirmé',
            };
        case 'rejected':
            return {
                bg: 'bg-gradient-to-r from-rose-50 to-rose-100/50 dark:from-rose-500/10 dark:to-rose-500/5',
                text: 'text-rose-700 dark:text-rose-300',
                border: 'border-rose-200 dark:border-rose-500/20',
                icon: XCircle,
                label: 'Refusé',
            };
        case 'present':
            return {
                bg: 'bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-500/10 dark:to-blue-500/5',
                text: 'text-blue-700 dark:text-blue-300',
                border: 'border-blue-200 dark:border-blue-500/20',
                icon: UserCheck,
                label: 'Présent',
            };
        default:
            return {
                bg: 'bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-500/10 dark:to-amber-500/5',
                text: 'text-amber-700 dark:text-amber-300',
                border: 'border-amber-200 dark:border-amber-500/20',
                icon: MinusCircle,
                label: 'En attente',
            };
    }
}

export default function Show({ event, viewer, stats, participants }: ShowProps) {
    const [copied, setCopied] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showPostponeModal, setShowPostponeModal] = useState(false);

    const {
        data: cancelData,
        setData: setCancelData,
        patch: submitCancel,
        processing: cancelProcessing,
        errors: cancelErrors,
        reset: resetCancel,
        clearErrors: clearCancelErrors,
    } = useForm({
        status_reason: '',
    });

    const {
        data: postponeData,
        setData: setPostponeData,
        patch: submitPostpone,
        processing: postponeProcessing,
        errors: postponeErrors,
        reset: resetPostpone,
        clearErrors: clearPostponeErrors,
    } = useForm({
        start_time: toDateTimeLocalValue(event.start_time),
        end_time: toDateTimeLocalValue(event.end_time),
        status_reason: event.status_reason ?? '',
    });

    const respond = async (status: 'pending' | 'confirmed' | 'rejected') => {
        if (!viewer.invitation_id) return;
        setActionLoading(status);
        router.patch(
            route('events.invitations.rsvp', viewer.invitation_id),
            { status },
            {
                preserveScroll: true,
                onFinish: () => setActionLoading(null),
            }
        );
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const viewerStatus = viewer.invitation_status;
    const statusConf = viewerStatus ? statusConfig(viewerStatus) : null;
    const isCanceled = event.status === 'canceled';
    const isPostponed = event.status === 'postponed';
    const isCompleted = event.status === 'completed';
    const canManageEvent = viewer.is_organizer || viewer.is_admin;

    const openCancelModal = () => {
        clearCancelErrors();
        resetCancel();
        setShowCancelModal(true);
    };

    const closeCancelModal = () => {
        setShowCancelModal(false);
        clearCancelErrors();
        resetCancel();
    };

    const openPostponeModal = () => {
        clearPostponeErrors();
        setPostponeData({
            start_time: toDateTimeLocalValue(event.start_time),
            end_time: toDateTimeLocalValue(event.end_time),
            status_reason: event.status_reason ?? '',
        });
        setShowPostponeModal(true);
    };

    const closePostponeModal = () => {
        setShowPostponeModal(false);
        clearPostponeErrors();
        resetPostpone();
    };

    const cancelEvent = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        submitCancel(route('events.cancel', event.id), {
            preserveScroll: true,
            onSuccess: () => closeCancelModal(),
        });
    };

    const postponeEvent = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        submitPostpone(route('events.postpone', event.id), {
            preserveScroll: true,
            onSuccess: () => closePostponeModal(),
        });
    };

    const actionButtons = [
        {
            status: 'confirmed' as const,
            label: 'Confirmer',
            icon: CheckCircle2,
            gradient: 'from-emerald-500 to-emerald-600',
            hoverGradient: 'hover:from-emerald-600 hover:to-emerald-700',
            shadow: 'shadow-emerald-500/20',
            disabled: isCanceled || viewerStatus === 'confirmed' || viewerStatus === 'present',
        },
        {
            status: 'rejected' as const,
            label: 'Refuser',
            icon: XCircle,
            gradient: 'from-rose-500 to-rose-600',
            hoverGradient: 'hover:from-rose-600 hover:to-rose-700',
            shadow: 'shadow-rose-500/20',
            disabled: isCanceled || viewerStatus === 'rejected' || viewerStatus === 'present',
        },
        {
            status: 'pending' as const,
            label: 'Peut-être',
            icon: MinusCircle,
            gradient: 'from-amber-500 to-amber-600',
            hoverGradient: 'hover:from-amber-600 hover:to-amber-700',
            shadow: 'shadow-amber-500/20',
            disabled: isCanceled || viewerStatus === 'pending' || viewerStatus === 'present',
        },
    ];

    const statsCards = [
        { label: 'Invités', value: stats.total, icon: UsersRound, gradient: 'from-indigo-500 to-indigo-600' },
        { label: 'En attente', value: stats.pending, icon: MinusCircle, gradient: 'from-amber-500 to-amber-600' },
        { label: 'Confirmés', value: stats.confirmed, icon: CheckCircle2, gradient: 'from-emerald-500 to-emerald-600' },
        { label: 'Refusés', value: stats.rejected, icon: XCircle, gradient: 'from-rose-500 to-rose-600' },
        { label: 'Présents', value: stats.present, icon: UserCheck, gradient: 'from-blue-500 to-blue-600' },
    ];

    return (
        <AuthenticatedLayout
            title={`${event.title} - Événement`}
            description="Détails de l'événement et gestion des participants"
        >
            <Head title={event.title} />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
                    {/* Header avec retour */}
                    <div className="mb-6 flex items-center justify-between gap-4 sm:mb-8">
                        <Link
                            href={route('events.invitations')}
                            className="group inline-flex items-center gap-2 rounded-2xl bg-white/80 px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:shadow-md dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-900 sm:px-5 sm:py-3"
                        >
                            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                            <span className="hidden sm:inline">Retour aux événements</span>
                            <span className="inline sm:hidden">Retour</span>
                        </Link>

                        {!viewer.is_organizer && viewerStatus && statusConf && (
                            <div className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 backdrop-blur-sm sm:px-4 sm:py-2 ${statusConf.bg} ${statusConf.border}`}>
                                <statusConf.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${statusConf.text}`} />
                                <span className={`text-xs font-semibold sm:text-sm ${statusConf.text}`}>
                                    {statusConf.label}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Main Content */}
                    <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
                        {/* Left Column - Event Details */}
                        <div className="lg:col-span-2">
                            {/* Event Card */}
                            <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/50 transition-all duration-300 dark:bg-slate-900 dark:shadow-slate-900/30">
                                {/* Hero Section avec gradient */}
                                <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-6 sm:p-8">
                                    <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 blur-3xl" />
                                    <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-64 w-64 rounded-full bg-gradient-to-tr from-purple-500/20 to-pink-500/20 blur-3xl" />

                                    <div className="relative">
                                        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                                            {event.title}
                                        </h1>
                                        <p className="mt-2 text-sm text-slate-300 sm:text-base">
                                            Organisé par <span className="font-medium text-white">{event.organizer?.name ?? 'N/A'}</span>
                                            <span className="hidden sm:inline"> · {event.organizer?.email ?? '-'}</span>
                                        </p>
                                        {isCanceled && (
                                            <div className="mt-4 rounded-3xl border border-rose-400/40 bg-rose-500/15 p-4 text-rose-50">
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-black tracking-[0.18em] text-white">
                                                        ANNULE
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                                                        <div>
                                                            <p className="font-semibold">Cet evenement a ete annule.</p>
                                                            {event.status_reason && (
                                                                <p className="mt-1 text-sm text-rose-100/90">{event.status_reason}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {isPostponed && (
                                            <div className="mt-4 rounded-3xl border border-amber-400/40 bg-amber-500/15 p-4 text-amber-50">
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-2xl bg-amber-600 px-4 py-2 text-sm font-black tracking-[0.18em] text-white">
                                                        REPORTE
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                                                        <div>
                                                            <p className="font-semibold">Cet evenement a ete reporte.</p>
                                                            <p className="mt-1 text-sm text-amber-100/90">
                                                                Nouvelle date: {formatDate(event.start_time)} de {formatTime(event.start_time)} a {formatTime(event.end_time)}
                                                            </p>
                                                            {event.status_reason && (
                                                                <p className="mt-1 text-sm text-amber-100/90">{event.status_reason}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Event Details Grid */}
                                <div className="space-y-6 p-5 sm:p-7">
                                    {/* Date et Heure */}
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 transition-all hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800">
                                            <div className="rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 p-2 shadow-lg shadow-cyan-500/20">
                                                <CalendarDays className="h-5 w-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    Date
                                                </p>
                                                <p className="mt-0.5 font-semibold text-slate-900 dark:text-white">
                                                    {formatDate(event.start_time)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 transition-all hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800">
                                            <div className="rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-2 shadow-lg shadow-purple-500/20">
                                                <Clock className="h-5 w-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    Horaires
                                                </p>
                                                <p className="mt-0.5 font-semibold text-slate-900 dark:text-white">
                                                    {formatTime(event.start_time)} - {formatTime(event.end_time)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Lieu / Lien */}
                                    <div className={`flex items-start gap-3 rounded-2xl p-4 transition-all ${
                                        event.type === 'online'
                                            ? 'bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20'
                                            : 'bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20'
                                    }`}>
                                        <div className={`rounded-xl p-2 shadow-lg ${
                                            event.type === 'online'
                                                ? 'bg-gradient-to-br from-blue-500 to-indigo-500 shadow-blue-500/20'
                                                : 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/20'
                                        }`}>
                                            {event.type === 'online' ? (
                                                <Video className="h-5 w-5 text-white" />
                                            ) : (
                                                <MapPinned className="h-5 w-5 text-white" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                {event.type === 'online' ? 'Lien de réunion' : 'Lieu'}
                                            </p>
                                            {event.type === 'online' && event.meeting_link ? (
                                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                                    <a
                                                        href={event.meeting_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                                    >
                                                        <Link2 className="h-3.5 w-3.5" />
                                                        Rejoindre la réunion
                                                    </a>
                                                    <button
                                                        onClick={() => copyToClipboard(event.meeting_link!)}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                                    >
                                                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                                        {copied ? 'Copié !' : 'Copier'}
                                                    </button>
                                                </div>
                                            ) : event.type === 'online' ? (
                                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Non défini</p>
                                            ) : (
                                                <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                                                    {event.location ?? 'Non défini'}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {event.description && (
                                        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                                            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Description
                                            </p>
                                            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                                {event.description}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Actions & Stats */}
                        <div className="space-y-6">
                            {/* Action Buttons for non-organizers */}
                            {!viewer.is_organizer && viewer.invitation_id && (
                                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/50 dark:bg-slate-900 dark:shadow-slate-900/30">
                                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-5">
                                        <h3 className="text-lg font-semibold text-white">Votre réponse</h3>
                                        <p className="mt-1 text-sm text-slate-300">
                                            {isCanceled ? "L'evenement est annule, la reponse est desactivee." : 'Confirmez votre présence à cet événement'}
                                        </p>
                                    </div>
                                    <div className="space-y-3 p-5">
                                        {actionButtons.map((btn) => (
                                            <button
                                                key={btn.status}
                                                type="button"
                                                onClick={() => respond(btn.status)}
                                                disabled={btn.disabled || actionLoading !== null}
                                                className={`relative w-full overflow-hidden rounded-2xl bg-gradient-to-r ${btn.gradient} px-4 py-3.5 font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl ${btn.shadow} disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100`}
                                            >
                                                <div className="flex items-center justify-center gap-2">
                                                    {actionLoading === btn.status ? (
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                    ) : (
                                                        <btn.icon className="h-5 w-5" />
                                                    )}
                                                    {btn.label}
                                                </div>
                                            </button>
                                        ))}

                                        <a
                                            href={route('events.invitations.pdf', viewer.invitation_id)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:bg-cyan-500/20"
                                        >
                                            <FileDown className="h-4 w-4" />
                                            Telecharger invitation PDF
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Stats for organizers/admins */}
                            {canManageEvent && (
                                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/50 dark:bg-slate-900 dark:shadow-slate-900/30">
                                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-5">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="h-5 w-5 text-amber-400" />
                                            <h3 className="text-lg font-semibold text-white">Actions organisateur</h3>
                                        </div>
                                        <p className="mt-1 text-sm text-slate-300">
                                            Annulez ou reportez cet evenement et prevenez automatiquement les invites.
                                        </p>
                                    </div>
                                    <div className="space-y-3 p-5">
                                        <button
                                            type="button"
                                            onClick={openPostponeModal}
                                            disabled={isCanceled || isCompleted}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition hover:from-amber-600 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <Calendar className="h-4 w-4" />
                                            Reporter l'evenement
                                        </button>

                                        <button
                                            type="button"
                                            onClick={openCancelModal}
                                            disabled={isCanceled || isCompleted}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 transition hover:from-rose-600 hover:to-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <XCircle className="h-4 w-4" />
                                            Annuler l'evenement
                                        </button>

                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                                            {isCanceled
                                                ? "Cet evenement est deja annule."
                                                : isCompleted
                                                  ? "Cet evenement est termine, les actions de modification sont bloquees."
                                                  : 'Les participants confirmes et en attente recevront une notification email et base de donnees.'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {canManageEvent && (
                                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/50 dark:bg-slate-900 dark:shadow-slate-900/30">
                                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-5">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5 text-cyan-400" />
                                            <h3 className="text-lg font-semibold text-white">Statistiques</h3>
                                        </div>
                                        <p className="mt-1 text-sm text-slate-300">
                                            Aperçu des participations
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 p-5">
                                        {statsCards.map((stat) => (
                                            <div
                                                key={stat.label}
                                                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 p-4 transition-all hover:shadow-md dark:from-slate-800/50 dark:to-slate-800/30"
                                            >
                                                <div className={`absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br ${stat.gradient} opacity-10 transition-opacity group-hover:opacity-20`} />
                                                <stat.icon className="relative h-5 w-5 text-slate-500 dark:text-slate-400" />
                                                <p className="relative mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                                    {stat.value}
                                                </p>
                                                <p className="relative text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    {stat.label}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Participants Table - for organizers/admins */}
                    {canManageEvent && participants.length > 0 && (
                        <div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/50 dark:bg-slate-900 dark:shadow-slate-900/30">
                            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-5 dark:border-slate-800 dark:from-slate-800/50 dark:to-slate-900">
                                <div className="flex items-center gap-2">
                                    <UsersRound className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        Liste des participants
                                    </h3>
                                    <span className="ml-2 rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-semibold text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
                                        {participants.length}
                                    </span>
                                </div>
                            </div>

                            {/* Mobile card view */}
                            <div className="block divide-y divide-slate-100 dark:divide-slate-800 lg:hidden">
                                {participants.map((participant) => {
                                    const status = statusConfig(participant.status);
                                    return (
                                        <div key={participant.id} className="p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className="font-medium text-slate-900 dark:text-white">
                                                        {participant.user?.name ?? 'N/A'}
                                                    </p>
                                                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                                        <Mail className="h-3.5 w-3.5" />
                                                        {participant.user?.email ?? '-'}
                                                    </div>
                                                </div>
                                                <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.bg} ${status.text}`}>
                                                    <status.icon className="h-3 w-3" />
                                                    {status.label}
                                                </div>
                                            </div>
                                            <a
                                                href={route('events.invitations.pdf', participant.id)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:bg-cyan-500/20"
                                            >
                                                <FileDown className="h-3.5 w-3.5" />
                                                PDF
                                            </a>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Desktop table view */}
                            <div className="hidden overflow-x-auto lg:block">
                                <table className="min-w-full">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Participant
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Email
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Statut
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Invitation
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {participants.map((participant) => {
                                            const status = statusConfig(participant.status);
                                            return (
                                                <tr key={participant.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                    <td className="whitespace-nowrap px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4 text-slate-400" />
                                                            <span className="font-medium text-slate-900 dark:text-white">
                                                                {participant.user?.name ?? 'N/A'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                                        {participant.user?.email ?? '-'}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4">
                                                        <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.bg} ${status.text}`}>
                                                            <status.icon className="h-3 w-3" />
                                                            {status.label}
                                                        </div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4">
                                                        <a
                                                            href={route('events.invitations.pdf', participant.id)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:bg-cyan-500/20"
                                                        >
                                                            <FileDown className="h-3.5 w-3.5" />
                                                            PDF
                                                        </a>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Empty state for participants */}
                    {(viewer.is_organizer || viewer.is_admin) && participants.length === 0 && (
                        <div className="mt-8 flex flex-col items-center justify-center rounded-3xl bg-white py-12 text-center shadow-xl shadow-slate-200/50 dark:bg-slate-900 dark:shadow-slate-900/30">
                            <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-800">
                                <UsersRound className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                            </div>
                            <p className="mt-4 text-sm font-medium text-slate-900 dark:text-white">
                                Aucun participant
                            </p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Les participants apparaîtront ici une fois qu'ils auront répondu à l'invitation.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <Modal show={showPostponeModal} onClose={closePostponeModal} maxWidth="lg">
                <form onSubmit={postponeEvent} className="p-6">
                    <h2 className="text-xl font-semibold text-slate-900">
                        Reporter l'evenement
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                        Definissez la nouvelle date puis ajoutez un motif. Les invites concernes seront notifies automatiquement.
                    </p>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="postpone_start_time" className="text-sm font-medium text-slate-700">
                                Nouvelle date de debut
                            </label>
                            <input
                                id="postpone_start_time"
                                type="datetime-local"
                                value={postponeData.start_time}
                                onChange={(e) => setPostponeData('start_time', e.target.value)}
                                className="mt-2 block w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                            <InputError message={postponeErrors.start_time} className="mt-2" />
                        </div>

                        <div>
                            <label htmlFor="postpone_end_time" className="text-sm font-medium text-slate-700">
                                Nouvelle date de fin
                            </label>
                            <input
                                id="postpone_end_time"
                                type="datetime-local"
                                value={postponeData.end_time}
                                onChange={(e) => setPostponeData('end_time', e.target.value)}
                                className="mt-2 block w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                            <InputError message={postponeErrors.end_time} className="mt-2" />
                        </div>
                    </div>

                    <div className="mt-4">
                        <label htmlFor="postpone_reason" className="text-sm font-medium text-slate-700">
                            Motif du report
                        </label>
                        <textarea
                            id="postpone_reason"
                            value={postponeData.status_reason}
                            onChange={(e) => setPostponeData('status_reason', e.target.value)}
                            rows={4}
                            className="mt-2 block w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            placeholder="Exemple: indisponibilite de la salle ou changement de planning."
                        />
                        <InputError message={postponeErrors.status_reason} className="mt-2" />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={closePostponeModal} disabled={postponeProcessing}>
                            Fermer
                        </SecondaryButton>
                        <PrimaryButton
                            disabled={postponeProcessing}
                            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 focus:bg-orange-600"
                        >
                            {postponeProcessing ? 'Envoi...' : "Confirmer le report"}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={showCancelModal} onClose={closeCancelModal} maxWidth="lg">
                <form onSubmit={cancelEvent} className="p-6">
                    <h2 className="text-xl font-semibold text-slate-900">
                        Annuler l'evenement
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                        Cette action invalidera les QR codes et notifiera tous les invites encore en attente ou confirmes.
                    </p>

                    <div className="mt-6">
                        <label htmlFor="cancel_reason" className="text-sm font-medium text-slate-700">
                            Motif de l'annulation
                        </label>
                        <textarea
                            id="cancel_reason"
                            value={cancelData.status_reason}
                            onChange={(e) => setCancelData('status_reason', e.target.value)}
                            rows={5}
                            className="mt-2 block w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                            placeholder="Expliquez brievement pourquoi l'evenement est annule."
                        />
                        <InputError message={cancelErrors.status_reason} className="mt-2" />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={closeCancelModal} disabled={cancelProcessing}>
                            Retour
                        </SecondaryButton>
                        <DangerButton
                            disabled={cancelProcessing}
                            className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700"
                        >
                            {cancelProcessing ? 'Annulation...' : "Confirmer l'annulation"}
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
