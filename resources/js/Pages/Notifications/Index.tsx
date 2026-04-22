import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Bell, ChevronRight, Inbox, MessageSquare, CalendarDays, Shield, ArrowLeft } from 'lucide-react';

type NotificationItem = {
    id: string;
    type: 'message' | 'reply' | 'event' | 'system';
    title: string;
    body: string;
    meta: string;
    href: string;
    created_at: string | null;
    unread: boolean;
};

type NotificationsPageProps = {
    notifications: NotificationItem[];
    unread_count: number;
    unread_messages_count: number;
};

function formatDate(value: string | null) {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function notificationMeta(type: NotificationItem['type']) {
    switch (type) {
        case 'message':
            return {
                icon: MessageSquare,
                tone: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300',
            };
        case 'event':
            return {
                icon: CalendarDays,
                tone: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
            };
        case 'reply':
            return {
                icon: Inbox,
                tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
            };
        default:
            return {
                icon: Shield,
                tone: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
            };
    }
}

export default function NotificationsIndex({
    notifications,
    unread_count,
    unread_messages_count,
}: NotificationsPageProps) {
    return (
        <AuthenticatedLayout
            title="Notifications"
            description="Consultez toutes les alertes, messages et rappels recents."
        >
            <Head title="Notifications" />

            <div className="space-y-8 pb-8">
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 p-6 shadow-xl shadow-cyan-500/10 md:p-8">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.14),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(34,211,238,0.18),_transparent_34%)]" />

                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100 backdrop-blur-sm">
                                <Bell className="h-3.5 w-3.5" />
                                Centre de notifications
                            </div>
                            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
                                Toutes vos notifications
                            </h1>
                            <p className="mt-3 text-base leading-relaxed text-cyan-50/90">
                                Retrouvez les messages, evenements et alertes systeme au meme endroit.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl bg-white/10 px-4 py-3 text-white backdrop-blur-sm">
                                <p className="text-xs uppercase tracking-[0.18em] text-cyan-100">Total</p>
                                <p className="mt-1 text-2xl font-bold">{notifications.length}</p>
                            </div>
                            <div className="rounded-2xl bg-white/10 px-4 py-3 text-white backdrop-blur-sm">
                                <p className="text-xs uppercase tracking-[0.18em] text-cyan-100">Non lues</p>
                                <p className="mt-1 text-2xl font-bold">{unread_count}</p>
                            </div>
                            <div className="rounded-2xl bg-white/10 px-4 py-3 text-white backdrop-blur-sm">
                                <p className="text-xs uppercase tracking-[0.18em] text-cyan-100">Messages</p>
                                <p className="mt-1 text-2xl font-bold">{unread_messages_count}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        href={route('dashboard')}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-500 dark:hover:text-cyan-300"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Retour au dashboard
                    </Link>
                    <Link
                        href={route('messages.inbox')}
                        className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:bg-cyan-500/20"
                    >
                        <Inbox className="h-4 w-4" />
                        Ouvrir la boite de reception
                    </Link>
                </div>

                <section className="overflow-hidden rounded-[2rem] border border-cyan-100/80 bg-white/90 backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/85">
                    <div className="border-b border-cyan-100/80 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.14),_transparent_42%),linear-gradient(135deg,_rgba(240,249,255,0.96),_rgba(255,255,255,0.92))] px-6 py-6 dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_42%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(2,6,23,0.92))]">
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                            Historique recent
                        </h2>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            Cliquez sur une ligne pour ouvrir la notification associee.
                        </p>
                    </div>

                    <div className="p-6">
                        {notifications.length > 0 ? (
                            <div className="space-y-3">
                                {notifications.map((notification) => {
                                    const meta = notificationMeta(notification.type);
                                    const Icon = meta.icon;

                                    return (
                                        <Link
                                            key={notification.id}
                                            href={notification.href}
                                            className={`group flex items-start gap-4 rounded-3xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                                                notification.unread
                                                    ? 'border-cyan-200 bg-cyan-50/60 dark:border-cyan-500/20 dark:bg-cyan-500/10'
                                                    : 'border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-950/50'
                                            }`}
                                        >
                                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${meta.tone}`}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                        {notification.title}
                                                    </p>
                                                    {notification.unread ? (
                                                        <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-[11px] font-semibold text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300">
                                                            Non lue
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                                                    {notification.body || 'Notification sans contenu.'}
                                                </p>
                                                {notification.meta ? (
                                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                        {notification.meta}
                                                    </p>
                                                ) : null}
                                                {notification.created_at ? (
                                                    <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                                                        {formatDate(notification.created_at)}
                                                    </p>
                                                ) : null}
                                            </div>
                                            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-300" />
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="rounded-3xl border border-dashed border-cyan-200 bg-cyan-50/50 px-6 py-12 text-center dark:border-cyan-500/20 dark:bg-cyan-500/5">
                                <Bell className="mx-auto h-10 w-10 text-cyan-600 dark:text-cyan-300" />
                                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                                    Aucune notification disponible
                                </h3>
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                    Les nouvelles alertes apparaitront ici des qu elles seront recues.
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
