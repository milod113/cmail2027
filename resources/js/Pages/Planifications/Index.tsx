import PlanningModal from '@/Components/PlanningModal';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import { Head, router } from '@inertiajs/react';
import { type ReactNode, useMemo, useState } from 'react';
import {
    ArrowRight,
    Bell,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock,
    MessageSquare,
    PenSquare,
    Plus,
    Send,
    Sparkles,
    Users,
    X,
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

type ScheduledMessageItem = {
    id: number;
    subject: string;
    body: string;
    excerpt: string;
    scheduled_at: string | null;
    status: string;
    created_at: string | null;
    receiver: Recipient | null;
};

type RecurringMessageItem = {
    id: number;
    body: string;
    excerpt: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    time_of_day: string;
    is_active: boolean;
    created_at: string | null;
    receiver: Recipient | null;
};

type PersonalReminderItem = {
    id: number;
    content: string;
    remind_at: string | null;
    is_completed: boolean;
    created_at: string | null;
};

type TabKey = 'scheduled' | 'recurring' | 'reminders';

export default function PlanificationsIndex({
    scheduledMessages,
    recurringMessages,
    personalReminders,
    recipients,
    roles,
}: {
    scheduledMessages: ScheduledMessageItem[];
    recurringMessages: RecurringMessageItem[];
    personalReminders: PersonalReminderItem[];
    recipients: Recipient[];
    roles: RoleOption[];
}) {
    const { __, locale } = useTranslation();
    const [activeTab, setActiveTab] = useState<TabKey>('scheduled');
    const [planningModalState, setPlanningModalState] = useState<
        | {
              type: 'scheduled' | 'recurring';
              mode: 'create' | 'edit';
              scheduledItem?: ScheduledMessageItem | null;
              recurringItem?: RecurringMessageItem | null;
          }
        | null
    >(null);

    const tabs = useMemo(
        () => [
            {
                key: 'scheduled' as const,
                label: __('Messages en attente'),
                icon: CalendarDays,
                count: scheduledMessages.length,
                helper: __('Programmes pour plus tard'),
            },
            {
                key: 'recurring' as const,
                label: __('Recurrents'),
                icon: MessageSquare,
                count: recurringMessages.length,
                helper: __('Routines automatiques'),
            },
            {
                key: 'reminders' as const,
                label: __('Rappels'),
                icon: Bell,
                count: personalReminders.length,
                helper: __('Memo personnel'),
            },
        ],
        [__, scheduledMessages.length, recurringMessages.length, personalReminders.length],
    );

    const nextScheduledMessage = scheduledMessages[0] ?? null;
    const activeRecurringCount = recurringMessages.filter((item) => item.is_active).length;
    const dueTodayReminders = personalReminders.filter((item) => {
        if (!item.remind_at) {
            return false;
        }

        const reminderDate = new Date(item.remind_at);
        const now = new Date();

        return reminderDate.toDateString() === now.toDateString();
    }).length;
    const totalManagedItems = scheduledMessages.length + recurringMessages.length + personalReminders.length;

    const formatDateTime = (value: string | null) => {
        if (!value) {
            return __('Non planifie');
        }

        return new Date(value).toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatTime = (value: string) => value.slice(0, 5);

    const frequencyLabel = (frequency: RecurringMessageItem['frequency']) => {
        switch (frequency) {
            case 'daily':
                return __('Tous les jours');
            case 'weekly':
                return __('Chaque semaine');
            case 'monthly':
                return __('Chaque mois');
            default:
                return frequency;
        }
    };

    const scheduledStatusLabel = (status: string) => {
        if (status === 'scheduled') {
            return __('Programme');
        }

        if (status === 'draft') {
            return __('Brouillon');
        }

        return __('Envoye');
    };

    const sendNow = (messageId: number) => {
        router.post(route('planifications.messages.send-now', messageId), {}, {
            preserveScroll: true,
        });
    };

    const cancelScheduled = (messageId: number) => {
        router.delete(route('planifications.messages.destroy', messageId), {
            preserveScroll: true,
        });
    };

    const openCreateScheduled = () => {
        setPlanningModalState({
            type: 'scheduled',
            mode: 'create',
            scheduledItem: null,
        });
    };

    const openEditScheduled = (item: ScheduledMessageItem) => {
        setPlanningModalState({
            type: 'scheduled',
            mode: 'edit',
            scheduledItem: item,
        });
    };

    const openCreateRecurring = () => {
        setPlanningModalState({
            type: 'recurring',
            mode: 'create',
            recurringItem: null,
        });
    };

    const openEditRecurring = (item: RecurringMessageItem) => {
        setPlanningModalState({
            type: 'recurring',
            mode: 'edit',
            recurringItem: item,
        });
    };

    return (
        <AuthenticatedLayout
            title={__('Planifications')}
            description={__('Organisez vos messages programmes, routines recurrentes et rappels personnels.')}
        >
            <Head title={__('Planifications')} />

            <div className="space-y-8">
                <section className="relative overflow-hidden rounded-[2rem] border border-cyan-100/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,249,255,0.96),rgba(248,250,252,0.94))] p-6 shadow-[0_28px_90px_-42px_rgba(14,116,144,0.35)] dark:border-cyan-500/20 dark:bg-[linear-gradient(135deg,rgba(2,6,23,0.96),rgba(8,47,73,0.28),rgba(2,6,23,0.96))] lg:p-8">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.14),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.14),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.1),transparent_26%)]" />
                    <div className="absolute -left-24 top-16 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-500/10" />
                    <div className="absolute -right-20 top-8 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-500/10" />

                    <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_24rem]">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/80 bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-700 shadow-sm dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300">
                                <Sparkles className="h-3.5 w-3.5" />
                                {__('Suite de planification')}
                            </div>

                            <div className="max-w-3xl">
                                <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white lg:text-5xl">
                                    {__('Pilotez vos envois et rappels avec une vue plus sereine, plus precise, plus elegante.')}
                                </h1>
                                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 lg:text-base">
                                    {__('Cmail regroupe vos messages programmes, vos routines recurrentes et vos pense-betes dans une interface premium, claire et rassurante pour l activite clinique quotidienne.')}
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={openCreateScheduled}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 via-sky-600 to-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:-translate-y-0.5 hover:shadow-cyan-500/35"
                                >
                                    <Plus className="h-4 w-4" />
                                    {__('Programmer un message')}
                                </button>
                                <button
                                    type="button"
                                    onClick={openCreateRecurring}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/80 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-cyan-200 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:border-cyan-500/30 dark:hover:text-cyan-300"
                                >
                                    <MessageSquare className="h-4 w-4" />
                                    {__('Nouvelle routine')}
                                </button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-4">
                                <MetricCard
                                    icon={<CalendarDays className="h-4 w-4" />}
                                    label={__('En attente')}
                                    value={String(scheduledMessages.length)}
                                    helper={
                                        nextScheduledMessage?.scheduled_at
                                            ? `${__('Prochain')}: ${formatDateTime(nextScheduledMessage.scheduled_at)}`
                                            : __('Aucun envoi programme')
                                    }
                                    tone="cyan"
                                />
                                <MetricCard
                                    icon={<MessageSquare className="h-4 w-4" />}
                                    label={__('Recurrents')}
                                    value={String(activeRecurringCount)}
                                    helper={__('Routines actives automatiques')}
                                    tone="emerald"
                                />
                                <MetricCard
                                    icon={<Bell className="h-4 w-4" />}
                                    label={__('Rappels du jour')}
                                    value={String(dueTodayReminders)}
                                    helper={__('A surveiller aujourd hui')}
                                    tone="amber"
                                />
                                <MetricCard
                                    icon={<CheckCircle2 className="h-4 w-4" />}
                                    label={__('Elements suivis')}
                                    value={String(totalManagedItems)}
                                    helper={__('Vue globale de vos planifications')}
                                    tone="slate"
                                />
                            </div>
                        </div>

                        <aside className="relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/85 p-5 shadow-lg backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-950/70">
                            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-cyan-500/10 via-sky-500/10 to-transparent" />
                            <div className="relative">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                                            {__('Vue rapide')}
                                        </p>
                                        <h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                                            {__('La prochaine fenetre utile')}
                                        </h2>
                                    </div>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 text-white shadow-lg shadow-cyan-500/20">
                                        <Clock className="h-5 w-5" />
                                    </div>
                                </div>

                                <div className="mt-6 rounded-[1.5rem] border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-sky-50 p-4 dark:border-cyan-500/20 dark:from-cyan-500/10 dark:via-slate-950/80 dark:to-sky-500/10">
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">
                                        {__('Prochain depart')}
                                    </p>
                                    <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                                        {nextScheduledMessage?.subject ?? __('Aucun message programme')}
                                    </p>
                                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                        {nextScheduledMessage?.receiver?.name ?? __('Ajoutez un message pour commencer a planifier.')}
                                    </p>
                                    <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm dark:bg-slate-900/80 dark:text-slate-200">
                                        <Clock className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-300" />
                                        {nextScheduledMessage?.scheduled_at
                                            ? formatDateTime(nextScheduledMessage.scheduled_at)
                                            : __('A planifier')}
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                                    <QuickOverviewCard
                                        label={__('Routines actives')}
                                        value={`${activeRecurringCount}`}
                                        helper={__('Messages recurrents actuellement actifs')}
                                    />
                                    <QuickOverviewCard
                                        label={__('Rappels a traiter')}
                                        value={`${personalReminders.length}`}
                                        helper={__('Notes et suivis personnels centralises')}
                                    />
                                </div>
                            </div>
                        </aside>
                    </div>
                </section>

                <section className="rounded-[2rem] border border-slate-200/70 bg-white/85 p-4 shadow-[0_24px_80px_-45px_rgba(15,23,42,0.35)] backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/85 lg:p-6">
                    <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-800/70 dark:bg-slate-950/40">
                        <div className="grid gap-3 md:grid-cols-3">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.key;

                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`group relative overflow-hidden rounded-[1.5rem] border p-4 text-left transition-all duration-200 ${
                                            isActive
                                                ? 'border-cyan-300 bg-white shadow-lg shadow-cyan-100/70 dark:border-cyan-500/40 dark:bg-slate-950'
                                                : 'border-transparent bg-transparent hover:border-cyan-200 hover:bg-white/70 dark:hover:border-cyan-500/20 dark:hover:bg-slate-900/60'
                                        }`}
                                    >
                                        <div
                                            className={`absolute inset-x-0 top-0 h-1 ${
                                                isActive
                                                    ? 'bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-400'
                                                    : 'bg-transparent group-hover:bg-gradient-to-r group-hover:from-cyan-400/50 group-hover:to-sky-400/50'
                                            }`}
                                        />
                                        <div className="flex items-start justify-between gap-3">
                                            <div
                                                className={`flex h-12 w-12 items-center justify-center rounded-2xl transition ${
                                                    isActive
                                                        ? 'bg-gradient-to-br from-cyan-500 to-sky-600 text-white shadow-lg shadow-cyan-500/20'
                                                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                                                }`}
                                            >
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                    isActive
                                                        ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300'
                                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                                }`}
                                            >
                                                {tab.count}
                                            </span>
                                        </div>
                                        <h2 className="mt-4 text-sm font-semibold text-slate-950 dark:text-white">{tab.label}</h2>
                                        <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">{tab.helper}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-6 rounded-[1.75rem] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.82))] p-5 dark:border-slate-800/70 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.92),rgba(15,23,42,0.68))] lg:p-6">
                        {activeTab === 'scheduled' ? (
                            <div className="space-y-5">
                                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                                    <div className="max-w-2xl">
                                        <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                                            <CalendarDays className="h-3.5 w-3.5" />
                                            {__('Envois programmes')}
                                        </div>
                                        <h3 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
                                            {__('Chaque message attend son meilleur moment.')}
                                        </h3>
                                        <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                                            {__('Retrouvez les messages deja prepares, ajustez l heure d envoi et declenchez une action immediate si le contexte clinique l exige.')}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-3 sm:flex-row">
                                        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                                            <div className="flex items-center gap-2 font-semibold">
                                                <Clock className="h-4 w-4" />
                                                {scheduledMessages.length} {__('a surveiller')}
                                            </div>
                                            <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-200/80">
                                                {__('Un point de controle clair sur les envois a venir.')}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={openCreateScheduled}
                                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:shadow-cyan-500/30"
                                        >
                                            <Plus className="h-4 w-4" />
                                            {__('Nouveau message')}
                                        </button>
                                    </div>
                                </div>

                                {scheduledMessages.length > 0 ? (
                                    <>
                                        <div className="hidden overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/40 lg:block">
                                            <table className="min-w-full text-sm">
                                                <thead className="border-b border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-950/80">
                                                    <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                                        <th className="px-6 py-4">{__('Destinataire')}</th>
                                                        <th className="px-6 py-4">{__('Message')}</th>
                                                        <th className="px-6 py-4">{__('Heure prevue')}</th>
                                                        <th className="px-6 py-4">{__('Statut')}</th>
                                                        <th className="px-6 py-4 text-right">{__('Actions')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                                    {scheduledMessages.map((item) => (
                                                        <tr
                                                            key={item.id}
                                                            className="align-top transition hover:bg-cyan-50/40 dark:hover:bg-cyan-500/5"
                                                        >
                                                            <td className="px-6 py-5">
                                                                <div className="flex items-start gap-3">
                                                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-100 to-sky-100 text-cyan-700 dark:from-cyan-500/10 dark:to-sky-500/10 dark:text-cyan-300">
                                                                        <Users className="h-4 w-4" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-semibold text-slate-950 dark:text-white">
                                                                            {item.receiver?.name ?? __('Inconnu')}
                                                                        </p>
                                                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                                            {item.receiver?.email ?? __('Sans email')}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <p className="font-semibold text-slate-950 dark:text-white">{item.subject}</p>
                                                                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                                                                    {item.excerpt}
                                                                </p>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <div className="inline-flex items-center gap-2 rounded-2xl border border-cyan-100 bg-cyan-50/80 px-3 py-2 text-slate-700 dark:border-cyan-500/10 dark:bg-cyan-500/10 dark:text-slate-100">
                                                                    <Clock className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                                                                    <span className="font-medium">{formatDateTime(item.scheduled_at)}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                                    {scheduledStatusLabel(item.status)}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <div className="flex justify-end gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openEditScheduled(item)}
                                                                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-500/30 dark:hover:bg-cyan-500/10"
                                                                    >
                                                                        <PenSquare className="h-4 w-4" />
                                                                        {__('Modifier')}
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => sendNow(item.id)}
                                                                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-700 px-4 py-2 font-semibold text-white transition hover:shadow-lg"
                                                                    >
                                                                        <Send className="h-4 w-4" />
                                                                        {__('Envoyer maintenant')}
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => cancelScheduled(item.id)}
                                                                        className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                        {__('Annuler')}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="grid gap-4 lg:hidden">
                                            {scheduledMessages.map((item) => (
                                                <article
                                                    key={item.id}
                                                    className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/40"
                                                >
                                                    <div className="h-1 bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-400" />
                                                    <div className="p-4">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <p className="font-semibold text-slate-950 dark:text-white">{item.subject}</p>
                                                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                                    {item.receiver?.name ?? __('Inconnu')}
                                                                </p>
                                                            </div>
                                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                                {scheduledStatusLabel(item.status)}
                                                            </span>
                                                        </div>

                                                        <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.excerpt}</p>

                                                        <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {formatDateTime(item.scheduled_at)}
                                                        </div>

                                                        <div className="mt-4 flex flex-wrap gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditScheduled(item)}
                                                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                                            >
                                                                <PenSquare className="h-4 w-4" />
                                                                {__('Modifier')}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => sendNow(item.id)}
                                                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-700 px-4 py-2 text-sm font-semibold text-white"
                                                            >
                                                                <Send className="h-4 w-4" />
                                                                {__('Envoyer maintenant')}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => cancelScheduled(item.id)}
                                                                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
                                                            >
                                                                <X className="h-4 w-4" />
                                                                {__('Annuler')}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </article>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <EmptyState
                                        icon={<CalendarDays className="h-8 w-8" />}
                                        title={__('Aucun message en attente')}
                                        description={__('Les messages programmes apparaitront ici avec leur heure prevue et leurs actions rapides.')}
                                    />
                                )}
                            </div>
                        ) : null}

                        {activeTab === 'recurring' ? (
                            <div className="space-y-5">
                                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                                    <div className="max-w-2xl">
                                        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                                            <MessageSquare className="h-3.5 w-3.5" />
                                            {__('Automatisation des routines')}
                                        </div>
                                        <h3 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
                                            {__('Des messages recurrents qui travaillent en arriere-plan pour vous.')}
                                        </h3>
                                        <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                                            {__('Organisez les transmissions repetitives, les rappels d equipe et les notifications planifiees avec une presentation plus lisible et plus haut de gamme.')}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={openCreateRecurring}
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:shadow-cyan-500/30"
                                    >
                                        <Plus className="h-4 w-4" />
                                        {__('Nouveau recurrent')}
                                    </button>
                                </div>

                                {recurringMessages.length > 0 ? (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {recurringMessages.map((item) => (
                                            <article
                                                key={item.id}
                                                className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-100/50 dark:border-slate-800 dark:bg-slate-950/50 dark:hover:shadow-cyan-500/5"
                                            >
                                                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-cyan-500 to-sky-500" />
                                                <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-cyan-100/60 blur-3xl dark:bg-cyan-500/10" />

                                                <div className="relative">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                                                                    item.is_active
                                                                        ? 'bg-gradient-to-br from-emerald-100 to-cyan-100 text-emerald-700 dark:from-emerald-500/10 dark:to-cyan-500/10 dark:text-emerald-300'
                                                                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                                                                }`}
                                                            >
                                                                <MessageSquare className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-950 dark:text-white">
                                                                    {item.receiver?.name ?? __('Destinataire inconnu')}
                                                                </p>
                                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                                    {item.receiver?.email ?? __('Sans email')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span
                                                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                                item.is_active
                                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                                            }`}
                                                        >
                                                            {item.is_active ? __('Actif') : __('Pause')}
                                                        </span>
                                                    </div>

                                                    <p className="mt-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
                                                        {item.excerpt}
                                                    </p>

                                                    <div className="mt-5 flex flex-wrap gap-2">
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {formatTime(item.time_of_day)}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                            <ChevronRight className="h-3.5 w-3.5" />
                                                            {frequencyLabel(item.frequency)}
                                                        </span>
                                                    </div>

                                                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200/80 pt-4 dark:border-slate-800">
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            {item.is_active
                                                                ? __('Routine active et prete pour le prochain cycle.')
                                                                : __('Routine conservee mais temporairement en pause.')}
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditRecurring(item)}
                                                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-500/30 dark:hover:bg-cyan-500/10"
                                                        >
                                                            <PenSquare className="h-4 w-4" />
                                                            {__('Modifier')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState
                                        icon={<MessageSquare className="h-8 w-8" />}
                                        title={__('Aucun message recurrent')}
                                        description={__('Vous pourrez bientot visualiser ici vos routines quotidiennes, hebdomadaires ou mensuelles.')}
                                    />
                                )}
                            </div>
                        ) : null}

                        {activeTab === 'reminders' ? (
                            <div className="space-y-5">
                                <div className="max-w-2xl">
                                    <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                                        <Bell className="h-3.5 w-3.5" />
                                        {__('Memo personnel')}
                                    </div>
                                    <h3 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
                                        {__('Des rappels qui restent discrets, mais jamais invisibles.')}
                                    </h3>
                                    <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                                        {__('Gardez vos notes de suivi, visites et actions importantes dans une timeline calme et lisible, pensee pour les journees chargees.')}
                                    </p>
                                </div>

                                {personalReminders.length > 0 ? (
                                    <div className="relative space-y-4 before:absolute before:bottom-0 before:left-5 before:top-0 before:hidden before:w-px before:bg-gradient-to-b before:from-cyan-200 before:to-amber-200 dark:before:from-cyan-500/20 dark:before:to-amber-500/20 md:before:block">
                                        {personalReminders.map((item) => (
                                            <article
                                                key={item.id}
                                                className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950/40 md:ml-10"
                                            >
                                                <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-amber-400 via-cyan-400 to-sky-500" />
                                                <div className="absolute -left-[3.15rem] top-6 hidden h-5 w-5 rounded-full border-4 border-white bg-amber-400 shadow-lg dark:border-slate-900 md:block" />

                                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-cyan-100 text-amber-700 dark:from-amber-500/10 dark:to-cyan-500/10 dark:text-amber-300">
                                                            <Bell className="h-5 w-5" />
                                                        </div>
                                                        <div className="max-w-3xl">
                                                            <p className="text-sm font-semibold leading-7 text-slate-950 dark:text-white">
                                                                {item.content}
                                                            </p>
                                                            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                                <Clock className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-300" />
                                                                {formatDateTime(item.remind_at)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        {__('A traiter')}
                                                    </div>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState
                                        icon={<Bell className="h-8 w-8" />}
                                        title={__('Aucun rappel personnel')}
                                        description={__('Les pense-betes a venir apparaitront ici avec leur date et heure.')}
                                    />
                                )}
                            </div>
                        ) : null}
                    </div>
                </section>
            </div>

            <PlanningModal
                show={planningModalState !== null}
                mode={planningModalState?.mode ?? 'create'}
                type={planningModalState?.type ?? 'scheduled'}
                recipients={recipients}
                roles={roles}
                scheduledItem={planningModalState?.type === 'scheduled' ? planningModalState.scheduledItem ?? null : null}
                recurringItem={planningModalState?.type === 'recurring' ? planningModalState.recurringItem ?? null : null}
                onClose={() => setPlanningModalState(null)}
            />
        </AuthenticatedLayout>
    );
}

function MetricCard({
    icon,
    label,
    value,
    helper,
    tone,
}: {
    icon: ReactNode;
    label: string;
    value: string;
    helper: string;
    tone: 'cyan' | 'emerald' | 'amber' | 'slate';
}) {
    const tones = {
        cyan: 'from-cyan-50 to-white text-cyan-700 dark:from-cyan-500/10 dark:to-slate-950 dark:text-cyan-300',
        emerald: 'from-emerald-50 to-white text-emerald-700 dark:from-emerald-500/10 dark:to-slate-950 dark:text-emerald-300',
        amber: 'from-amber-50 to-white text-amber-700 dark:from-amber-500/10 dark:to-slate-950 dark:text-amber-300',
        slate: 'from-slate-100 to-white text-slate-700 dark:from-slate-800 dark:to-slate-950 dark:text-slate-300',
    };

    return (
        <div className={`rounded-[1.5rem] border border-white/80 bg-gradient-to-br p-4 shadow-sm dark:border-slate-800 ${tones[tone]}`}>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
                {icon}
                {label}
            </div>
            <div className="mt-4 text-3xl font-bold text-slate-950 dark:text-white">{value}</div>
            <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">{helper}</p>
        </div>
    );
}

function QuickOverviewCard({
    label,
    value,
    helper,
}: {
    label: string;
    value: string;
    helper: string;
}) {
    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{label}</p>
                <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">{value}</p>
            <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">{helper}</p>
        </div>
    );
}

function EmptyState({
    icon,
    title,
    description,
}: {
    icon: ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="relative overflow-hidden rounded-[1.75rem] border border-dashed border-slate-200 bg-[linear-gradient(135deg,rgba(248,250,252,0.95),rgba(255,255,255,0.98))] px-6 py-16 text-center dark:border-slate-800 dark:bg-[linear-gradient(135deg,rgba(2,6,23,0.84),rgba(15,23,42,0.68))]">
            <div className="absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-cyan-200/30 blur-3xl dark:bg-cyan-500/10" />
            <div className="relative">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-400 shadow-lg dark:bg-slate-900 dark:text-slate-500">
                    {icon}
                </div>
                <h4 className="mt-5 text-lg font-semibold text-slate-950 dark:text-white">{title}</h4>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-500 dark:text-slate-400">{description}</p>
            </div>
        </div>
    );
}
