import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import { Head, Link } from '@inertiajs/react';

type DraftItem = {
    id: number;
    sujet: string | null;
    contenu: string | null;
    receiver_count: number;
    recipients: Array<{ id: number; name: string; email: string }>;
    updated_at: string | null;
    has_attachment: boolean;
    type_message: string | null;
};

export default function Drafts({ drafts }: { drafts: DraftItem[] }) {
    const { __, locale } = useTranslation();

    const formatDate = (value: string | null) => {
        if (!value) {
            return __('Inconnu');
        }

        return new Date(value).toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-FR');
    };

    return (
        <AuthenticatedLayout
            title={__('Brouillons')}
            description={__('Compositions enregistrées que vous pouvez reprendre puis envoyer plus tard.')}
        >
            <Head title={__('Brouillons')} />

            <div className="space-y-6">
                <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{__('Espace brouillons')}</h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {__('Ouvrez un brouillon, complétez-le, puis envoyez-le quand vous êtes prêt.')}
                            </p>
                        </div>
                        <Link
                            href={route('messages.create')}
                            className="inline-flex rounded-full bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700"
                        >
                            {__('Nouveau message')}
                        </Link>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        {drafts.length > 0 ? drafts.map((draft) => (
                            <Link
                                key={draft.id}
                                href={route('drafts.edit', draft.id)}
                                className="rounded-3xl border border-slate-200/70 bg-gradient-to-br from-amber-50 to-orange-50 p-5 transition hover:border-amber-300 dark:border-slate-800 dark:from-amber-500/10 dark:to-orange-500/10"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <p className="font-medium text-slate-900 dark:text-white">
                                        {draft.sujet || __('Brouillon sans sujet')}
                                    </p>
                                    <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-slate-900/60 dark:text-amber-300">
                                        {draft.type_message || __('Normal')}
                                    </span>
                                </div>

                                <p className="mt-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                                    {draft.contenu || __('Aucun contenu pour le moment.')}
                                </p>

                                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                                    {__('Destinataires')}: {draft.receiver_count}
                                </p>

                                {draft.recipients.length > 0 ? (
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        {draft.recipients.map((recipient) => recipient.name).join(', ')}
                                    </p>
                                ) : null}

                                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                                    {__('Dernière mise à jour')}: {formatDate(draft.updated_at)}
                                </p>

                                {draft.has_attachment ? (
                                    <p className="mt-2 text-xs font-medium text-cyan-700 dark:text-cyan-300">
                                        {__('Pièce jointe incluse')}
                                    </p>
                                ) : null}
                            </Link>
                        )) : (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400 md:col-span-2">
                                {__('Aucun brouillon enregistré pour le moment.')}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
