import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import { PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { BriefcaseBusiness, Pencil, Plus, Trash2 } from 'lucide-react';

type PositionItem = {
    id: number;
    title: string;
    code?: string | null;
    is_head: boolean;
    is_active: boolean;
    hierarchy_order: number;
    active_user_positions_count: number;
    department?: { id: number; name: string; parent?: { id: number; name: string } | null; category?: string | null; level_type?: string | null } | null;
    role?: { id: number; nom_role: string } | null;
    reports_to_position?: { id: number; title: string } | null;
};

export default function Index({ positions }: PageProps<{ positions: PositionItem[] }>) {
    const { flash } = usePage<PageProps>().props;
    const { __ } = useTranslation();

    const handleDelete = (position: PositionItem) => {
        if (!window.confirm(__('Supprimer le poste ":name" ?', { name: position.title }))) {
            return;
        }

        router.delete(route('positions.destroy', position.id));
    };

    return (
        <AdminLayout
            title={__('Postes')}
            description={__('Administrez les postes reels de chaque departement pour structurer la chaine hierarchique.')}
            actions={
                <Link
                    href={route('positions.create')}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 via-sky-700 to-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-900/20 transition hover:-translate-y-0.5 hover:brightness-95"
                >
                    <Plus className="h-4 w-4" />
                    {__('Creer un poste')}
                </Link>
            }
        >
            <Head title={__('Postes')} />

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
                                <BriefcaseBusiness className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    {__('Cartographie des postes')}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {__('Directeur, sous-directeur, chef de bureau et tous les postes relies aux departements hierarchiques.')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200/70 dark:divide-slate-800">
                            <thead className="bg-slate-50/80 dark:bg-slate-950/40">
                                <tr>
                                    {[__('Poste'), __('Departement'), __('Role'), __('Reporte a'), __('Affectations'), __('Statut'), __('Actions')].map((label) => (
                                        <th key={label} className="px-6 py-4 text-start text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                                {positions.length > 0 ? positions.map((position) => (
                                    <tr key={position.id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-950/30">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900 dark:text-white">{position.title}</div>
                                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                {position.code || __('Sans code')} • #{position.hierarchy_order}
                                                {position.is_head ? ` • ${__('Responsable')}` : ''}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                            {position.department?.name ?? __('N/A')}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                            {position.role?.nom_role ?? __('Aucun')}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                            {position.reports_to_position?.title ?? __('Aucun')}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                            {position.active_user_positions_count}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${position.is_active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                                                {position.is_active ? __('Actif') : __('Inactif')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Link
                                                    href={route('positions.edit', position.id)}
                                                    className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                    {__('Modifier')}
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(position)}
                                                    className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    {__('Supprimer')}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                                            {__('Aucun poste n a encore ete configure.')}
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
