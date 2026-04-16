import Dropdown from '@/Components/Dropdown';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { useTranslation } from '@/Hooks/useTranslation';
import { Link, usePage } from '@inertiajs/react';
import {
    Moon, Sun, Bell, Search, Menu, X, ChevronRight, LogOut, User,
    Settings, HelpCircle, PenSquare, Users, Inbox, Send, Archive,
    FileText, FolderTree, UsersRound, Star, Trash2, AlertCircle,
    Sparkles, CreditCard, Shield, Activity, Circle, CheckCircle2,
    Clock, Plus, Zap, MessageSquare, ChevronDown, LayoutDashboard
} from 'lucide-react';
import { PropsWithChildren, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
    isNew?: boolean;
    isPro?: boolean;
};

type NotificationItem = {
    id: string;
    type: 'message' | 'reply' | 'system' | 'alert';
    title: string;
    body: string;
    meta: string;
    href: string;
    created_at: string | null;
    unread: boolean;
};

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.2 }
};

const scaleOnHover = {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 }
};

function SidebarLink({
    item,
    mobile = false,
    onNavigate,
    isCollapsed = false,
}: {
    item: NavItem;
    mobile?: boolean;
    onNavigate?: () => void;
    isCollapsed?: boolean;
}) {
    const isActive = route().current(item.routeName);

    return (
        <motion.div
            whileHover="whileHover"
            whileTap="whileTap"
            variants={!mobile ? scaleOnHover : undefined}
        >
            <Link
                href={item.href}
                onClick={onNavigate}
                className={`
                    group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
                    transition-all duration-200 ease-out
                    ${isActive
                        ? 'bg-gradient-to-r from-cyan-500/15 to-sky-500/15 text-cyan-700 dark:text-cyan-300 shadow-sm border border-cyan-200/30 dark:border-cyan-500/20'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white'
                    }
                    ${mobile ? 'w-full' : ''}
                    ${isCollapsed ? 'justify-center px-2' : ''}
                `}
            >
                <span className={`
                    transition-all duration-200 relative
                    ${isActive
                        ? 'text-cyan-600 dark:text-cyan-400'
                        : 'text-slate-400 group-hover:text-cyan-500 dark:text-slate-500'
                    }
                    ${isCollapsed ? 'scale-110' : ''}
                `}>
                    {item.icon}
                    {item.isNew && !isCollapsed && (
                        <span className="absolute -right-2 -top-2 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                    )}
                </span>
                
                {!isCollapsed && (
                    <>
                        <span className="flex-1">{item.label}</span>
                        {item.badge && item.badge > 0 && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="ml-auto rounded-full bg-gradient-to-r from-red-500 to-orange-500 px-2 py-0.5 text-xs font-bold text-white shadow-md"
                            >
                                {item.badge > 99 ? '99+' : item.badge}
                            </motion.span>
                        )}
                        {item.isPro && (
                            <span className="ml-auto text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-transparent bg-clip-text">
                                PRO
                            </span>
                        )}
                        {isActive && (
                            <ChevronRight className="absolute right-3 h-3.5 w-3.5 text-cyan-500" />
                        )}
                    </>
                )}
            </Link>
        </motion.div>
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
        if (!value) return '';
        const date = new Date(value);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours} h`;
        if (diffDays < 7) return `Il y a ${diffDays} j`;
        
        return date.toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-FR', {
            day: 'numeric',
            month: 'short',
        });
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'message':
                return <MessageSquare className="h-4 w-4 text-blue-500" />;
            case 'reply':
                return <Reply className="h-4 w-4 text-emerald-500" />;
            case 'alert':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            default:
                return <Bell className="h-4 w-4 text-purple-500" />;
        }
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

        window.setTimeout(() => void audioContext.close(), 300);
    };

    useEffect(() => {
        void fetchNotifications();
        const intervalId = window.setInterval(() => void fetchNotifications(), 10000);

        if (window.Echo) {
            const channelName = `user.${userId}`;
            window.Echo.private(channelName).listen('.NotificationCreated', () => void fetchNotifications());
        }

        return () => {
            window.clearInterval(intervalId);
            window.Echo?.leave?.(`user.${userId}`);
            window.Echo?.leaveChannel?.(`private-user.${userId}`);
        };
    }, [userId]);

    useEffect(() => {
        if (!isOpen || unreadCount === 0) return;
        const markRead = async () => {
            await window.axios.post(route('notifications.read'));
            await fetchNotifications();
        };
        void markRead();
    }, [isOpen, unreadCount]);

    useEffect(() => {
        if (toasts.length === 0) return;
        const timeoutId = window.setTimeout(() => {
            setToasts((current) => current.slice(0, -1));
        }, 4500);
        return () => window.clearTimeout(timeoutId);
    }, [toasts]);

    return (
        <>
            <motion.div className="relative" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-600 transition-all hover:border-cyan-300 hover:bg-white hover:text-cyan-600 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-cyan-500/40 dark:hover:bg-slate-900"
                >
                    <Bell className="h-4.5 w-4.5" />
                    {unreadCount > 0 && (
                        <>
                            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-950"></span>
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-md"
                            >
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </motion.span>
                        </>
                    )}
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-40"
                                onClick={() => setIsOpen(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-1rem))] max-w-sm origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95"
                            >
                                <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800 bg-gradient-to-r from-cyan-50/50 to-transparent dark:from-cyan-950/30">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <Bell className="h-4 w-4 text-cyan-500" />
                                            <h3 className="font-semibold text-slate-900 dark:text-white">{__('Notifications')}</h3>
                                        </div>
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                                            {unreadCount > 0 ? `${unreadCount} ${__('non lues')}` : __('À jour')}
                                        </span>
                                    </div>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {loading ? (
                                        <div className="px-4 py-8 text-center">
                                            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
                                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{__('Chargement...')}</p>
                                        </div>
                                    ) : notifications.length > 0 ? (
                                        <AnimatePresence>
                                            {notifications.map((notification, idx) => (
                                                <motion.div
                                                    key={notification.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.03 }}
                                                >
                                                    <Link
                                                        href={notification.href}
                                                        onClick={() => setIsOpen(false)}
                                                        className={`block border-b border-slate-100 px-4 py-3 transition-all hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50 ${
                                                            notification.unread ? 'bg-gradient-to-r from-cyan-50/80 to-transparent dark:from-cyan-500/10' : ''
                                                        }`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className="mt-0.5 flex-shrink-0">
                                                                {getNotificationIcon(notification.type)}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                                        {__(notification.title)}
                                                                    </span>
                                                                    {notification.unread && (
                                                                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-500"></span>
                                                                    )}
                                                                </div>
                                                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                                                                    {notification.body}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-1.5">
                                                                    <Clock className="h-3 w-3 text-slate-400" />
                                                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                        {formatDate(notification.created_at)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="px-4 py-8 text-center"
                                        >
                                            <Bell className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {__('Aucune nouvelle notification')}
                                            </p>
                                        </motion.div>
                                    )}
                                </div>
                                <div className="border-t border-slate-100 dark:border-slate-800 p-2 bg-slate-50/50 dark:bg-slate-900/50">
                                    <Link
                                        href={route('notifications.index')}
                                        onClick={() => setIsOpen(false)}
                                        className="block w-full text-center text-xs font-medium text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 py-1.5 transition-colors"
                                    >
                                        {__('Voir toutes les notifications')}
                                    </Link>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </motion.div>

            <div className="fixed right-4 top-20 z-[60] space-y-3">
                <AnimatePresence>
                    {toasts.map((toast, idx) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 100, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 100, scale: 0.9 }}
                            transition={{ duration: 0.3, delay: idx * 0.1 }}
                        >
                            <Link
                                href={toast.href}
                                className="block w-80 rounded-2xl border border-cyan-200 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur dark:border-cyan-800 dark:bg-slate-900/95 hover:shadow-xl transition-all"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5">
                                        <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse"></div>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{__(toast.title)}</p>
                                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 line-clamp-1">{toast.body}</p>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{toast.meta}</p>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </>
    );
}

// Helper component for Reply icon
const Reply = (props: any) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 10h10a8 8 0 0 1 8 8v2M3 10l6 6m-6-6 6-6"/>
    </svg>
);

export default function AuthenticatedLayout({
    title,
    description,
    actions,
    children,
}: LayoutProps) {
    const { auth, current_locale } = usePage().props as {
        auth: { user: { id: number; name: string; email: string; avatar?: string; role?: string } };
        current_locale: string;
    };
    const { __, isRtl } = useTranslation();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [unreadInboxCount, setUnreadInboxCount] = useState(0);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isDesktopViewport, setIsDesktopViewport] = useState(false);

    useEffect(() => {
        const storedTheme = window.localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const storedCollapsed = window.localStorage.getItem('sidebarCollapsed');
        const shouldUseDark = storedTheme ? storedTheme === 'dark' : prefersDark;

        document.documentElement.classList.toggle('dark', shouldUseDark);
        setDarkMode(shouldUseDark);
        setIsSidebarCollapsed(storedCollapsed === 'true');
        setIsDesktopViewport(window.matchMedia('(min-width: 1024px)').matches);
    }, []);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 1024px)');
        const handleViewportChange = (event: MediaQueryListEvent | MediaQueryList) => {
            setIsDesktopViewport(event.matches);
        };

        handleViewportChange(mediaQuery);

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleViewportChange);

            return () => mediaQuery.removeEventListener('change', handleViewportChange);
        }

        mediaQuery.addListener(handleViewportChange);

        return () => mediaQuery.removeListener(handleViewportChange);
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
        window.localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    useEffect(() => {
        window.localStorage.setItem('sidebarCollapsed', String(isSidebarCollapsed));
    }, [isSidebarCollapsed]);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navigation = useMemo<NavItem[]>(
        () => [
            {
                label: __('Tableau de bord'),
                routeName: 'dashboard',
                href: route('dashboard'),
                icon: <LayoutDashboard className="h-5 w-5" />,
            },
            {
                label: __('Boîte de réception'),
                routeName: 'messages.inbox',
                href: route('messages.inbox'),
                badge: unreadInboxCount > 0 ? unreadInboxCount : undefined,
                icon: <Inbox className="h-5 w-5" />,
            },
            {
                label: __('Messages envoyés'),
                routeName: 'messages.sent',
                href: route('messages.sent'),
                icon: <Send className="h-5 w-5" />,
            },
            {
                label: __('Messages groupés'),
                routeName: 'messages.group',
                href: route('messages.group'),
                icon: <UsersRound className="h-5 w-5" />,
                isNew: true,
            },
            {
                label: __('Brouillons'),
                routeName: 'drafts.index',
                href: route('drafts.index'),
                icon: <FileText className="h-5 w-5" />,
            },
            ...(route().has('messages.starred')
                ? [{
                    label: __('Favoris'),
                    routeName: 'messages.starred',
                    href: route('messages.starred'),
                    icon: <Star className="h-5 w-5" />,
                }]
                : []),
            ...(route().has('messages.trash')
                ? [{
                    label: __('Corbeille'),
                    routeName: 'messages.trash',
                    href: route('messages.trash'),
                    icon: <Trash2 className="h-5 w-5" />,
                }]
                : []),
            ...(route().has('admin')
                ? [{
                    label: __('Administration'),
                    routeName: 'admin',
                    href: route('admin'),
                    icon: <Shield className="h-5 w-5" />,
                    isPro: true,
                    badge: 3,
                }]
                : []),
            {
                label: __('Rôles'),
                routeName: 'roles.index',
                href: route('roles.index'),
                icon: <Users className="h-5 w-5" />,
            },
            {
                label: __('Départements'),
                routeName: 'departments.index',
                href: route('departments.index'),
                icon: <FolderTree className="h-5 w-5" />,
            },
            {
                label: __('Contacts'),
                routeName: 'contacts.index',
                href: route('contacts.index'),
                icon: <Users className="h-5 w-5" />,
            },
            {
                label: __('Archives'),
                routeName: 'messages.archive',
                href: route('messages.archive'),
                icon: <Archive className="h-5 w-5" />,
            },
        ],
        [__, unreadInboxCount],
    );

    const userInitials = auth.user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-cyan-950/30">
            <div className="flex min-h-screen">
                {/* Desktop Sidebar */}
                <motion.aside
                    initial={false}
                    animate={{
                        width: isSidebarCollapsed ? 80 : 288,
                    }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="fixed left-0 top-0 z-30 hidden h-full shrink-0 border-r border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-950/80 lg:flex lg:flex-col overflow-hidden"
                >
                    <div className={`flex flex-col h-full px-3 py-5 ${isSidebarCollapsed ? 'items-center' : ''}`}>
                        {/* Logo Section */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className={`group mb-6 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 ${isSidebarCollapsed ? 'px-2' : ''}`}
                        >
                            {!isSidebarCollapsed ? (
                                <>
                                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                        {__('Centre hospitalier')}
                                    </div>
                                    <div className="mt-2">
                                        <img
                                            src="/images/cmail.png"
                                            alt="Cmail 2027"
                                            className="h-10 w-auto object-contain"
                                        />
                                    </div>
                                    <div className="mt-1 bg-gradient-to-r from-cyan-600 to-sky-600 bg-clip-text text-xl font-bold text-transparent dark:from-cyan-400 dark:to-sky-400">
                                        cmail2027
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                                        {__('Communication interne')}
                                    </p>
                                </>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <img
                                        src="/images/cmail.png"
                                        alt="Cmail"
                                        className="h-8 w-auto object-contain"
                                    />
                                </div>
                            )}
                        </motion.div>

                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`mb-6 ${isSidebarCollapsed ? 'w-full flex justify-center' : ''}`}
                        >
                            <Link
                                href={route('messages.create')}
                                className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-700 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/30 ${
                                    isSidebarCollapsed ? 'h-10 w-10 p-0' : 'w-full px-4 py-3'
                                }`}
                            >
                                <PenSquare className="h-4 w-4" />
                                {!isSidebarCollapsed && __('Nouveau message')}
                            </Link>
                        </motion.div>

                        {/* Collapse Toggle Button */}
                        <button
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className="absolute -right-3 top-20 hidden lg:flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-md hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                        >
                            <ChevronRight className={`h-3 w-3 transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Navigation */}
                        <nav className="flex-1 space-y-1 overflow-y-auto w-full">
                            {navigation.map((item) => (
                                <SidebarLink
                                    key={item.routeName}
                                    item={item}
                                    isCollapsed={isSidebarCollapsed}
                                />
                            ))}
                        </nav>

                        {/* User Profile Section */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className={`mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-800/50 w-full ${isSidebarCollapsed ? 'flex justify-center' : ''}`}
                        >
                            <div className={`rounded-xl bg-gradient-to-br from-slate-50 to-cyan-50/40 p-3 dark:from-slate-900/50 dark:to-cyan-900/20 ${isSidebarCollapsed ? 'p-2' : ''}`}>
                                {!isSidebarCollapsed ? (
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 text-sm font-bold text-white shadow-md">
                                            {userInitials}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-slate-900 dark:text-white truncate text-sm">
                                                {auth.user.name}
                                            </div>
                                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                                {auth.user.email}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 text-sm font-bold text-white shadow-md">
                                        {userInitials}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </motion.aside>

                {/* Main Content */}
                <div
                    className="flex flex-1 flex-col transition-all duration-200"
                    style={{ marginLeft: isDesktopViewport ? (isSidebarCollapsed ? 80 : 288) : 0 }}
                >
                    {/* Header */}
                    <motion.header
                        initial={false}
                        animate={{
                            backgroundColor: darkMode
                                ? (scrolled ? 'rgba(2,6,23,0.92)' : 'rgba(15,23,42,0.82)')
                                : (scrolled ? 'rgba(248,250,252,0.92)' : 'rgba(255,255,255,0.82)'),
                            borderBottomColor: darkMode
                                ? (scrolled ? 'rgba(51,65,85,0.9)' : 'rgba(51,65,85,0.65)')
                                : (scrolled ? 'rgba(203,213,225,0.9)' : 'rgba(226,232,240,0.75)'),
                        }}
                        className="sticky top-0 z-20 border-b shadow-sm shadow-slate-200/30 transition-all duration-300 backdrop-blur-xl dark:shadow-slate-950/30"
                    >
                        <div className="px-4 py-3 sm:px-6 lg:px-8">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                {/* Left Section */}
                                <div className="flex min-w-0 items-start gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setMobileOpen(true)}
                                        className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 lg:hidden"
                                    >
                                        <Menu className="h-5 w-5" />
                                    </button>

                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Sparkles className="h-4 w-4 text-cyan-500" />
                                            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                                                {__('Messagerie centrale')}
                                            </p>
                                        </div>
                                        <h1 className="truncate bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-xl font-bold tracking-tight text-transparent dark:from-white dark:to-slate-300 sm:text-2xl">
                                            {title}
                                        </h1>
                                        {description && (
                                            <p className="mt-0.5 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                                                {description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Right Section */}
                                <div className="flex flex-wrap items-center justify-end gap-2">
                                    <div className="hidden lg:block">
                                        <LanguageSwitcher />
                                    </div>

                                    <NotificationBell __={__} locale={current_locale} userId={auth.user.id} onUnreadMessagesChange={setUnreadInboxCount} />

                                    {actions}

                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        type="button"
                                        onClick={() => setDarkMode((value) => !value)}
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-600 transition-all hover:border-cyan-300 hover:bg-white hover:text-cyan-600 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-cyan-500/40 dark:hover:bg-slate-900"
                                        aria-label="Toggle theme"
                                    >
                                        <AnimatePresence mode="wait" initial={false}>
                                            <motion.div
                                                key={darkMode ? 'sun' : 'moon'}
                                                initial={{ opacity: 0, rotate: -90 }}
                                                animate={{ opacity: 1, rotate: 0 }}
                                                exit={{ opacity: 0, rotate: 90 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                {darkMode ? (
                                                    <Sun className="h-4.5 w-4.5" />
                                                ) : (
                                                    <Moon className="h-4.5 w-4.5" />
                                                )}
                                            </motion.div>
                                        </AnimatePresence>
                                    </motion.button>

                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-2.5 py-1.5 text-sm font-medium text-slate-700 transition-all hover:border-cyan-300 hover:bg-white hover:shadow-md dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 sm:px-3"
                                            >
                                                <span className="hidden sm:inline">{auth.user.name.split(' ')[0]}</span>
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-sky-600 text-sm font-bold text-white shadow-md">
                                                    {userInitials}
                                                </div>
                                                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                                            </motion.button>
                                        </Dropdown.Trigger>

                                        <Dropdown.Content align={isRtl ? 'left' : 'right'} width="48">
                                            <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 text-sm font-bold text-white">
                                                        {userInitials}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{auth.user.name}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">{auth.user.email}</p>
                                                        {auth.user.role && (
                                                            <span className="text-[10px] font-medium text-cyan-600 dark:text-cyan-400">
                                                                {auth.user.role}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <Dropdown.Link href={route('profile.edit')} icon={<User className="h-4 w-4" />}>
                                                {__('Mon profil')}
                                            </Dropdown.Link>
                                            <Dropdown.Link href="#" icon={<Settings className="h-4 w-4" />}>
                                                {__('Paramètres')}
                                            </Dropdown.Link>
                                            <Dropdown.Link href="#" icon={<HelpCircle className="h-4 w-4" />}>
                                                {__('Aide et support')}
                                            </Dropdown.Link>
                                            <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                                                <Dropdown.Link href={route('logout')} method="post" as="button" icon={<LogOut className="h-4 w-4" />}>
                                                    {__('Déconnexion')}
                                                </Dropdown.Link>
                                            </div>
                                        </Dropdown.Content>
                                    </Dropdown>
                                </div>
                            </div>
                        </div>
                    </motion.header>

                    {/* Mobile Menu Overlay */}
                    <AnimatePresence>
                        {mobileOpen && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
                                    onClick={() => setMobileOpen(false)}
                                />
                                <motion.div
                                    initial={{ x: -300, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -300, opacity: 0 }}
                                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                    className="fixed inset-y-0 left-0 z-50 w-80 max-w-[88vw] overflow-y-auto bg-white shadow-2xl dark:bg-slate-950 lg:hidden"
                                >
                                    <div className="flex flex-col h-full">
                                        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
                                            <div className="flex items-center gap-2">
                                                <img src="/images/cmail.png" alt="Cmail" className="h-8 w-auto" />
                                                <span className="font-bold bg-gradient-to-r from-cyan-600 to-sky-600 bg-clip-text text-transparent">cmail2027</span>
                                            </div>
                                            <button
                                                onClick={() => setMobileOpen(false)}
                                                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>

                                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-cyan-50/30 to-transparent dark:from-cyan-950/20">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 text-lg font-bold text-white shadow-md">
                                                    {userInitials}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-900 dark:text-white">{auth.user.name}</div>
                                                    <div className="text-sm text-slate-500 dark:text-slate-400">{auth.user.email}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <nav className="flex-1 p-4 space-y-1">
                                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                                <Link
                                                    href={route('messages.create')}
                                                    onClick={() => setMobileOpen(false)}
                                                    className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all"
                                                >
                                                    <PenSquare className="h-4 w-4" />
                                                    {__('Nouveau message')}
                                                </Link>
                                            </motion.div>

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
                                                }}
                                                className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                                            >
                                                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                                                {darkMode ? __('Mode clair') : __('Mode sombre')}
                                            </button>
                                            <Link
                                                href={route('logout')}
                                                method="post"
                                                as="button"
                                                className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors"
                                            >
                                                <LogOut className="h-5 w-5" />
                                                {__('Déconnexion')}
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>

                    {/* Main Content Area */}
                    <motion.main
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex-1 px-3 py-5 sm:px-6 lg:px-8"
                    >
                        <div className="mx-auto min-w-0 max-w-7xl">
                            {children}
                        </div>
                    </motion.main>
                </div>
            </div>
        </div>
    );
}
