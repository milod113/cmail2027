import { useTranslation } from '@/Hooks/useTranslation';
import { getPendingRequestTimeStatus } from '@/Utils/pendingRequestTime';
import { router } from '@inertiajs/react';
import { AlertCircle, Bell, Clock, Send, User } from 'lucide-react';
import { useState } from 'react';

type PendingSentRequest = {
    id: number;
    subject: string;
    body: string;
    excerpt: string;
    sent_at: string | null;
    created_at: string | null;
    receiver: {
        id: number;
        name: string;
        email?: string | null;
    } | null;
};

export default function PendingRequestsWidget({
    pendingSentRequests,
}: {
    pendingSentRequests: PendingSentRequest[];
}) {
    const { __ } = useTranslation();
    const [processingId, setProcessingId] = useState<number | null>(null);

    const pingMessage = (messageId: number) => {
        if (processingId !== null) {
            return;
        }

        setProcessingId(messageId);

        router.post(
            route('messages.ping', messageId),
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessingId(null),
            },
        );
    };

    return (
        <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-sm shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900/85">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <Bell className="h-3.5 w-3.5" />
                        {__('Mes demandes en attente')}
                    </div>
                    <h2 className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">
                        {__('Suivez les validations importantes en cours.')}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                        {__('Consultez les messages importants non encore valides, mesurez le temps d attente et relancez si necessaire.')}
                    </p>
                </div>

                <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
                    <Clock className="h-4 w-4 text-amber-500" />
                    {pendingSentRequests.length} {__('en attente')}
                </div>
            </div>

            <div className="mt-6 space-y-3">
                {pendingSentRequests.length > 0 ? (
                    pendingSentRequests.map((message) => {
                        const waitingStatus = getPendingRequestTimeStatus(message.sent_at ?? message.created_at);
                        const isProcessing = processingId === message.id;

                        return (
                            <article
                                key={message.id}
                                className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4 transition hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-slate-700"
                            >
                                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">
                                                <User className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-300" />
                                                {message.receiver?.name ?? __('Destinataire inconnu')}
                                            </span>
                                            <span className="inline-flex items-center gap-2 rounded-full bg-slate-200/70 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                <Clock className="h-3.5 w-3.5" />
                                                {__(waitingStatus.label)}
                                            </span>
                                            {waitingStatus.shouldSuggestPing ? (
                                                <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                                                    <AlertCircle className="h-3.5 w-3.5" />
                                                    {__('Relance suggeree')}
                                                </span>
                                            ) : null}
                                        </div>

                                        <p className="mt-4 font-semibold text-slate-900 dark:text-white">{message.subject}</p>
                                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                                            {message.excerpt}
                                        </p>
                                    </div>

                                    <div className="flex shrink-0 items-center">
                                        <button
                                            type="button"
                                            onClick={() => pingMessage(message.id)}
                                            disabled={!waitingStatus.shouldSuggestPing || processingId !== null}
                                            className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:border-amber-300 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/15"
                                        >
                                            <Send className="h-4 w-4" />
                                            {isProcessing ? __('Relance...') : __('Relancer')}
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })
                ) : (
                    <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center dark:border-slate-800 dark:bg-slate-950/40">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm dark:bg-slate-900 dark:text-slate-500">
                            <Bell className="h-6 w-6" />
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
                            {__('Aucune demande en attente')}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            {__('Les messages importants envoyes et non encore valides apparaitront ici.')}
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
