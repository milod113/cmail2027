import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import { Head, router } from '@inertiajs/react';

type ArchivedMessage = {
    id: number;
    sender_id: number;
    receiver_id: number;
    sujet: string;
    contenu: string;
    important: boolean;
    sent_at: string | null;
    scheduled_at: string | null;
    type_message: string | null;
    updated_at: string | null;
    sender?: {
        id: number;
        name: string;
        email: string;
    } | null;
    receiver?: {
        id: number;
        name: string;
        email: string;
    } | null;
};

export default function Archive({
    messages,
    userId,
}: {
    messages: ArchivedMessage[];
    userId: number;
}) {
    const { __, locale } = useTranslation();

    const formatDate = (value: string | null) => {
        if (!value) {
            return __('Inconnu');
        }

        return new Date(value).toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-FR');
    };

    return (
        <AuthenticatedLayout
            title={__('Archives')}
            description={__('Messages archivés et conservés pour une récupération ultérieure.')}
        >
            <Head title={__('Archives')} />

            <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
                <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{__('Éléments archivés')}</h2>
                    <div className="mt-6 space-y-4">
                        {messages.length > 0 ? messages.map((message) => {
                            const isSentByUser = message.sender_id === userId;
                            const counterpart = isSentByUser ? message.receiver : message.sender;

                            return (
                                <div key={message.id} className="rounded-3xl border border-slate-200/70 bg-slate-50/80 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/40">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-medium text-slate-900 dark:text-white">{message.sujet}</p>
                                                <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                    {__('Archivé')}
                                                </span>
                                                {message.important ? (
                                                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                                                        {__('Important')}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                                {isSentByUser ? __('À') : __('De')} {counterpart?.name ?? __('Inconnu')}
                                                {counterpart?.email ? ` (${counterpart.email})` : ''}
                                            </p>
                                            <p className="mt-3 line-clamp-2 text-sm text-slate-700 dark:text-slate-200">
                                                {message.contenu}
                                            </p>
                                            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                                                {__('Dernière mise à jour')}: {formatDate(message.updated_at)}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => router.post(route('messages.archive.restore', message.id))}
                                            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-cyan-400 hover:text-cyan-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-500 dark:hover:text-cyan-300"
                                        >
                                            {__('Désarchiver')}
                                        </button>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
                                {__('Aucun message archivé pour le moment.')}
                            </div>
                        )}
                    </div>
                </section>

                <section className="rounded-[2rem] border border-white/70 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 p-6 text-white shadow-2xl shadow-slate-900/30">
                    <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100">{__('Rétention')}</div>
                    <h3 className="mt-4 text-2xl font-semibold">{messages.length}</h3>
                    <p className="mt-4 text-sm text-slate-200">
                        {__('Les messages archivés sont masqués de la boîte de réception et des messages envoyés jusqu’à leur restauration.')}
                    </p>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
