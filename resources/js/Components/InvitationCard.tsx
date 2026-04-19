import { Link } from '@inertiajs/react';
import type { ComponentType } from 'react';
import {
    AlertTriangle,
    Calendar,
    Check,
    ChevronRight,
    Clock,
    Copy,
    ExternalLink,
    FileDown,
    MapPinned,
    User,
    Video,
} from 'lucide-react';

type EventItem = {
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

type InvitationItem = {
    id: number;
    status: 'pending' | 'confirmed' | 'rejected' | 'present';
    qr_code_uuid: string | null;
    event: EventItem | null;
};

type StatusConfig = {
    bg: string;
    text: string;
    border: string;
    icon: ComponentType<{ className?: string }>;
    label: string;
};

type ActionButton = {
    status: 'pending' | 'confirmed' | 'rejected';
    label: string;
    icon: ComponentType<{ className?: string }>;
    gradient: string;
    shadow: string;
};

type Props = {
    invitation: InvitationItem;
    status: StatusConfig;
    isPastEvent: boolean;
    actionLoading: number | null;
    copiedLinkId: number | null;
    actionButtons: ActionButton[];
    formatDate: (value: string | null) => string;
    formatTime: (value: string | null) => string;
    copyToClipboard: (text: string, id: number) => void;
    respondInvitation: (invitationId: number, status: 'pending' | 'confirmed' | 'rejected') => void;
};

export default function InvitationCard({
    invitation,
    status,
    isPastEvent,
    actionLoading,
    copiedLinkId,
    actionButtons,
    formatDate,
    formatTime,
    copyToClipboard,
    respondInvitation,
}: Props) {
    const event = invitation.event;
    const isEventDeleted = !event;
    const isCanceled = event?.status === 'canceled';
    const isPostponed = event?.status === 'postponed';

    return (
        <div
            className={`p-5 transition-all sm:p-6 ${
                isCanceled
                    ? 'bg-slate-100/80 opacity-80 grayscale dark:bg-slate-900/50'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {event?.title ?? 'Evenement supprime'}
                    </h3>
                    {event && (
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <User className="h-3.5 w-3.5" />
                            <span>{event.organizer?.name ?? 'Organisateur inconnu'}</span>
                        </div>
                    )}
                </div>
                <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${status.bg} ${status.border} ${status.text}`}>
                    <status.icon className="h-3.5 w-3.5" />
                    {status.label}
                </div>
            </div>

            {event && isCanceled && (
                <div className="mt-4 rounded-3xl border-2 border-rose-300 bg-rose-50 p-4 text-rose-900 shadow-sm dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100">
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-rose-600 px-4 py-2 text-base font-black tracking-[0.18em] text-white">
                            ANNULE
                        </div>
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-semibold">Cet evenement a ete annule.</p>
                                {event.status_reason && (
                                    <p className="mt-1 text-sm text-rose-800 dark:text-rose-200">
                                        {event.status_reason}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {event && isPostponed && (
                <div className="mt-4 rounded-3xl border-2 border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-sm dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-amber-600 px-4 py-2 text-base font-black tracking-[0.18em] text-white">
                            REPORTE
                        </div>
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-semibold">La date de cet evenement a change.</p>
                                <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                                    Nouvelle date: {formatDate(event.start_time)} a {formatTime(event.start_time)}
                                </p>
                                {event.status_reason && (
                                    <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                                        {event.status_reason}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {event && (
                <div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/30 sm:grid-cols-2">
                    <div className="flex items-start gap-2 text-sm">
                        <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-600 dark:text-cyan-400" />
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Date
                            </p>
                            <p className="font-medium text-slate-900 dark:text-white">
                                {formatDate(event.start_time)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2 text-sm">
                        <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-600 dark:text-purple-400" />
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Horaire
                            </p>
                            <p className="font-medium text-slate-900 dark:text-white">
                                {formatTime(event.start_time)} - {formatTime(event.end_time)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2 text-sm sm:col-span-2">
                        {event.type === 'online' ? (
                            <>
                                <Video className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                                <div className="flex-1">
                                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Lien de reunion
                                    </p>
                                    {event.meeting_link ? (
                                        <div className="mt-1 flex flex-wrap items-center gap-2">
                                            <a
                                                href={event.meeting_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                            >
                                                Rejoindre
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                            <button
                                                onClick={() => copyToClipboard(event.meeting_link!, invitation.id)}
                                                className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                            >
                                                {copiedLinkId === invitation.id ? (
                                                    <Check className="h-3 w-3" />
                                                ) : (
                                                    <Copy className="h-3 w-3" />
                                                )}
                                                {copiedLinkId === invitation.id ? 'Copie !' : 'Copier'}
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                            Non defini
                                        </p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <MapPinned className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Lieu
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                                        {event.location ?? 'Non defini'}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {event && (
                <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                        href={route('events.show', event.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                        Details
                        <ChevronRight className="h-4 w-4" />
                    </Link>

                    <a
                        href={route('events.invitations.pdf', invitation.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-700 transition-all hover:bg-cyan-100 hover:shadow-md dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:bg-cyan-500/20"
                    >
                        <FileDown className="h-4 w-4" />
                        Invitation PDF
                    </a>

                    {!isPastEvent &&
                        actionButtons.map((btn) => {
                            const isDisabled =
                                isCanceled ||
                                invitation.status === btn.status ||
                                invitation.status === 'present' ||
                                actionLoading === invitation.id;

                            return (
                                <button
                                    key={btn.status}
                                    type="button"
                                    onClick={() => respondInvitation(invitation.id, btn.status)}
                                    disabled={isDisabled}
                                    className={`relative inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r ${btn.gradient} px-3 py-2 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${btn.shadow} disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100`}
                                >
                                    {actionLoading === invitation.id ? (
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    ) : (
                                        <btn.icon className="h-4 w-4" />
                                    )}
                                    {btn.label}
                                </button>
                            );
                        })}
                </div>
            )}

            {event && isPastEvent && !isCanceled && (
                <div className="mt-4 rounded-xl bg-slate-100 p-3 text-center text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    Cet evenement est deja passe
                </div>
            )}

            {isEventDeleted && (
                <div className="mt-4 rounded-xl bg-rose-50 p-3 text-center text-xs text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                    Cet evenement n'existe plus
                </div>
            )}
        </div>
    );
}
