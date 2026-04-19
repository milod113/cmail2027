import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ReportModal from '@/Components/ReportModal';
import { useTranslation } from '@/Hooks/useTranslation';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Archive, CalendarDays, CheckCircle2, ChevronRight, Filter, Search, Shield, Star, X, Zap } from 'lucide-react';

type RoleOption = {
    id: number;
    nom_role: string;
};

type InboxMessage = {
    id: number;
    sujet: string;
    contenu: string;
    important: boolean;
    lu: boolean;
    sent_at: string | null;
    type_message: string | null;
    original_receiver_id?: number | null;
    original_receiver?: {
        id: number;
        name: string;
        email: string;
    } | null;
    sender?: {
        id: number;
        name: string;
        email: string;
        role?: {
            id: number;
            nom_role: string;
        } | null;
    } | null;
};

function ReportBanner({
    messageId,
    messageSubject,
    onDismiss,
    onOpenFullReport,
}: {
    messageId: number;
    messageSubject: string;
    onDismiss: () => void;
    onOpenFullReport: () => void;
}) {
    const { __ } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const quickReasons = [
        { value: 'spam', label: __('Spam'), icon: 'EMAIL', tone: 'orange' },
        { value: 'harassment', label: __('Harcelement'), icon: 'ALERT', tone: 'red' },
        { value: 'other', label: __('Inapproprie'), icon: 'FLAG', tone: 'purple' },
    ];

    const handleQuickReport = (reason: 'spam' | 'harassment' | 'other') => {
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.post(
            route('messages.reports.store', messageId),
            {
                reason_category: reason,
                comment: '',
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setIsSubmitted(true);
                    window.setTimeout(() => {
                        onDismiss();
                    }, 3000);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    if (isSubmitted) {
        return (
            <div className="mb-3 flex items-center gap-3 rounded-xl bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">{__('Signalement envoye. Merci !')}</span>
            </div>
        );
    }

    return (
        <div
            className={`mb-3 overflow-hidden rounded-xl border transition-all ${
                isExpanded
                    ? 'border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/5'
                    : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
            }`}
        >
            <div className="flex items-center justify-between p-3">
                <button
                    type="button"
                    onClick={() => setIsExpanded((current) => !current)}
                    className="flex flex-1 items-center gap-2 text-left"
                >
                    <Shield
                        className={`h-4 w-4 transition-colors ${
                            isExpanded ? 'text-red-500' : 'text-slate-400'
                        }`}
                    />
                    <span
                        className={`text-sm font-medium ${
                            isExpanded ? 'text-red-700 dark:text-red-300' : 'text-slate-600 dark:text-slate-400'
                        }`}
                    >
                        {__('Signaler un probleme avec ce message')}
                    </span>
                    <ChevronRight
                        className={`ml-auto h-4 w-4 transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                        }`}
                    />
                </button>

                <button
                    type="button"
                    onClick={onDismiss}
                    className="ml-2 rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                    <X className="h-3 w-3 text-slate-400" />
                </button>
            </div>

            {isExpanded ? (
                <div className="border-t border-red-100 p-3 dark:border-red-500/10">
                    <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                        {__('Pourquoi signalez-vous ce message ?')}
                    </p>

                    <div className="flex flex-wrap gap-2">
                        {quickReasons.map((reason) => (
                            <button
                                key={reason.value}
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => handleQuickReport(reason.value as 'spam' | 'harassment' | 'other')}
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                    reason.tone === 'red'
                                        ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-500/20 dark:text-red-300'
                                        : reason.tone === 'orange'
                                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-500/20 dark:text-orange-300'
                                          : 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-500/20 dark:text-purple-300'
                                }`}
                            >
                                <span className="text-[10px] font-bold tracking-[0.12em]">{reason.icon}</span>
                                {reason.label}
                            </button>
                        ))}

                        <button
                            type="button"
                            onClick={onOpenFullReport}
                            className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-slate-600 dark:text-slate-400"
                        >
                            {__('Autre raison...')}
                        </button>
                    </div>

                    {messageSubject ? (
                        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                            {__('Objet')} : {messageSubject}
                        </p>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}

export default function Inbox({
    stats,
    messages,
    filters,
    roles,
}: {
    stats: {
        unread: number;
        important: number;
        total: number;
    };
    messages: InboxMessage[];
    filters: {
        search: string;
        role: string;
        quick: string;
    };
    roles: RoleOption[];
}) {
    const { __, locale } = useTranslation();
    const [selectedMessageIds, setSelectedMessageIds] = useState<number[]>([]);
    const [dismissedReportBannerIds, setDismissedReportBannerIds] = useState<number[]>([]);
    const [reportModalMessage, setReportModalMessage] = useState<Pick<InboxMessage, 'id' | 'sujet'> | null>(null);

    const cards = [
        { label: __('Non lus'), value: String(stats.unread), tone: 'from-emerald-500 to-teal-600' },
        { label: __('Importants'), value: String(stats.important), tone: 'from-amber-500 to-orange-600' },
        { label: __('Total'), value: String(stats.total), tone: 'from-sky-500 to-cyan-600' },
    ];

    const applyFilters = (nextFilters: { search?: string; role?: string; quick?: string }) => {
        router.get(
            route('messages.inbox'),
            {
                search: nextFilters.search ?? filters.search,
                role: nextFilters.role ?? filters.role,
                quick: nextFilters.quick ?? filters.quick,
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

    const dismissReportBanner = (messageId: number) => {
        setDismissedReportBannerIds((current) =>
            current.includes(messageId) ? current : [...current, messageId],
        );
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

    const formatDate = (value: string) =>
        new Date(value).toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-FR');

    const quickFilterOptions = [
        { value: '', label: __('Tous'), icon: Filter },
        { value: 'yesterday', label: __('Hier'), icon: CalendarDays },
        { value: 'important', label: __('Important'), icon: Star },
        { value: 'urgent', label: __('Urgent'), icon: Zap },
    ];

    return (
        <AuthenticatedLayout
            title={__('Boîte de réception')}
            description={__('Consultez les messages reçus et leur état de lecture.')}
        >
            <Head title={__('Boîte de réception')} />

            <div className="space-y-6">
                <section className="grid gap-4 md:grid-cols-3">
                    {cards.map((card) => (
                        <div key={card.label} className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-lg shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
                            <div className={`inline-flex rounded-2xl bg-gradient-to-r ${card.tone} px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white`}>
                                {card.label}
                            </div>
                            <div className="mt-4 text-4xl font-semibold text-slate-900 dark:text-white">{card.value}</div>
                        </div>
                    ))}
                </section>

                <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{__('Messages reçus')}</h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {__('Les messages les plus récents apparaissent en premier.')}
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="block">
                                <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                    <Search className="h-4 w-4 text-cyan-500" />
                                    {__('Rechercher')}
                                </span>
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(event) => applyFilters({ search: event.target.value })}
                                    placeholder={__('Tapez un nom ou un email')}
                                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                    <Filter className="h-4 w-4 text-cyan-500" />
                                    {__('Filtrer par rôle')}
                                </span>
                                <select
                                    value={filters.role}
                                    onChange={(event) => applyFilters({ role: event.target.value })}
                                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                >
                                    <option value="">{__('Tous les rôles')}</option>
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.nom_role}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        {quickFilterOptions.map((option) => {
                            const isActive = filters.quick === option.value;
                            const Icon = option.icon;

                            return (
                                <button
                                    key={option.value || 'all'}
                                    type="button"
                                    onClick={() => applyFilters({ quick: option.value })}
                                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                        isActive
                                            ? 'border-cyan-400 bg-cyan-50 text-cyan-700 dark:border-cyan-500/60 dark:bg-cyan-500/15 dark:text-cyan-200'
                                            : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-cyan-500 dark:hover:text-cyan-300'
                                    }`}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    {option.label}
                                </button>
                            );
                        })}
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

                    <div className="mt-6 grid gap-4">
                        {messages.length > 0 ? (
                            messages.map((message) => (
                                <div key={message.id} className="rounded-3xl border border-slate-200/70 bg-slate-50/80 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/40">
                                    {!dismissedReportBannerIds.includes(message.id) ? (
                                        <ReportBanner
                                            messageId={message.id}
                                            messageSubject={message.sujet}
                                            onDismiss={() => dismissReportBanner(message.id)}
                                            onOpenFullReport={() => setReportModalMessage({ id: message.id, sujet: message.sujet })}
                                        />
                                    ) : null}

                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-3 flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedMessageIds.includes(message.id)}
                                                    onChange={() => toggleMessageSelection(message.id)}
                                                    className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500/30 dark:border-slate-600 dark:bg-slate-900"
                                                />
                                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                    {selectedMessageIds.includes(message.id) ? __('Sélectionné') : __('Sélectionner')}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        router.post(
                                                            route('messages.important.toggle', message.id),
                                                            {},
                                                            { preserveScroll: true, preserveState: true },
                                                        )
                                                    }
                                                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full border transition ${
                                                        message.important
                                                            ? 'border-amber-300 bg-amber-50 text-amber-600 hover:border-amber-400 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300'
                                                            : 'border-slate-200 bg-white text-slate-400 hover:border-amber-300 hover:text-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500 dark:hover:border-amber-500/40 dark:hover:text-amber-300'
                                                    }`}
                                                    aria-label={message.important ? __('Retirer important') : __('Marquer important')}
                                                    title={message.important ? __('Retirer important') : __('Marquer important')}
                                                >
                                                    <Star className={`h-3.5 w-3.5 ${message.important ? 'fill-current' : ''}`} />
                                                </button>
                                                <p className="font-semibold text-slate-900 dark:text-white">{message.sujet}</p>
                                                {message.important ? (
                                                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                                                        {__('Important')}
                                                    </span>
                                                ) : null}
                                                {message.type_message === 'urgent' ? (
                                                    <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-800 dark:bg-rose-500/15 dark:text-rose-300">
                                                        {__('Urgent')}
                                                    </span>
                                                ) : null}
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                        message.lu
                                                            ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                                    }`}
                                                >
                                                    {message.lu ? __('Lu') : __('Non lu')}
                                                </span>
                                                {message.sender?.role?.nom_role ? (
                                                    <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300">
                                                        {message.sender.role.nom_role}
                                                    </span>
                                                ) : null}
                                                {message.original_receiver ? (
                                                    <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-800 dark:bg-violet-500/15 dark:text-violet-300">
                                                        {__('Delegue pour')} {message.original_receiver.name}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                                {__('De')} {message.sender?.name ?? __('Inconnu')} {message.sender?.email ? `(${message.sender.email})` : ''}
                                            </p>
                                            <p className="mt-3 line-clamp-2 text-sm text-slate-700 dark:text-slate-200">
                                                {message.contenu}
                                            </p>
                                        </div>

                                        <div className="flex flex-col items-end gap-3">
                                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                {message.sent_at ? formatDate(message.sent_at) : __('Planifié')}
                                            </div>
                                            <Link
                                                href={route('messages.show', message.id)}
                                                className="rounded-full border border-cyan-300 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 transition hover:border-cyan-400 hover:bg-cyan-100 dark:border-cyan-700/60 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:border-cyan-500"
                                            >
                                                {__('Show')}
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => router.post(route('messages.archive.store', message.id))}
                                                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-cyan-400 hover:text-cyan-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-500 dark:hover:text-cyan-300"
                                            >
                                                <Archive className="mr-1 inline h-3 w-3" />
                                                {__('Archiver')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
                                {__('Aucun message trouvé avec ce filtre.')}
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <ReportModal
                show={reportModalMessage !== null}
                messageId={reportModalMessage?.id ?? 0}
                messageSubject={reportModalMessage?.sujet ?? ''}
                onClose={() => setReportModalMessage(null)}
                onSubmitted={() => {
                    if (reportModalMessage) {
                        dismissReportBanner(reportModalMessage.id);
                    }
                }}
            />
        </AuthenticatedLayout>
    );
}
