import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import { Head, Link, router } from '@inertiajs/react';
import { Filter, Search } from 'lucide-react';

type RoleOption = {
    id: number;
    nom_role: string;
};

type SentMessage = {
    id: number;
    sujet: string;
    contenu: string;
    important: boolean;
    sent_at: string | null;
    scheduled_at: string | null;
    type_message: string | null;
    requires_receipt: boolean;
    receiver?: {
        id: number;
        name: string;
        email: string;
        role?: {
            id: number;
            nom_role: string;
        } | null;
    } | null;
};

export default function Sent({
    messages,
    filters,
    roles,
}: {
    messages: SentMessage[];
    filters: {
        search: string;
        role: string;
    };
    roles: RoleOption[];
}) {
    const { __, locale } = useTranslation();

    const formatDate = (value: string) =>
        new Date(value).toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-FR');

    const applyFilters = (nextFilters: { search?: string; role?: string }) => {
        router.get(
            route('messages.sent'),
            {
                search: nextFilters.search ?? filters.search,
                role: nextFilters.role ?? filters.role,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    return (
        <AuthenticatedLayout
            title={__('Messages envoyés')}
            description={__('Suivez les messages envoyés et programmés.')}
        >
            <Head title={__('Messages envoyés')} />

            <div className="grid gap-6 lg:grid-cols-[1.4fr,0.9fr]">
                <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{__('Historique des envois')}</h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {__('Suivez les messages envoyés et programmés.')}
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="block">
                                <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                    <Search className="h-4 w-4 text-cyan-500" />
                                    {__('Rechercher')}
                                </span>
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(event) => applyFilters({ search: event.target.value })}
                                    placeholder={__('Tapez un nom ou un email')}
                                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                    <Filter className="h-4 w-4 text-cyan-500" />
                                    {__('Filtrer par rôle')}
                                </span>
                                <select
                                    value={filters.role}
                                    onChange={(event) => applyFilters({ role: event.target.value })}
                                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                >
                                    <option value="">{__('Tous les rôles')}</option>
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.nom_role}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        {messages.length > 0 ? messages.map((message) => (
                            <Link
                                key={message.id}
                                href={route('messages.sent.show', message.id)}
                                className="block rounded-3xl border border-slate-200/70 bg-slate-50/80 p-5 transition hover:border-cyan-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-cyan-500/60"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-base font-medium text-slate-900 dark:text-white">{message.sujet}</p>
                                            {message.important ? (
                                                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                                                    {__('Important')}
                                                </span>
                                            ) : null}
                                            {message.requires_receipt ? (
                                                <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300">
                                                    {__('Accusé demandé')}
                                                </span>
                                            ) : null}
                                            {message.receiver?.role?.nom_role ? (
                                                <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                    {message.receiver.role.nom_role}
                                                </span>
                                            ) : null}
                                        </div>
                                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                            {__('À')} {message.receiver?.name ?? __('Inconnu')} {message.receiver?.email ? `(${message.receiver.email})` : ''}
                                        </p>
                                        <p className="mt-3 line-clamp-2 text-sm text-slate-700 dark:text-slate-200">
                                            {message.contenu}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-3">
                                        <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                                            {message.sent_at
                                                ? formatDate(message.sent_at)
                                                : message.scheduled_at
                                                  ? `${__('Planifié')} ${formatDate(message.scheduled_at)}`
                                                  : __('Brouillon')}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.preventDefault();
                                                event.stopPropagation();
                                                router.post(route('messages.archive.store', message.id));
                                            }}
                                            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-cyan-400 hover:text-cyan-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-500 dark:hover:text-cyan-300"
                                        >
                                            {__('Archiver')}
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        )) : (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
                                {__('Aucun message trouvé avec ce filtre.')}
                            </div>
                        )}
                    </div>
                </section>

                <section className="rounded-[2rem] border border-white/70 bg-gradient-to-br from-cyan-600 via-sky-700 to-slate-900 p-6 text-white shadow-2xl shadow-cyan-900/20">
                    <div className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-100">{__('Aperçu')}</div>
                    <div className="mt-4 text-4xl font-semibold">{messages.length}</div>
                    <p className="mt-2 text-sm text-cyan-50/85">{__('Messages enregistrés dans les éléments envoyés.')}</p>
                    <div className="mt-8 rounded-3xl bg-white/10 p-5 backdrop-blur">
                        <p className="text-sm text-cyan-50/90">
                            {__('Les messages programmés apparaissent ici jusqu’à leur envoi effectif.')}
                        </p>
                    </div>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
