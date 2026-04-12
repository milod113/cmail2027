import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import { PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react';

type Department = {
    id: number;
    name: string;
    establishment: {
        id: number;
        name: string;
    };
};

export default function Index({
    departments,
}: PageProps<{
    departments: Department[];
}>) {
    const { flash } = usePage<PageProps>().props;
    const { __ } = useTranslation();

    const handleDelete = (department: Department) => {
        if (!window.confirm(__('Supprimer le département ":name" ?', { name: department.name }))) {
            return;
        }

        router.delete(route('departments.destroy', department.id));
    };

    return (
        <AuthenticatedLayout
            title={__('Départements')}
            description={__('Gérez les départements hospitaliers et leurs établissements liés.')}
            actions={
                <Link
                    href={route('departments.create')}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 via-sky-700 to-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-900/20 transition hover:-translate-y-0.5 hover:brightness-95"
                >
                    <Plus className="h-4 w-4" />
                    {__('Créer un nouveau département')}
                </Link>
            }
        >
            <Head title={__('Départements')} />

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
                                    {__('Annuaire des départements')}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {__('Afficher, créer, modifier et supprimer des départements.')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200/70 dark:divide-slate-800">
                            <thead className="bg-slate-50/80 dark:bg-slate-950/40">
                                <tr>
                                    {[__('ID'), __('Nom du département'), __('Nom de l’établissement'), __('Actions')].map((label) => (
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
                                            <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-200">
                                                {department.name}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-300">
                                                {department.establishment?.name ?? __('N/A')}
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
                                        <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                                            {__('Aucun département trouvé pour le moment.')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}
