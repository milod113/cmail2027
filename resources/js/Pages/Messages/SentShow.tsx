import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';
import {
    ArrowLeft,
    Paperclip,
    Calendar,
    Clock,
    Users,
    Mail,
    Flag,
    Receipt,
    Share2,
    MessageSquare,
    CheckCircle2,
    AlertCircle,
    Download,
    ExternalLink,
    User,
    AtSign,
    Reply,
    FileText,
    Send,
    X,
    CornerDownLeft,
    ClipboardList,
} from 'lucide-react';

type ReplyItem = {
    id: number;
    contenu: string;
    fichier: string | null;
    attachment_url: string | null;
    created_at: string | null;
    user: {
        name: string;
    } | null;
};

type MessageDetail = {
    id: number;
    sujet: string;
    contenu: string;
    important: boolean;
    requires_receipt: boolean;
    sent_at: string | null;
    scheduled_at: string | null;
    receipt_requested_at: string | null;
    deadline_reponse: string | null;
    type_message: string | null;
    can_be_redirected: boolean;
    can_forward: boolean;
    fichier: string | null;
    attachment_url: string | null;
    receiver: {
        id: number;
        name: string;
        email: string;
    } | null;
    sender: {
        id: number;
        name: string;
        email: string;
    } | null;
    replies: ReplyItem[];
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
        minute: '2-digit',
    });
}

function formatRelativeDate(value: string | null, locale: string) {
    if (!value) {
        return null;
    }

    const date = new Date(value);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "A l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays < 7) return `Il y a ${diffDays} j`;

    return formatDate(value, locale);
}

function resolveAttachmentUrl(path: string | null, attachmentUrl: string | null) {
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
        default: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    };

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[type]}`}>
            {children}
        </span>
    );
}

function InfoCard({ icon: Icon, label, value, highlight = false }: { icon: any; label: string; value: string; highlight?: boolean }) {
    return (
        <div className={`rounded-xl p-3 transition-all ${highlight ? 'bg-white/10' : 'bg-white/5'}`}>
            <div className="flex items-center gap-2 text-xs text-cyan-100/70">
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
            </div>
            <p className={`mt-1 text-sm font-medium ${highlight ? 'text-white' : 'text-cyan-50'}`}>
                {value}
            </p>
        </div>
    );
}

export default function SentShow({ message }: { message: MessageDetail }) {
    const { __, locale } = useTranslation();
    const [isReplying, setIsReplying] = useState(false);
    const [fileInputKey, setFileInputKey] = useState(0);
    const [isCreatingTask, setIsCreatingTask] = useState(false);

    const { data, setData, post, processing, reset, errors, clearErrors } = useForm<{
        contenu: string;
        fichier: File | null;
    }>({
        contenu: '',
        fichier: null,
    });

    const sentAt = formatDate(message.sent_at, locale);
    const sentRelative = formatRelativeDate(message.sent_at, locale);
    const scheduledAt = formatDate(message.scheduled_at, locale);
    const receiptRequestedAt = formatDate(message.receipt_requested_at, locale);
    const deadline = formatDate(message.deadline_reponse, locale);
    const attachmentUrl = resolveAttachmentUrl(message.fichier, message.attachment_url);
    const hasAttachment = !!attachmentUrl;

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

    const createTaskFromMessage = () => {
        if (isCreatingTask) {
            return;
        }

        setIsCreatingTask(true);

        router.post(
            route('tasks.store-from-message', message.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsCreatingTask(false),
            },
        );
    };

    return (
        <AuthenticatedLayout
            title={message.sujet}
            description={__('Consultez les details de votre message, suivez les reponses associees et repondez en ligne.')}
        >
            <Head title={message.sujet} />

            <div className="space-y-8">
                <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-slate-50/50 to-cyan-50/30 p-6 shadow-xl backdrop-blur-sm dark:from-slate-900 dark:via-slate-900/80 dark:to-cyan-950/30 lg:p-8">
                    <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-cyan-400/10 to-sky-400/10 blur-3xl" />
                    <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-gradient-to-tr from-indigo-400/5 to-purple-400/5 blur-3xl" />

                    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300">
                                    <Mail className="h-3 w-3" />
                                    {__('Message envoye')}
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
                                        {__('Accuse de reception')}
                                    </StatusBadge>
                                )}
                                <StatusBadge type="default">
                                    {message.type_message ?? __('Normal')}
                                </StatusBadge>
                            </div>

                            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white lg:text-3xl">
                                {message.sujet}
                            </h1>

                            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                    <User className="h-4 w-4" />
                                    <span>{__('A')} :</span>
                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                        {message.receiver?.name ?? __('Inconnu')}
                                    </span>
                                </div>
                                {message.receiver?.email && (
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                        <AtSign className="h-4 w-4" />
                                        <span className="text-sm">{message.receiver.email}</span>
                                    </div>
                                )}
                                {sentRelative && (
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                        <Clock className="h-4 w-4" />
                                        <span>{sentRelative}</span>
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
                                onClick={createTaskFromMessage}
                                disabled={isCreatingTask}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-medium text-emerald-700 transition-all hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
                            >
                                {isCreatingTask ? (
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent dark:border-emerald-300 dark:border-t-transparent" />
                                ) : (
                                    <ClipboardList className="h-4 w-4" />
                                )}
                                {isCreatingTask ? __('Creation...') : __('Créer une tâche')}
                            </button>
                            <Link
                                href={route('messages.sent')}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 text-sm font-medium text-slate-700 transition-all hover:border-cyan-300 hover:bg-white hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-cyan-500/40 dark:hover:text-cyan-300"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                {__('Retour')}
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="grid gap-6 xl:grid-cols-3">
                    <div className="space-y-6 xl:col-span-2">
                        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-lg backdrop-blur-sm dark:border-slate-800/50 dark:bg-slate-900/80 lg:p-8">
                            <div className="flex items-center gap-2 border-b border-slate-200/50 pb-4 dark:border-slate-800/50">
                                <FileText className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    {__('Contenu du message')}
                                </h2>
                            </div>

                            <div className="mt-6 rounded-2xl bg-gradient-to-br from-slate-50 to-white p-6 text-sm leading-7 text-slate-700 shadow-inner dark:from-slate-950/50 dark:to-slate-900/30 dark:text-slate-200 lg:text-base">
                                <p className="whitespace-pre-wrap text-start">{message.contenu}</p>
                            </div>

                            {hasAttachment && (
                                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/30">
                                    <div className="flex items-center justify-between flex-wrap gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300">
                                                <Paperclip className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    {__('Piece jointe')}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {attachmentUrl?.split('/').pop() || 'Fichier'}
                                                </p>
                                            </div>
                                        </div>
                                        <a
                                            href={attachmentUrl ?? '#'}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-cyan-700 hover:shadow-lg"
                                        >
                                            <Download className="h-4 w-4" />
                                            {__('Telecharger')}
                                            <ExternalLink className="h-3 w-3 opacity-70" />
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

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
                                            {__('Reponses recues sur ce message')}
                                        </p>
                                    </div>
                                </div>
                                <div className="rounded-full bg-gradient-to-r from-cyan-500/10 to-sky-500/10 px-3 py-1.5 text-sm font-semibold text-cyan-700 dark:text-cyan-300">
                                    {message.replies.length} {message.replies.length === 1 ? __('reponse') : __('reponses')}
                                </div>
                            </div>

                            <div className="mt-6 space-y-4">
                                {message.replies.length > 0 ? (
                                    message.replies.map((reply, index) => {
                                        const replyDate = formatDate(reply.created_at, locale);
                                        const replyRelative = formatRelativeDate(reply.created_at, locale);
                                        const replyAttachmentUrl = resolveAttachmentUrl(reply.fichier, reply.attachment_url);
                                        const isLast = index === message.replies.length - 1;

                                        return (
                                            <article
                                                key={reply.id}
                                                className={`group rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50/50 to-white p-5 transition-all hover:shadow-md dark:border-slate-800 dark:from-slate-950/30 dark:to-slate-900/50 ${
                                                    !isLast ? 'border-b' : ''
                                                }`}
                                            >
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 text-sm font-bold text-white shadow-sm">
                                                            {reply.user?.name?.charAt(0).toUpperCase() || '?'}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-900 dark:text-white">
                                                                {reply.user?.name ?? __('Utilisateur')}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                                <span>{replyDate ?? __('Date inconnue')}</span>
                                                                {replyRelative && replyRelative !== replyDate && (
                                                                    <>
                                                                        <span>-</span>
                                                                        <span className="text-slate-400">{replyRelative}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                                                        <Reply className="mr-1 inline h-3 w-3" />
                                                        {__('Reponse')}
                                                    </div>
                                                </div>

                                                <div className="mt-4 rounded-xl bg-white p-4 text-sm leading-7 text-slate-700 shadow-sm dark:bg-slate-950/50 dark:text-slate-200">
                                                    <p className="whitespace-pre-wrap text-start">{reply.contenu}</p>
                                                </div>

                                                {replyAttachmentUrl && (
                                                    <div className="mt-4">
                                                        <a
                                                            href={replyAttachmentUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-all hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-cyan-500/30 dark:hover:bg-cyan-500/10"
                                                        >
                                                            <Paperclip className="h-3.5 w-3.5" />
                                                            {__('Voir la piece jointe')}
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
                                            {__('Aucune reponse pour le moment')}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                            {__('Vous pouvez repondre depuis cette vue')}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 border-t border-slate-200/50 pt-6 dark:border-slate-800/50">
                                {!isReplying ? (
                                    <button
                                        type="button"
                                        onClick={() => setIsReplying(true)}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-xl hover:shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <CornerDownLeft className="h-4 w-4" />
                                        {__('Repondre')}
                                    </button>
                                ) : (
                                    <form onSubmit={submitReply} className="space-y-5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-sky-600">
                                                    <Reply className="h-4 w-4 text-white" />
                                                </div>
                                                <h3 className="font-semibold text-slate-900 dark:text-white">
                                                    {__('Nouvelle reponse')}
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
                                                placeholder={__('Saisissez votre reponse...')}
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
                                                        {__('Envoyer la reponse')}
                                                    </>
                                                )}
                                            </button>
                                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                                {__('La reponse apparaitra automatiquement dans le fil')}
                                            </p>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
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
                                    label={__("Date d'envoi")}
                                    value={sentAt ?? __('Non envoye')}
                                    highlight={!!sentAt}
                                />

                                {message.scheduled_at && (
                                    <InfoCard
                                        icon={Clock}
                                        label={__('Programme pour')}
                                        value={scheduledAt ?? __('Non programme')}
                                    />
                                )}

                                {message.requires_receipt && (
                                    <InfoCard
                                        icon={Receipt}
                                        label={__("Demande d'accuse")}
                                        value={receiptRequestedAt ?? __('En attente')}
                                    />
                                )}

                                {message.deadline_reponse && (
                                    <InfoCard
                                        icon={AlertCircle}
                                        label={__('Date limite')}
                                        value={deadline ?? __('Aucune')}
                                    />
                                )}

                                <InfoCard
                                    icon={Share2}
                                    label={__('Redirection')}
                                    value={message.can_be_redirected ? __('Autorisee') : __('Non autorisee')}
                                />
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-lg backdrop-blur-sm dark:border-slate-800/50 dark:bg-slate-900/80">
                            <div className="flex items-center gap-2 border-b border-slate-200/50 pb-4 dark:border-slate-800/50">
                                <Users className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                                <h3 className="font-semibold text-slate-900 dark:text-white">
                                    {__('Destinataire')}
                                </h3>
                            </div>

                            <div className="mt-4 rounded-xl bg-gradient-to-br from-slate-50 to-white p-4 dark:from-slate-950/50 dark:to-slate-900/30">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 text-lg font-bold text-white shadow-md">
                                        {message.receiver?.name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                                            {message.receiver?.name ?? __('Inconnu')}
                                        </p>
                                        {message.receiver?.email && (
                                            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 truncate">
                                                {message.receiver.email}
                                            </p>
                                        )}
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-0.5 text-xs text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                                                <Mail className="h-2.5 w-2.5" />
                                                {__('Principal')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-lg backdrop-blur-sm dark:border-slate-800/50 dark:bg-slate-900/80">
                            <div className="flex items-center gap-2 border-b border-slate-200/50 pb-4 dark:border-slate-800/50">
                                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/20">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="font-semibold text-slate-900 dark:text-white">
                                    {__('Statistiques')}
                                </h3>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-3 text-center dark:from-emerald-950/30 dark:to-emerald-900/20">
                                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                                        {message.replies.length}
                                    </div>
                                    <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400/70">
                                        {__('Reponses')}
                                    </div>
                                </div>
                                <div className="rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100/50 p-3 text-center dark:from-cyan-950/30 dark:to-cyan-900/20">
                                    <div className="text-2xl font-bold text-cyan-700 dark:text-cyan-400">
                                        {hasAttachment ? '1' : '0'}
                                    </div>
                                    <div className="mt-1 text-xs text-cyan-600 dark:text-cyan-400/70">
                                        {__('Pieces jointes')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
