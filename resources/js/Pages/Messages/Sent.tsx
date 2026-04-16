import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Filter, Search, Send, Calendar, Clock, Flag, Receipt, Archive, Users, ChevronRight, Inbox, AlertCircle } from 'lucide-react';

type RoleOption = {
    id: number;
    nom_role: string;
};

type SentMessage = {
    id: number;
    sujet: string;
    contenu: string;
    important: boolean;
    sent_at: string | null;
    scheduled_at: string | null;
    type_message: string | null;
    requires_receipt: boolean;
    original_receiver_id?: number | null;
    original_receiver?: {
        id: number;
        name: string;
        email: string;
    } | null;
    receiver?: {
        id: number;
        name: string;
        email: string;
        role?: {
            id: number;
            nom_role: string;
        } | null;
    } | null;
};

function StatusBadge({ type, children }: { type: 'info' | 'warning' | 'success' | 'default'; children: React.ReactNode }) {
    const styles = {
        info: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/20',
        warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
        success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
        default: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
    };

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[type]}`}>
            {children}
        </span>
    );
}

function formatRelativeDate(value: string | null, locale: string) {
    if (!value) return null;
    
    const date = new Date(value);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    
    return null;
}

export default function Sent({
    messages,
    filters,
    roles,
}: {
    messages: SentMessage[];
    filters: {
        search: string;
        role: string;
    };
    roles: RoleOption[];
}) {
    const { __, locale } = useTranslation();
    const [selectedMessageIds, setSelectedMessageIds] = useState<number[]>([]);

    const formatDate = (value: string) =>
        new Date(value).toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-FR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });

    const applyFilters = (nextFilters: { search?: string; role?: string }) => {
        router.get(
            route('messages.sent'),
            {
                search: nextFilters.search ?? filters.search,
                role: nextFilters.role ?? filters.role,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const toggleMessageSelection = (messageId: number) => {
        setSelectedMessageIds((current) =>
            current.includes(messageId)
                ? current.filter((id) => id !== messageId)
                : [...current, messageId],
        );
    };

    const visibleMessageIds = useMemo(() => messages.map((message) => message.id), [messages]);

    const allVisibleSelected = visibleMessageIds.length > 0 && visibleMessageIds.every((id) => selectedMessageIds.includes(id));

    const selectAllVisible = () => {
        setSelectedMessageIds(Array.from(new Set([...selectedMessageIds, ...visibleMessageIds])));
    };

    const deselectAllVisible = () => {
        const visibleIds = new Set(visibleMessageIds);
        setSelectedMessageIds((current) => current.filter((id) => !visibleIds.has(id)));
    };

    const archiveSelected = () => {
        if (selectedMessageIds.length === 0) {
            return;
        }

        router.post(
            route('messages.archive.bulk'),
            { message_ids: selectedMessageIds },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedMessageIds([]);
                },
            },
        );
    };

    const sentMessages = messages.filter(m => m.sent_at);
    const scheduledMessages = messages.filter(m => !m.sent_at && m.scheduled_at);
    const draftMessages = messages.filter(m => !m.sent_at && !m.scheduled_at);

    return (
        <AuthenticatedLayout
            title={__('Messages envoyés')}
            description={__('Suivez l\'historique de vos messages envoyés et programmés.')}
        >
            <Head title={__('Messages envoyés')} />

            <div className="space-y-6">
                {/* Header Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-slate-800/50 dark:bg-slate-900/80">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/20">
                                <Send className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{sentMessages.length}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{__('Messages envoyés')}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-slate-800/50 dark:bg-slate-900/80">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/20">
                                <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{scheduledMessages.length}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{__('Programmés')}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-slate-800/50 dark:bg-slate-900/80">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                                <Inbox className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{draftMessages.length}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{__('Brouillons')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="rounded-3xl border border-slate-200/70 bg-white/80 shadow-lg backdrop-blur-sm dark:border-slate-800/50 dark:bg-slate-900/80">
                    {/* Filters Section */}
                    <div className="border-b border-slate-200/50 p-6 dark:border-slate-800/50">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    {__('Historique des envois')}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    {__('Consultez et gérez tous vos messages envoyés')}
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        <Search className="mr-1 inline h-3.5 w-3.5 text-cyan-500" />
                                        {__('Rechercher')}
                                    </label>
                                    <input
                                        type="text"
                                        value={filters.search}
                                        onChange={(event) => applyFilters({ search: event.target.value })}
                                        placeholder={__('Nom, email ou sujet...')}
                                        className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        <Filter className="mr-1 inline h-3.5 w-3.5 text-cyan-500" />
                                        {__('Filtrer par rôle')}
                                    </label>
                                    <select
                                        value={filters.role}
                                        onChange={(event) => applyFilters({ role: event.target.value })}
                                        className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-500"
                                    >
                                        <option value="">{__('Tous les rôles')}</option>
                                        {roles.map((role) => (
                                            <option key={role.id} value={role.id}>
                                                {role.nom_role}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={allVisibleSelected ? deselectAllVisible : selectAllVisible}
                                className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:border-cyan-500/40 dark:hover:bg-cyan-500/20"
                            >
                                {allVisibleSelected ? __('Désélectionner tout') : __('Sélectionner tout')}
                            </button>
                            <button
                                type="button"
                                onClick={deselectAllVisible}
                                disabled={selectedMessageIds.length === 0}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                            >
                                {__('Effacer la sélection')}
                            </button>
                            <button
                                type="button"
                                onClick={archiveSelected}
                                disabled={selectedMessageIds.length === 0}
                                className="rounded-xl bg-gradient-to-r from-cyan-600 to-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {__('Archiver la sélection')} ({selectedMessageIds.length})
                            </button>
                        </div>
                    </div>

                    {/* Messages List */}
                    <div className="p-6">
                        {messages.length > 0 ? (
                            <div className="space-y-3">
                                {messages.map((message) => {
                                    const isScheduled = !message.sent_at && message.scheduled_at;
                                    const isDraft = !message.sent_at && !message.scheduled_at;
                                    const relativeDate = message.sent_at ? formatRelativeDate(message.sent_at, locale) : null;
                                    const formattedDate = message.sent_at 
                                        ? formatDate(message.sent_at)
                                        : message.scheduled_at 
                                            ? formatDate(message.scheduled_at)
                                            : null;
                                    
                                    return (
                                        <Link
                                            key={message.id}
                                            href={route('messages.sent.show', message.id)}
                                            className="group block rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-cyan-300 hover:shadow-md hover:shadow-cyan-500/5 dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-cyan-500/40"
                                        >
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                <div className="min-w-0 flex-1">
                                                    <div className="mb-3 flex items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedMessageIds.includes(message.id)}
                                                            onChange={(event) => {
                                                                event.stopPropagation();
                                                                toggleMessageSelection(message.id);
                                                            }}
                                                            onClick={(event) => event.stopPropagation()}
                                                            className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500/30 dark:border-slate-600 dark:bg-slate-900"
                                                        />
                                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                            {selectedMessageIds.includes(message.id) ? __('Sélectionné') : __('Sélectionner')}
                                                        </span>
                                                    </div>

                                                    {/* Header with badges */}
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                                                            {message.sujet}
                                                        </h3>
                                                        {message.important && (
                                                            <StatusBadge type="warning">
                                                                <Flag className="h-3 w-3" />
                                                                {__('Important')}
                                                            </StatusBadge>
                                                        )}
                                                        {message.requires_receipt && (
                                                            <StatusBadge type="info">
                                                                <Receipt className="h-3 w-3" />
                                                                {__('Accusé')}
                                                            </StatusBadge>
                                                        )}
                                                        {message.receiver?.role?.nom_role && (
                                                            <StatusBadge type="default">
                                                                <Users className="h-3 w-3" />
                                                                {message.receiver.role.nom_role}
                                                            </StatusBadge>
                                                        )}
                                                        {message.original_receiver && (
                                                            <StatusBadge type="info">
                                                                <AlertCircle className="h-3 w-3" />
                                                                {__('Delegue pour')} {message.original_receiver.name}
                                                            </StatusBadge>
                                                        )}
                                                        {isScheduled && (
                                                            <StatusBadge type="info">
                                                                <Clock className="h-3 w-3" />
                                                                {__('Programmé')}
                                                            </StatusBadge>
                                                        )}
                                                        {isDraft && (
                                                            <StatusBadge type="default">
                                                                {__('Brouillon')}
                                                            </StatusBadge>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Recipient info */}
                                                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                                        <span>{__('À')} :</span>
                                                        <span className="font-medium text-slate-700 dark:text-slate-300">
                                                            {message.receiver?.name ?? __('Inconnu')}
                                                        </span>
                                                        {message.receiver?.email && (
                                                            <span className="text-xs text-slate-400">
                                                                {message.receiver.email}
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Message preview */}
                                                    <p className="mt-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                                                        {message.contenu}
                                                    </p>
                                                </div>
                                                
                                                {/* Right side - Date and actions */}
                                                <div className="flex flex-row items-center justify-between gap-4 lg:flex-col lg:items-end">
                                                    <div className="text-right">
                                                        {relativeDate ? (
                                                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                                                {relativeDate}
                                                            </span>
                                                        ) : formattedDate ? (
                                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                {formattedDate}
                                                            </span>
                                                        ) : null}
                                                        {message.scheduled_at && !message.sent_at && (
                                                            <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                                                <Clock className="h-3 w-3" />
                                                                <span>{formatDate(message.scheduled_at)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.preventDefault();
                                                                event.stopPropagation();
                                                                router.post(route('messages.archive.store', message.id));
                                                            }}
                                                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-all hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-cyan-500/40 dark:hover:bg-cyan-500/10 dark:hover:text-cyan-300"
                                                        >
                                                            <Archive className="mr-1 inline h-3 w-3" />
                                                            {__('Archiver')}
                                                        </button>
                                                        <ChevronRight className="h-4 w-4 text-slate-300 opacity-0 transition-all group-hover:opacity-100 dark:text-slate-600" />
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-16 text-center dark:border-slate-800 dark:bg-slate-950/30">
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                    <Send className="h-10 w-10 text-slate-400 dark:text-slate-600" />
                                </div>
                                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                                    {__('Aucun message trouvé')}
                                </h3>
                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                    {__('Aucun message ne correspond à vos critères de recherche')}
                                </p>
                                {(filters.search || filters.role) && (
                                    <button
                                        onClick={() => applyFilters({ search: '', role: '' })}
                                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-700 px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg"
                                    >
                                        <Filter className="h-4 w-4" />
                                        {__('Réinitialiser les filtres')}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
