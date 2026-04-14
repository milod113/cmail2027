import Dropdown from '@/Components/Dropdown';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { useTranslation } from '@/Hooks/useTranslation';
import { Link, usePage } from '@inertiajs/react';
import { Moon, Sun, Bell, Search, Menu, X, ChevronRight, LogOut, User, Settings, HelpCircle, PenSquare } from 'lucide-react';
import { PropsWithChildren, ReactNode, useEffect, useMemo, useRef, useState } from 'react';

type LayoutProps = PropsWithChildren<{
    title: string;
    description?: string;
    actions?: ReactNode;
}>;

type NavItem = {
    label: string;
    routeName: string;
    href: string;
    icon: JSX.Element;
    badge?: number;
};

type NotificationItem = {
    id: string;
    type: 'message' | 'reply';
    title: string;
    body: string;
    meta: string;
    href: string;
    created_at: string | null;
    unread: boolean;
};

function SidebarLink({
    item,
    mobile = false,
    onNavigate,
}: {
    item: NavItem;
    mobile?: boolean;
    onNavigate?: () => void;
}) {
    const isActive = route().current(item.routeName);

    return (
        <Link
            href={item.href}
            onClick={onNavigate}
            className={`
                group relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium
                transition-all duration-200 ease-out
                ${isActive
                    ? 'bg-gradient-to-r from-cyan-500/10 to-sky-500/10 text-cyan-700 dark:text-cyan-300 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white'
                }
                ${mobile ? 'w-full' : ''}
            `}
        >
            <span className={`
                transition-all duration-200
                ${isActive
                    ? 'text-cyan-600 dark:text-cyan-400'
                    : 'text-slate-400 group-hover:text-cyan-500 dark:text-slate-500'
                }
            `}>
                {item.icon}
            </span>
            <span className="flex-1">{item.label}</span>
            {item.badge && (
                <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white shadow-sm">
                    {item.badge}
                </span>
            )}
            {isActive && !mobile && (
                <ChevronRight className="absolute right-3 h-4 w-4 text-cyan-500" />
            )}
        </Link>
    );
}

function NotificationBell({
    __,
    locale,
    userId,
    onUnreadMessagesChange,
}: {
    __: (key: string) => string;
    locale: string;
    userId: number;
    onUnreadMessagesChange: (count: number) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [toasts, setToasts] = useState<NotificationItem[]>([]);
    const initializedRef = useRef(false);
    const knownUnreadIdsRef = useRef<string[]>([]);

    const formatDate = (value: string | null) => {
        if (!value) {
            return '';
        }

        return new Date(value).toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-FR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const fetchNotifications = async () => {
        try {
            const response = await window.axios.get(route('notifications.index'));
            const nextNotifications = response.data.notifications ?? [];
            const nextUnreadCount = response.data.unread_count ?? 0;
            const nextUnreadMessagesCount = response.data.unread_messages_count ?? 0;
            const nextUnreadIds = nextNotifications
                .filter((notification: NotificationItem) => notification.unread)
                .map((notification: NotificationItem) => notification.id);

            setNotifications(nextNotifications);
            setUnreadCount(nextUnreadCount);
            onUnreadMessagesChange(nextUnreadMessagesCount);

            if (initializedRef.current) {
                const incoming = nextNotifications.filter(
                    (notification: NotificationItem) =>
                        notification.unread && !knownUnreadIdsRef.current.includes(notification.id),
                );

                if (incoming.length > 0) {
                    playNotificationSound();
                    setToasts((current) => [...incoming.slice(-3), ...current].slice(0, 4));
                }
            } else {
                initializedRef.current = true;
            }

            knownUnreadIdsRef.current = nextUnreadIds;
        } finally {
            setLoading(false);
        }
    };

    const playNotificationSound = () => {
        const audioContext = new window.AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(660, audioContext.currentTime + 0.18);
        gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.22);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.24);

        window.setTimeout(() => {
            void audioContext.close();
        }, 300);
    };

    useEffect(() => {
        void fetchNotifications();

        const intervalId = window.setInterval(() => {
            void fetchNotifications();
        }, 10000);

        if (window.Echo) {
            const channelName = `user.${userId}`;
            window.Echo.private(channelName).listen('.NotificationCreated', () => {
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
        if (!isOpen || unreadCount === 0) {
            return;
        }

        const markRead = async () => {
            await window.axios.post(route('notifications.read'));
            await fetchNotifications();
        };

        void markRead();
    }, [isOpen, unreadCount]);

    useEffect(() => {
        if (toasts.length === 0) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setToasts((current) => current.slice(0, -1));
        }, 4500);

        return () => window.clearTimeout(timeoutId);
    }, [toasts]);

    return (
        <>
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-600 transition-all hover:border-cyan-200 hover:bg-white hover:text-cyan-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-cyan-500/30 dark:hover:bg-slate-900"
                >
                    <Bell className="h-4.5 w-4.5" />
                    {unreadCount > 0 && (
                        <>
                            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-950"></span>
                            <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        </>
                    )}
                </button>
                
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-2xl border border-slate-200 bg-white shadow-2xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 z-50">
                            <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="font-semibold text-slate-900 dark:text-white">{__('Notifications')}</h3>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        {unreadCount > 0 ? `${unreadCount} ${__('non lues')}` : __('A jour')}
                                    </span>
                                </div>
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {loading ? (
                                    <div className="px-4 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                                        {__('Chargement...')}
                                    </div>
                                ) : notifications.length > 0 ? (
                                    notifications.map((notification) => (
                                        <Link
                                            key={notification.id}
                                            href={notification.href}
                                            onClick={() => setIsOpen(false)}
                                            className={`block border-b border-slate-100 px-4 py-3 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50 ${
                                                notification.unread ? 'bg-cyan-50/60 dark:bg-cyan-500/10' : ''
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                            {__(notification.title)}
                                                        </span>
                                                        {notification.unread && (
                                                            <span className="h-2 w-2 rounded-full bg-cyan-500"></span>
                                                        )}
                                                    </div>
                                                    <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">
                                                        {notification.body}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                        {notification.meta}
                                                    </p>
                                                </div>
                                                <span className="whitespace-nowrap text-[11px] text-slate-400 dark:text-slate-500">
                                                    {formatDate(notification.created_at)}
                                                </span>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                                        {__('Aucune nouvelle notification')}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="fixed right-4 top-20 z-[60] space-y-3">
                {toasts.map((toast) => (
                    <Link
                        key={toast.id}
                        href={toast.href}
                        className="block w-80 rounded-2xl border border-cyan-200 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur dark:border-cyan-800 dark:bg-slate-900/95"
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-cyan-500"></div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{__(toast.title)}</p>
                                <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">{toast.body}</p>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{toast.meta}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </>
    );
}

export default function AuthenticatedLayout({
    title,
    description,
    actions,
    children,
}: LayoutProps) {
    const { auth, current_locale } = usePage().props as {
        auth: { user: { id: number; name: string; email: string } };
        current_locale: string;
    };
    const { __, isRtl } = useTranslation();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [unreadInboxCount, setUnreadInboxCount] = useState(0);

    useEffect(() => {
        const storedTheme = window.localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldUseDark = storedTheme ? storedTheme === 'dark' : prefersDark;

        document.documentElement.classList.toggle('dark', shouldUseDark);
        setDarkMode(shouldUseDark);
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
        window.localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navigation = useMemo<NavItem[]>(
        () => [
            {
                label: __('Boîte de réception'),
                routeName: 'messages.inbox',
                href: route('messages.inbox'),
                badge: unreadInboxCount > 0 ? unreadInboxCount : undefined,
                icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7.5h18v9a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 16.5v-9Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m3 7.5 8.47 6.352a.9.9 0 001.06 0L21 7.5" />
                    </svg>
                ),
            },
            {
                label: __('Messages envoyés'),
                routeName: 'messages.sent',
                href: route('messages.sent'),
                icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 12 3.75 3.75 20.25 12 3.75 20.25 6 12Zm0 0h7.5" />
                    </svg>
                ),
            },
            {
                label: __('Brouillons'),
                routeName: 'drafts.index',
                href: route('drafts.index'),
                icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.971L8.25 19.04 4.5 19.5l.46-3.75L16.862 4.487Z" />
                    </svg>
                ),
            },
            {
                label: __('Rôles'),
                routeName: 'roles.index',
                href: route('roles.index'),
                icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12.75 11.25 15 15 9.75" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.75 12a8.25 8.25 0 1 0 16.5 0 8.25 8.25 0 0 0-16.5 0Z" />
                    </svg>
                ),
            },
            {
                label: __('Départements'),
                routeName: 'departments.index',
                href: route('departments.index'),
                icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.75 20.25h16.5" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5.25 20.25V6.75A2.25 2.25 0 0 1 7.5 4.5h9A2.25 2.25 0 0 1 18.75 6.75v13.5" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 8.25h6M9 12h6M9 15.75h3" />
                    </svg>
                ),
            },
            {
                label: __('Contacts'),
                routeName: 'contacts.index',
                href: route('contacts.index'),
                icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 19.5v-.75A3.75 3.75 0 0011.25 15h-3.5A3.75 3.75 0 004 18.75v.75" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.5 11.25a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8.25 8.25v-.75A3.75 3.75 0 0015 15.169" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.25 5.339a3 3 0 1 1 0 5.822" />
                    </svg>
                ),
            },
            {
                label: __('Archives'),
                routeName: 'messages.archive',
                href: route('messages.archive'),
                icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20.25 7.5v10.125A2.625 2.625 0 0 1 17.625 20.25H6.375A2.625 2.625 0 0 1 3.75 17.625V7.5" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 5.25H3m5.25 5.25h7.5" />
                    </svg>
                ),
            },
        ],
        [__, unreadInboxCount],
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-cyan-950/20">
            <div className="flex min-h-screen">
                {/* Desktop Sidebar */}
                <aside className="fixed left-0 top-0 z-30 hidden h-full w-72 shrink-0 border-r border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-950/80 lg:flex lg:flex-col transition-all duration-300">
                    <div className="flex flex-col h-full px-5 py-6">
                        {/* Logo Section */}
                        <Link href={route('messages.inbox')} className="group mb-8 rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90">
                            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                {__('Centre hospitalier')}
                            </div>
                            <div className="mt-3">
                                <img
                                    src="/images/cmail.png"
                                    alt="Cmail 2027"
                                    className="h-12 w-auto object-contain"
                                />
                            </div>
                            <div className="mt-2 bg-gradient-to-r from-cyan-600 to-sky-600 bg-clip-text text-2xl font-bold text-transparent dark:from-cyan-400 dark:to-sky-400">
                                cmail2027
                            </div>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                {__('Plateforme de communication interne')}
                            </p>
                        </Link>

                        <Link
                            href={route('messages.create')}
                            className="mb-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-cyan-500/30"
                        >
                            <PenSquare className="h-4 w-4" />
                            {__('Nouveau message')}
                        </Link>

                        {/* Navigation */}
                        <nav className="flex-1 space-y-1 overflow-y-auto">
                            {navigation.map((item) => (
                                <SidebarLink key={item.routeName} item={item} />
                            ))}
                        </nav>

                        {/* User Profile Section */}
                        <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                            <div className="rounded-xl bg-gradient-to-br from-slate-50 to-cyan-50/40 p-4 dark:from-slate-900/50 dark:to-cyan-900/20">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 text-sm font-bold text-white shadow-md">
                                        {auth.user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-slate-900 dark:text-white truncate">
                                            {auth.user.name}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                            {auth.user.email}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex flex-1 flex-col lg:ml-72">
                    {/* Header */}
                    <header className={`
                        sticky top-0 z-20 transition-all duration-300
                        ${scrolled 
                            ? 'border-b border-slate-200/70 bg-white/85 backdrop-blur-xl shadow-sm dark:border-slate-800/50 dark:bg-slate-950/85' 
                            : 'border-b border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-800/30 dark:bg-slate-950/70'
                        }
                    `}>
                        <div className="px-4 py-3 sm:px-6 lg:px-8">
                            <div className="flex items-center justify-between gap-4">
                                {/* Left Section */}
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setMobileOpen(true)}
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 lg:hidden"
                                    >
                                        <Menu className="h-5 w-5" />
                                    </button>

                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                                            {__('Messagerie centrale')}
                                        </p>
                                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                                            {title}
                                        </h1>
                                        {description && (
                                            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                                                {description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Right Section */}
                                <div className="flex items-center gap-2">
                                    <div className="hidden lg:block">
                                        <LanguageSwitcher />
                                    </div>

                                    <NotificationBell __={__} locale={current_locale} userId={auth.user.id} onUnreadMessagesChange={setUnreadInboxCount} />

                                    {actions}

                                    <button
                                        type="button"
                                        onClick={() => setDarkMode((value) => !value)}
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-600 transition-all hover:border-cyan-200 hover:bg-white hover:text-cyan-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-cyan-500/30 dark:hover:bg-slate-900"
                                        aria-label="Toggle theme"
                                    >
                                        {darkMode ? (
                                            <Sun className="h-4.5 w-4.5" />
                                        ) : (
                                            <Moon className="h-4.5 w-4.5" />
                                        )}
                                    </button>

                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-700 transition-all hover:border-cyan-200 hover:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200">
                                                <span className="hidden sm:inline">{auth.user.name.split(' ')[0]}</span>
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-sky-600 text-sm font-bold text-white shadow-md">
                                                    {auth.user.name.charAt(0).toUpperCase()}
                                                </div>
                                            </button>
                                        </Dropdown.Trigger>

                                        <Dropdown.Content align={isRtl ? 'left' : 'right'} width="48">
                                            <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{auth.user.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{auth.user.email}</p>
                                            </div>
                                            <Dropdown.Link href={route('profile.edit')}>
                                                {__('Mon profil')}
                                            </Dropdown.Link>
                                            <Dropdown.Link href="#">
                                                {__('Paramètres')}
                                            </Dropdown.Link>
                                            <Dropdown.Link href="#">
                                                {__('Aide')}
                                            </Dropdown.Link>
                                            <div className="border-t border-slate-100 dark:border-slate-800">
                                                <Dropdown.Link href={route('logout')} method="post" as="button">
                                                    {__('Déconnexion')}
                                                </Dropdown.Link>
                                            </div>
                                        </Dropdown.Content>
                                    </Dropdown>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Mobile Menu Overlay */}
                    {mobileOpen && (
                        <>
                            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
                            <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85%] overflow-y-auto bg-white shadow-2xl dark:bg-slate-950 lg:hidden animate-in slide-in-from-left">
                                <div className="flex flex-col h-full">
                                    <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
                                        <img src="/images/cmail.png" alt="Cmail" className="h-8 w-auto" />
                                        <button
                                            onClick={() => setMobileOpen(false)}
                                            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                    
                                    <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 text-lg font-bold text-white">
                                                {auth.user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-900 dark:text-white">{auth.user.name}</div>
                                                <div className="text-sm text-slate-500 dark:text-slate-400">{auth.user.email}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <nav className="flex-1 p-4 space-y-1">
                                        <Link
                                            href={route('messages.create')}
                                            onClick={() => setMobileOpen(false)}
                                            className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all"
                                        >
                                            <PenSquare className="h-4 w-4" />
                                            {__('Nouveau message')}
                                        </Link>

                                        {navigation.map((item) => (
                                            <SidebarLink
                                                key={item.routeName}
                                                item={item}
                                                mobile
                                                onNavigate={() => setMobileOpen(false)}
                                            />
                                        ))}
                                    </nav>

                                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                                        <LanguageSwitcher />
                                        <button
                                            onClick={() => {
                                                setDarkMode(!darkMode);
                                                setMobileOpen(false);
                                            }}
                                            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                        >
                                            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                                            {darkMode ? __('Mode clair') : __('Mode sombre')}
                                        </button>
                                        <Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                                        >
                                            <LogOut className="h-5 w-5" />
                                            {__('Déconnexion')}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Main Content Area */}
                    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-7xl">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
