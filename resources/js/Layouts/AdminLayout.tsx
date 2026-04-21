import { useRealtimePresence } from '@/Hooks/useRealtimePresence';
import { PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    BarChart3,
    Bell,
    Building2,
    CalendarDays,
    FileText,
    Flag,
    LifeBuoy,
    LayoutDashboard,
    LogOut,
    MessageSquare,
    Moon,
    Search,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Sun,
    Users,
} from 'lucide-react';
import { PropsWithChildren, ReactNode, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';

type AdminLayoutProps = PropsWithChildren<{
    title: string;
    description?: string;
    actions?: ReactNode;
}>;

type AdminNavItem = {
    label: string;
    routeName: string;
    href: string;
    icon: JSX.Element;
};

type NotificationItem = {
    id: string;
    type: string;
    title: string;
    body: string;
    href: string;
    created_at: string | null;
    unread: boolean;
};

function getInitials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
}

function formatNotificationDate(value: string | null) {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) {
        return "A l'instant";
    }

    if (diffMinutes < 60) {
        return `Il y a ${diffMinutes} min`;
    }

    if (diffHours < 24) {
        return `Il y a ${diffHours} h`;
    }

    if (diffDays < 7) {
        return `Il y a ${diffDays} j`;
    }

    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
    });
}

function notificationIcon(type: string) {
    switch (type) {
        case 'message':
        case 'reply':
            return <MessageSquare className="h-4 w-4 text-cyan-500" />;
        case 'event':
        case 'event_invitation':
        case 'event_rsvp':
            return <CalendarDays className="h-4 w-4 text-emerald-500" />;
        case 'alert':
            return <ShieldAlert className="h-4 w-4 text-rose-500" />;
        default:
            return <Bell className="h-4 w-4 text-amber-500" />;
    }
}

function AdminNavLink({ item }: { item: AdminNavItem }) {
    const active = route().current(item.routeName);

    return (
        <Link
            href={item.href}
            className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                active
                    ? 'bg-cyan-50 text-cyan-700 shadow-sm dark:bg-cyan-500/15 dark:text-cyan-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
        >
            <span
                className={`${
                    active ? 'text-cyan-600 dark:text-cyan-300' : 'text-slate-400 group-hover:text-cyan-500'
                }`}
            >
                {item.icon}
            </span>
            <span>{item.label}</span>
        </Link>
    );
}

function AdminNotificationBell({ userId }: { userId: number }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const fetchNotifications = async () => {
        try {
            const response = await window.axios.get(route('notifications.index'));
            setNotifications(response.data.notifications ?? []);
            setUnreadCount(response.data.unread_count ?? 0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchNotifications();

        const intervalId = window.setInterval(() => {
            void fetchNotifications();
        }, 15000);

        if (window.Echo) {
            window.Echo.private(`user.${userId}`).listen('.NotificationCreated', () => {
                void fetchNotifications();
            });
        }

        return () => {
            window.clearInterval(intervalId);
            window.Echo?.leave?.(`user.${userId}`);
            window.Echo?.leaveChannel?.(`private-user.${userId}`);
        };
    }, [userId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (!isOpen || unreadCount === 0) {
            return;
        }

        const markAsRead = async () => {
            await window.axios.post(route('notifications.read'));
            await fetchNotifications();
        };

        void markAsRead();
    }, [isOpen, unreadCount]);

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/90 text-slate-600 shadow-sm transition hover:border-cyan-300 hover:text-cyan-600 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-300 dark:hover:border-cyan-500/40 dark:hover:text-cyan-300"
                aria-label="Notifications admin"
            >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 ? (
                    <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                ) : null}
            </button>

            {isOpen ? (
                <div className="absolute right-0 z-40 mt-3 w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                    <div className="border-b border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-white px-5 py-4 dark:border-slate-800 dark:from-cyan-500/10 dark:via-slate-900 dark:to-slate-900">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600">Centre admin</p>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
                            </div>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {unreadCount > 0 ? `${unreadCount} non lues` : 'A jour'}
                            </span>
                        </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                Chargement...
                            </div>
                        ) : notifications.length > 0 ? (
                            notifications.map((notification) => (
                                <Link
                                    key={notification.id}
                                    href={notification.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-start gap-3 border-b border-slate-100 px-5 py-4 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60 ${
                                        notification.unread ? 'bg-cyan-50/60 dark:bg-cyan-500/5' : ''
                                    }`}
                                >
                                    <div className="mt-0.5">{notificationIcon(notification.type)}</div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                                {notification.title}
                                            </p>
                                            {notification.unread ? (
                                                <span className="h-2 w-2 rounded-full bg-cyan-500" />
                                            ) : null}
                                        </div>
                                        <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                                            {notification.body}
                                        </p>
                                        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                                            {formatNotificationDate(notification.created_at)}
                                        </p>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                Aucune notification recente.
                            </div>
                        )}
                    </div>

                    <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
                        <Link
                            href={route('notifications.index')}
                            onClick={() => setIsOpen(false)}
                            className="block rounded-2xl px-3 py-2 text-center text-sm font-semibold text-cyan-700 transition hover:bg-white dark:text-cyan-300 dark:hover:bg-slate-800"
                        >
                            Voir toutes les notifications
                        </Link>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export default function AdminLayout({ title, description, actions, children }: AdminLayoutProps) {
    useRealtimePresence();

    const { auth } = usePage<PageProps>().props;
    const [darkMode, setDarkMode] = useState(false);
    const [quickSearch, setQuickSearch] = useState('');

    const navigation: AdminNavItem[] = [
        {
            label: 'Dashboard',
            routeName: 'admin.dashboard',
            href: route('admin.dashboard'),
            icon: <LayoutDashboard className="h-4.5 w-4.5" />,
        },
        {
            label: 'Utilisateurs',
            routeName: 'admin.users.index',
            href: route('admin.users.index'),
            icon: <Users className="h-4.5 w-4.5" />,
        },
        {
            label: 'Roles',
            routeName: 'roles.index',
            href: route('roles.index'),
            icon: <ShieldCheck className="h-4.5 w-4.5" />,
        },
        {
            label: 'Departements',
            routeName: 'departments.index',
            href: route('departments.index'),
            icon: <Building2 className="h-4.5 w-4.5" />,
        },
        {
            label: 'Support',
            routeName: 'admin.support.index',
            href: route('admin.support.index'),
            icon: <LifeBuoy className="h-4.5 w-4.5" />,
        },
        {
            label: 'Feedback',
            routeName: 'admin.feedback.index',
            href: route('admin.feedback.index'),
            icon: <BarChart3 className="h-4.5 w-4.5" />,
        },
        {
            label: 'Signalements',
            routeName: 'admin.reports.index',
            href: route('admin.reports.index'),
            icon: <Flag className="h-4.5 w-4.5" />,
        },
        {
            label: 'Audit',
            routeName: 'admin.audit.messages',
            href: route('admin.audit.messages'),
            icon: <ShieldCheck className="h-4.5 w-4.5" />,
        },
        {
            label: 'Publications',
            routeName: 'admin.publications.index',
            href: route('admin.publications.index'),
            icon: <FileText className="h-4.5 w-4.5" />,
        },
    ];

    const userInitials = useMemo(() => getInitials(auth.user.name), [auth.user.name]);

    useEffect(() => {
        const storedTheme = window.localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldUseDark = storedTheme ? storedTheme === 'dark' : prefersDark;

        setDarkMode(shouldUseDark);
        document.documentElement.classList.toggle('dark', shouldUseDark);
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
        window.localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    const handleQuickSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            route('admin.users.index'),
            { search: quickSearch },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.12),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.10),_transparent_24%)] bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <Head title={title} />

            <div className="mx-auto flex min-h-screen w-full max-w-[1680px]">
                <aside className="hidden w-72 shrink-0 border-r border-slate-200/70 bg-white/85 px-4 py-5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85 lg:flex lg:flex-col">
                    <div className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-white to-cyan-50 px-4 py-4 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-900">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600">Admin Panel</p>
                        <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">Cmail 2027</h2>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Administration hospitaliere</p>
                    </div>

                    <nav className="mt-5 space-y-1">
                        {navigation.map((item) => (
                            <AdminNavLink key={item.routeName} item={item} />
                        ))}
                    </nav>

                    <div className="mt-5 rounded-[1.75rem] border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-sky-50 p-4 dark:border-cyan-500/20 dark:from-cyan-500/10 dark:via-slate-900 dark:to-slate-900">
                        <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300">
                            <Sparkles className="h-4 w-4" />
                            <p className="text-sm font-semibold">Pilotage rapide</p>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
                            Utilisez la barre du haut pour rechercher un utilisateur, suivre les alertes et changer le theme.
                        </p>
                    </div>

                    <div className="mt-auto space-y-3 pt-5">
                        <div className="rounded-[1.75rem] border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Connecte en tant que</p>
                            <div className="mt-3 flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 text-sm font-bold text-white">
                                    {userInitials}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{auth.user.name}</p>
                                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{auth.user.email}</p>
                                </div>
                            </div>
                        </div>
                        <Link
                            href={route('dashboard')}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Retour a l'application
                        </Link>
                    </div>
                </aside>

                <div className="flex min-w-0 flex-1 flex-col">
                    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 px-4 py-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80 sm:px-6">
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600">Administration</p>
                                    <h1 className="truncate text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
                                    {description ? (
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
                                    ) : null}
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <form onSubmit={handleQuickSearch} className="min-w-[18rem] max-w-full flex-1 xl:w-[22rem]">
                                        <label className="relative block">
                                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                value={quickSearch}
                                                onChange={(event) => setQuickSearch(event.target.value)}
                                                placeholder="Recherche admin rapide..."
                                                className="w-full rounded-2xl border border-slate-200 bg-white/90 py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100 dark:focus:ring-cyan-500/10"
                                            />
                                        </label>
                                    </form>

                                    <AdminNotificationBell userId={auth.user.id} />

                                    <button
                                        type="button"
                                        onClick={() => setDarkMode((current) => !current)}
                                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/90 text-slate-600 shadow-sm transition hover:border-cyan-300 hover:text-cyan-600 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-300 dark:hover:border-cyan-500/40 dark:hover:text-cyan-300"
                                        aria-label="Changer le theme"
                                    >
                                        {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
                                    </button>

                                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 text-sm font-bold text-white">
                                            {userInitials}
                                        </div>
                                        <div className="hidden sm:block">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{auth.user.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Supervision admin</p>
                                        </div>
                                        <Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-rose-400"
                                        >
                                            <LogOut className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Link
                                    href={route('admin.support.index')}
                                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-cyan-500 dark:hover:text-cyan-300"
                                >
                                    Support
                                </Link>
                                <Link
                                    href={route('admin.feedback.index')}
                                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-cyan-500 dark:hover:text-cyan-300"
                                >
                                    Feedback
                                </Link>
                                <Link
                                    href={route('admin.reports.index')}
                                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-cyan-500 dark:hover:text-cyan-300"
                                >
                                    Signalements
                                </Link>
                                <div className="flex-1" />
                                {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
                </div>
            </div>
        </div>
    );
}
