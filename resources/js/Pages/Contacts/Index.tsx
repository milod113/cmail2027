import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight, Building2, Filter, Mail, RotateCcw, Search, ShieldCheck, Star, UserRound } from 'lucide-react';
import { FormEvent, useState } from 'react';

type ContactUser = {
    id: number;
    name: string;
    username?: string | null;
    email: string;
    is_online: boolean;
    is_blocked: boolean;
    is_favorite: boolean;
    department?: {
        id: number;
        name: string;
    } | null;
    role?: {
        id: number;
        nom_role: string;
    } | null;
};

type Filters = {
    search: string;
    department: string;
    role: string;
    status: string;
};

type Option = {
    id: number;
    name?: string;
    nom_role?: string;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedUsers = {
    data: ContactUser[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: PaginationLink[];
};

export default function ContactsIndex({
    stats,
    users,
    filters,
    filterOptions,
}: {
    stats: {
        users: number;
        departments: number;
        establishments: number;
    };
    users: PaginatedUsers;
    filters: Filters;
    filterOptions: {
        departments: Option[];
        roles: Option[];
    };
}) {
    const { __ } = useTranslation();
    const [form, setForm] = useState<Filters>(filters);

    const submit = (event: FormEvent) => {
        event.preventDefault();

        router.get(
            route('contacts.index'),
            {
                search: form.search || undefined,
                department: form.department || undefined,
                role: form.role || undefined,
                status: form.status || undefined,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const resetFilters = () => {
        const emptyFilters = {
            search: '',
            department: '',
            role: '',
            status: '',
        };

        setForm(emptyFilters);
        router.get(route('contacts.index'), {}, { preserveState: true, replace: true });
    };

    const toggleFavorite = (user: ContactUser) => {
        if (user.is_favorite) {
            router.delete(route('contacts.favorite.destroy', user.id), { preserveScroll: true });
            return;
        }

        router.post(route('contacts.favorite.store', user.id), {}, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            title={__('Contacts')}
            description={__("Annuaire des utilisateurs, departements et etablissements de l'application.")}
        >
            <Head title={__('Contacts')} />

            <div className="space-y-6">
                <section className="grid gap-4 md:grid-cols-3">
                    {[
                        [__('Utilisateurs'), String(stats.users)],
                        [__('Departements'), String(stats.departments)],
                        [__('Etablissements'), String(stats.establishments)],
                    ].map(([label, value]) => (
                        <div
                            key={label}
                            className="rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80"
                        >
                            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">
                                {label}
                            </p>
                            <p className="mt-4 text-4xl font-semibold text-slate-900 dark:text-white">
                                {value}
                            </p>
                        </div>
                    ))}
                </section>

                <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
                    <div className="flex flex-col gap-6">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                {__('Annuaire des utilisateurs')}
                            </h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {__('Recherchez et filtrez les utilisateurs par nom, role, departement et statut.')}
                            </p>
                        </div>

                        <form
                            onSubmit={submit}
                            className="rounded-[1.75rem] border border-cyan-100/80 bg-gradient-to-br from-cyan-50 via-white to-sky-50 p-4 shadow-inner shadow-cyan-100/40 dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
                        >
                            <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
                                <label className="space-y-2">
                                    <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                                        {__('Rechercher')}
                                    </span>
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-600 dark:text-cyan-300" />
                                        <input
                                            type="text"
                                            value={form.search}
                                            onChange={(event) =>
                                                setForm((current) => ({
                                                    ...current,
                                                    search: event.target.value,
                                                }))
                                            }
                                            placeholder={__('Rechercher par nom, identifiant ou email')}
                                            className="block w-full rounded-2xl border border-cyan-200/80 bg-white/90 py-3 pe-4 ps-12 text-slate-900 shadow-sm transition focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                                        />
                                    </div>
                                </label>

                                <label className="space-y-2">
                                    <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                                        {__('Departement')}
                                    </span>
                                    <select
                                        value={form.department}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                department: event.target.value,
                                            }))
                                        }
                                        className="w-full rounded-2xl border border-cyan-200/80 bg-white/90 px-4 py-3 text-slate-900 shadow-sm transition focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                                    >
                                        <option value="">{__('Tous les departements')}</option>
                                        {filterOptions.departments.map((department) => (
                                            <option key={department.id} value={department.id}>
                                                {department.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="space-y-2">
                                    <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                                        {__('Role')}
                                    </span>
                                    <select
                                        value={form.role}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                role: event.target.value,
                                            }))
                                        }
                                        className="w-full rounded-2xl border border-cyan-200/80 bg-white/90 px-4 py-3 text-slate-900 shadow-sm transition focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                                    >
                                        <option value="">{__('Tous les roles')}</option>
                                        {filterOptions.roles.map((role) => (
                                            <option key={role.id} value={role.id}>
                                                {role.nom_role}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="space-y-2">
                                    <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                                        {__('Statut')}
                                    </span>
                                    <select
                                        value={form.status}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                status: event.target.value,
                                            }))
                                        }
                                        className="w-full rounded-2xl border border-cyan-200/80 bg-white/90 px-4 py-3 text-slate-900 shadow-sm transition focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                                    >
                                        <option value="">{__('Tous les statuts')}</option>
                                        <option value="online">{__('En ligne')}</option>
                                        <option value="offline">{__('Hors ligne')}</option>
                                        <option value="blocked">{__('Bloque')}</option>
                                    </select>
                                </label>
                            </div>

                            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {__("Affinez l'annuaire avec des filtres rapides et appliquez-les instantanement.")}
                                </p>

                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 sm:w-auto"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                        {__('Reinitialiser')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 via-sky-700 to-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-900/20 transition hover:-translate-y-0.5 hover:brightness-95 sm:w-auto"
                                    >
                                        <Filter className="h-4 w-4" />
                                        {__('Appliquer les filtres')}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {users.data.length > 0 ? (
                            users.data.map((user) => (
                                <div
                                    key={user.id}
                                    className="rounded-3xl border border-slate-200/70 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/40"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                                                <UserRound className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-base font-semibold text-slate-900 dark:text-white">
                                                    {user.name}
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    @{user.username ?? __('sans-identifiant')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => toggleFavorite(user)}
                                                className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition ${
                                                    user.is_favorite
                                                        ? 'border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
                                                        : 'border-slate-200 bg-white text-slate-400 hover:border-amber-200 hover:text-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500'
                                                }`}
                                                title={user.is_favorite ? __('Retirer des favoris') : __('Ajouter aux favoris')}
                                            >
                                                <Star className={`h-4 w-4 ${user.is_favorite ? 'fill-current' : ''}`} />
                                            </button>

                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    user.is_blocked
                                                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
                                                        : user.is_online
                                                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                                                          : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                }`}
                                            >
                                                {user.is_blocked
                                                    ? __('Bloque')
                                                    : user.is_online
                                                      ? __('En ligne')
                                                      : __('Hors ligne')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                                        {user.is_favorite && (
                                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-300">
                                                <Star className="h-4 w-4 fill-current" />
                                                <span>{__('Contact favori')}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                                            <span>{user.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                                            <span>{user.department?.name ?? __('Aucun departement assigné')}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                                            <span>{user.role?.nom_role ?? __('Aucun role assigné')}</span>
                                        </div>
                                    </div>

                                    <div className="mt-5">
                                        <Link
                                            href={route('contacts.show', user.id)}
                                            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 via-sky-700 to-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-900/20 transition hover:-translate-y-0.5 hover:brightness-95"
                                        >
                                            {__('Voir le profil')}
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="md:col-span-2 xl:col-span-3">
                                <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
                                    {__('Aucun utilisateur trouve pour la recherche et les filtres actuels.')}
                                </div>
                            </div>
                        )}
                    </div>

                    {users.total > 0 && (
                        <div className="mt-6 flex flex-col gap-4 border-t border-slate-200/70 pt-6 dark:border-slate-800">
                            <div className="flex flex-col gap-2 text-sm text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                                <p>
                                    {__('Affichage de')} <span className="font-semibold text-slate-700 dark:text-slate-200">{users.from ?? 0}</span> {__('a')}{' '}
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{users.to ?? 0}</span> {__('sur')}{' '}
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{users.total}</span> {__('utilisateurs')}
                                </p>
                                <p>
                                    {__('Page')} <span className="font-semibold text-slate-700 dark:text-slate-200">{users.current_page}</span> {__('sur')}{' '}
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{users.last_page}</span>
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {users.links.map((link, index) => {
                                    const label = link.label
                                        .replace('&laquo; Previous', __('Precedent'))
                                        .replace('Next &raquo;', __('Suivant'));

                                    const baseClass =
                                        'inline-flex min-w-10 items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition';

                                    if (!link.url) {
                                        return (
                                            <span
                                                key={`${label}-${index}`}
                                                className={`${baseClass} cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600`}
                                                dangerouslySetInnerHTML={{ __html: label }}
                                            />
                                        );
                                    }

                                    return (
                                        <Link
                                            key={`${label}-${index}`}
                                            href={link.url}
                                            preserveState
                                            preserveScroll
                                            className={`${baseClass} ${
                                                link.active
                                                    ? 'bg-gradient-to-r from-cyan-600 via-sky-700 to-slate-900 text-white shadow-lg shadow-cyan-900/20'
                                                    : 'border border-slate-200 bg-white text-slate-700 hover:border-cyan-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: label }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </AuthenticatedLayout>
    );
}


