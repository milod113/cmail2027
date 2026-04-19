import InvitationCard from '@/Components/InvitationCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Calendar,
    CalendarDays,
    CheckCircle2,
    Clock,
    Mail,
    MapPin,
    Plus,
    Video,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

type InvitationItem = {
    id: number;
    status: 'pending' | 'confirmed' | 'rejected' | 'present';
    qr_code_uuid: string | null;
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
    } | null;
};

type OrganizedEventItem = {
    id: number;
    title: string;
    type: 'in_person' | 'online';
    status: 'scheduled' | 'postponed' | 'canceled' | 'completed';
    status_reason: string | null;
    start_time: string | null;
    end_time: string | null;
};

type EventInvitationsPageProps = {
    canOrganizeEvent: boolean;
    invitations: InvitationItem[];
    organizedEvents: OrganizedEventItem[];
};

function formatDate(value: string | null): string {
    if (!value) return '-';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('fr-FR', {
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

function statusConfig(status: InvitationItem['status']) {
    switch (status) {
        case 'confirmed':
            return {
                bg: 'bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-500/10 dark:to-emerald-500/5',
                text: 'text-emerald-700 dark:text-emerald-300',
                border: 'border-emerald-200 dark:border-emerald-500/20',
                icon: CheckCircle2,
                label: 'Confirme',
            };
        case 'rejected':
            return {
                bg: 'bg-gradient-to-r from-rose-50 to-rose-100/50 dark:from-rose-500/10 dark:to-rose-500/5',
                text: 'text-rose-700 dark:text-rose-300',
                border: 'border-rose-200 dark:border-rose-500/20',
                icon: XCircle,
                label: 'Refuse',
            };
        case 'present':
            return {
                bg: 'bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-500/10 dark:to-blue-500/5',
                text: 'text-blue-700 dark:text-blue-300',
                border: 'border-blue-200 dark:border-blue-500/20',
                icon: CheckCircle2,
                label: 'Present',
            };
        default:
            return {
                bg: 'bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-500/10 dark:to-amber-500/5',
                text: 'text-amber-700 dark:text-amber-300',
                border: 'border-amber-200 dark:border-amber-500/20',
                icon: Clock,
                label: 'En attente',
            };
        }
}

export default function Index({ canOrganizeEvent, invitations, organizedEvents }: EventInvitationsPageProps) {
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [copiedLinkId, setCopiedLinkId] = useState<number | null>(null);
    const { flash } = usePage<PageProps>().props;

    const respondInvitation = (invitationId: number, status: 'pending' | 'confirmed' | 'rejected') => {
        setActionLoading(invitationId);
        router.patch(
            route('events.invitations.rsvp', invitationId),
            { status },
            {
                preserveScroll: true,
                onFinish: () => setActionLoading(null),
            }
        );
    };

    const copyToClipboard = (text: string, id: number) => {
        navigator.clipboard.writeText(text);
        setCopiedLinkId(id);
        setTimeout(() => setCopiedLinkId(null), 2000);
    };

    const actionButtons = [
        {
            status: 'confirmed' as const,
            label: 'Confirmer',
            icon: CheckCircle2,
            gradient: 'from-emerald-500 to-emerald-600',
            shadow: 'shadow-emerald-500/20',
        },
        {
            status: 'rejected' as const,
            label: 'Refuser',
            icon: XCircle,
            gradient: 'from-rose-500 to-rose-600',
            shadow: 'shadow-rose-500/20',
        },
        {
            status: 'pending' as const,
            label: 'Peut-etre',
            icon: Clock,
            gradient: 'from-amber-500 to-amber-600',
            shadow: 'shadow-amber-500/20',
        },
    ];

    return (
        <AuthenticatedLayout
            title="Mes invitations"
            description="Gerez vos invitations et evenements organises"
        >
            <Head title="Invitations" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                                Mes evenements
                            </h1>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Gerez vos invitations et evenements organises
                            </p>
                        </div>
                        {canOrganizeEvent && route().has('events.create') && (
                            <Link
                                href={route('events.create')}
                                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02] hover:shadow-xl dark:from-cyan-600 dark:to-cyan-700 dark:shadow-cyan-500/20 sm:px-6 sm:py-3"
                            >
                                <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
                                Creer un evenement
                            </Link>
                        )}
                    </div>

                    {flash.success && (
                        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                <p>{flash.success}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-8 lg:grid-cols-3 lg:gap-8">
                        <div className="lg:col-span-1">
                            <div className="sticky top-6 overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/50 transition-all duration-300 dark:bg-slate-900 dark:shadow-slate-900/30">
                                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-5 sm:p-6">
                                    <div className="flex items-center gap-2">
                                        <CalendarDays className="h-5 w-5 text-cyan-400" />
                                        <h2 className="text-lg font-semibold text-white">
                                            Evenements organises
                                        </h2>
                                    </div>
                                    <p className="mt-1 text-sm text-slate-300">
                                        {canOrganizeEvent
                                            ? `Vous avez organise ${organizedEvents.length} evenement${organizedEvents.length > 1 ? 's' : ''}`
                                            : "Privilege d'organisateur non disponible"}
                                    </p>
                                </div>

                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {canOrganizeEvent ? (
                                        organizedEvents.length > 0 ? (
                                            organizedEvents.map((event) => (
                                                <div
                                                    key={event.id}
                                                    className="group p-5 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-slate-900 transition-colors group-hover:text-cyan-600 dark:text-white dark:group-hover:text-cyan-400">
                                                                {event.title}
                                                            </h3>
                                                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                                <span
                                                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                                                        event.type === 'online'
                                                                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                                                                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                                                                    }`}
                                                                >
                                                                    {event.type === 'online' ? (
                                                                        <Video className="h-3 w-3" />
                                                                    ) : (
                                                                        <MapPin className="h-3 w-3" />
                                                                    )}
                                                                    {event.type === 'online' ? 'En ligne' : 'Presentiel'}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="h-3 w-3" />
                                                                    {formatDate(event.start_time)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <Link
                                                            href={route('events.show', event.id)}
                                                            className="inline-flex items-center gap-1 rounded-xl bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition-all hover:bg-cyan-100 hover:shadow-md dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:bg-cyan-500/20"
                                                        >
                                                            Voir
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex flex-col items-center py-12 text-center">
                                                <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-800">
                                                    <CalendarDays className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                                                </div>
                                                <p className="mt-3 text-sm font-medium text-slate-900 dark:text-white">
                                                    Aucun evenement organise
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                    Commencez par creer votre premier evenement
                                                </p>
                                            </div>
                                        )
                                    ) : (
                                        <div className="flex flex-col items-center py-12 text-center">
                                            <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-800">
                                                <AlertCircle className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                                            </div>
                                            <p className="mt-3 text-sm font-medium text-slate-900 dark:text-white">
                                                Privilege limite
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                Vous n'avez pas encore la permission d'organiser des evenements
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2">
                            <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/50 dark:bg-slate-900 dark:shadow-slate-900/30">
                                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-5 sm:p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-5 w-5 text-cyan-400" />
                                                <h2 className="text-lg font-semibold text-white">
                                                    Invitations recues
                                                </h2>
                                            </div>
                                            <p className="mt-1 text-sm text-slate-300">
                                                {invitations.length} invitation{invitations.length > 1 ? 's' : ''} en attente de reponse
                                            </p>
                                        </div>
                                        {invitations.length > 0 && (
                                            <div className="hidden sm:block">
                                                <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                                                    {invitations.filter((i) => i.status === 'pending').length} en attente
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {invitations.length > 0 ? (
                                        invitations.map((invitation) => {
                                            const status = statusConfig(invitation.status);
                                            const event = invitation.event;
                                            const isPastEvent = !!(event?.start_time && new Date(event.start_time) < new Date());

                                            return (
                                                <InvitationCard
                                                    key={invitation.id}
                                                    invitation={invitation}
                                                    status={status}
                                                    isPastEvent={isPastEvent}
                                                    actionLoading={actionLoading}
                                                    copiedLinkId={copiedLinkId}
                                                    actionButtons={actionButtons}
                                                    formatDate={formatDate}
                                                    formatTime={formatTime}
                                                    copyToClipboard={copyToClipboard}
                                                    respondInvitation={respondInvitation}
                                                />
                                            );
                                        })
                                    ) : (
                                        <div className="flex flex-col items-center py-16 text-center">
                                            <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-800">
                                                <Mail className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                                            </div>
                                            <p className="mt-4 text-base font-medium text-slate-900 dark:text-white">
                                                Aucune invitation
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                Vous n'avez recu aucune invitation pour le moment
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
