import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import { useTranslation } from '@/Hooks/useTranslation';
import { router } from '@inertiajs/react';
import { type ReactNode, FormEvent, useEffect, useMemo, useState } from 'react';
import {
    CalendarDays,
    CheckCircle2,
    Clock,
    Filter,
    MessageSquare,
    Save,
    Search,
    Sparkles,
    UserMinus,
    UserPlus,
    Users,
    X,
    Zap,
    Mail,
    Send,
    Repeat,
    AlertCircle,
    ChevronRight,
    Star,
} from 'lucide-react';

type Recipient = {
    id: number;
    name: string;
    email: string;
    role_id?: number | null;
    role?: {
        id: number;
        nom_role: string;
    } | null;
};

type RoleOption = {
    id: number;
    nom_role: string;
};

type ScheduledPlanning = {
    id: number;
    subject: string;
    body: string;
    scheduled_at: string | null;
    receiver: Recipient | null;
};

type RecurringPlanning = {
    id: number;
    body: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    time_of_day: string;
    is_active: boolean;
    receiver: Recipient | null;
};

type PlanningModalProps = {
    show: boolean;
    mode: 'create' | 'edit';
    type: 'scheduled' | 'recurring';
    recipients: Recipient[];
    roles: RoleOption[];
    scheduledItem?: ScheduledPlanning | null;
    recurringItem?: RecurringPlanning | null;
    onClose: () => void;
};

type ErrorBag = Partial<
    Record<'receiver_id' | 'receiver_ids' | 'sujet' | 'contenu' | 'scheduled_at' | 'body' | 'frequency' | 'time_of_day', string>
>;

const scheduledDefaults: {
    receiver_ids: number[];
    receiver_id: string;
    sujet: string;
    contenu: string;
    scheduled_at: string;
} = {
    receiver_ids: [] as number[],
    receiver_id: '',
    sujet: '',
    contenu: '',
    scheduled_at: '',
};

const recurringDefaults: {
    receiver_ids: number[];
    receiver_id: string;
    body: string;
    frequency: RecurringPlanning['frequency'];
    time_of_day: string;
    is_active: boolean;
} = {
    receiver_ids: [] as number[],
    receiver_id: '',
    body: '',
    frequency: 'daily' as const,
    time_of_day: '',
    is_active: true,
};

export default function PlanningModal({
    show,
    mode,
    type,
    recipients,
    roles,
    scheduledItem,
    recurringItem,
    onClose,
}: PlanningModalProps) {
    const { __ } = useTranslation();
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<ErrorBag>({});
    const [scheduledData, setScheduledData] = useState(scheduledDefaults);
    const [recurringData, setRecurringData] = useState(recurringDefaults);
    const [roleFilter, setRoleFilter] = useState('');
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'compose' | 'recipients'>('compose');

    useEffect(() => {
        if (!show) {
            return;
        }

        setErrors({});
        setRoleFilter('');
        setSearch('');
        setActiveTab('compose');

        if (type === 'scheduled') {
            setScheduledData(
                scheduledItem
                    ? {
                          receiver_ids: scheduledItem.receiver?.id ? [scheduledItem.receiver.id] : [],
                          receiver_id: scheduledItem.receiver?.id ? String(scheduledItem.receiver.id) : '',
                          sujet: scheduledItem.subject,
                          contenu: scheduledItem.body,
                          scheduled_at: formatDateTimeLocal(scheduledItem.scheduled_at),
                      }
                    : scheduledDefaults,
            );
        }

        if (type === 'recurring') {
            setRecurringData(
                recurringItem
                    ? {
                          receiver_ids: recurringItem.receiver?.id ? [recurringItem.receiver.id] : [],
                          receiver_id: recurringItem.receiver?.id ? String(recurringItem.receiver.id) : '',
                          body: recurringItem.body,
                          frequency: recurringItem.frequency,
                          time_of_day: recurringItem.time_of_day.slice(0, 5),
                          is_active: recurringItem.is_active,
                      }
                    : recurringDefaults,
            );
        }
    }, [show, type, scheduledItem, recurringItem]);

    const closeModal = () => {
        setErrors({});
        onClose();
    };

    const submitScheduled = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProcessing(true);
        setErrors({});

        const payload = {
            receiver_ids: scheduledData.receiver_ids,
            sujet: scheduledData.sujet,
            contenu: scheduledData.contenu,
            scheduled_at: scheduledData.scheduled_at,
        };

        const options = {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: (nextErrors: Record<string, string>) => setErrors(nextErrors),
            onFinish: () => setProcessing(false),
        };

        if (mode === 'edit' && scheduledItem) {
            router.put(
                route('planifications.messages.update', scheduledItem.id),
                {
                    receiver_id: scheduledData.receiver_id,
                    sujet: scheduledData.sujet,
                    contenu: scheduledData.contenu,
                    scheduled_at: scheduledData.scheduled_at,
                },
                options,
            );
            return;
        }

        router.post(route('planifications.messages.store'), payload, options);
    };

    const submitRecurring = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProcessing(true);
        setErrors({});

        const payload = {
            receiver_ids: recurringData.receiver_ids,
            body: recurringData.body,
            frequency: recurringData.frequency,
            time_of_day: recurringData.time_of_day,
            is_active: recurringData.is_active,
        };

        const options = {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: (nextErrors: Record<string, string>) => setErrors(nextErrors),
            onFinish: () => setProcessing(false),
        };

        if (mode === 'edit' && recurringItem) {
            router.put(
                route('planifications.recurrents.update', recurringItem.id),
                {
                    receiver_id: recurringData.receiver_id,
                    body: recurringData.body,
                    frequency: recurringData.frequency,
                    time_of_day: recurringData.time_of_day,
                    is_active: recurringData.is_active,
                },
                options,
            );
            return;
        }

        router.post(route('planifications.recurrents.store'), payload, options);
    };

    const filteredRecipients = useMemo(() => {
        const term = search.trim().toLowerCase();

        return recipients.filter((recipient) => {
            const matchesRole = roleFilter === '' || String(recipient.role?.id ?? recipient.role_id ?? '') === roleFilter;
            const matchesSearch =
                term === ''
                || recipient.name.toLowerCase().includes(term)
                || recipient.email.toLowerCase().includes(term)
                || (recipient.role?.nom_role ?? '').toLowerCase().includes(term);

            return matchesRole && matchesSearch;
        });
    }, [recipients, roleFilter, search]);

    const selectedScheduledRecipients = useMemo(
        () => recipients.filter((recipient) => scheduledData.receiver_ids.includes(recipient.id)),
        [recipients, scheduledData.receiver_ids],
    );
    const selectedRecurringRecipients = useMemo(
        () => recipients.filter((recipient) => recurringData.receiver_ids.includes(recipient.id)),
        [recipients, recurringData.receiver_ids],
    );

    const toggleScheduledRecipient = (recipientId: number) => {
        setScheduledData((current) => ({
            ...current,
            receiver_ids: current.receiver_ids.includes(recipientId)
                ? current.receiver_ids.filter((id) => id !== recipientId)
                : [...current.receiver_ids, recipientId],
        }));
    };

    const toggleRecurringRecipient = (recipientId: number) => {
        setRecurringData((current) => ({
            ...current,
            receiver_ids: current.receiver_ids.includes(recipientId)
                ? current.receiver_ids.filter((id) => id !== recipientId)
                : [...current.receiver_ids, recipientId],
        }));
    };

    const selectAllFilteredScheduledRecipients = () => {
        const visibleRecipientIds = filteredRecipients.map((recipient) => recipient.id);
        setScheduledData((current) => ({
            ...current,
            receiver_ids: Array.from(new Set([...current.receiver_ids, ...visibleRecipientIds])),
        }));
    };

    const deselectAllFilteredScheduledRecipients = () => {
        const visibleRecipientIds = new Set(filteredRecipients.map((recipient) => recipient.id));
        setScheduledData((current) => ({
            ...current,
            receiver_ids: current.receiver_ids.filter((recipientId) => !visibleRecipientIds.has(recipientId)),
        }));
    };

    const selectAllFilteredRecurringRecipients = () => {
        const visibleRecipientIds = filteredRecipients.map((recipient) => recipient.id);
        setRecurringData((current) => ({
            ...current,
            receiver_ids: Array.from(new Set([...current.receiver_ids, ...visibleRecipientIds])),
        }));
    };

    const deselectAllFilteredRecurringRecipients = () => {
        const visibleRecipientIds = new Set(filteredRecipients.map((recipient) => recipient.id));
        setRecurringData((current) => ({
            ...current,
            receiver_ids: current.receiver_ids.filter((recipientId) => !visibleRecipientIds.has(recipientId)),
        }));
    };

    const recipientError = errors.receiver_ids ?? (errors as Record<string, string | undefined>)['receiver_ids.0'] ?? errors.receiver_id;

    const isScheduled = type === 'scheduled';
    const title = isScheduled
        ? mode === 'edit'
            ? __('Modifier un message programme')
            : __('Nouveau message programme')
        : mode === 'edit'
          ? __('Modifier un message recurrent')
          : __('Nouveau message recurrent');

    const subtitle = isScheduled
        ? __('Choisissez un destinataire, un contenu et une date precise pour l envoi.')
        : __('Definissez une routine automatique avec frequence et heure d execution.');

    const spotlightTitle = isScheduled ? __('Envoi unique maitrise') : __('Routine automatique elegante');
    const spotlightDescription = isScheduled
        ? __('Ideal pour preparer une communication importante et la laisser partir exactement au bon moment.')
        : __('Parfait pour les transmissions regulieres et les rappels qui reviennent sans friction.');

    const frequencyLabels = {
        daily: __('Tous les jours'),
        weekly: __('Chaque semaine'),
        monthly: __('Chaque mois'),
    };

    return (
        <Modal show={show} onClose={closeModal} maxWidth="2xl">
            <div className="relative overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900 animate-in zoom-in-95 duration-300">
                {/* Animated Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 -mr-32 -mt-32 h-64 w-64 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 blur-3xl" />
                <div className="absolute bottom-0 left-0 -ml-32 -mb-32 h-64 w-64 rounded-full bg-gradient-to-tr from-purple-400/20 to-pink-500/20 blur-3xl" />

                {/* Hero Section */}
                <div className="relative border-b border-slate-200/60 bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 dark:from-slate-950/95 dark:via-slate-900/95 dark:to-slate-950/95 backdrop-blur-sm">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.18),transparent_26%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.14),transparent_22%)] opacity-70" />

                    <div className="relative px-6 py-8 md:px-8 md:py-10">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex-1">
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="relative">
                                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 blur-lg opacity-60" />
                                        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg">
                                            {isScheduled ? (
                                                <CalendarDays className="h-6 w-6 text-white" />
                                            ) : (
                                                <Repeat className="h-6 w-6 text-white" />
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1">
                                            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                                            <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                                                {__('Edition premium')}
                                            </span>
                                        </div>
                                        <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">{title}</h2>
                                        <p className="mt-2 text-sm text-slate-300 max-w-2xl">{subtitle}</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/70 transition-all hover:bg-white/20 hover:text-white hover:scale-105"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Info Cards */}
                        <div className="mt-8 grid gap-4 md:grid-cols-2">
                            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 transition-all hover:bg-white/10">
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative flex items-start gap-3">
                                    <div className="rounded-xl bg-cyan-500/20 p-2.5">
                                        <Zap className="h-5 w-5 text-cyan-300" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">{spotlightTitle}</p>
                                        <p className="mt-1 text-sm text-slate-300 leading-relaxed">{spotlightDescription}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 transition-all hover:bg-white/10">
                                <div className="relative flex items-start gap-3">
                                    <div className="rounded-xl bg-emerald-500/20 p-2.5">
                                        {mode === 'edit' ? <CheckCircle2 className="h-5 w-5 text-emerald-300" /> : <Send className="h-5 w-5 text-emerald-300" />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                                            {mode === 'edit' ? __('Mode mise a jour') : __('Mode creation')}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-300 leading-relaxed">
                                            {mode === 'edit'
                                                ? __('Vos ajustements seront appliques des la validation.')
                                                : __('Configurez les parametres puis confirmez pour enregistrer la planification.')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation for better UX */}
                <div className="relative border-b border-slate-200 dark:border-slate-800 px-6 pt-2">
                    <div className="flex gap-1">
                        <button
                            type="button"
                            onClick={() => setActiveTab('compose')}
                            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-t-xl transition-all ${
                                activeTab === 'compose'
                                    ? 'bg-white text-cyan-600 shadow-sm dark:bg-slate-800 dark:text-cyan-400'
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                            }`}
                        >
                            <MessageSquare className="h-4 w-4" />
                            {__('Composition')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('recipients')}
                            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-t-xl transition-all ${
                                activeTab === 'recipients'
                                    ? 'bg-white text-cyan-600 shadow-sm dark:bg-slate-800 dark:text-cyan-400'
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                            }`}
                        >
                            <Users className="h-4 w-4" />
                            {__('Destinataires')}
                            {(isScheduled ? selectedScheduledRecipients.length : selectedRecurringRecipients.length) > 0 && (
                                <span className="ml-1 rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-semibold text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400">
                                    {isScheduled ? selectedScheduledRecipients.length : selectedRecurringRecipients.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {isScheduled ? (
                    <form onSubmit={submitScheduled} className="relative">
                        <div className="p-6 md:p-8">
                            {activeTab === 'compose' ? (
                                <div className="space-y-6">
                                    <FloatingCard icon={<Mail className="h-5 w-5" />} title={__('Informations du message')}>
                                        <div className="space-y-5">
                                            <div>
                                                <FloatingLabelInput
                                                    id="planning_subject"
                                                    label={__('Sujet')}
                                                    type="text"
                                                    value={scheduledData.sujet}
                                                    onChange={(value) =>
                                                        setScheduledData((current) => ({ ...current, sujet: value }))
                                                    }
                                                    placeholder={__('Objet du message')}
                                                    error={errors.sujet}
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    {__('Contenu')}
                                                </label>
                                                <div className="relative">
                                                    <textarea
                                                        rows={8}
                                                        value={scheduledData.contenu}
                                                        onChange={(event) =>
                                                            setScheduledData((current) => ({ ...current, contenu: event.target.value }))
                                                        }
                                                        className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-900 shadow-sm transition-all focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-400/10 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100 dark:focus:border-cyan-500 resize-none"
                                                        placeholder={__('Redigez le message a programmer...')}
                                                    />
                                                    <div className="absolute bottom-3 right-3 text-xs text-slate-400">
                                                        {scheduledData.contenu.length} caractères
                                                    </div>
                                                </div>
                                                <InputError message={errors.contenu} className="mt-2" />
                                            </div>
                                        </div>
                                    </FloatingCard>

                                    <FloatingCard icon={<CalendarDays className="h-5 w-5" />} title={__('Planification')}>
                                        <div>
                                            <FloatingLabelInput
                                                id="planning_scheduled_at"
                                                label={__('Date et heure d envoi')}
                                                type="datetime-local"
                                                value={scheduledData.scheduled_at}
                                                onChange={(value) =>
                                                    setScheduledData((current) => ({ ...current, scheduled_at: value }))
                                                }
                                                error={errors.scheduled_at}
                                                icon={<CalendarDays className="h-4 w-4" />}
                                            />
                                        </div>

                                        <div className="mt-4 rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 p-4 dark:from-cyan-500/10 dark:to-blue-500/10 border border-cyan-100 dark:border-cyan-500/20">
                                            <div className="flex items-start gap-3">
                                                <div className="rounded-lg bg-cyan-500/20 p-2">
                                                    <Clock className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-cyan-800 dark:text-cyan-200">
                                                        {__('Conseil de planification')}
                                                    </p>
                                                    <p className="mt-1 text-xs text-cyan-700/80 dark:text-cyan-300/80">
                                                        {__('Utilisez cette vue pour anticiper les transmissions, confirmations et informations qui doivent partir sans stress au bon moment.')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </FloatingCard>
                                </div>
                            ) : (
                                <RecipientSelectorPanel
                                    recipients={recipients}
                                    filteredRecipients={filteredRecipients}
                                    roles={roles}
                                    roleFilter={roleFilter}
                                    search={search}
                                    selectedIds={scheduledData.receiver_ids}
                                    selectedRecipients={selectedScheduledRecipients}
                                    onRoleFilterChange={setRoleFilter}
                                    onSearchChange={setSearch}
                                    onToggleRecipient={toggleScheduledRecipient}
                                    onSelectAll={selectAllFilteredScheduledRecipients}
                                    onDeselectAll={deselectAllFilteredScheduledRecipients}
                                    onClearSelection={() =>
                                        setScheduledData((current) => ({ ...current, receiver_ids: [] }))
                                    }
                                    error={recipientError}
                                    __={__}
                                />
                            )}
                        </div>

                        <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 backdrop-blur-sm px-6 py-5 dark:border-slate-800 dark:bg-slate-900/95">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={processing}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                                >
                                    <X className="h-4 w-4" />
                                    {__('Annuler')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-xl hover:shadow-cyan-500/30 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {processing ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            {__('Enregistrement...')}
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            {mode === 'edit' ? __('Mettre a jour') : __('Programmer')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={submitRecurring} className="relative">
                        <div className="p-6 md:p-8">
                            {activeTab === 'compose' ? (
                                <div className="space-y-6">
                                    <FloatingCard icon={<Repeat className="h-5 w-5" />} title={__('Message recurrent')}>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                {__('Contenu du message')}
                                            </label>
                                            <div className="relative">
                                                <textarea
                                                    rows={6}
                                                    value={recurringData.body}
                                                    onChange={(event) =>
                                                        setRecurringData((current) => ({ ...current, body: event.target.value }))
                                                    }
                                                    className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-900 shadow-sm transition-all focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-400/10 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100 dark:focus:border-cyan-500 resize-none"
                                                    placeholder={__('Contenu a envoyer automatiquement...')}
                                                />
                                                <div className="absolute bottom-3 right-3 text-xs text-slate-400">
                                                    {recurringData.body.length} caractères
                                                </div>
                                            </div>
                                            <InputError message={errors.body} className="mt-2" />
                                        </div>
                                    </FloatingCard>

                                    <FloatingCard icon={<Clock className="h-5 w-5" />} title={__('Cadence d envoi')}>
                                        <div className="grid gap-5 md:grid-cols-2">
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    {__('Frequence')}
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        value={recurringData.frequency}
                                                        onChange={(event) =>
                                                            setRecurringData((current) => ({
                                                                ...current,
                                                                frequency: event.target.value as 'daily' | 'weekly' | 'monthly',
                                                            }))
                                                        }
                                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm appearance-none focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-400/10 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100"
                                                    >
                                                        <option value="daily">📅 {__('Tous les jours')}</option>
                                                        <option value="weekly">📆 {__('Chaque semaine')}</option>
                                                        <option value="monthly">🗓️ {__('Chaque mois')}</option>
                                                    </select>
                                                    <ChevronRight className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
                                                </div>
                                                <InputError message={errors.frequency} className="mt-2" />
                                            </div>

                                            <div>
                                                <FloatingLabelInput
                                                    id="recurring_time_of_day"
                                                    label={__('Heure d envoi')}
                                                    type="time"
                                                    value={recurringData.time_of_day}
                                                    onChange={(value) =>
                                                        setRecurringData((current) => ({ ...current, time_of_day: value }))
                                                    }
                                                    error={errors.time_of_day}
                                                    icon={<Clock className="h-4 w-4" />}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-5">
                                            <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/30 dark:hover:bg-slate-800/50">
                                                <input
                                                    type="checkbox"
                                                    checked={recurringData.is_active}
                                                    onChange={(event) =>
                                                        setRecurringData((current) => ({ ...current, is_active: event.target.checked }))
                                                    }
                                                    className="mt-0.5 h-5 w-5 rounded-md border-slate-300 text-cyan-600 focus:ring-cyan-500/30 dark:border-slate-600 dark:bg-slate-700"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <Star className="h-4 w-4 text-amber-500" />
                                                        <span className="font-semibold text-slate-900 dark:text-white">
                                                            {__('Activer cette routine des son enregistrement')}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                        {__('Si cette option reste active, le cycle automatique commencera selon la frequence definie.')}
                                                    </p>
                                                </div>
                                            </label>
                                        </div>
                                    </FloatingCard>

                                    {/* Frequency Preview */}
                                    {recurringData.time_of_day && (
                                        <div className="rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 p-4 dark:from-purple-500/10 dark:to-pink-500/10 border border-purple-100 dark:border-purple-500/20">
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-lg bg-purple-500/20 p-2">
                                                    <AlertCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                                                        {__('Aperçu de la planification')}
                                                    </p>
                                                    <p className="text-xs text-purple-700/80 dark:text-purple-300/80">
                                                        {recurringData.frequency === 'daily' && __(`Ce message sera envoyé tous les jours à ${recurringData.time_of_day}`)}
                                                        {recurringData.frequency === 'weekly' && __(`Ce message sera envoyé chaque semaine le même jour à ${recurringData.time_of_day}`)}
                                                        {recurringData.frequency === 'monthly' && __(`Ce message sera envoyé chaque mois le même jour à ${recurringData.time_of_day}`)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <RecipientSelectorPanel
                                    recipients={recipients}
                                    filteredRecipients={filteredRecipients}
                                    roles={roles}
                                    roleFilter={roleFilter}
                                    search={search}
                                    selectedIds={recurringData.receiver_ids}
                                    selectedRecipients={selectedRecurringRecipients}
                                    onRoleFilterChange={setRoleFilter}
                                    onSearchChange={setSearch}
                                    onToggleRecipient={toggleRecurringRecipient}
                                    onSelectAll={selectAllFilteredRecurringRecipients}
                                    onDeselectAll={deselectAllFilteredRecurringRecipients}
                                    onClearSelection={() =>
                                        setRecurringData((current) => ({ ...current, receiver_ids: [] }))
                                    }
                                    error={recipientError}
                                    __={__}
                                />
                            )}
                        </div>

                        <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 backdrop-blur-sm px-6 py-5 dark:border-slate-800 dark:bg-slate-900/95">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={processing}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                                >
                                    <X className="h-4 w-4" />
                                    {__('Annuler')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-xl hover:shadow-cyan-500/30 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {processing ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            {__('Enregistrement...')}
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            {mode === 'edit' ? __('Mettre a jour') : __('Creer la routine')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </Modal>
    );
}

// Helper Components
function FloatingCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
    return (
        <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800/30">
            <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 p-2 text-white shadow-md">
                    {icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
            </div>
            {children}
        </div>
    );
}

function FloatingLabelInput({
    id,
    label,
    type,
    value,
    onChange,
    placeholder,
    error,
    icon,
}: {
    id: string;
    label: string;
    type: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    error?: string;
    icon?: ReactNode;
}) {
    return (
        <div>
            <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {label}
            </label>
            <div className="relative">
                {icon && (
                    <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        {icon}
                    </div>
                )}
                <input
                    id={id}
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`w-full rounded-xl border ${
                        error ? 'border-red-300 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'
                    } bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition-all focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-400/10 dark:bg-slate-800/50 dark:text-slate-100 dark:focus:border-cyan-500 ${
                        icon ? 'pl-10' : ''
                    }`}
                />
            </div>
            <InputError message={error} className="mt-2" />
        </div>
    );
}

function RecipientSelectorPanel({
    recipients,
    filteredRecipients,
    roles,
    roleFilter,
    search,
    selectedIds,
    selectedRecipients,
    onRoleFilterChange,
    onSearchChange,
    onToggleRecipient,
    onSelectAll,
    onDeselectAll,
    onClearSelection,
    error,
    __,
}: {
    recipients: Recipient[];
    filteredRecipients: Recipient[];
    roles: RoleOption[];
    roleFilter: string;
    search: string;
    selectedIds: number[];
    selectedRecipients: Recipient[];
    onRoleFilterChange: (value: string) => void;
    onSearchChange: (value: string) => void;
    onToggleRecipient: (recipientId: number) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    onClearSelection: () => void;
    error?: string;
    __: (key: string) => string;
}) {
    return (
        <div className="space-y-6">
            {/* Stats Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 p-4 dark:from-slate-800/50 dark:to-slate-800/30">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10">
                        <Users className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{__('Selection')}</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{selectedIds.length}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm dark:bg-slate-700 dark:text-slate-300">
                        {filteredRecipients.length} {__('visibles')}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm dark:bg-slate-700 dark:text-slate-300">
                        {recipients.length} {__('au total')}
                    </span>
                </div>
            </div>

            {/* Filters */}
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                        <Search className="h-4 w-4 text-cyan-500" />
                        {__('Recherche rapide')}
                    </label>
                    <input
                        type="text"
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder={__('Nom, email ou role...')}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition-all focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-400/10 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100"
                    />
                </div>
                <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                        <Filter className="h-4 w-4 text-cyan-500" />
                        {__('Filtrer par role')}
                    </label>
                    <select
                        value={roleFilter}
                        onChange={(event) => onRoleFilterChange(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition-all focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-400/10 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100"
                    >
                        <option value="">{__('Tous les roles')}</option>
                        {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                                {role.nom_role}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Bulk Actions */}
            <div className="flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={onSelectAll}
                    disabled={filteredRecipients.length === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-cyan-700 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                    <UserPlus className="h-4 w-4" />
                    {__('Selectionner les visibles')}
                </button>
                <button
                    type="button"
                    onClick={onDeselectAll}
                    disabled={filteredRecipients.length === 0}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                    <UserMinus className="h-4 w-4" />
                    {__('Retirer les visibles')}
                </button>
                <button
                    type="button"
                    onClick={onClearSelection}
                    disabled={selectedIds.length === 0}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition-all hover:bg-rose-100 hover:border-rose-300 disabled:opacity-50 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                >
                    <X className="h-4 w-4" />
                    {__('Vider la selection')}
                </button>
            </div>

            {/* Selected Recipients Tags */}
            {selectedRecipients.length > 0 && (
                <div className="rounded-xl border border-cyan-200 bg-cyan-50/50 p-4 dark:border-cyan-500/20 dark:bg-cyan-500/5">
                    <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-semibold text-cyan-800 dark:text-cyan-200">
                            {__('Destinataires selectionnes')}
                        </p>
                        <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-cyan-700 shadow-sm dark:bg-slate-800 dark:text-cyan-300">
                            {selectedRecipients.length}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {selectedRecipients.map((recipient) => (
                            <button
                                key={recipient.id}
                                type="button"
                                onClick={() => onToggleRecipient(recipient.id)}
                                className="group inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-cyan-500/20 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-rose-500/20 dark:hover:bg-rose-500/10"
                            >
                                <span className="max-w-[180px] truncate">{recipient.name}</span>
                                <X className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Recipients List */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/30 overflow-hidden">
                <div className="max-h-80 space-y-1 overflow-y-auto p-2">
                    {filteredRecipients.length > 0 ? (
                        filteredRecipients.map((recipient) => {
                            const checked = selectedIds.includes(recipient.id);
                            return (
                                <label
                                    key={recipient.id}
                                    className={`flex cursor-pointer items-start gap-3 rounded-xl p-4 transition-all ${
                                        checked
                                            ? 'bg-cyan-50/80 border border-cyan-200 shadow-sm dark:bg-cyan-500/10 dark:border-cyan-500/30'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => onToggleRecipient(recipient.id)}
                                        className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500/30 dark:border-slate-600 dark:bg-slate-700"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{recipient.name}</p>
                                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{recipient.email}</p>
                                            </div>
                                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                                {recipient.role?.nom_role ?? __('Sans role')}
                                            </span>
                                        </div>
                                    </div>
                                </label>
                            );
                        })
                    ) : (
                        <div className="py-12 text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                                <Users className="h-5 w-5 text-slate-400" />
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {__('Aucun utilisateur trouve avec ce filtre.')}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <InputError message={error} className="mt-2" />
        </div>
    );
}

function formatDateTimeLocal(value: string | null): string {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    const pad = (input: number) => String(input).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
