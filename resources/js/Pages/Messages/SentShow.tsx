import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import { Head, Link } from '@inertiajs/react';

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
};

function formatDate(value: string | null, locale: string) {
    if (!value) {
        return null;
    }

    return new Date(value).toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-FR');
}

export default function SentShow({ message }: { message: MessageDetail }) {
    const { __, locale } = useTranslation();

    const sentAt = formatDate(message.sent_at, locale);
    const scheduledAt = formatDate(message.scheduled_at, locale);
    const receiptRequestedAt = formatDate(message.receipt_requested_at, locale);
    const deadline = formatDate(message.deadline_reponse, locale);

    return (
        <AuthenticatedLayout
            title={message.sujet}
            description={__('Détail du message envoyé.')}
        >
            <Head title={message.sujet} />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-600 dark:text-cyan-300">
                            {__('Messages envoyés')}
                        </p>
                        <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                            {message.sujet}
                        </h1>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            {__('À')} {message.receiver?.name ?? __('Inconnu')}
                            {message.receiver?.email ? ` (${message.receiver.email})` : ''}
                        </p>
                    </div>

                    <Link
                        href={route('messages.sent')}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-cyan-500 dark:hover:text-cyan-300"
                    >
                        {__('Retour aux messages envoyés')}
                    </Link>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.35fr,0.85fr]">
                    <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
                        <div className="flex flex-wrap items-center gap-3">
                            {message.important ? (
                                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                                    {__('Important')}
                                </span>
                            ) : null}
                            {message.requires_receipt ? (
                                <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300">
                                    {__('Accusé demandé')}
                                </span>
                            ) : null}
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                {message.type_message ?? __('Normal')}
                            </span>
                        </div>

                        <div className="mt-6 rounded-3xl bg-slate-50 p-5 text-sm leading-7 text-slate-700 dark:bg-slate-950/50 dark:text-slate-200">
                            <p className="whitespace-pre-wrap text-start">{message.contenu}</p>
                        </div>

                        {message.attachment_url ? (
                            <div className="mt-6">
                                <a
                                    href={message.attachment_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700"
                                >
                                    {__('Télécharger la pièce jointe')}
                                </a>
                            </div>
                        ) : null}
                    </section>

                    <aside className="space-y-6">
                        <section className="rounded-[2rem] border border-white/70 bg-gradient-to-br from-cyan-600 via-sky-700 to-slate-900 p-6 text-white shadow-2xl shadow-cyan-900/20">
                            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-100">
                                {__('Informations')}
                            </p>
                            <div className="mt-5 space-y-4 text-sm">
                                <div>
                                    <p className="text-cyan-100/80">{__('Envoyé le')}</p>
                                    <p className="mt-1 font-medium text-white">{sentAt ?? __('Non envoyé')}</p>
                                </div>
                                <div>
                                    <p className="text-cyan-100/80">{__('Planifié pour')}</p>
                                    <p className="mt-1 font-medium text-white">{scheduledAt ?? __('Aucune planification')}</p>
                                </div>
                                <div>
                                    <p className="text-cyan-100/80">{__('Accusé demandé')}</p>
                                    <p className="mt-1 font-medium text-white">
                                        {message.requires_receipt ? receiptRequestedAt ?? __('Oui') : __('Non')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-cyan-100/80">{__('Date limite de réponse')}</p>
                                    <p className="mt-1 font-medium text-white">{deadline ?? __('Aucune date limite')}</p>
                                </div>
                                <div>
                                    <p className="text-cyan-100/80">{__('Redirection')}</p>
                                    <p className="mt-1 font-medium text-white">
                                        {message.can_be_redirected ? __('Autorisée') : __('Non autorisée')}
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                {__('Destinataires')}
                            </h2>
                            <div className="mt-4 rounded-3xl bg-slate-50 p-4 dark:bg-slate-950/50">
                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                    {message.receiver?.name ?? __('Inconnu')}
                                </p>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    {message.receiver?.email ?? '-'}
                                </p>
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
