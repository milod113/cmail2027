import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import { Head, Link } from '@inertiajs/react';
import { Users, ArrowRight, Mail, Clock } from 'lucide-react';

type GroupMessage = {
    id: number;
    sujet: string;
    contenu: string;
    important: boolean;
    lu: boolean;
    created_at: string | null;
    sent_at: string | null;
    participant_count: number;
    is_sender: boolean;
    sender?: {
        id: number;
        name: string;
        email: string;
    } | null;
};

export default function GroupIndex({ messages }: { messages: GroupMessage[] }) {
    const { __, locale } = useTranslation();

    const formatDate = (value: string | null) => {
        if (!value) {
            return __('Date inconnue');
        }

        return new Date(value).toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-FR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AuthenticatedLayout
            title={__('Messages groupés')}
            description={__('Retrouvez les conversations envoyées ou reçues par plusieurs participants.')}
        >
            <Head title={__('Messages groupés')} />

            <div className="space-y-6">
                <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/60 pb-5 dark:border-slate-800/60">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 text-white shadow-md">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{__('Conversations de groupe')}</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {messages.length} {__('conversation(s) groupée(s)')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4">
                        {messages.length > 0 ? messages.map((message) => (
                            <Link
                                key={message.id}
                                href={route('messages.show', message.id)}
                                className="group rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white to-slate-50/80 p-5 transition hover:border-cyan-300 hover:shadow-lg dark:border-slate-800 dark:from-slate-900 dark:to-slate-950/60"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-base font-semibold text-slate-900 dark:text-white">{message.sujet}</p>
                                            <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                                                <Users className="h-3.5 w-3.5" />
                                                {message.participant_count} {__('participants')}
                                            </span>
                                            {message.important ? (
                                                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                                                    {__('Important')}
                                                </span>
                                            ) : null}
                                        </div>

                                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                                            <span className="inline-flex items-center gap-1.5">
                                                <Mail className="h-4 w-4" />
                                                {message.is_sender ? __('Envoyé par vous') : `${__('De')} ${message.sender?.name ?? __('Inconnu')}`}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5">
                                                <Clock className="h-4 w-4" />
                                                {formatDate(message.sent_at ?? message.created_at)}
                                            </span>
                                        </div>

                                        <p className="mt-3 line-clamp-2 text-sm text-slate-700 dark:text-slate-200">
                                            {message.contenu}
                                        </p>
                                    </div>

                                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition group-hover:border-cyan-300 group-hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                        {__('Ouvrir')}
                                        <ArrowRight className="h-4 w-4" />
                                    </div>
                                </div>
                            </Link>
                        )) : (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
                                {__('Aucun message groupé disponible pour le moment.')}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
