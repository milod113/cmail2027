import { useTranslation } from '@/Hooks/useTranslation';
import { router } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, Clock, ShieldAlert, User } from 'lucide-react';
import { useState } from 'react';

type ActionRequiredMessage = {
    id: number;
    subject: string;
    body: string;
    excerpt: string;
    sent_at: string | null;
    created_at: string | null;
    sender: {
        id: number;
        name: string;
        email?: string | null;
    } | null;
};

export default function ActionRequiredWidget({
    actionRequiredMessages,
}: {
    actionRequiredMessages: ActionRequiredMessage[];
}) {
    const { __, locale } = useTranslation();
    const [processingId, setProcessingId] = useState<number | null>(null);

    if (actionRequiredMessages.length === 0) {
        return null;
    }

    const acknowledgeMessage = (messageId: number) => {
        if (processingId !== null) {
            return;
        }

        setProcessingId(messageId);

        router.post(
            route('messages.acknowledge', messageId),
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessingId(null),
            },
        );
    };

    const formatReceivedAt = (value: string | null) => {
        if (!value) {
            return __('Date inconnue');
        }

        return new Date(value).toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <section className="overflow-hidden rounded-[2rem] border border-rose-200 bg-[linear-gradient(135deg,rgba(255,241,242,0.96),rgba(255,255,255,0.98))] shadow-sm shadow-rose-100/80 dark:border-rose-500/20 dark:bg-[linear-gradient(135deg,rgba(127,29,29,0.18),rgba(15,23,42,0.92))]">
            <div className="border-b border-rose-200/80 bg-rose-50/80 px-6 py-5 dark:border-rose-500/20 dark:bg-rose-500/10">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            {__('Actions prioritaires')}
                        </div>
                        <h2 className="mt-3 text-xl font-semibold text-rose-950 dark:text-white">
                            {__('Des messages importants attendent votre validation.')}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-rose-800/80 dark:text-rose-100/80">
                            {__('Confirmez rapidement la reception pour rassurer l expediteur et faire avancer le suivi des urgences.')}
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-700 shadow-sm dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                        <AlertCircle className="h-4 w-4" />
                        {actionRequiredMessages.length} {__('a valider')}
                    </div>
                </div>
            </div>

            <div className="space-y-3 p-6">
                {actionRequiredMessages.map((message) => {
                    const receivedAt = message.sent_at ?? message.created_at;
                    const isProcessing = processingId === message.id;

                    return (
                        <article
                            key={message.id}
                            className="rounded-[1.5rem] border border-rose-200 bg-white/90 p-4 shadow-sm dark:border-rose-500/20 dark:bg-slate-950/70"
                        >
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                                            <User className="h-3.5 w-3.5" />
                                            {message.sender?.name ?? __('Expediteur inconnu')}
                                        </span>
                                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                            <Clock className="h-3.5 w-3.5" />
                                            {__('Recu le')} {formatReceivedAt(receivedAt)}
                                        </span>
                                    </div>

                                    <p className="mt-4 font-semibold text-slate-900 dark:text-white">{message.subject}</p>
                                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                                        {message.excerpt}
                                    </p>
                                </div>

                                <div className="flex shrink-0 items-center">
                                    <button
                                        type="button"
                                        onClick={() => acknowledgeMessage(message.id)}
                                        disabled={processingId !== null}
                                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        {isProcessing ? __('Validation...') : __('Valider la reception')}
                                    </button>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
