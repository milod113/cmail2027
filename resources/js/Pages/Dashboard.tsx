import ActionRequiredWidget from '@/Components/ActionRequiredWidget';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PendingRequestsWidget from '@/Components/PendingRequestsWidget';
import PublicationsFeed from '@/Components/PublicationsFeed';
import { Head, Link } from '@inertiajs/react';
import {
    Archive,
    Bell,
    CalendarDays,
    FileText,
    Mail,
    Send,
    Inbox,
    Users,
    Sparkles,
    ArrowRight,
    MessageSquare,
    Clock,
    Eye,
    PenSquare
} from 'lucide-react';

type DashboardProps = {
    publications: Array<{
        id: number;
        title?: string | null;
        content: string;
        photo_url?: string | null;
        created_at: string;
        likes_count: number;
        comments_count: number;
        is_liked_by_current_user: boolean;
        user: {
            id: number;
            name: string;
            email?: string;
        };
        comments: Array<{
            id: number;
            content: string;
            created_at: string;
            user: {
                id: number;
                name: string;
                email?: string;
            };
        }>;
    }>;
    stats: {
        unread_messages: number;
        pending_invitations: number;
        drafts: number;
        unread_notifications: number;
        publications_count: number;
    };
    pendingSentRequests: Array<{
        id: number;
        subject: string;
        body: string;
        excerpt: string;
        sent_at: string | null;
        created_at: string | null;
        receiver: {
            id: number;
            name: string;
            email?: string | null;
        } | null;
    }>;
    actionRequiredMessages: Array<{
        id: number;
        subject: string;
        body: string;
        excerpt: string;
        sent_at: string | null;
        created_at: string | null;
        sender: {
            id: number;
            name: string;
            email?: string | null;
        } | null;
    }>;
    recentActivity: Array<{
        id: string;
        type: 'received_message' | 'sent_message' | 'draft_saved' | 'invitation' | 'publication';
        title: string;
        description: string;
        occurred_at: string;
    }>;
};

function statCards(stats: DashboardProps['stats']) {
    return [
        {
            label: 'Messages non lus',
            value: stats.unread_messages,
            helper: 'Dans votre boîte de réception',
            icon: <Mail className="h-5 w-5" />,
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-500/10',
            textColor: 'text-blue-600 dark:text-blue-400',
            trend: '+12%',
        },
        {
            label: 'Invitations en attente',
            value: stats.pending_invitations,
            helper: 'Confirmez vos événements',
            icon: <CalendarDays className="h-5 w-5" />,
            color: 'from-purple-500 to-purple-600',
            bgColor: 'bg-purple-50 dark:bg-purple-500/10',
            textColor: 'text-purple-600 dark:text-purple-400',
            trend: '+5%',
        },
        {
            label: 'Brouillons',
            value: stats.drafts,
            helper: 'Messages enregistrés',
            icon: <FileText className="h-5 w-5" />,
            color: 'from-amber-500 to-amber-600',
            bgColor: 'bg-amber-50 dark:bg-amber-500/10',
            textColor: 'text-amber-600 dark:text-amber-400',
            trend: '-2%',
        },
        {
            label: 'Notifications',
            value: stats.unread_notifications,
            helper: 'Alertes récentes',
            icon: <Bell className="h-5 w-5" />,
            color: 'from-rose-500 to-rose-600',
            bgColor: 'bg-rose-50 dark:bg-rose-500/10',
            textColor: 'text-rose-600 dark:text-rose-400',
            trend: '+8%',
        },
    ];
}

function getInitials(label: string) {
    return label
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

function formatRelativeTime(value: string) {
    const date = new Date(value);
    const diffInMinutes = Math.round((date.getTime() - Date.now()) / 60000);
    const formatter = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });

    const ranges: Array<[number, Intl.RelativeTimeFormatUnit]> = [
        [60, 'minute'],
        [1440, 'hour'],
        [10080, 'day'],
        [43200, 'week'],
        [525600, 'month'],
    ];

    for (const [limit, unit] of ranges) {
        if (Math.abs(diffInMinutes) < limit) {
            const divisor =
                unit === 'minute' ? 1
                    : unit === 'hour' ? 60
                    : unit === 'day' ? 1440
                    : unit === 'week' ? 10080
                    : 43200;

            return formatter.format(Math.round(diffInMinutes / divisor), unit);
        }
    }

    return formatter.format(Math.round(diffInMinutes / 525600), 'year');
}

function recentActivityMeta(type: DashboardProps['recentActivity'][number]['type']) {
    switch (type) {
        case 'received_message':
            return {
                icon: MessageSquare,
                avatarClass: 'from-indigo-500 to-purple-500',
                iconClass: 'text-indigo-400',
            };
        case 'sent_message':
            return {
                icon: Send,
                avatarClass: 'from-cyan-500 to-sky-600',
                iconClass: 'text-cyan-400',
            };
        case 'draft_saved':
            return {
                icon: PenSquare,
                avatarClass: 'from-amber-500 to-orange-500',
                iconClass: 'text-amber-400',
            };
        case 'invitation':
            return {
                icon: CalendarDays,
                avatarClass: 'from-emerald-500 to-teal-600',
                iconClass: 'text-emerald-400',
            };
        case 'publication':
            return {
                icon: Archive,
                avatarClass: 'from-rose-500 to-pink-600',
                iconClass: 'text-rose-400',
            };
        default:
            return {
                icon: MessageSquare,
                avatarClass: 'from-slate-500 to-slate-600',
                iconClass: 'text-slate-400',
            };
    }
}

export default function Dashboard({ publications, stats, pendingSentRequests, actionRequiredMessages, recentActivity }: DashboardProps) {
    const quickActions = [
        { label: 'Nouveau message', href: route('messages.create'), icon: Send, color: 'from-indigo-500 to-indigo-600' },
        { label: 'Boîte de réception', href: route('messages.inbox'), icon: Inbox, color: 'from-emerald-500 to-emerald-600' },
        { label: 'Mes invitations', href: route('events.invitations'), icon: CalendarDays, color: 'from-amber-500 to-amber-600' },
        { label: 'Annuaire', href: route('contacts.index'), icon: Users, color: 'from-cyan-500 to-cyan-600' },
    ];

    return (
        <AuthenticatedLayout
            title="Dashboard"
            description="Vue d'ensemble de vos messages, invitations et publications internes."
        >
            <Head title="Dashboard" />

            <div className="space-y-8 pb-8">
                {/* Hero Section with Gradient */}
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-xl dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 md:p-8">
                    {/* Animated Background Elements */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl" />
                        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 blur-3xl" />
                    </div>

                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="max-w-2xl">
                            <div className="mb-3 flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-amber-400" />
                                <span className="text-sm font-medium text-amber-400">Tableau de bord</span>
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                                Bonjour, bienvenue 👋
                            </h1>
                            <p className="mt-3 text-base leading-relaxed text-slate-300 md:text-lg">
                                Retrouvez vos actions prioritaires, le suivi de votre activité et les dernières publications internes.
                            </p>
                        </div>

                        {/* Quick Actions - Mobile Scrollable */}
                        <div className="flex gap-3 overflow-x-auto pb-2 lg:overflow-visible lg:pb-0">
                            {quickActions.map((action) => {
                                const Icon = action.icon;
                                return (
                                    <Link
                                        key={action.label}
                                        href={action.href}
                                        className="group flex shrink-0 items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:scale-105 active:scale-95"
                                    >
                                        <Icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                                        <span>{action.label}</span>
                                        <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Stats Grid */}
                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {statCards(stats).map((card, index) => (
                        <div
                            key={card.label}
                            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/50 hover:-translate-y-1"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {/* Animated gradient border on hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:via-slate-800" />

                            <div className="relative flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
                                    <p className="mt-2 text-4xl font-bold text-slate-900 dark:text-white">{card.value}</p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{card.helper}</p>
                                        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                                            <Clock className="h-2.5 w-2.5" />
                                            {card.trend}
                                        </span>
                                    </div>
                                </div>
                                <div className={`rounded-2xl ${card.bgColor} p-2.5 transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                                    <div className={card.textColor}>
                                        {card.icon}
                                    </div>
                                </div>
                            </div>

                            {/* Progress bar animation */}
                            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700">
                                <div
                                    className="h-full w-0 bg-gradient-to-r rounded-full transition-all duration-1000 group-hover:w-full"
                                    style={{
                                        backgroundImage: `linear-gradient(90deg, ${card.color.split(' ')[1]}, ${card.color.split(' ')[3]})`,
                                        opacity: 0.7
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </section>

                {/* Main Content Grid */}
                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Left Column */}
                    <div className="space-y-8">
                        <ActionRequiredWidget actionRequiredMessages={actionRequiredMessages} />
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Activité récente</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Vos dernières interactions réelles</p>
                                </div>
                                <Eye className="h-5 w-5 text-slate-400" />
                            </div>
                            <div className="space-y-3">
                                {recentActivity.length > 0 ? (
                                    recentActivity.map((activity) => {
                                        const meta = recentActivityMeta(activity.type);
                                        const Icon = meta.icon;

                                        return (
                                            <div key={activity.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 transition hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800">
                                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white ${meta.avatarClass}`}>
                                                    {getInitials(activity.title)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{activity.title}</p>
                                                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{activity.description}</p>
                                                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{formatRelativeTime(activity.occurred_at)}</p>
                                                </div>
                                                <Icon className={`h-4 w-4 shrink-0 ${meta.iconClass}`} />
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                                        Aucune activite recente pour le moment.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-8">
                        <PendingRequestsWidget pendingSentRequests={pendingSentRequests} />
                    </div>
                </div>

                {/* Publications Feed */}
                <PublicationsFeed publications={publications} />
            </div>
        </AuthenticatedLayout>
    );
}
