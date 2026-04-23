import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import MessageContentWithSignature from '@/Components/MessageContentWithSignature';
import ReportModal from '@/Components/ReportModal';
import TaskFormModal from '@/Components/TaskFormModal';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Paperclip,
  Calendar,
  Clock,
  Receipt,
  Users,
  Mail,
  Flag,
  MessageSquare,
  Reply,
  Send,
  Share2,
  X,
  Download,
  ExternalLink,
  User,
  AtSign,
  FileText,
  Eye,
  CheckCircle2,
  AlertCircle,
  CornerDownLeft,
  ClipboardList,
} from 'lucide-react';

type MessageUser = {
    id?: number;
    name: string;
    email?: string;
};

type ReplyItem = {
    id: number;
    contenu: string;
    fichier: string | null;
    attachment_url?: string | null;
    user: MessageUser | null;
    created_at: string | null;
};

type MessageDetail = {
    id: number;
    sujet: string;
    contenu: string;
    important: boolean;
    requires_receipt: boolean;
    receipt_requested_at: string | null;
    deadline_reponse: string | null;
    acknowledged_at: string | null;
    type_message: string | null;
    fichier: string | null;
    attachment_url?: string | null;
    sender: MessageUser | null;
    receiver?: MessageUser | null;
    created_at: string | null;
    can_be_redirected: boolean;
    can_forward: boolean;
    receiver_ids: number[];
    current_user_id: number;
    replies: ReplyItem[];
    unread_replies_count?: number;
    has_unread_replies?: boolean;
};

function formatDate(value: string | null, locale: string) {
    if (!value) {
        return null;
    }

    return new Date(value).toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatRelativeDate(value: string | null, locale: string) {
    if (!value) return null;
    
    const date = new Date(value);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    
    return formatDate(value, locale);
}

function resolveAttachmentUrl(path: string | null | undefined, attachmentUrl?: string | null) {
    if (attachmentUrl) {
        return attachmentUrl;
    }

    if (!path) {
        return null;
    }

    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    return `/storage/${path}`;
}

function StatusBadge({ type, children }: { type: 'info' | 'warning' | 'success' | 'default'; children: React.ReactNode }) {
    const styles = {
        info: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/20',
        warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
        success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
        default: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
    };

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[type]}`}>
            {children}
        </span>
    );
}

function InfoCard({
    icon: Icon,
    label,
    value,
    tone = 'default',
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    tone?: 'default' | 'warning' | 'info' | 'success';
}) {
    const styles = {
        default: 'bg-white/5 text-white',
        warning: 'bg-amber-400/15 text-amber-50',
        info: 'bg-cyan-400/15 text-cyan-50',
        success: 'bg-emerald-400/15 text-emerald-50',
    };

    return (
        <div className={`rounded-xl p-3 ${styles[tone]}`}>
            <div className="flex items-center gap-2 text-xs text-cyan-100/70">
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
            </div>
            <p className="mt-1 text-sm font-medium">{value}</p>
        </div>
    );
}

export default function Show({ message }: { message: MessageDetail }) {
    const { __, locale, isRtl } = useTranslation();
    const [isReplying, setIsReplying] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [fileInputKey, setFileInputKey] = useState(0);
    const [quickReplySendingKey, setQuickReplySendingKey] = useState<string | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const originalDate = formatDate(message.created_at, locale);
    const originalRelative = formatRelativeDate(message.created_at, locale);
    const receiptRequestedAt = formatDate(message.receipt_requested_at, locale);
    const deadline = formatDate(message.deadline_reponse, locale);
    const acknowledgedAt = formatDate(message.acknowledged_at, locale);

    const { data, setData, post, processing, reset, errors, clearErrors } = useForm<{
        contenu: string;
        fichier: File | null;
    }>({
        contenu: '',
        fichier: null,
    });

    const unreadRepliesCount = useMemo(() => {
        if (typeof message.unread_replies_count === 'number') {
            return message.unread_replies_count;
        }

        return message.has_unread_replies ? 1 : 0;
    }, [message.has_unread_replies, message.unread_replies_count]);

    useEffect(() => {
        if (!window.Echo) {
            return;
        }

        const channelName = `message.${message.id}`;

        window.Echo.private(channelName).listen('.ReplyCreated', () => {
            router.reload({
                only: ['message'],
            });
        });

        return () => {
            window.Echo?.leave?.(channelName);
            window.Echo?.leaveChannel?.(`private-${channelName}`);
        };
    }, [message.id]);

    const submitReply = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(route('replies.store', message.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                clearErrors();
                setIsReplying(false);
                setFileInputKey((current) => current + 1);
                router.reload({
                    only: ['message'],
                });
            },
        });
    };

    const hasAttachment = !!resolveAttachmentUrl(message.fichier, message.attachment_url);
    const quickReplyTemplates = useMemo(
        () => [
            {
                key: 'received',
                label: __('Bien reçu'),
                contenu: __('Bien reçu, merci pour votre message.'),
            },
            {
                key: 'working',
                label: __('Je traite'),
                contenu: __('Merci, je prends en charge ce point et je vous fais un retour rapidement.'),
            },
            {
                key: 'need-clarification',
                label: __('Besoin de précision'),
                contenu: __('Merci. Pouvez-vous préciser davantage pour que je puisse traiter la demande ?'),
            },
            {
                key: 'urgent',
                label: __('Action immédiate'),
                contenu: __('Reçu. Action immédiate lancée de mon côté.'),
            },
        ],
        [__],
    );
    const isQuickReplySending = quickReplySendingKey !== null;

    const sendQuickReply = (templateKey: string, contenu: string) => {
        if (isQuickReplySending || processing) {
            return;
        }

        setQuickReplySendingKey(templateKey);

        router.post(
            route('replies.store', message.id),
            { contenu },
            {
                preserveScroll: true,
                onSuccess: () => {
                    clearErrors();
                    router.reload({
                        only: ['message'],
                    });
                },
                onFinish: () => {
                    setQuickReplySendingKey(null);
                },
            },
        );
    };

    return (
        <AuthenticatedLayout
            title={message.sujet}
            description={__('Consultez le message original, suivez les réponses et répondez en temps réel.')}
        >
            <Head title={message.sujet} />

            <div className="space-y-8">
                {/* Header Section */}
                <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-slate-50/50 to-cyan-50/30 p-6 shadow-xl backdrop-blur-sm dark:from-slate-900 dark:via-slate-900/80 dark:to-cyan-950/30 lg:p-8">
                    <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-cyan-400/10 to-sky-400/10 blur-3xl" />
                    <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-gradient-to-tr from-indigo-400/5 to-purple-400/5 blur-3xl" />
                    
                    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300">
                                    <Mail className="h-3 w-3" />
                                    {__('Message reçu')}
                                </span>
                                {message.important && (
                                    <StatusBadge type="warning">
                                        <Flag className="h-3 w-3" />
                                        {__('Important')}
                                    </StatusBadge>
                                )}
                                {message.requires_receipt && (
                                    <StatusBadge type="info">
                                        <Receipt className="h-3 w-3" />
                                        {__('Accusé de réception demandé')}
                                    </StatusBadge>
                                )}
                                <StatusBadge type="default">
                                    {message.type_message ?? __('Normal')}
                                </StatusBadge>
                                {unreadRepliesCount > 0 && (
                                    <StatusBadge type="warning">
                                        <Eye className="h-3 w-3" />
                                        {unreadRepliesCount} {__('nouvelle(s) réponse(s)')}
                                    </StatusBadge>
                                )}
                            </div>
                            
                            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white lg:text-3xl">
                                {message.sujet}
                            </h1>
                            
                            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                    <User className="h-4 w-4" />
                                    <span>{__('De')} :</span>
                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                        {message.sender?.name ?? __('Inconnu')}
                                    </span>
                                </div>
                                {originalRelative && (
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                        <Clock className="h-4 w-4" />
                                        <span>{originalRelative}</span>
                                    </div>
                                )}
                                {message.receiver_ids.length >= 2 && (
                                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                                        <Users className="h-3.5 w-3.5" />
                                        {__('Message Groupé')} ({message.receiver_ids.length + 1} {__('participants')})
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                            {message.can_forward && (
                                <Link
                                    href={route('messages.create', { forward: message.id })}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-700 px-4 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-xl hover:shadow-cyan-500/30"
                                >
                                    <Share2 className="h-4 w-4" />
                                    {__('Transferer')}
                                </Link>
                            )}
                            <button
                                type="button"
                                onClick={() => setIsTaskModalOpen(true)}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-medium text-emerald-700 transition-all hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
                            >
                                <ClipboardList className="h-4 w-4" />
                                {__('Créer une tâche')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsReportModalOpen(true)}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-700 transition-all hover:border-rose-300 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                            >
                                <Flag className="h-4 w-4" />
                                {__('Signaler')}
                            </button>
                            <Link
                                href={route('messages.inbox')}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 text-sm font-medium text-slate-700 transition-all hover:border-cyan-300 hover:bg-white hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-cyan-500/40 dark:hover:text-cyan-300"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                {__('Retour')}
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-3">
                    {/* Main Content - Original Message */}
                    <div className="space-y-6 xl:col-span-2">
                        {/* Original Message Card */}
                        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-lg backdrop-blur-sm dark:border-slate-800/50 dark:bg-slate-900/80 lg:p-8">
                            <div className="flex items-center gap-2 border-b border-slate-200/50 pb-4 dark:border-slate-800/50">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 shadow-md">
                                    <FileText className="h-4 w-4 text-white" />
                                </div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    {__('Message original')}
                                </h2>
                                {originalDate && (
                                    <span className="ms-auto text-xs text-slate-400 dark:text-slate-500">
                                        {originalDate}
                                    </span>
                                )}
                            </div>
                            
                            <div className="mt-6 rounded-2xl bg-gradient-to-br from-slate-50 to-white p-6 text-sm leading-7 text-slate-700 shadow-inner dark:from-slate-950/50 dark:to-slate-900/30 dark:text-slate-200 lg:text-base">
                                <MessageContentWithSignature content={message.contenu} />
                            </div>

                            {(message.important || message.requires_receipt || message.deadline_reponse || message.acknowledged_at) && (
                                <div className="mt-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50/80 via-white to-cyan-50/40 p-5 dark:border-slate-800 dark:from-slate-950/40 dark:via-slate-900/50 dark:to-cyan-950/10">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                                {__('Details du message')}
                                            </h3>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                {__('Les informations prioritaires et les contraintes associees a ce message.')}
                                            </p>
                                        </div>
                                        {message.important && (
                                            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                                                <Flag className="h-3.5 w-3.5" />
                                                {__('Traitement prioritaire')}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
                                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                                                <Flag className="h-3.5 w-3.5 text-amber-500" />
                                                {__('Priorite')}
                                            </div>
                                            <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                                                {message.important ? __('Message important') : __('Standard')}
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
                                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                                                <Receipt className="h-3.5 w-3.5 text-cyan-500" />
                                                {__('Accuse')}
                                            </div>
                                            <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                                                {message.requires_receipt ? __('Demande active') : __('Non demande')}
                                            </p>
                                            {receiptRequestedAt && (
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{receiptRequestedAt}</p>
                                            )}
                                        </div>

                                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
                                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                                                <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                                                {__('Date limite')}
                                            </div>
                                            <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                                                {deadline ?? __('Aucune date limite')}
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
                                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                                {__('Validation')}
                                            </div>
                                            <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                                                {acknowledgedAt ? __('Reception validee') : __('En attente')}
                                            </p>
                                            {acknowledgedAt && (
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{acknowledgedAt}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {hasAttachment && (
                                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/30">
                                    <div className="flex items-center justify-between flex-wrap gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300">
                                                <Paperclip className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    {__('Pièce jointe')}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {resolveAttachmentUrl(message.fichier, message.attachment_url)?.split('/').pop() || 'Fichier'}
                                                </p>
                                            </div>
                                        </div>
                                        <a
                                            href={resolveAttachmentUrl(message.fichier, message.attachment_url) ?? '#'}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-cyan-700 hover:shadow-lg"
                                        >
                                            <Download className="h-4 w-4" />
                                            {__('Télécharger')}
                                            <ExternalLink className="h-3 w-3 opacity-70" />
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Replies Section */}
                        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-lg backdrop-blur-sm dark:border-slate-800/50 dark:bg-slate-900/80 lg:p-8">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
                                        <MessageSquare className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                            {__('Fil de discussion')}
                                        </h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {__('Réponses en temps réel')}
                                        </p>
                                    </div>
                                </div>
                                <div className="rounded-full bg-gradient-to-r from-cyan-500/10 to-sky-500/10 px-3 py-1.5 text-sm font-semibold text-cyan-700 dark:text-cyan-300">
                                    {message.replies.length} {message.replies.length === 1 ? __('réponse') : __('réponses')}
                                </div>
                            </div>

                            <div className="mt-6 space-y-4">
                                {message.replies.length > 0 ? (
                                    message.replies.map((reply, index) => {
                                        const replyDate = formatDate(reply.created_at, locale);
                                        const replyRelative = formatRelativeDate(reply.created_at, locale);
                                        const attachmentUrl = resolveAttachmentUrl(reply.fichier, reply.attachment_url);
                                        const isLast = index === message.replies.length - 1;
                                        const isMine = reply.user?.id === message.current_user_id;

                                        return (
                                            <article
                                                key={reply.id}
                                                className={`group rounded-2xl border p-5 transition-all hover:shadow-md ${
                                                    isMine
                                                        ? 'ms-auto max-w-3xl border-teal-200 bg-teal-50/90 dark:border-teal-500/30 dark:bg-teal-500/10'
                                                        : 'me-auto border-slate-200 bg-gradient-to-br from-slate-50/50 to-white dark:border-slate-800 dark:from-slate-950/30 dark:to-slate-900/50'
                                                } ${
                                                    !isLast ? 'border-b' : ''
                                                }`}
                                            >
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm ${
                                                            isMine
                                                                ? 'bg-gradient-to-br from-teal-500 to-cyan-600'
                                                                : 'bg-gradient-to-br from-slate-500 to-slate-600'
                                                        }`}>
                                                            {(isMine ? __('Moi') : reply.user?.name)?.charAt(0).toUpperCase() || '?'}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-900 dark:text-white">
                                                                {isMine ? __('Moi') : reply.user?.name ?? __('Utilisateur')}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                                <span>{replyDate ?? __('Date inconnue')}</span>
                                                                {replyRelative && replyRelative !== replyDate && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span className="text-slate-400">{replyRelative}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                                        isMine
                                                            ? 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300'
                                                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                                                    }`}>
                                                        <Reply className="me-1 inline h-3 w-3" />
                                                        {__('Réponse')}
                                                    </div>
                                                </div>

                                                <div className={`mt-4 rounded-xl p-4 text-sm leading-7 shadow-sm ${
                                                    isMine
                                                        ? 'bg-white/80 text-slate-700 dark:bg-slate-950/40 dark:text-slate-100'
                                                        : 'bg-white text-slate-700 dark:bg-slate-950/50 dark:text-slate-200'
                                                }`}>
                                                    <p className="whitespace-pre-wrap text-start">{reply.contenu}</p>
                                                </div>

                                                {attachmentUrl && (
                                                    <div className="mt-4">
                                                        <a
                                                            href={attachmentUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-all hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-cyan-500/30 dark:hover:bg-cyan-500/10"
                                                        >
                                                            <Paperclip className="h-3.5 w-3.5" />
                                                            {__('Voir la pièce jointe')}
                                                            <ExternalLink className="h-3 w-3 opacity-60" />
                                                        </a>
                                                    </div>
                                                )}
                                            </article>
                                        );
                                    })
                                ) : (
                                    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-12 text-center dark:border-slate-800 dark:bg-slate-950/30">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                            <MessageSquare className="h-8 w-8 text-slate-400 dark:text-slate-600" />
                                        </div>
                                        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                                            {__('Aucune réponse pour le moment')}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                            {__('Soyez le premier à répondre')}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 rounded-2xl border border-cyan-200/70 bg-gradient-to-br from-cyan-50/70 to-sky-50/40 p-5 dark:border-cyan-500/20 dark:from-cyan-500/10 dark:to-sky-500/5">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                            {__('Réponses rapides')}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {__('Un clic envoie directement une réponse.')}
                                        </p>
                                    </div>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-medium text-cyan-700 dark:bg-slate-900/70 dark:text-cyan-300">
                                        <Send className="h-3 w-3" />
                                        {__('Envoi instantané')}
                                    </span>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {quickReplyTemplates.map((template) => {
                                        const isSendingThis = quickReplySendingKey === template.key;

                                        return (
                                            <button
                                                key={template.key}
                                                type="button"
                                                onClick={() => sendQuickReply(template.key, template.contenu)}
                                                disabled={isQuickReplySending || processing}
                                                className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-xs font-semibold text-cyan-700 transition-all hover:border-cyan-300 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-cyan-500/30 dark:bg-slate-900/70 dark:text-cyan-300 dark:hover:border-cyan-500/50 dark:hover:bg-cyan-500/10"
                                            >
                                                {isSendingThis ? (
                                                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent dark:border-cyan-300 dark:border-t-transparent" />
                                                ) : (
                                                    <CornerDownLeft className="h-3.5 w-3.5" />
                                                )}
                                                {template.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Reply Form Section */}
                            <div className="mt-8 border-t border-slate-200/50 pt-6 dark:border-slate-800/50">
                                {!isReplying ? (
                                    <button
                                        type="button"
                                        onClick={() => setIsReplying(true)}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-xl hover:shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <CornerDownLeft className="h-4 w-4" />
                                        {__('Répondre')}
                                    </button>
                                ) : (
                                    <form onSubmit={submitReply} className="space-y-5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-sky-600">
                                                    <Reply className="h-4 w-4 text-white" />
                                                </div>
                                                <h3 className="font-semibold text-slate-900 dark:text-white">
                                                    {__('Nouvelle réponse')}
                                                </h3>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsReplying(false);
                                                    reset();
                                                    clearErrors();
                                                    setFileInputKey((current) => current + 1);
                                                }}
                                                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <div>
                                            <textarea
                                                value={data.contenu}
                                                onChange={(event) => setData('contenu', event.target.value)}
                                                rows={5}
                                                className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-500"
                                                placeholder={__('Saisissez votre réponse...')}
                                            />
                                            {errors.contenu && (
                                                <p className="mt-2 flex items-center gap-1 text-sm text-rose-600 dark:text-rose-400">
                                                    <AlertCircle className="h-3.5 w-3.5" />
                                                    {errors.contenu}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block cursor-pointer">
                                                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 transition-all hover:border-cyan-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-cyan-600">
                                                    <Paperclip className="h-4 w-4 text-slate-400" />
                                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                                        {data.fichier ? data.fichier.name : __('Joindre un fichier')}
                                                    </span>
                                                </div>
                                                <input
                                                    key={fileInputKey}
                                                    type="file"
                                                    onChange={(event) => setData('fichier', event.target.files?.[0] ?? null)}
                                                    className="hidden"
                                                />
                                            </label>
                                            {errors.fichier && (
                                                <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{errors.fichier}</p>
                                            )}
                                        </div>

                                        <div className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-xl hover:shadow-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {processing ? (
                                                    <>
                                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                        {__('Envoi...')}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="h-4 w-4" />
                                                        {__('Envoyer la réponse')}
                                                    </>
                                                )}
                                            </button>
                                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                                {__('La réponse apparaîtra automatiquement dans le fil')}
                                            </p>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Information Cards */}
                    <div className="space-y-6">
                        {/* Message Info Card */}
                        <div className="rounded-3xl bg-gradient-to-br from-cyan-700 via-cyan-800 to-slate-900 p-6 text-white shadow-xl">
                            <div className="flex items-center gap-2 border-b border-cyan-600/50 pb-4">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
                                    <Calendar className="h-4 w-4" />
                                </div>
                                <h3 className="font-semibold tracking-wide">{__('Informations')}</h3>
                            </div>
                            
                            <div className="mt-4 space-y-3">
                                <InfoCard
                                    icon={Calendar}
                                    label={__('Date de réception')}
                                    value={originalDate ?? __('Date inconnue')}
                                    tone="info"
                                />

                                <InfoCard
                                    icon={MessageSquare}
                                    label={__('Statut des réponses')}
                                    value={`${message.replies.length} ${__('réponse(s)')}`}
                                />

                                {message.requires_receipt && (
                                    <InfoCard
                                        icon={Receipt}
                                        label={__('Accusé demandé')}
                                        value={receiptRequestedAt ?? __('En attente')}
                                        tone="warning"
                                    />
                                )}

                                {message.deadline_reponse && (
                                    <InfoCard
                                        icon={AlertCircle}
                                        label={__('Date limite de réponse')}
                                        value={deadline ?? __('Aucune')}
                                        tone="warning"
                                    />
                                )}

                                <InfoCard
                                    icon={CheckCircle2}
                                    label={__('Reception')}
                                    value={acknowledgedAt ? __('Validee') : __('Pas encore validee')}
                                    tone={acknowledgedAt ? 'success' : 'default'}
                                />
                            </div>
                        </div>

                        {/* Quick Stats Card */}
                        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-lg backdrop-blur-sm dark:border-slate-800/50 dark:bg-slate-900/80">
                            <div className="flex items-center gap-2 border-b border-slate-200/50 pb-4 dark:border-slate-800/50">
                                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/20">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="font-semibold text-slate-900 dark:text-white">
                                    {__('Récapitulatif')}
                                </h3>
                            </div>
                            
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-3 text-center dark:from-emerald-950/30 dark:to-emerald-900/20">
                                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                                        {message.replies.length}
                                    </div>
                                    <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400/70">
                                        {__('Réponses')}
                                    </div>
                                </div>
                                <div className="rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100/50 p-3 text-center dark:from-cyan-950/30 dark:to-cyan-900/20">
                                    <div className="text-2xl font-bold text-cyan-700 dark:text-cyan-400">
                                        {hasAttachment ? '1' : '0'}
                                    </div>
                                    <div className="mt-1 text-xs text-cyan-600 dark:text-cyan-400/70">
                                        {__('Pièce jointe')}
                                    </div>
                                </div>
                                <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 p-3 text-center dark:from-amber-950/30 dark:to-amber-900/20">
                                    <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                                        {message.important ? '1' : '0'}
                                    </div>
                                    <div className="mt-1 text-xs text-amber-600 dark:text-amber-400/70">
                                        {__('Priorité')}
                                    </div>
                                </div>
                                <div className="rounded-xl bg-gradient-to-br from-rose-50 to-rose-100/50 p-3 text-center dark:from-rose-950/30 dark:to-rose-900/20">
                                    <div className="text-2xl font-bold text-rose-700 dark:text-rose-400">
                                        {message.deadline_reponse ? '1' : '0'}
                                    </div>
                                    <div className="mt-1 text-xs text-rose-600 dark:text-rose-400/70">
                                        {__('Deadline')}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-4 rounded-xl bg-gradient-to-r from-slate-100 to-slate-50 p-3 dark:from-slate-800/50 dark:to-slate-900/30">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">{__('Statut')}</span>
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                        acknowledgedAt
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                                    }`}>
                                        <CheckCircle2 className="h-3 w-3" />
                                        {acknowledgedAt ? __('Reception validee') : __('Suivi en cours')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <ReportModal
                show={isReportModalOpen}
                messageId={message.id}
                messageSubject={message.sujet}
                onClose={() => setIsReportModalOpen(false)}
            />
            <TaskFormModal
                show={isTaskModalOpen}
                messageId={message.id}
                onClose={() => setIsTaskModalOpen(false)}
                onSubmitted={() => {}}
            />
        </AuthenticatedLayout>
    );
}
