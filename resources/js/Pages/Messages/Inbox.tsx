import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import { Head, Link, router } from '@inertiajs/react';
import { Filter, Search } from 'lucide-react';

type RoleOption = {
    id: number;
    nom_role: string;
};

type InboxMessage = {
    id: number;
    sujet: string;
    contenu: string;
    important: boolean;
    lu: boolean;
    sent_at: string | null;
    type_message: string | null;
    sender?: {
        id: number;
        name: string;
        email: string;
        role?: {
            id: number;
            nom_role: string;
        } | null;
    } | null;
};

export default function Inbox({
    stats,
    messages,
    filters,
    roles,
}: {
    stats: {
        unread: number;
        important: number;
        total: number;
    };
    messages: InboxMessage[];
    filters: {
        search: string;
        role: string;
    };
    roles: RoleOption[];
}) {
    const { __, locale } = useTranslation();

    const cards = [
        { label: __('Non lus'), value: String(stats.unread), tone: 'from-emerald-500 to-teal-600' },
        { label: __('Importants'), value: String(stats.important), tone: 'from-amber-500 to-orange-600' },
        { label: __('Total'), value: String(stats.total), tone: 'from-sky-500 to-cyan-600' },
    ];

    const applyFilters = (nextFilters: { search?: string; role?: string }) => {
        router.get(
            route('messages.inbox'),
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

    const formatDate = (value: string) =>
        new Date(value).toLocaleString(locale === 'ar' ? 'ar-DZ' : 'fr-FR');

    return (
        <AuthenticatedLayout
            title={__('BoÃ®te de rÃ©ception')}
            description={__('Consultez les messages reÃ§us et leur Ã©tat de lecture.')}
        >
            <Head title={__('BoÃ®te de rÃ©ception')} />

            <div className="space-y-6">
                <section className="grid gap-4 md:grid-cols-3">
                    {cards.map((card) => (
                        <div key={card.label} className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-lg shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
                            <div className={`inline-flex rounded-2xl bg-gradient-to-r ${card.tone} px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white`}>
                                {card.label}
                            </div>
                            <div className="mt-4 text-4xl font-semibold text-slate-900 dark:text-white">{card.value}</div>
                        </div>
                    ))}
                </section>

                <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{__('Messages reÃ§us')}</h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {__('Les messages les plus rÃ©cents apparaissent en premier.')}
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
                                    {__('Filtrer par rÃ´le')}
                                </span>
                                <select
                                    value={filters.role}
                                    onChange={(event) => applyFilters({ role: event.target.value })}
                                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                >
                                    <option value="">{__('Tous les rÃ´les')}</option>
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.nom_role}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4">
                        {messages.length > 0 ? (
                            messages.map((message) => (
                                <div key={message.id} className="rounded-3xl border border-slate-200/70 bg-slate-50/80 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/40">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-semibold text-slate-900 dark:text-white">{message.sujet}</p>
                                                {message.important ? (
                                                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                                                        {__('Important')}
                                                    </span>
                                                ) : null}
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                        message.lu
                                                            ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                                    }`}
                                                >
                                                    {message.lu ? __('Lu') : __('Non lu')}
                                                </span>
                                                {message.sender?.role?.nom_role ? (
                                                    <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300">
                                                        {message.sender.role.nom_role}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                                {__('De')} {message.sender?.name ?? __('Inconnu')} {message.sender?.email ? `(${message.sender.email})` : ''}
                                            </p>
                                            <p className="mt-3 line-clamp-2 text-sm text-slate-700 dark:text-slate-200">
                                                {message.contenu}
                                            </p>
                                        </div>

                                        <div className="flex flex-col items-end gap-3">
                                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                {message.sent_at ? formatDate(message.sent_at) : __('PlanifiÃ©')}
                                            </div>
                                            <Link
                                                href={route('messages.show', message.id)}
                                                className="rounded-full border border-cyan-300 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 transition hover:border-cyan-400 hover:bg-cyan-100 dark:border-cyan-700/60 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:border-cyan-500"
                                            >
                                                {__('Show')}
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => router.post(route('messages.archive.store', message.id))}
                                                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-cyan-400 hover:text-cyan-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-500 dark:hover:text-cyan-300"
                                            >
                                                {__('Archiver')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
                                {__('Aucun message trouvÃ© avec ce filtre.')}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
