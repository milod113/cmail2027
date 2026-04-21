import ActionRequiredWidget from '@/Components/ActionRequiredWidget';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PendingRequestsWidget from '@/Components/PendingRequestsWidget';
import PublicationsFeed from '@/Components/PublicationsFeed';
import ShiftDashboard from '@/Components/ShiftDashboard';
import SystemFeedbackCard from '@/Components/SystemFeedbackCard';
import { Head, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
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
    PenSquare,
    TrendingUp,
    TrendingDown,
    Activity,
    ChevronRight,
    Grid3x3,
    LayoutGrid,
    Sun,
    Moon,
    Zap,
    Shield,
    Award,
    Target,
    Compass,
    Rocket,
    Star,
    Heart,
    ThumbsUp,
    Coffee,
    Brain,
    Cloud,
    Droplets,
    Wind,
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
    tasks: Array<{
        id: number;
        message_id: number | null;
        title: string;
        description: string | null;
        status: 'pending' | 'completed';
        created_at: string | null;
        message: {
            id: number;
            sujet: string | null;
        } | null;
    }>;
    feedbackRequest: {
        id: string;
        title: string;
        message: string;
        type: string;
    } | null;
};

function statCards(stats: DashboardProps['stats']) {
    const trends = [
        { value: '+12%', up: true },
        { value: '+5%', up: true },
        { value: '-2%', up: false },
        { value: '+8%', up: true },
    ];

    return [
        {
            label: 'Messages non lus',
            value: stats.unread_messages,
            helper: 'Dans votre boîte de réception',
            icon: Mail,
            gradient: 'from-blue-500 to-blue-600',
            bgGradient: 'from-blue-50 to-blue-100 dark:from-blue-500/20 dark:to-blue-600/20',
            textColor: 'text-blue-600 dark:text-blue-400',
            trend: trends[0],
        },
        {
            label: 'Invitations en attente',
            value: stats.pending_invitations,
            helper: 'Confirmez vos événements',
            icon: CalendarDays,
            gradient: 'from-purple-500 to-purple-600',
            bgGradient: 'from-purple-50 to-purple-100 dark:from-purple-500/20 dark:to-purple-600/20',
            textColor: 'text-purple-600 dark:text-purple-400',
            trend: trends[1],
        },
        {
            label: 'Brouillons',
            value: stats.drafts,
            helper: 'Messages enregistrés',
            icon: FileText,
            gradient: 'from-amber-500 to-amber-600',
            bgGradient: 'from-amber-50 to-amber-100 dark:from-amber-500/20 dark:to-amber-600/20',
            textColor: 'text-amber-600 dark:text-amber-400',
            trend: trends[2],
        },
        {
            label: 'Notifications',
            value: stats.unread_notifications,
            helper: 'Alertes récentes',
            icon: Bell,
            gradient: 'from-rose-500 to-rose-600',
            bgGradient: 'from-rose-50 to-rose-100 dark:from-rose-500/20 dark:to-rose-600/20',
            textColor: 'text-rose-600 dark:text-rose-400',
            trend: trends[3],
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
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'à l\'instant';
    if (diffInSeconds < 3600) return `il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `il y a ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `il y a ${Math.floor(diffInSeconds / 86400)} j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function recentActivityMeta(type: DashboardProps['recentActivity'][number]['type']) {
    switch (type) {
        case 'received_message':
            return {
                icon: MessageSquare,
                gradient: 'from-indigo-500 to-purple-500',
                iconColor: 'text-indigo-400',
                bgLight: 'bg-indigo-50 dark:bg-indigo-500/10',
            };
        case 'sent_message':
            return {
                icon: Send,
                gradient: 'from-cyan-500 to-sky-600',
                iconColor: 'text-cyan-400',
                bgLight: 'bg-cyan-50 dark:bg-cyan-500/10',
            };
        case 'draft_saved':
            return {
                icon: PenSquare,
                gradient: 'from-amber-500 to-orange-500',
                iconColor: 'text-amber-400',
                bgLight: 'bg-amber-50 dark:bg-amber-500/10',
            };
        case 'invitation':
            return {
                icon: CalendarDays,
                gradient: 'from-emerald-500 to-teal-600',
                iconColor: 'text-emerald-400',
                bgLight: 'bg-emerald-50 dark:bg-emerald-500/10',
            };
        case 'publication':
            return {
                icon: Archive,
                gradient: 'from-rose-500 to-pink-600',
                iconColor: 'text-rose-400',
                bgLight: 'bg-rose-50 dark:bg-rose-500/10',
            };
        default:
            return {
                icon: MessageSquare,
                gradient: 'from-slate-500 to-slate-600',
                iconColor: 'text-slate-400',
                bgLight: 'bg-slate-50 dark:bg-slate-500/10',
            };
    }
}

// Animated Counter Component
function AnimatedCounter({ value }: { value: number }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let start = 0;
        const duration = 1000;
        const increment = value / (duration / 16);

        const timer = setInterval(() => {
            start += increment;
            if (start >= value) {
                setCount(value);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);

        return () => clearInterval(timer);
    }, [value]);

    return <span>{count}</span>;
}

// Floating Particles Component
function FloatingParticles() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
                <div
                    key={i}
                    className="absolute animate-float rounded-full bg-white/10"
                    style={{
                        width: `${Math.random() * 4 + 2}px`,
                        height: `${Math.random() * 4 + 2}px`,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 5}s`,
                        animationDuration: `${Math.random() * 10 + 5}s`,
                    }}
                />
            ))}
        </div>
    );
}

export default function Dashboard({ publications, stats, pendingSentRequests, actionRequiredMessages, recentActivity, tasks, feedbackRequest }: DashboardProps) {
    const [greeting, setGreeting] = useState('');
    const [currentTime, setCurrentTime] = useState('');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Bonjour');
        else if (hour < 18) setGreeting('Bon après-midi');
        else setGreeting('Bonsoir');

        const updateTime = () => {
            setCurrentTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
        };
        updateTime();
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, []);

    const quickActions = [
        { label: 'Nouveau message', href: route('messages.create'), icon: Send, gradient: 'from-indigo-500 to-indigo-600', color: 'indigo' },
        { label: 'Boîte de réception', href: route('messages.inbox'), icon: Inbox, gradient: 'from-emerald-500 to-emerald-600', color: 'emerald' },
        { label: 'Mes invitations', href: route('events.invitations'), icon: CalendarDays, gradient: 'from-amber-500 to-amber-600', color: 'amber' },
        { label: 'Annuaire', href: route('contacts.index'), icon: Users, gradient: 'from-cyan-500 to-cyan-600', color: 'cyan' },
    ];

    return (
        <AuthenticatedLayout
            title="Dashboard"
            description="Vue d'ensemble de vos messages, invitations et publications internes."
        >
            <Head title="Dashboard" />

            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) translateX(0px); }
                    25% { transform: translateY(-20px) translateX(10px); }
                    75% { transform: translateY(20px) translateX(-10px); }
                }
                @keyframes gradient-shift {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                @keyframes pulse-ring {
                    0% { transform: scale(0.8); opacity: 0.5; }
                    100% { transform: scale(1.4); opacity: 0; }
                }
                .animate-float {
                    animation: float linear infinite;
                }
                .animate-gradient {
                    background-size: 200% 200%;
                    animation: gradient-shift 6s ease infinite;
                }
                .animate-pulse-ring {
                    animation: pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                <div className="container mx-auto space-y-6 px-4 py-4 sm:space-y-8 sm:px-6 sm:py-6 lg:px-8 lg:py-8">

                    {/* Hero Section - Modern Glass Morphism */}
                    <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl">
                        <FloatingParticles />

                        {/* Animated gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 animate-gradient" />

                        {/* Decorative circles */}
                        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 blur-3xl" />
                        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-3xl" />

                        <div className="relative p-5 sm:p-6 md:p-8 lg:p-10">
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                                <div className="space-y-3 sm:space-y-4">
                                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                                        <Sparkles className="h-4 w-4 text-amber-400" />
                                        <span className="text-xs font-medium text-amber-400 sm:text-sm">
                                            {greeting}, bienvenue
                                        </span>
                                    </div>

                                    <div>
                                        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">
                                            Tableau de bord
                                        </h1>
                                        <p className="mt-2 text-sm text-slate-300 sm:mt-3 sm:text-base lg:text-lg">
                                            {currentTime} · Vue d'ensemble de votre activité
                                        </p>
                                    </div>
                                </div>

                                {/* Quick Actions - Horizontal Scroll on Mobile */}
                                <div className="flex gap-2 overflow-x-auto pb-2 sm:gap-3 lg:overflow-visible">
                                    {quickActions.map((action) => {
                                        const Icon = action.icon;
                                        return (
                                            <Link
                                                key={action.label}
                                                href={action.href}
                                                className="group relative shrink-0 overflow-hidden rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-95 sm:rounded-2xl sm:px-5 sm:py-3"
                                            >
                                                <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-500 group-hover:translate-x-[100%]" />
                                                <div className="relative flex items-center gap-2">
                                                    <Icon className="h-4 w-4 transition-transform group-hover:scale-110 sm:h-5 sm:w-5" />
                                                    <span className="text-xs sm:text-sm">{action.label}</span>
                                                    <ArrowRight className="h-3 w-3 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 sm:h-3.5 sm:w-3.5" />
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Stats Preview on Mobile */}
                            <div className="mt-6 grid grid-cols-2 gap-3 sm:hidden">
                                <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
                                    <p className="text-xs text-slate-300">Total messages</p>
                                    <p className="mt-1 text-2xl font-bold text-white">
                                        {stats.unread_messages + (stats.drafts || 0)}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
                                    <p className="text-xs text-slate-300">Publications</p>
                                    <p className="mt-1 text-2xl font-bold text-white">{stats.publications_count}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Stats Grid - Modern Cards with Animations */}
                    <section className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                        {statCards(stats).map((card, index) => {
                            const Icon = card.icon;
                            const TrendIcon = card.trend.up ? TrendingUp : TrendingDown;

                            return (
                                <div
                                    key={card.label}
                                    className="group relative overflow-hidden rounded-xl bg-white p-4 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 dark:bg-slate-900 sm:rounded-2xl sm:p-5"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    {/* Animated border gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:via-slate-800" />

                                    <div className="relative flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">
                                                {card.label}
                                            </p>
                                            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white sm:mt-3 sm:text-3xl lg:text-4xl">
                                                <AnimatedCounter value={card.value} />
                                            </p>
                                            <div className="mt-2 flex items-center gap-1.5">
                                                <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium ${
                                                    card.trend.up
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                                        : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                                                }`}>
                                                    <TrendIcon className="h-2.5 w-2.5" />
                                                    {card.trend.value}
                                                </span>
                                                <span className="text-xs text-slate-400">{card.helper}</span>
                                            </div>
                                        </div>

                                        <div className={`rounded-xl bg-gradient-to-br ${card.bgGradient} p-2 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 sm:rounded-2xl sm:p-3`}>
                                            <Icon className={`h-4 w-4 ${card.textColor} sm:h-5 sm:w-5`} />
                                        </div>
                                    </div>

                                    {/* Progress indicator */}
                                    <div className="absolute bottom-0 left-0 h-1 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                                        <div
                                            className={`h-full w-0 rounded-full bg-gradient-to-r ${card.gradient} transition-all duration-1000 group-hover:w-full`}
                                            style={{ width: `${Math.min((card.value / 100) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </section>

                    {feedbackRequest?.type === 'feedback_request' && (
                        <div className="animate-slide-down">
                            <SystemFeedbackCard
                                title={feedbackRequest.title}
                                message={feedbackRequest.message}
                            />
                        </div>
                    )}

                    {/* Main Content Grid - Responsive */}
                    <div className="grid gap-6 lg:gap-8 lg:grid-cols-2">
                        {/* Left Column */}
                        <div className="space-y-6 lg:space-y-8">
                            {/* Action Required Widget */}
                            <div className="transform transition-all duration-300 hover:translate-y-[-2px]">
                                <ActionRequiredWidget actionRequiredMessages={actionRequiredMessages} />
                            </div>

                            {/* Recent Activity - Enhanced */}
                            <div className="rounded-xl bg-white p-4 shadow-lg dark:bg-slate-900 sm:rounded-2xl sm:p-6">
                                <div className="mb-4 flex items-center justify-between sm:mb-6">
                                    <div>
                                        <h3 className="text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
                                            Activité récente
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                                            Vos dernières interactions
                                        </p>
                                    </div>
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
                                        <Activity className="h-4 w-4 text-slate-500" />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {recentActivity.length > 0 ? (
                                        recentActivity.slice(0, 5).map((activity, idx) => {
                                            const meta = recentActivityMeta(activity.type);
                                            const Icon = meta.icon;

                                            return (
                                                <div
                                                    key={activity.id}
                                                    className="group relative flex items-start gap-3 rounded-lg p-2 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 sm:gap-4 sm:p-3"
                                                    style={{ animationDelay: `${idx * 50}ms` }}
                                                >
                                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${meta.gradient} shadow-md transition-transform group-hover:scale-110 sm:h-12 sm:w-12`}>
                                                        <Icon className="h-4 w-4 text-white sm:h-5 sm:w-5" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">
                                                            {activity.title}
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                                            {activity.description}
                                                        </p>
                                                        <div className="mt-1 flex items-center gap-2">
                                                            <Clock className="h-3 w-3 text-slate-400" />
                                                            <p className="text-xs text-slate-400">
                                                                {formatRelativeTime(activity.occurred_at)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="h-4 w-4 text-slate-400 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="rounded-lg bg-slate-50 p-6 text-center dark:bg-slate-800/50">
                                            <Coffee className="mx-auto h-8 w-8 text-slate-400" />
                                            <p className="mt-2 text-sm text-slate-500">
                                                Aucune activité récente
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {recentActivity.length > 5 && (
                                    <div className="mt-4 text-center">
                                        <Link
                                            href={route('activity.index')}
                                            className="inline-flex items-center gap-1 text-xs font-medium text-cyan-600 transition hover:gap-2 hover:text-cyan-700 dark:text-cyan-400"
                                        >
                                            Voir tout l'historique
                                            <ChevronRight className="h-3 w-3" />
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6 lg:space-y-8">
                            {/* Pending Requests Widget */}
                            <div className="transform transition-all duration-300 hover:translate-y-[-2px]">
                                <PendingRequestsWidget pendingSentRequests={pendingSentRequests} />
                            </div>

                            {/* Shift Dashboard */}
                            <div className="transform transition-all duration-300 hover:translate-y-[-2px]">
                                <ShiftDashboard tasks={tasks} />
                            </div>
                        </div>
                    </div>

                    {/* Publications Feed - Full Width */}
                    <div className="transform transition-all duration-300">
                        <PublicationsFeed publications={publications} />
                    </div>

                    {/* Footer Note */}
                    <div className="rounded-xl bg-gradient-to-r from-cyan-50 to-sky-50 p-4 text-center dark:from-cyan-500/10 dark:to-sky-500/10 sm:rounded-2xl sm:p-6">
                        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                                <p className="text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
                                    Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
                                </p>
                            </div>
                            <div className="hidden h-4 w-px bg-slate-300 dark:bg-slate-700 sm:block" />
                            <p className="text-xs text-slate-500 dark:text-slate-500">
                                🚀 Productivité +40% avec les tâches organisées
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
