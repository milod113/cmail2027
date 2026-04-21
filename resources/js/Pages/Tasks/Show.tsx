import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    Circle,
    ClipboardList,
    Clock3,
    ExternalLink,
    Flag,
    Mail,
    Sparkles,
    Award,
    Trophy,
    Target,
    Zap,
    Clock,
    Calendar,
    Bell,
    MessageSquare,
    ThumbsUp,
    Share2,
    Bookmark,
    MoreHorizontal,
    ChevronRight,
    Loader2,
    Sun,
    Moon,
    Star,
    Heart,
    TrendingUp,
    Activity,
    BarChart3,
    PieChart,
    LineChart,
    Brain,
} from 'lucide-react';
import { type ReactNode } from 'react';

type TaskDetail = {
    id: number;
    kind?: string;
    message_id: number | null;
    title: string;
    description: string | null;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    status: 'pending' | 'completed';
    is_completed?: boolean;
    due_date?: string | null;
    reminder_at?: string | null;
    created_at: string | null;
    archived_at?: string | null;
    show_url?: string;
    toggle_url?: string;
    message: {
        id: number;
        sujet: string | null;
        view_url?: string;
    } | null;
};

function formatDateTime(value: string | null | undefined, locale: string) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatRelativeTime(value: string | null | undefined) {
    if (!value) return null;
    const date = new Date(value);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;
    return `Le ${date.toLocaleDateString('fr-FR')}`;
}

function priorityMeta(priority: TaskDetail['priority']) {
    switch (priority) {
        case 'urgent':
            return {
                label: 'Urgente',
                icon: Zap,
                gradient: 'from-rose-500 to-pink-600',
                bgGradient: 'from-rose-50 to-pink-50 dark:from-rose-500/20 dark:to-pink-500/20',
                textColor: 'text-rose-700 dark:text-rose-300',
                badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
                progressColor: 'bg-gradient-to-r from-rose-500 to-pink-500',
            };
        case 'high':
            return {
                label: 'Haute',
                icon: TrendingUp,
                gradient: 'from-amber-500 to-orange-600',
                bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-500/20 dark:to-orange-500/20',
                textColor: 'text-amber-700 dark:text-amber-300',
                badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
                progressColor: 'bg-gradient-to-r from-amber-500 to-orange-500',
            };
        case 'low':
            return {
                label: 'Basse',
                icon: Star,
                gradient: 'from-slate-500 to-slate-600',
                bgGradient: 'from-slate-50 to-slate-100 dark:from-slate-500/20 dark:to-slate-600/20',
                textColor: 'text-slate-700 dark:text-slate-300',
                badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300',
                progressColor: 'bg-gradient-to-r from-slate-500 to-slate-600',
            };
        default:
            return {
                label: 'Normale',
                icon: Target,
                gradient: 'from-sky-500 to-cyan-600',
                bgGradient: 'from-sky-50 to-cyan-50 dark:from-sky-500/20 dark:to-cyan-500/20',
                textColor: 'text-sky-700 dark:text-sky-300',
                badgeClass: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
                progressColor: 'bg-gradient-to-r from-sky-500 to-cyan-500',
            };
    }
}

// Floating particles background
function FloatingParticles() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(30)].map((_, i) => (
                <div
                    key={i}
                    className="absolute animate-float rounded-full bg-white/10"
                    style={{
                        width: `${Math.random() * 6 + 2}px`,
                        height: `${Math.random() * 6 + 2}px`,
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

// Animated progress circle
function ProgressCircle({ percentage, color }: { percentage: number; color: string }) {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <svg className="h-24 w-24 transform -rotate-90">
            <circle
                className="text-slate-200 dark:text-slate-700"
                strokeWidth="4"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="48"
                cy="48"
            />
            <circle
                className={`${color} transition-all duration-1000 ease-out`}
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="48"
                cy="48"
            />
        </svg>
    );
}

export default function TaskShow({ task }: { task: TaskDetail }) {
    const { __, locale } = useTranslation();
    const [isUpdating, setIsUpdating] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);

    const dueDateLabel = formatDateTime(task.due_date, locale);
    const reminderLabel = formatDateTime(task.reminder_at, locale);
    const createdAtLabel = formatDateTime(task.created_at, locale);
    const relativeTime = formatRelativeTime(task.created_at);
    const priority = priorityMeta(task.priority);
    const isCompleted = task.status === 'completed';
    const PriorityIcon = priority.icon;

    // Calculate progress percentage (example: based on completion and time)
    const progressPercentage = isCompleted ? 100 : dueDateLabel ? 65 : 30;

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (showShareMenu && !(e.target as Element).closest('.share-menu')) {
                setShowShareMenu(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showShareMenu]);

    const toggleStatus = () => {
        if (!task.toggle_url || isUpdating) return;
        setIsUpdating(true);
        router.patch(
            task.toggle_url,
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsUpdating(false),
            },
        );
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: task.title,
                text: task.description || '',
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Lien copié dans le presse-papiers');
        }
        setShowShareMenu(false);
    };

    return (
        <AuthenticatedLayout
            title={task.title}
            description={__('Consultez le detail de la tache et mettez a jour son statut.')}
        >
            <Head title={task.title} />

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
                @keyframes slide-up {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
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
                .animate-slide-up {
                    animation: slide-up 0.5s ease-out forwards;
                }
                .animate-pulse-ring {
                    animation: pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                <div className="container mx-auto space-y-6 px-4 py-4 sm:space-y-8 sm:px-6 sm:py-6 lg:px-8 lg:py-8">

                    {/* Hero Section - Dynamic Gradient based on Priority */}
                    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br shadow-2xl transition-all duration-500 sm:rounded-3xl"
                        style={{
                            backgroundImage: `linear-gradient(135deg, ${priority.gradient.split(' ')[1]} 0%, ${priority.gradient.split(' ')[3]} 100%)`,
                        }}>
                        <FloatingParticles />

                        {/* Animated overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-black/10 animate-gradient" />

                        <div className="relative p-5 sm:p-6 md:p-8 lg:p-10">
                            {/* Mobile Header */}
                            <div className="mb-4 flex items-center justify-between lg:hidden">
                                <Link
                                    href={route('tasks.index')}
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
                                >
                                    <ArrowLeft className="h-5 w-5 text-white" />
                                </Link>
                                <button
                                    onClick={() => setShowShareMenu(!showShareMenu)}
                                    className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
                                >
                                    <MoreHorizontal className="h-5 w-5 text-white" />
                                </button>
                            </div>

                            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                                <div className="space-y-3 sm:space-y-4">
                                    <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 backdrop-blur-sm">
                                        <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                                        <span className="text-xs font-semibold uppercase tracking-wider text-white">
                                            {__('Tâche professionnelle')}
                                        </span>
                                    </div>

                                    <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">
                                        {task.title}
                                    </h1>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${priority.badgeClass}`}>
                                            <PriorityIcon className="h-3.5 w-3.5" />
                                            {priority.label}
                                        </div>
                                        {relativeTime && (
                                            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                                                <Clock className="h-3.5 w-3.5" />
                                                Créée {relativeTime}
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-sm leading-relaxed text-white/90 sm:text-base lg:text-lg">
                                        {task.description || __('Aucune description renseignée pour cette tâche.')}
                                    </p>
                                </div>

                                {/* Desktop Actions */}
                                <div className="hidden items-center gap-3 lg:flex">
                                    <Link
                                        href={route('tasks.index')}
                                        className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        {__('Retour')}
                                    </Link>
                                    {task.message?.view_url && (
                                        <Link
                                            href={task.message.view_url}
                                            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-cyan-50 dark:bg-slate-900 dark:text-white dark:hover:bg-cyan-500/20"
                                        >
                                            <Mail className="h-4 w-4" />
                                            {__('Message associé')}
                                        </Link>
                                    )}
                                    <button
                                        onClick={handleShare}
                                        className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
                                    >
                                        <Share2 className="h-4 w-4" />
                                        {__('Partager')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Mobile Share Menu */}
                    {showShareMenu && (
                        <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up lg:hidden">
                            <div className="rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900">
                                <div className="p-4">
                                    <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
                                    <button
                                        onClick={handleShare}
                                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                        <Share2 className="h-5 w-5" />
                                        <span className="text-sm font-medium">Partager la tâche</span>
                                    </button>
                                    {task.message?.view_url && (
                                        <Link
                                            href={task.message.view_url}
                                            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                        >
                                            <Mail className="h-5 w-5" />
                                            <span className="text-sm font-medium">Voir le message associé</span>
                                        </Link>
                                    )}
                                    <button
                                        onClick={() => setShowShareMenu(false)}
                                        className="mt-2 flex w-full items-center justify-center rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Content Grid */}
                    <div className="grid gap-6 lg:gap-8 lg:grid-cols-3">
                        {/* Left Column - Main Info */}
                        <div className="space-y-6 lg:col-span-2">
                            {/* Status Card */}
                            <div className={`group relative overflow-hidden rounded-xl bg-white p-5 shadow-lg transition-all hover:shadow-xl dark:bg-slate-900 sm:rounded-2xl sm:p-6 ${
                                isCompleted ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-amber-500'
                            }`}>
                                <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-slate-800" />

                                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className={`absolute inset-0 rounded-full blur-xl ${
                                                isCompleted ? 'bg-emerald-500/30' : 'bg-amber-500/30'
                                            }`} />
                                            {isCompleted ? (
                                                <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                                                    <CheckCircle2 className="h-7 w-7 text-white" />
                                                </div>
                                            ) : (
                                                <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                                                    <Circle className="h-7 w-7 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-slate-900 dark:text-white">
                                                {isCompleted ? __('✅ Tâche terminée') : __('⏳ Tâche en attente')}
                                            </p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {isCompleted
                                                    ? __('Félicitations ! Cette tâche est complétée.')
                                                    : __('Cette tâche attend encore votre action.')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Progress Indicator */}
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                                {progressPercentage}%
                                            </p>
                                            <p className="text-xs text-slate-500">Progression</p>
                                        </div>
                                        <div className="h-12 w-12">
                                            <ProgressCircle percentage={progressPercentage} color={priority.progressColor} />
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                    <div
                                        className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ${priority.progressColor}`}
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <InfoCard
                                    icon={<Calendar className="h-5 w-5" />}
                                    label={__('Date limite')}
                                    value={dueDateLabel ?? __('Aucune date limite')}
                                    gradient="from-purple-500 to-indigo-600"
                                    isHighlight={!!dueDateLabel}
                                />
                                <InfoCard
                                    icon={<Bell className="h-5 w-5" />}
                                    label={__('Rappel')}
                                    value={reminderLabel ?? __('Aucun rappel')}
                                    gradient="from-amber-500 to-orange-600"
                                    isHighlight={!!reminderLabel}
                                />
                                <InfoCard
                                    icon={<Flag className="h-5 w-5" />}
                                    label={__('Priorité')}
                                    value={priority.label}
                                    gradient={priority.gradient}
                                    isHighlight={true}
                                />
                                <InfoCard
                                    icon={<CalendarDays className="h-5 w-5" />}
                                    label={__('Création')}
                                    value={createdAtLabel ?? __('Date inconnue')}
                                    gradient="from-slate-500 to-slate-600"
                                    isHighlight={false}
                                />
                            </div>

                            {/* Associated Message */}
                            {task.message && (
                                <div className="rounded-xl bg-gradient-to-br from-cyan-50 to-sky-50 p-5 shadow-md dark:from-cyan-500/10 dark:to-sky-500/10 sm:rounded-2xl sm:p-6">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 shadow-md">
                                                <MessageSquare className="h-5 w-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {__('Message associé')}
                                                </p>
                                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                                    {task.message.sujet || __('Message sans sujet')}
                                                </p>
                                            </div>
                                        </div>
                                        {task.message.view_url && (
                                            <Link
                                                href={task.message.view_url}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-cyan-700 shadow-sm transition hover:bg-cyan-50 dark:bg-slate-900 dark:text-cyan-300 dark:hover:bg-cyan-500/20"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                                {__('Consulter le message')}
                                                <ChevronRight className="h-4 w-4" />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column - Actions & Insights */}
                        <div className="space-y-6">
                            {/* Action Card */}
                            <div className="rounded-xl bg-white p-5 shadow-lg dark:bg-slate-900 sm:rounded-2xl sm:p-6">
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
                                        <Award className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
                                            {__('Actions')}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {__('Mettez à jour le statut')}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        type="button"
                                        onClick={toggleStatus}
                                        disabled={isUpdating || !task.toggle_url}
                                        className={`group relative w-full overflow-hidden rounded-xl px-5 py-3.5 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                                            isCompleted
                                                ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-lg hover:scale-[1.02]'
                                                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg hover:scale-[1.02]'
                                        }`}
                                    >
                                        <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-500 group-hover:translate-x-[100%]" />
                                        <div className="relative flex items-center justify-center gap-2">
                                            {isUpdating ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    {__('Mise à jour...')}
                                                </>
                                            ) : (
                                                <>
                                                    {isCompleted ? (
                                                        <>
                                                            <Circle className="h-4 w-4" />
                                                            {__('Réouvrir la tâche')}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle2 className="h-4 w-4" />
                                                            {__('Marquer comme terminée')}
                                                            <Sparkles className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </button>

                                    {isCompleted && (
                                        <div className="rounded-xl bg-emerald-50 p-3 text-center dark:bg-emerald-500/10">
                                            <p className="text-xs text-emerald-700 dark:text-emerald-300">
                                                🎉 Bravo ! Cette tâche est complétée.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Insights Card */}
                            <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-5 shadow-lg dark:from-slate-800/50 dark:to-slate-900/50 sm:rounded-2xl sm:p-6">
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-md">
                                        <Brain className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
                                            {__('Conseil productivité')}
                                        </h3>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        {!isCompleted && dueDateLabel ? (
                                            <>
                                                📅 Cette tâche a une échéance fixée au {dueDateLabel}.
                                                Priorisez-la dans votre planning quotidien pour éviter le stress de dernière minute.
                                            </>
                                        ) : !isCompleted && !dueDateLabel ? (
                                            <>
                                                💡 Ajouter une date limite à vos tâches augmente de 40%
                                                les chances de les réaliser à temps. Modifiez cette tâche pour définir une échéance.
                                            </>
                                        ) : (
                                            <>
                                                🎯 Félicitations pour avoir complété cette tâche !
                                                Prenez un moment pour célébrer cette victoire avant d'attaquer la suivante.
                                            </>
                                        )}
                                    </p>

                                    <div className="flex items-center gap-2 rounded-lg bg-white/50 p-3 dark:bg-slate-800/50">
                                        <ThumbsUp className="h-4 w-4 text-emerald-500" />
                                        <p className="text-xs text-slate-600 dark:text-slate-400">
                                            {__('Les tâches découpées en sous-éléments sont 2x plus rapides à réaliser')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl bg-white p-3 text-center shadow-md dark:bg-slate-900">
                                    <Trophy className="mx-auto h-6 w-6 text-amber-500" />
                                    <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                                        {isCompleted ? '100%' : '0%'}
                                    </p>
                                    <p className="text-xs text-slate-500">Taux d'achèvement</p>
                                </div>
                                <div className="rounded-xl bg-white p-3 text-center shadow-md dark:bg-slate-900">
                                    <Clock className="mx-auto h-6 w-6 text-cyan-500" />
                                    <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                                        {dueDateLabel ? 'À venir' : 'Non définie'}
                                    </p>
                                    <p className="text-xs text-slate-500">Échéance</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function InfoCard({
    icon,
    label,
    value,
    gradient,
    isHighlight = false,
}: {
    icon: ReactNode;
    label: string;
    value: string;
    gradient: string;
    isHighlight?: boolean;
}) {
    return (
        <div className={`group rounded-xl bg-white p-4 shadow-md transition-all hover:shadow-lg dark:bg-slate-900 sm:rounded-2xl sm:p-5 ${
            isHighlight ? 'border-l-2 border-l-cyan-500' : ''
        }`}>
            <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-md transition-transform group-hover:scale-110`}>
                    <div className="text-white">
                        {icon}
                    </div>
                </div>
                <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {label}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white break-words">
                        {value}
                    </p>
                </div>
            </div>
        </div>
    );
}
