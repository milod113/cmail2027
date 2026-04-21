import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import type { PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState, useEffect, useRef } from 'react';
import {
    ArrowLeft,
    BadgeCheck,
    Building2,
    IdCard,
    Mail,
    MapPin,
    MessageSquare,
    Phone,
    ShieldCheck,
    UserRound,
    Send,
    Sparkles,
    Zap,
    Clock,
    AlertCircle,
    CheckCircle2,
    Lock,
    Eye,
    Search,
    Star,
    Menu,
    X,
    ChevronDown,
    MoreVertical,
    Copy,
    Share2,
    Bell,
    BellOff,
    Flag,
    Users,
    Calendar,
    Activity,
    Fingerprint,
    Globe,
    Server,
    Cpu,
    Shield,
    Award,
    Trophy,
    Target,
    Heart,
    ThumbsUp,
    Bookmark,
    Camera,
    Edit,
    Settings,
    HelpCircle,
    Info,
    ExternalLink,
} from 'lucide-react';

type Contact = {
    id: number;
    name: string;
    username?: string | null;
    email: string;
    is_online: boolean;
    last_seen_at?: string | null;
    is_blocked: boolean;
    is_favorite: boolean;
    email_verified_at?: string | null;
    department?: {
        id: number;
        name: string;
    } | null;
    role?: {
        id: number;
        nom_role: string;
    } | null;
    profile?: {
        matricule?: string | null;
        grade?: string | null;
        telephone?: string | null;
        adresse?: string | null;
        photo?: string | null;
    } | null;
};

type ThreadMessage = {
    id: number;
    subject: string | null;
    excerpt: string;
    sent_at: string | null;
    created_at: string | null;
    read: boolean;
    important: boolean;
    requires_receipt: boolean;
    acknowledged_at: string | null;
    deadline_reponse: string | null;
    status: string | null;
    direction: 'incoming' | 'outgoing';
    sender: {
        id: number;
        name: string;
        email: string;
    } | null;
    receiver: {
        id: number;
        name: string;
        email: string;
    } | null;
    href: string;
};

type ChatMessage = {
    id: number;
    body: string;
    created_at: string | null;
    read_at: string | null;
    direction: 'incoming' | 'outgoing';
    sender: {
        id: number;
        name: string;
        email: string;
    } | null;
    receiver: {
        id: number;
        name: string;
        email: string;
    } | null;
};

function getStatusBadge(contact: Contact, __: (key: string) => string) {
    if (contact.is_blocked) {
        return {
            label: __('Bloqué'),
            description: __("Ce compte a été bloqué"),
            icon: Lock,
            color: 'rose',
            gradient: 'from-rose-500 to-pink-600',
            className: 'bg-rose-500/15 text-rose-100 border-rose-400/30',
        };
    }

    if (contact.is_online) {
        return {
            label: __('En ligne'),
            description: __("Disponible immédiatement"),
            icon: Zap,
            color: 'emerald',
            gradient: 'from-emerald-500 to-teal-600',
            className: 'bg-emerald-500/15 text-emerald-100 border-emerald-400/30',
        };
    }

    return {
        label: __('Hors ligne'),
        description: __("Non disponible actuellement"),
        icon: Clock,
        color: 'slate',
        gradient: 'from-slate-500 to-gray-600',
        className: 'bg-white/15 text-cyan-100 border-white/20',
    };
}

function StatusIndicator({ isActive, label }: { isActive: boolean; label: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className={`relative h-2 w-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                {isActive && (
                    <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-75" />
                )}
            </div>
            <span className="text-xs text-slate-600 dark:text-slate-400">{label}</span>
        </div>
    );
}

function formatThreadDate(value: string | null, locale: string): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatChatTime(value: string | null, locale: string): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';

    return date.toLocaleTimeString(locale === 'ar' ? 'ar-DZ' : 'fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatPresenceLabel(
    isOnline: boolean,
    lastSeenAt: string | null | undefined,
    locale: string,
    __: (key: string) => string,
): string {
    if (isOnline) {
        return __('Actuellement en ligne');
    }

    if (!lastSeenAt) {
        return __('Hors ligne');
    }

    const date = new Date(lastSeenAt);

    if (Number.isNaN(date.getTime())) {
        return __('Hors ligne');
    }

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

    if (diffMinutes < 60) {
        return `${__('Vu il y a')} ${diffMinutes} min`;
    }

    if (diffMinutes < 1440) {
        return `${__('Vu il y a')} ${Math.floor(diffMinutes / 60)} h`;
    }

    return date.toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-FR', {
        day: 'numeric',
        month: 'short',
    });
}

export default function ContactsShow({
    contact,
    communicationThread,
    chatConversation,
    chatUnreadCount,
}: {
    contact: Contact;
    communicationThread: ThreadMessage[];
    chatConversation: ChatMessage[];
    chatUnreadCount: number;
}) {
    const { __, locale } = useTranslation();
    const { auth } = usePage<PageProps>().props;
    const profile = contact.profile;
    const photoUrl = profile?.photo ? `/storage/${profile.photo}` : null;
    const [threadSearch, setThreadSearch] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showCopiedToast, setShowCopiedToast] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'messages'>('info');
    const [isContactOnline, setIsContactOnline] = useState(contact.is_online);
    const [contactLastSeenAt, setContactLastSeenAt] = useState<string | null>(contact.last_seen_at ?? null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>(chatConversation);
    const [chatDraft, setChatDraft] = useState('');
    const [chatSending, setChatSending] = useState(false);
    const [chatUnread, setChatUnread] = useState(chatUnreadCount);
    const [chatToast, setChatToast] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement | null>(null);
    const badge = getStatusBadge({ ...contact, is_online: isContactOnline }, __);
    const StatusIcon = badge.icon;
    const presenceLabel = formatPresenceLabel(isContactOnline, contactLastSeenAt, locale, __);

    useEffect(() => {
        if (showCopiedToast) {
            const timer = setTimeout(() => setShowCopiedToast(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [showCopiedToast]);

    useEffect(() => {
        setIsContactOnline(contact.is_online);
        setContactLastSeenAt(contact.last_seen_at ?? null);
        setChatMessages(chatConversation);
        setChatUnread(chatUnreadCount);
    }, [contact.id, contact.is_online, contact.last_seen_at, chatConversation, chatUnreadCount]);

    useEffect(() => {
        if (!chatToast) {
            return;
        }

        const timer = window.setTimeout(() => setChatToast(null), 3500);

        return () => window.clearTimeout(timer);
    }, [chatToast]);

    useEffect(() => {
        const globalWindow = window as typeof window & {
            __cmailOnlineUserIds?: number[];
        };

        const syncPresence = (onlineUserIds: number[]) => {
            setIsContactOnline(onlineUserIds.includes(contact.id));
        };

        const handlePresenceSync = (event: Event) => {
            const customEvent = event as CustomEvent<{ onlineUserIds?: number[] }>;
            syncPresence(customEvent.detail?.onlineUserIds ?? []);
        };

        const handlePresenceChange = (event: Event) => {
            const customEvent = event as CustomEvent<{ userId?: number; isOnline?: boolean }>;

            if (customEvent.detail?.userId !== contact.id) {
                return;
            }

            setIsContactOnline(Boolean(customEvent.detail?.isOnline));

            if (!customEvent.detail?.isOnline) {
                setContactLastSeenAt(new Date().toISOString());
            }
        };

        if (Array.isArray(globalWindow.__cmailOnlineUserIds)) {
            syncPresence(globalWindow.__cmailOnlineUserIds);
        }

        window.addEventListener('cmail:presence-sync', handlePresenceSync as EventListener);
        window.addEventListener('cmail:presence-change', handlePresenceChange as EventListener);

        return () => {
            window.removeEventListener('cmail:presence-sync', handlePresenceSync as EventListener);
            window.removeEventListener('cmail:presence-change', handlePresenceChange as EventListener);
        };
    }, [contact.id]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [chatMessages]);

    const toggleFavorite = () => {
        if (contact.is_favorite) {
            router.delete(route('contacts.favorite.destroy', contact.id), { preserveScroll: true });
        } else {
            router.post(route('contacts.favorite.store', contact.id), {}, { preserveScroll: true });
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setShowCopiedToast(true);
    };

    const markChatAsRead = async () => {
        try {
            await window.axios.post(route('contacts.chat.read', contact.id));
            setChatUnread(0);
            setChatMessages((current) =>
                current.map((message) =>
                    message.direction === 'incoming' && !message.read_at
                        ? { ...message, read_at: new Date().toISOString() }
                        : message,
                ),
            );
        } catch {
            // Keep the UI responsive even if the background update fails.
        }
    };

    useEffect(() => {
        if (chatUnreadCount > 0) {
            void markChatAsRead();
        }
    }, [contact.id, chatUnreadCount]);

    useEffect(() => {
        if (!window.Echo) {
            return;
        }

        const channelName = `user.${auth.user.id}`;
        const channel = window.Echo.private(channelName);

        channel.listen('.ChatMessageCreated', (event: { message?: ChatMessage }) => {
            const nextMessage = event.message;

            if (!nextMessage) {
                return;
            }

            const senderId = nextMessage.sender?.id;
            const receiverId = nextMessage.receiver?.id;
            const belongsToCurrentConversation =
                (senderId === contact.id && receiverId === auth.user.id)
                || (senderId === auth.user.id && receiverId === contact.id);

            if (!belongsToCurrentConversation) {
                return;
            }

            setChatMessages((current) => {
                if (current.some((message) => message.id === nextMessage.id)) {
                    return current.map((message) =>
                        message.id === nextMessage.id ? nextMessage : message,
                    );
                }

                return [...current, nextMessage];
            });

            if (senderId === contact.id && receiverId === auth.user.id) {
                setChatToast(`${contact.name} ${__('vous a envoye un nouveau message')}`);
                void markChatAsRead();
            }
        });

        return () => {
            channel.stopListening('.ChatMessageCreated');
        };
    }, [auth.user.id, contact.id, contact.name]);

    const infoItems = [
        { label: __('Email'), value: contact.email, icon: Mail, color: 'cyan', copyable: true },
        {
            label: __("Nom d'utilisateur"),
            value: contact.username ? `@${contact.username}` : __('Non renseigné'),
            icon: UserRound,
            color: 'blue',
            copyable: !!contact.username,
        },
        { label: __('Matricule'), value: profile?.matricule || __('Non renseigné'), icon: IdCard, color: 'purple', copyable: !!profile?.matricule },
        { label: __('Grade'), value: profile?.grade || __('Non renseigné'), icon: BadgeCheck, color: 'emerald' },
        { label: __('Téléphone'), value: profile?.telephone || __('Non renseigné'), icon: Phone, color: 'orange', copyable: !!profile?.telephone },
        {
            label: __('Département'),
            value: contact.department?.name || __('Aucun département assigné'),
            icon: Building2,
            color: 'indigo',
        },
        {
            label: __('Rôle'),
            value: contact.role?.nom_role || __('Aucun rôle assigné'),
            icon: ShieldCheck,
            color: 'violet',
        },
        { label: __('Adresse'), value: profile?.adresse || __('Non renseignée'), icon: MapPin, color: 'rose' },
    ];

    const filteredThread = useMemo(() => {
        const term = threadSearch.trim().toLowerCase();
        if (term === '') return communicationThread;
        return communicationThread.filter((message) => {
            const haystack = [
                message.subject ?? '',
                message.excerpt,
                message.sender?.name ?? '',
                message.receiver?.name ?? '',
            ].join(' ').toLowerCase();
            return haystack.includes(term);
        });
    }, [communicationThread, threadSearch]);

    const outgoingCount = communicationThread.filter((message) => message.direction === 'outgoing').length;
    const incomingCount = communicationThread.length - outgoingCount;

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const sendChatMessage = async () => {
        const payload = chatDraft.trim();

        if (payload === '' || chatSending) {
            return;
        }

        setChatSending(true);

        try {
            const response = await window.axios.post(route('contacts.chat.store', contact.id), {
                body: payload,
            });

            const nextMessage = response.data.message as ChatMessage;

            setChatMessages((current) =>
                current.some((message) => message.id === nextMessage.id)
                    ? current
                    : [...current, nextMessage],
            );
            setChatDraft('');
        } finally {
            setChatSending(false);
        }
    };

    const chatPanel = (
        <section className="overflow-hidden rounded-3xl border border-white/20 bg-white/80 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/80">
            <div className="border-b border-slate-200/70 bg-gradient-to-r from-cyan-50/80 via-white to-white px-5 py-4 dark:border-slate-800 dark:from-cyan-500/10 dark:via-slate-900 dark:to-slate-900">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 shadow-md">
                            <MessageSquare className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                {__('Chat instantane')}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {__('Module separe de la messagerie classique')}
                            </p>
                        </div>
                    </div>
                    {chatUnread > 0 && (
                        <span className="rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                            {chatUnread} {__('nouveau')}
                        </span>
                    )}
                </div>

                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm dark:bg-slate-950/70 dark:text-slate-300">
                    <span className={`h-2.5 w-2.5 rounded-full ${isContactOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {presenceLabel}
                </div>
            </div>

            <div className="bg-gradient-to-b from-slate-50 via-white to-slate-50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                <div className="max-h-[26rem] space-y-3 overflow-y-auto pr-1">
                    {chatMessages.length > 0 ? (
                        chatMessages.map((message) => {
                            const isOutgoing = message.direction === 'outgoing';

                            return (
                                <div
                                    key={message.id}
                                    className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[88%] rounded-[1.6rem] px-4 py-3 shadow-sm ${
                                            isOutgoing
                                                ? 'rounded-br-md bg-gradient-to-br from-cyan-600 to-sky-600 text-white'
                                                : 'rounded-bl-md border border-white/70 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
                                        }`}
                                    >
                                        <p className="whitespace-pre-wrap text-sm leading-6">
                                            {message.body}
                                        </p>
                                        <div
                                            className={`mt-2 flex items-center justify-end gap-2 text-[10px] ${
                                                isOutgoing ? 'text-white/75' : 'text-slate-500 dark:text-slate-400'
                                            }`}
                                        >
                                            <span>{formatChatTime(message.created_at, locale)}</span>
                                            {isOutgoing ? (
                                                <span>{message.read_at ? __('Lu') : __('Envoye')}</span>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 px-4 py-8 text-center dark:border-slate-700 dark:bg-slate-900/70">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-300">
                                <MessageSquare className="h-5 w-5" />
                            </div>
                            <h4 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                                {__('Aucun message instantane')}
                            </h4>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {__('Commencez une conversation en temps reel ici.')}
                            </p>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        void sendChatMessage();
                    }}
                    className="mt-4 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/90"
                >
                    <textarea
                        value={chatDraft}
                        onChange={(event) => setChatDraft(event.target.value)}
                        rows={3}
                        placeholder={__('Ecrire un message rapide...')}
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/10"
                    />
                    <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {__('Temps reel, conserve separement des emails internes.')}
                        </p>
                        <button
                            type="submit"
                            disabled={chatSending || chatDraft.trim() === ''}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Send className="h-4 w-4" />
                            {chatSending ? __('Envoi...') : __('Envoyer')}
                        </button>
                    </div>
                </form>

                {chatToast && (
                    <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                        {chatToast}
                    </div>
                )}
            </div>
        </section>
    );

    return (
        <AuthenticatedLayout
            title={__('Profil du contact')}
            description={__('Consultez les informations générales de cet utilisateur.')}
        >
            <Head title={`${__('Profil du contact')} - ${contact.name}`} />

            {/* Toast Notification */}
            {showCopiedToast && (
                <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 animate-slide-up rounded-full bg-slate-900 px-4 py-2 shadow-lg dark:bg-white">
                    <p className="text-sm text-white dark:text-slate-900">
                        {__('Copié dans le presse-papiers')}
                    </p>
                </div>
            )}

            <div className="space-y-4 px-4 pb-6 sm:space-y-6 sm:px-6 lg:space-y-8 lg:px-8">
                {/* Mobile Header Actions */}
                <div className="flex items-center justify-between lg:hidden">
                    <Link
                        href={route('contacts.index')}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md dark:bg-slate-800"
                    >
                        <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                    </Link>
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md dark:bg-slate-800"
                    >
                        <MoreVertical className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                    </button>
                </div>

                {/* Mobile Bottom Sheet Menu */}
                {mobileMenuOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 lg:hidden">
                            <div className="p-4">
                                <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
                                <div className="space-y-3">
                                    <button
                                        onClick={() => {
                                            toggleFavorite();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                                    >
                                        <Star className={`h-5 w-5 ${contact.is_favorite ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            {contact.is_favorite ? __('Retirer des favoris') : __('Ajouter aux favoris')}
                                        </span>
                                    </button>
                                    <Link
                                        href={route('messages.composeparam', { recipient_id: contact.id })}
                                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:shadow-lg"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <Send className="h-4 w-4" />
                                        {__('Envoyer un message')}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Hero Section - Enhanced Mobile Friendly */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-600 to-slate-900 p-5 shadow-2xl shadow-cyan-500/20 sm:rounded-3xl sm:p-6 lg:p-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent" />
                    <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-white/10 blur-3xl sm:h-64 sm:w-64" />
                    <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl sm:h-80 sm:w-80" />

                    <div className="relative z-10">
                        {/* Desktop Back Button */}
                        <Link
                            href={route('contacts.index')}
                            className="mb-4 hidden items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-white/25 lg:mb-6 lg:inline-flex lg:px-4 lg:py-2 lg:text-sm"
                        >
                            <ArrowLeft className="h-3 w-3 lg:h-4 lg:w-4" />
                            {__('Retour aux contacts')}
                        </Link>

                        <div className="flex flex-col gap-4 sm:gap-6">
                            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left lg:gap-5">
                                {/* Avatar Section */}
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 opacity-75 blur-lg group-hover:opacity-100 transition duration-500 sm:rounded-3xl" />
                                    {photoUrl ? (
                                        <img
                                            src={photoUrl}
                                            alt={contact.name}
                                            className="relative h-20 w-20 rounded-2xl border-2 border-white/20 object-cover shadow-xl transition-transform duration-300 group-hover:scale-105 sm:h-24 sm:w-24 sm:rounded-3xl"
                                        />
                                    ) : (
                                        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-white/20 to-white/5 text-white shadow-xl backdrop-blur-sm transition-transform duration-300 group-hover:scale-105 sm:h-24 sm:w-24 sm:rounded-3xl">
                                            <span className="text-2xl font-bold sm:text-3xl">
                                                {getInitials(contact.name)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1.5 sm:space-y-2">
                                    <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                                        {contact.name}
                                    </h1>
                                    <p className="text-xs text-cyan-100 sm:text-sm lg:text-base">
                                        {profile?.grade || contact.role?.nom_role || __('Utilisateur')}
                                    </p>
                                    <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                                        <div className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold sm:gap-2 sm:px-3 sm:py-1 ${badge.className}`}>
                                            <StatusIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                            {badge.label}
                                        </div>
                                        <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold text-white sm:gap-2 sm:px-3 sm:py-1">
                                            {contact.email_verified_at ? (
                                                <>
                                                    <CheckCircle2 className="h-2.5 w-2.5 text-emerald-300 sm:h-3 sm:w-3" />
                                                    {__('Email vérifié')}
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle className="h-2.5 w-2.5 text-amber-300 sm:h-3 sm:w-3" />
                                                    {__('Email non vérifié')}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Quick Stats */}
                            <div className="grid grid-cols-3 gap-2 sm:hidden">
                                <div className="rounded-xl bg-white/10 p-2 text-center backdrop-blur-sm">
                                    <p className="text-xs text-cyan-100">{__('Messages')}</p>
                                    <p className="text-lg font-bold text-white">{communicationThread.length}</p>
                                </div>
                                <div className="rounded-xl bg-white/10 p-2 text-center backdrop-blur-sm">
                                    <p className="text-xs text-cyan-100">{__('Envoyés')}</p>
                                    <p className="text-lg font-bold text-white">{outgoingCount}</p>
                                </div>
                                <div className="rounded-xl bg-white/10 p-2 text-center backdrop-blur-sm">
                                    <p className="text-xs text-cyan-100">{__('Reçus')}</p>
                                    <p className="text-lg font-bold text-white">{incomingCount}</p>
                                </div>
                            </div>

                            {/* Desktop Stats Card */}
                            <div className="hidden rounded-2xl border border-white/15 bg-white/10 p-3 text-white backdrop-blur-md sm:block lg:p-4">
                                <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-100 lg:text-xs">
                                    {__('Consultation')}
                                </p>
                                <p className="mt-1 text-xs text-white/90 sm:text-sm">
                                    {__('Cette page affiche les informations en mode lecture seule.')}
                                </p>
                                {contact.is_favorite && (
                                    <p className="mt-1 text-center text-[10px] font-semibold text-amber-600 dark:text-amber-300 sm:text-xs">
                                        {__('⭐ Ce contact fait partie de vos favoris')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Tab Navigation */}
                <div className="flex gap-2 rounded-2xl bg-white/80 p-1 backdrop-blur-xl dark:bg-slate-900/80 lg:hidden">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                            activeTab === 'info'
                                ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-white shadow-lg'
                                : 'text-slate-600 dark:text-slate-400'
                        }`}
                    >
                        {__('Informations')}
                    </button>
                    <button
                        onClick={() => setActiveTab('messages')}
                        className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                            activeTab === 'messages'
                                ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-white shadow-lg'
                                : 'text-slate-600 dark:text-slate-400'
                        }`}
                    >
                        {__('Messages')}
                        {communicationThread.length > 0 && (
                            <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                                {communicationThread.length}
                            </span>
                        )}
                    </button>
                </div>

                <div className="grid gap-4 lg:gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
                    {/* Main Content */}
                    <div className="space-y-4 sm:space-y-6">
                        {/* Information Section - Mobile Optimized */}
                        {(activeTab === 'info' || window.innerWidth >= 1024) && (
                            <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-xl shadow-slate-200/40 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl dark:border-slate-700/50 dark:bg-slate-900/80 sm:rounded-3xl sm:p-6">
                                <div className="mb-4 flex items-center gap-2 sm:mb-6 sm:gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 shadow-md sm:h-12 sm:w-12 sm:rounded-2xl">
                                        <Sparkles className="h-4 w-4 text-white sm:h-5 sm:w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white sm:text-2xl">
                                            {__('Informations générales')}
                                        </h2>
                                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:mt-1 sm:text-sm">
                                            {__('Les détails principaux de ce contact')}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                                    {infoItems.map(({ label, value, icon: Icon, color, copyable }) => {
                                        const colorClasses = {
                                            cyan: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300',
                                            blue: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
                                            purple: 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300',
                                            emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
                                            orange: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
                                            indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300',
                                            violet: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
                                            rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
                                        };
                                        return (
                                            <div
                                                key={label}
                                                className="group relative rounded-xl border border-slate-200/70 bg-slate-50/80 p-3 transition-all duration-300 hover:border-slate-300 hover:bg-white hover:shadow-md dark:border-slate-700/70 dark:bg-slate-950/60 dark:hover:border-slate-600 dark:hover:bg-slate-900 sm:rounded-2xl sm:p-4"
                                            >
                                                <div className="flex items-start gap-2 sm:gap-3">
                                                    <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 sm:h-10 sm:w-10 sm:rounded-2xl ${colorClasses[color as keyof typeof colorClasses]}`}>
                                                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 sm:text-xs">
                                                            {label}
                                                        </p>
                                                        <div className="mt-1 flex items-center justify-between gap-2">
                                                            <p className="break-words text-xs font-medium text-slate-800 dark:text-slate-100 sm:text-sm">
                                                                {value}
                                                            </p>
                                                            {copyable && value !== __('Non renseigné') && value !== __('Non renseignée') && value !== __('Aucun département assigné') && value !== __('Aucun rôle assigné') && (
                                                                <button
                                                                    onClick={() => copyToClipboard(value)}
                                                                    className="rounded-full p-1 text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                                                                >
                                                                    <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* Messages Section - Mobile Optimized */}
                        {(activeTab === 'messages' || window.innerWidth >= 1024) && (
                            <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-xl shadow-slate-200/40 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl dark:border-slate-700/50 dark:bg-slate-900/80 sm:rounded-3xl sm:p-6">
                                <div className="flex flex-col gap-4 border-b border-slate-200/70 pb-4 dark:border-slate-800 sm:gap-5 sm:pb-5">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 shadow-md sm:h-12 sm:w-12 sm:rounded-2xl">
                                                <MessageSquare className="h-4 w-4 text-white sm:h-5 sm:w-5" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-bold text-slate-900 dark:text-white sm:text-2xl">
                                                    {__('Flux de communication')}
                                                </h2>
                                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:mt-1 sm:text-sm">
                                                    {__('Messages reçus et envoyés')}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Desktop Stats */}
                                        <div className="hidden grid-cols-3 gap-2 sm:grid sm:gap-3">
                                            <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-950/50 sm:rounded-2xl sm:px-4 sm:py-3">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:text-[11px]">{__('Total')}</p>
                                                <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white sm:mt-1 sm:text-xl">{communicationThread.length}</p>
                                            </div>
                                            <div className="rounded-xl bg-emerald-50 px-3 py-2 dark:bg-emerald-500/10 sm:rounded-2xl sm:px-4 sm:py-3">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300 sm:text-[11px]">{__('Envoyés')}</p>
                                                <p className="mt-0.5 text-lg font-bold text-emerald-700 dark:text-emerald-200 sm:mt-1 sm:text-xl">{outgoingCount}</p>
                                            </div>
                                            <div className="rounded-xl bg-cyan-50 px-3 py-2 dark:bg-cyan-500/10 sm:rounded-2xl sm:px-4 sm:py-3">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-300 sm:text-[11px]">{__('Reçus')}</p>
                                                <p className="mt-0.5 text-lg font-bold text-cyan-700 dark:text-cyan-200 sm:mt-1 sm:text-xl">{incomingCount}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Search Bar */}
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 sm:left-4 sm:h-4 sm:w-4" />
                                        <input
                                            type="text"
                                            value={threadSearch}
                                            onChange={(event) => setThreadSearch(event.target.value)}
                                            placeholder={__('Rechercher...')}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/10 sm:rounded-2xl sm:py-2.5 sm:pl-10 sm:pr-4 sm:text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 space-y-3 sm:mt-6 sm:space-y-4">
                                    {filteredThread.length > 0 ? (
                                        filteredThread.map((message) => {
                                            const isOutgoing = message.direction === 'outgoing';
                                            const displayDate = formatThreadDate(message.sent_at ?? message.created_at, locale);

                                            return (
                                                <article
                                                    key={message.id}
                                                    className={`rounded-xl border p-3 shadow-sm transition-all duration-300 active:scale-[0.99] sm:rounded-2xl sm:p-4 sm:hover:-translate-y-0.5 sm:hover:shadow-lg ${
                                                        isOutgoing
                                                            ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/90 to-white dark:border-emerald-500/20 dark:from-emerald-500/10 dark:to-slate-900'
                                                            : 'border-cyan-200 bg-gradient-to-br from-cyan-50/90 to-white dark:border-cyan-500/20 dark:from-cyan-500/10 dark:to-slate-900'
                                                    }`}
                                                >
                                                    <div className="flex flex-col gap-3">
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <div className="flex flex-wrap items-center gap-1.5">
                                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold sm:px-3 sm:py-1 sm:text-xs ${
                                                                    isOutgoing
                                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                                                        : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300'
                                                                }`}>
                                                                    {isOutgoing ? __('📤 Envoyé') : __('📥 Reçu')}
                                                                </span>
                                                                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 shadow-sm dark:bg-slate-950 dark:text-slate-300 sm:px-3 sm:py-1 sm:text-xs">
                                                                    {displayDate}
                                                                </span>
                                                                {message.important && (
                                                                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 sm:px-3 sm:py-1 sm:text-xs">
                                                                        ⚠️ {__('Important')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <Link
                                                                href={message.href}
                                                                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 sm:gap-2 sm:rounded-2xl sm:px-3 sm:py-1.5 sm:text-sm"
                                                            >
                                                                <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                                <span className="hidden sm:inline">{__('Voir')}</span>
                                                            </Link>
                                                        </div>

                                                        <div>
                                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white sm:text-base">
                                                                {message.subject?.trim() || __('Sans sujet')}
                                                            </h3>
                                                            <p className="mt-1 line-clamp-2 text-xs leading-6 text-slate-600 dark:text-slate-300 sm:mt-2 sm:text-sm">
                                                                {message.excerpt}
                                                            </p>
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 sm:gap-3 sm:text-xs">
                                                            <span>
                                                                {isOutgoing ? '→' : '←'} <span className="font-semibold text-slate-700 dark:text-slate-200">
                                                                    {isOutgoing
                                                                        ? (message.receiver?.name ?? contact.name)
                                                                        : (message.sender?.name ?? contact.name)
                                                                    }
                                                                </span>
                                                            </span>
                                                            {message.deadline_reponse && (
                                                                <span>
                                                                    📅 {formatThreadDate(message.deadline_reponse, locale)}
                                                                </span>
                                                            )}
                                                            {!isOutgoing && (
                                                                <span className="inline-flex items-center gap-1">
                                                                    {message.read ? '✓✓' : '✓'} {message.read ? __('Lu') : __('Non lu')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </article>
                                            );
                                        })
                                    ) : (
                                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center dark:border-slate-800 dark:bg-slate-950/40 sm:rounded-2xl sm:px-6 sm:py-12">
                                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-slate-900 sm:h-14 sm:w-14 sm:rounded-2xl">
                                                <MessageSquare className="h-5 w-5 text-slate-400 dark:text-slate-500 sm:h-6 sm:w-6" />
                                            </div>
                                            <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white sm:mt-4 sm:text-lg">
                                                {threadSearch.trim() !== '' ? __('Aucun résultat') : __('Aucun échange')}
                                            </h3>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:mt-2 sm:text-sm">
                                                {threadSearch.trim() !== ''
                                                    ? __('Essayez un autre mot-clé')
                                                    : __('Les messages apparaîtront ici')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                    </div>

                    {/* Sidebar - Desktop Only */}
                    <aside className="hidden space-y-4 lg:block lg:space-y-6">
                        {/* Account Status Card */}
                        <section className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/80 p-5 shadow-xl shadow-slate-200/40 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl dark:border-slate-700/50 dark:bg-slate-900/80 lg:p-6">
                            <div className={`absolute inset-0 bg-gradient-to-br ${badge.gradient} opacity-5`} />
                            <div className="relative">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${badge.gradient} shadow-md lg:h-10 lg:w-10 lg:rounded-2xl`}>
                                            <StatusIcon className="h-4 w-4 text-white lg:h-5 lg:w-5" />
                                        </div>
                                        <h2 className="text-base font-bold text-slate-900 dark:text-white lg:text-lg">
                                            {__('Statut du compte')}
                                        </h2>
                                    </div>
                                    <div className={`rounded-full px-2 py-0.5 text-[10px] font-bold lg:px-3 lg:py-1 lg:text-xs ${badge.className}`}>
                                        {badge.label}
                                    </div>
                                </div>

                                <p className="text-xs text-slate-600 dark:text-slate-300 lg:text-sm">
                                    {badge.description}
                                </p>

                                <div className="mt-3 space-y-1.5 lg:mt-4 lg:space-y-2">
                                    <StatusIndicator isActive={isContactOnline && !contact.is_blocked} label={__("Connecté")} />
                                    <StatusIndicator isActive={!!contact.email_verified_at} label={__("Email vérifié")} />
                                    <StatusIndicator isActive={!contact.is_blocked} label={__("Compte actif")} />
                                </div>

                                <div className="mt-3 rounded-xl bg-slate-100/80 p-2.5 dark:bg-slate-800/60 lg:mt-4 lg:p-3">
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 lg:text-xs">
                                        {__("Dernière activité")}
                                    </p>
                                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 lg:text-sm">
                                        {presenceLabel}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Quick Summary Card */}
                        <section className="rounded-3xl border border-white/20 bg-white/80 p-5 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/80 lg:p-6">
                            <h2 className="text-base font-bold text-slate-900 dark:text-white lg:text-lg">
                                {__('Résumé rapide')}
                            </h2>
                            <div className="mt-3 space-y-3 lg:mt-5 lg:space-y-4">
                                <div className="group rounded-xl bg-gradient-to-br from-cyan-50 to-sky-50 p-3 transition-all duration-300 hover:shadow-md dark:from-cyan-500/10 dark:to-sky-500/10 lg:rounded-2xl lg:p-4">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-700 dark:text-cyan-300 lg:text-xs">
                                        {__('Département')}
                                    </p>
                                    <p className="mt-1 text-xs font-medium text-slate-900 dark:text-white lg:mt-2 lg:text-sm">
                                        {contact.department?.name || __('Non assigné')}
                                    </p>
                                </div>
                                <div className="group rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 p-3 transition-all duration-300 hover:shadow-md dark:from-violet-500/10 dark:to-purple-500/10 lg:rounded-2xl lg:p-4">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-700 dark:text-violet-300 lg:text-xs">
                                        {__('Rôle')}
                                    </p>
                                    <p className="mt-1 text-xs font-medium text-slate-900 dark:text-white lg:mt-2 lg:text-sm">
                                        {contact.role?.nom_role || __('Non assigné')}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Action Buttons */}
                        <section className="rounded-3xl border border-white/20 bg-white/80 p-5 shadow-xl shadow-slate-200/40 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl dark:border-slate-700/50 dark:bg-slate-900/80 lg:p-6">
                            <div className="space-y-3 lg:space-y-4">
                                <div className="flex items-center gap-2 lg:gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md lg:h-12 lg:w-12 lg:rounded-2xl">
                                        <MessageSquare className="h-4 w-4 text-white lg:h-5 lg:w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white lg:text-base">
                                            {__('Envoyer un message')}
                                        </h3>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 lg:text-xs">
                                            {__("Commencer une conversation")}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={toggleFavorite}
                                    className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all duration-300 lg:rounded-2xl lg:px-6 lg:py-3 lg:text-sm ${
                                        contact.is_favorite
                                            ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'
                                            : 'border-slate-200 bg-white text-slate-700 hover:border-amber-200 hover:text-amber-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                                    }`}
                                >
                                    <Star className={`h-3.5 w-3.5 ${contact.is_favorite ? 'fill-current' : ''} lg:h-4 lg:w-4`} />
                                    {contact.is_favorite ? __('Retirer des favoris') : __('Ajouter aux favoris')}
                                </button>

                                <Link
                                    href={route('messages.composeparam', { recipient_id: contact.id })}
                                    className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] lg:rounded-2xl lg:gap-3 lg:px-6 lg:py-4 lg:text-base"
                                >
                                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                    <Send className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 lg:h-5 lg:w-5" />
                                    {__('Contacter')}
                                </Link>
                            </div>
                        </section>

                        {/* Security Note */}
                        <div className="rounded-xl border border-amber-200/50 bg-amber-50/50 p-3 backdrop-blur-sm dark:border-amber-500/20 dark:bg-amber-500/5 lg:rounded-2xl lg:p-4">
                            <div className="flex items-start gap-2 lg:gap-3">
                                <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400 lg:h-5 lg:w-5" />
                                <div>
                                    <p className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 lg:text-xs">
                                        {__('Confidentialité')}
                                    </p>
                                    <p className="text-[10px] text-amber-700/70 dark:text-amber-400/70 lg:text-xs">
                                        {__('Messages chiffrés de bout en bout')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {chatPanel}
                    </aside>
                </div>
            </div>

            <style jsx>{`
                @keyframes slide-up {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
            `}</style>
        </AuthenticatedLayout>
    );
}
