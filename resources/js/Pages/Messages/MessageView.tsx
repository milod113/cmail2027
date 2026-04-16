import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Eye,
    Mail,
    MessageSquare,
    Reply,
    Send,
    Users,
    X,
    Clock,
    Paperclip,
    CornerDownLeft,
    UserCheck,
    MessageCircle,
    ChevronRight,
    Sparkles,
} from 'lucide-react';

type Person = {
    id: number;
    name: string;
    email: string;
};

type ThreadItem = {
    id: number | string;
    type: 'original' | 'reply';
    contenu: string;
    created_at: string | null;
    sender: Person | null;
    receiver: Person | null;
};

type RecipientStatus = {
    recipient: Person | null;
    read_status: {
        is_read: boolean;
        read_at: string | null;
    };
    reply_date: string | null;
    reply_excerpt: string | null;
    thread: ThreadItem[];
};

type MessageViewData = {
    id: number;
    sujet: string;
    contenu: string;
    created_at: string | null;
    sender: Person | null;
    recipient_count: number;
    recipients: RecipientStatus[];
};

function formatDate(value: string | null, locale: string) {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatRelativeTime(value: string | null, locale: string) {
    if (!value) return '—';

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
    return formatDate(value, locale);
}

export default function MessageView({ message }: { message: MessageViewData }) {
    const { __, locale } = useTranslation();
    const [isReplyAllOpen, setIsReplyAllOpen] = useState(false);
    const [activeRecipientId, setActiveRecipientId] = useState<number | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const replyAllForm = useForm({
        contenu: '',
        fichier: null as File | null,
    });

    const recipientReplyForm = useForm({
        contenu: '',
        fichier: null as File | null,
    });

    const activeRecipient = useMemo(
        () => message.recipients.find((item) => item.recipient?.id === activeRecipientId) ?? null,
        [activeRecipientId, message.recipients],
    );

    const submitReplyAll = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        replyAllForm.post(route('messages.reply_all', message.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                replyAllForm.reset();
                setSelectedFile(null);
                setIsReplyAllOpen(false);
            },
        });
    };

    const submitRecipientReply = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!activeRecipient?.recipient) {
            return;
        }

        recipientReplyForm.post(
            route('messages.reply_recipient', {
                message: message.id,
                recipient: activeRecipient.recipient.id,
            }),
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    recipientReplyForm.reset();
                    setSelectedFile(null);
                },
            },
        );
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, form: 'all' | 'recipient') => {
        const file = e.target.files?.[0] || null;
        setSelectedFile(file);
        if (form === 'all') {
            replyAllForm.setData('fichier', file);
        } else {
            recipientReplyForm.setData('fichier', file);
        }
    };

    const readPercentage = (message.recipients.filter(r => r.read_status.is_read).length / message.recipients.length) * 100;

    return (
        <AuthenticatedLayout
            title={message.sujet}
            description={__('Suivez les accusés de lecture et les réponses des destinataires.')}
        >
            <Head title={message.sujet} />

            <div className="space-y-6">
                {/* Hero Section with Gradient */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 shadow-2xl dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-cyan-500/5 blur-3xl" />
                    <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-sky-500/5 blur-3xl" />

                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300 backdrop-blur-sm">
                                    <Users className="h-3 w-3" />
                                    {__('Message groupé')}
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-700/50 px-3 py-1 text-xs font-medium text-slate-300 backdrop-blur-sm">
                                    <Mail className="h-3 w-3" />
                                    {message.recipient_count} {__('destinataires')}
                                </span>
                            </div>

                            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white lg:text-4xl">
                                {message.sujet}
                            </h1>

                            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-300">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-sky-500">
                                        <span className="text-xs font-bold text-white">
                                            {message.sender?.name?.charAt(0) || '?'}
                                        </span>
                                    </div>
                                    <span>{__('De')} <span className="font-medium text-white">{message.sender?.name ?? __('Inconnu')}</span></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {formatDate(message.created_at, locale)}
                                </div>
                            </div>

                            <div className="mt-6 rounded-xl bg-white/5 p-5 text-sm leading-7 text-slate-200 backdrop-blur-sm">
                                <p className="whitespace-pre-wrap leading-relaxed">{message.contenu}</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setIsReplyAllOpen(true)}
                                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/30"
                            >
                                <Reply className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5 group-hover:translate-y-0.5" />
                                {__('Répondre à tous')}
                                <ChevronRight className="h-3.5 w-3.5 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
                            </button>

                            <Link
                                href={route('messages.group')}
                                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:border-white/30"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                {__('Retour')}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="group rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:border-slate-800/60 dark:bg-slate-900/80">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{__('Taux de lecture')}</p>
                                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{Math.round(readPercentage)}%</p>
                            </div>
                            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                                <Eye className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                                style={{ width: `${readPercentage}%` }}
                            />
                        </div>
                    </div>

                    <div className="group rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:border-slate-800/60 dark:bg-slate-900/80">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{__('Réponses reçues')}</p>
                                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                                    {message.recipients.filter(r => r.reply_date).length}
                                </p>
                            </div>
                            <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400">
                                <MessageCircle className="h-5 w-5" />
                            </div>
                        </div>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            sur {message.recipients.length} destinataires
                        </p>
                    </div>

                    <div className="group rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:border-slate-800/60 dark:bg-slate-900/80">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{__('Non lus')}</p>
                                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                                    {message.recipients.filter(r => !r.read_status.is_read).length}
                                </p>
                            </div>
                            <div className="rounded-xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                                <Clock className="h-5 w-5" />
                            </div>
                        </div>
                    </div>

                    <div className="group rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:border-slate-800/60 dark:bg-slate-900/80">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{__('Taux de réponse')}</p>
                                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                                                    {Math.round((message.recipients.filter(r => r.reply_date).length / message.recipients.length) * 100)}%
                                </p>
                            </div>
                            <div className="rounded-xl bg-violet-50 p-3 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                                <Sparkles className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recipients Table Section */}
                <section className="rounded-2xl border border-slate-200/70 bg-white/85 shadow-lg backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/80">
                    <div className="border-b border-slate-200/70 px-4 py-5 dark:border-slate-800/60 sm:px-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                                    {__('Suivi des réponses')}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    {__('Statut de lecture et dernières réponses par destinataire')}
                                </p>
                            </div>
                            <div className="hidden sm:block">
                                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                    <UserCheck className="h-3 w-3" />
                                    {message.recipients.length} contacts
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 px-4 py-4 sm:hidden">
                        {message.recipients.map((item, idx) => (
                            <article
                                key={item.recipient?.id ?? idx}
                                className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800/60 dark:bg-slate-950/30"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-sky-500 text-sm font-bold text-white shadow-md">
                                        {item.recipient?.name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-semibold text-slate-900 dark:text-white">{item.recipient?.name ?? __('Inconnu')}</div>
                                        <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{item.recipient?.email ?? 'â€”'}</div>
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                                        item.read_status.is_read
                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                                            : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                                    }`}>
                                        {item.read_status.is_read ? <CheckCircle2 className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                        {item.read_status.is_read ? __('Lu') : __('Non lu')}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                        <CornerDownLeft className="h-3 w-3" />
                                        {item.reply_date ? formatRelativeTime(item.reply_date, locale) : __('Aucune réponse')}
                                    </span>
                                </div>
                                <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                                    {item.reply_excerpt ? (
                                        <p className="line-clamp-3">"{item.reply_excerpt}"</p>
                                    ) : (
                                        <span className="italic text-slate-400">{__('Aucune rÃ©ponse')}</span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveRecipientId(item.recipient?.id ?? null);
                                        recipientReplyForm.reset();
                                    }}
                                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-700 transition-all duration-200 hover:bg-cyan-100 hover:border-cyan-300 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:bg-cyan-500/20"
                                >
                                    <MessageSquare className="h-3.5 w-3.5" />
                                    {__('RÃ©pondre')}
                                </button>
                            </article>
                        ))}
                    </div>

                    <div className="hidden overflow-hidden sm:block">
                        <div className="overflow-x-auto">
                            <table className="min-w-[900px]">
                                <thead className="bg-slate-50/50 dark:bg-slate-950/30">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{__('Destinataire')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{__('Statut')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{__('Dernière réponse')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{__('Extrait')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{__('Action')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                                    {message.recipients.map((item, idx) => (
                                        <tr key={item.recipient?.id ?? idx} className="group transition-colors duration-200 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-sky-500 text-sm font-bold text-white shadow-md">
                                                        {item.recipient?.name?.charAt(0).toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-900 dark:text-white">{item.recipient?.name ?? __('Inconnu')}</div>
                                                        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{item.recipient?.email ?? '—'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                                                    item.read_status.is_read
                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                                                        : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                                                }`}>
                                                    {item.read_status.is_read ? <CheckCircle2 className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                    {item.read_status.is_read ? (
                                                        <>
                                                            {__('Lu')}
                                                            {item.read_status.read_at && (
                                                                <span className="ml-1 text-xs opacity-70">
                                                                    {formatRelativeTime(item.read_status.read_at, locale)}
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : __('Non lu')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                                {item.reply_date ? (
                                                    <div className="flex items-center gap-1">
                                                        <CornerDownLeft className="h-3 w-3 text-slate-400" />
                                                        {formatRelativeTime(item.reply_date, locale)}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {item.reply_excerpt ? (
                                                    <p className="max-w-xs truncate text-sm text-slate-600 dark:text-slate-300">
                                                        "{item.reply_excerpt}"
                                                    </p>
                                                ) : (
                                                    <span className="text-sm italic text-slate-400">{__('Aucune réponse')}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setActiveRecipientId(item.recipient?.id ?? null);
                                                        recipientReplyForm.reset();
                                                    }}
                                                    className="inline-flex items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-sm font-medium text-cyan-700 transition-all duration-200 hover:bg-cyan-100 hover:border-cyan-300 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:bg-cyan-500/20"
                                                >
                                                    <MessageSquare className="h-3.5 w-3.5" />
                                                    {__('Répondre')}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>

            {/* Reply All Modal */}
            {isReplyAllOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsReplyAllOpen(false)} />
                    <div className="relative w-full max-w-2xl animate-in zoom-in-95 fade-in duration-200">
                        <div className="rounded-2xl border border-slate-200/70 bg-white shadow-2xl dark:border-slate-800/60 dark:bg-slate-900">
                            <div className="flex items-start justify-between gap-3 border-b border-slate-200/70 px-4 py-4 dark:border-slate-800/60 sm:px-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{__('Répondre à tous')}</h3>
                                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                                        {__('Cette réponse sera envoyée à tous les destinataires')}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsReplyAllOpen(false);
                                        replyAllForm.reset();
                                        setSelectedFile(null);
                                    }}
                                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <form onSubmit={submitReplyAll} className="space-y-4 p-4 sm:p-6">
                                <textarea
                                    value={replyAllForm.data.contenu}
                                    onChange={(event) => replyAllForm.setData('contenu', event.target.value)}
                                    rows={6}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-950/50 dark:text-white dark:placeholder:text-slate-500"
                                    placeholder={__('Saisissez votre réponse globale...')}
                                />
                                {replyAllForm.errors.contenu && (
                                    <p className="text-sm text-rose-600 dark:text-rose-400">{replyAllForm.errors.contenu}</p>
                                )}

                                <div className="flex flex-wrap items-center gap-3">
                                    <label className="flex max-w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
                                        <Paperclip className="h-4 w-4" />
                                        <span className="max-w-[12rem] truncate">{selectedFile ? selectedFile.name : __('Joindre un fichier')}</span>
                                        <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'all')} />
                                    </label>
                                    {selectedFile && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedFile(null);
                                                replyAllForm.setData('fichier', null);
                                            }}
                                            className="text-sm text-rose-500 hover:text-rose-600"
                                        >
                                            {__('Retirer')}
                                        </button>
                                    )}
                                </div>

                                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsReplyAllOpen(false);
                                            replyAllForm.reset();
                                            setSelectedFile(null);
                                        }}
                                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                        {__('Annuler')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={replyAllForm.processing}
                                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-xl disabled:opacity-60"
                                    >
                                        <Send className="h-4 w-4" />
                                        {replyAllForm.processing ? __('Envoi...') : __('Envoyer à tous')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Recipient Reply Slide-over */}
            {activeRecipient && activeRecipient.recipient && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" onClick={() => setActiveRecipientId(null)} />
                    <div className="absolute inset-y-0 right-0 flex w-full max-w-xl">
                        <div className="relative flex h-full w-full flex-col bg-white shadow-2xl dark:bg-slate-900 animate-in slide-in-from-right duration-300">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 dark:border-slate-800 sm:px-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-sky-500 text-sm font-bold text-white shadow-md">
                                        {activeRecipient.recipient.name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 dark:text-white">{activeRecipient.recipient.name}</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{activeRecipient.recipient.email}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActiveRecipientId(null)}
                                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Messages Thread */}
                            <div className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-slate-50/30 to-white px-4 py-5 dark:from-slate-950/30 dark:to-slate-900 sm:px-6 sm:py-6">
                                {activeRecipient.thread.map((item) => {
                                    const isFromDirector = item.sender?.id === message.sender?.id;

                                    return (
                                        <div
                                            key={item.id}
                                            className={`flex ${isFromDirector ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[92%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[85%] ${
                                                    isFromDirector
                                                        ? 'bg-gradient-to-br from-cyan-500 to-sky-500 text-white'
                                                        : 'bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                                                }`}
                                            >
                                                <div className={`mb-1.5 flex items-center justify-between gap-3 text-xs ${
                                                    isFromDirector ? 'text-cyan-50/80' : 'text-slate-500 dark:text-slate-400'
                                                }`}>
                                                    <span className="font-medium">{item.sender?.name ?? __('Inconnu')}</span>
                                                    <span>{formatRelativeTime(item.created_at, locale)}</span>
                                                </div>
                                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{item.contenu}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                {activeRecipient.thread.length === 0 && (
                                    <div className="flex h-full items-center justify-center">
                                        <div className="text-center">
                                            <MessageCircle className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
                                            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                                                {__('Aucun message dans cette conversation')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Reply Form */}
                            <form onSubmit={submitRecipientReply} className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                                <div className="relative">
                                    <textarea
                                        value={recipientReplyForm.data.contenu}
                                        onChange={(event) => recipientReplyForm.setData('contenu', event.target.value)}
                                        rows={3}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-950/50 dark:text-white"
                                        placeholder={__('Écrivez votre réponse...')}
                                    />
                                    <button
                                        type="submit"
                                        disabled={recipientReplyForm.processing || !recipientReplyForm.data.contenu.trim()}
                                        className="absolute bottom-3 right-3 rounded-lg bg-gradient-to-r from-cyan-600 to-sky-600 p-2 text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                </div>
                                {recipientReplyForm.errors.contenu && (
                                    <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{recipientReplyForm.errors.contenu}</p>
                                )}

                                <div className="mt-3 flex flex-wrap items-center gap-3">
                                    <label className="flex max-w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
                                        <Paperclip className="h-3.5 w-3.5" />
                                        <span className="max-w-[10rem] truncate">{selectedFile ? selectedFile.name : __('Pièce jointe')}</span>
                                        <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'recipient')} />
                                    </label>
                                    {selectedFile && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedFile(null);
                                                recipientReplyForm.setData('fichier', null);
                                            }}
                                            className="text-xs text-rose-500 hover:text-rose-600"
                                        >
                                            {__('Retirer')}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
