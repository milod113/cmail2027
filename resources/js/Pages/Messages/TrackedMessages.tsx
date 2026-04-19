import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import { Head, Link } from '@inertiajs/react';
import { Activity, CalendarClock, CheckCircle2, Eye, Mail, UserRound } from 'lucide-react';

type TrackedMessage = {
    id: number;
    sujet: string;
    contenu: string;
    sent_at: string | null;
    read_at: string | null;
    is_tracked: boolean;
    is_delivered: boolean;
    created_at: string | null;
    receiver?: {
        id: number;
        name: string;
        email: string;
    } | null;
};

function StatusBadge({
    readAt,
    isDelivered,
    __,
    locale,
}: {
    readAt: string | null;
    isDelivered: boolean;
    __: (key: string) => string;
    locale: string;
}) {
    if (readAt) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {__('Lu le')} {new Date(readAt).toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-FR')}
            </span>
        );
    }

    if (!isDelivered) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                <CalendarClock className="h-3.5 w-3.5" />
                {__('En attente d’envoi')}
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Eye className="h-3.5 w-3.5" />
            {__('Non lu')}
        </span>
    );
}

export default function TrackedMessages({ messages }: { messages: TrackedMessage[] }) {
    const { __, locale } = useTranslation();

    const trackedCount = messages.length;
    const readCount = messages.filter((message) => message.read_at).length;
    const unreadCount = messages.filter((message) => message.is_delivered && !message.read_at).length;

    const formatDate = (value: string | null) => {
        if (!value) {
            return __('Date indisponible');
        }

        return new Date(value).toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AuthenticatedLayout
            title={__('Suivi des messages')}
            description={__('Consultez le statut de lecture des messages envoyés avec suivi de lecture.')}
        >
            <Head title={__('Suivi des messages')} />

            <div className="space-y-6">
                <section className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-3xl border border-cyan-100/80 bg-gradient-to-br from-cyan-50 via-white to-sky-50 p-5 shadow-lg shadow-cyan-100/40 dark:border-cyan-500/10 dark:from-cyan-950/20 dark:via-slate-900 dark:to-sky-950/20">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 shadow-md">
                                <Activity className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{trackedCount}</p>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{__('Messages avec suivi')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-emerald-100/80 bg-gradient-to-br from-emerald-50 via-white to-green-50 p-5 shadow-lg shadow-emerald-100/40 dark:border-emerald-500/10 dark:from-emerald-950/20 dark:via-slate-900 dark:to-green-950/20">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-md">
                                <CheckCircle2 className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{readCount}</p>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{__('Déjà lus')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-lg shadow-slate-200/40 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 shadow-sm dark:bg-slate-800">
                                <Eye className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{unreadCount}</p>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{__('En attente de lecture')}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/85 shadow-xl shadow-slate-200/40 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/85">
                    <div className="border-b border-slate-200/70 bg-gradient-to-r from-slate-50 to-cyan-50/50 px-6 py-5 dark:border-slate-800 dark:from-slate-900 dark:to-cyan-950/10">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {__('Suivi des messages')}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {__('Visualisez rapidement si vos messages importants ont été consultés.')}
                        </p>
                    </div>

                    {messages.length > 0 ? (
                        <div className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
                            {messages.map((message) => (
                                <Link
                                    key={message.id}
                                    href={route('messages.sent.show', message.id)}
                                    className="block px-6 py-5 transition hover:bg-cyan-50/50 dark:hover:bg-cyan-500/5"
                                >
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                                                    {message.sujet}
                                                </h3>
                                                <StatusBadge readAt={message.read_at} isDelivered={message.is_delivered} __={__} locale={locale} />
                                            </div>

                                            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <UserRound className="h-4 w-4 text-cyan-500" />
                                                    {message.receiver?.name ?? __('Destinataire inconnu')}
                                                </span>
                                                {message.receiver?.email && (
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <Mail className="h-4 w-4 text-cyan-500" />
                                                        {message.receiver.email}
                                                    </span>
                                                )}
                                            </div>

                                            <p className="mt-3 line-clamp-2 text-sm text-slate-700 dark:text-slate-300">
                                                {message.contenu}
                                            </p>
                                        </div>

                                        <div className="min-w-[220px] rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-950/40">
                                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                                                {__('Envoyé')}
                                            </p>
                                            <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">
                                                {formatDate(message.sent_at ?? message.created_at)}
                                            </p>

                                            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                                                {__('Lecture')}
                                            </p>
                                            <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">
                                                {message.read_at ? formatDate(message.read_at) : __('Pas encore lu')}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="px-6 py-16 text-center">
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                <Activity className="h-10 w-10 text-slate-400 dark:text-slate-600" />
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                                {__('Aucun message avec suivi')}
                            </h3>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                {__('Demandez un suivi de lecture lors de l’envoi d’un message pour voir son statut ici.')}
                            </p>
                            <Link
                                href={route('messages.create')}
                                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-900/20 transition hover:brightness-95"
                            >
                                <Mail className="h-4 w-4" />
                                {__('Nouveau message')}
                            </Link>
                        </div>
                    )}
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
