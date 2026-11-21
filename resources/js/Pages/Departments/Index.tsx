import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import { PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Building2, Pencil, Plus, RotateCcw, Search, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';

type Department = {
    id: number;
    name: string;
    category: string;
    level_type: string;
    is_active: boolean;
    sort_order: number;
    description?: string | null;
    parent?: {
        id: number;
        name: string;
    } | null;
    manager?: {
        id: number;
        name: string;
        email: string;
    } | null;
    establishment?: {
        id: number;
        name: string;
    } | null;
};

const CATEGORIES = ['administratif', 'medical', 'chirurgical'] as const;

export default function Index({
    departments,
    filters,
}: PageProps<{
    departments: Department[];
    filters: { search: string; category: string };
}>) {
    const { flash } = usePage<PageProps>().props;
    const { __ } = useTranslation();
    const [search, setSearch] = useState(filters?.search ?? '');
    const [category, setCategory] = useState(filters?.category ?? '');

    const submitFilters = (event: FormEvent) => {
        event.preventDefault();

        router.get(
            route('departments.index'),
            {
                search: search.trim() || undefined,
                category: category || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const resetFilters = () => {
        setSearch('');
        setCategory('');
        router.get(route('departments.index'), {}, { preserveState: true, replace: true });
    };

    const handleDelete = (department: Department) => {
        if (!window.confirm(__('Supprimer le departement ":name" ?', { name: department.name }))) {
            return;
        }

        router.delete(route('departments.destroy', department.id));
    };

    return (
        <AdminLayout
            title={__('Departements')}
            description={__('Gerez l arbre hierarchique administratif, medical et chirurgical via les departements.')}
            actions={
                <Link
                    href={route('departments.create')}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 via-sky-700 to-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-900/20 transition hover:-translate-y-0.5 hover:brightness-95"
                >
                    <Plus className="h-4 w-4" />
                    {__('Creer un nouveau departement')}
                </Link>
            }
        >
            <Head title={__('Departements')} />

            <div className="space-y-6">
                {flash.success ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                        {flash.success}
                    </div>
                ) : null}

                <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
                    <div className="border-b border-slate-200/70 px-6 py-5 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    {__('Arbre des departements')}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {__('Directions, sous-directions, bureaux, services et unites dans une seule structure.')}
                                </p>
                            </div>

                            <form onSubmit={submitFilters} className="flex w-full max-w-xl items-center gap-2">
                                <label className="relative flex-1">
                                    <span className="sr-only">{__('Rechercher')}</span>
                                    <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder={__('Rechercher un departement, categorie, responsable...')}
                                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 ps-10 pe-3 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
                                    />
                                </label>
                                <select
                                    value={category}
                                    onChange={(event) => setCategory(event.target.value)}
                                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
                                >
                                    <option value="">{__('Toutes les categories')}</option>
                                    {CATEGORIES.map((value) => (
                                        <option key={value} value={value}>
                                            {__(value.charAt(0).toUpperCase() + value.slice(1))}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="submit"
                                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700"
                                >
                                    <Search className="h-4 w-4" />
                                    {__('Rechercher')}
                                </button>
                                {filters?.search || filters?.category ? (
                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                        {__('Reinitialiser')}
                                    </button>
                                ) : null}
                            </form>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200/70 dark:divide-slate-800">
                            <thead className="bg-slate-50/80 dark:bg-slate-950/40">
                                <tr>
                                    {[__('ID'), __('Departement'), __('Categorie'), __('Parent'), __('Responsable'), __('Statut'), __('Actions')].map((label) => (
                                        <th
                                            key={label}
                                            className="px-6 py-4 text-start text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400"
                                        >
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                                {departments.length > 0 ? (
                                    departments.map((department) => (
                                        <tr key={department.id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-950/30">
                                            <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                                                #{department.id}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                                    {department.name}
                                                </div>
                                                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                    {department.level_type}
                                                    {department.establishment?.name ? ` • ${department.establishment.name}` : ''}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-300">
                                                {department.category}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-300">
                                                {department.parent?.name ?? __('Racine')}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-300">
                                                {department.manager?.name ?? __('Non assigne')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${department.is_active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                                                    {department.is_active ? __('Actif') : __('Inactif')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Link
                                                        href={route('departments.edit', department.id)}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                        {__('Modifier')}
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(department)}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        {__('Supprimer')}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                                            {filters?.search || filters?.category
                                                ? __('Aucun departement ne correspond a votre recherche.')
                                                : __('Aucun departement trouve pour le moment.')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
