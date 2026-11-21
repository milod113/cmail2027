import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import { PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2, UserRoundCheck } from 'lucide-react';

type Assignment = {
    id: number;
    is_primary: boolean;
    is_acting: boolean;
    is_active: boolean;
    starts_at?: string | null;
    ends_at?: string | null;
    user?: { id: number; name: string; email: string } | null;
    position?: {
        id: number;
        title: string;
        department?: {
            id: number;
            name: string;
            parent?: { id: number; name: string } | null;
        } | null;
    } | null;
};

export default function Index({ assignments }: PageProps<{ assignments: Assignment[] }>) {
    const { flash } = usePage<PageProps>().props;
    const { __ } = useTranslation();

    const handleDelete = (assignment: Assignment) => {
        if (!window.confirm(__('Supprimer cette affectation ?'))) {
            return;
        }

        router.delete(route('user-positions.destroy', assignment.id));
    };

    return (
        <AdminLayout
            title={__('Affectations utilisateurs')}
            description={__('Reliez les utilisateurs reels aux postes pour rendre l organigramme operationnel.')}
            actions={
                <Link
                    href={route('user-positions.create')}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 via-sky-700 to-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-900/20 transition hover:-translate-y-0.5 hover:brightness-95"
                >
                    <Plus className="h-4 w-4" />
                    {__('Creer une affectation')}
                </Link>
            }
        >
            <Head title={__('Affectations utilisateurs')} />

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
                                <UserRoundCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    {__('Liaisons utilisateur-poste')}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {__('Postes principaux, interims et activations temporelles des affectations.')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200/70 dark:divide-slate-800">
                            <thead className="bg-slate-50/80 dark:bg-slate-950/40">
                                <tr>
                                    {[__('Utilisateur'), __('Poste'), __('Periode'), __('Type'), __('Statut'), __('Actions')].map((label) => (
                                        <th key={label} className="px-6 py-4 text-start text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                                {assignments.length > 0 ? assignments.map((assignment) => (
                                    <tr key={assignment.id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-950/30">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900 dark:text-white">{assignment.user?.name ?? __('Utilisateur')}</div>
                                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{assignment.user?.email ?? ''}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{assignment.position?.title ?? __('Poste')}</div>
                                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{assignment.position?.department?.name ?? __('N/A')}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                            {(assignment.starts_at || assignment.ends_at)
                                                ? `${assignment.starts_at ?? __('Debut libre')} → ${assignment.ends_at ?? __('Sans fin')}`
                                                : __('Permanent')}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                            {assignment.is_primary ? __('Principal') : __('Secondaire')}
                                            {assignment.is_acting ? ` • ${__('Interim')}` : ''}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${assignment.is_active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                                                {assignment.is_active ? __('Active') : __('Inactive')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Link
                                                    href={route('user-positions.edit', assignment.id)}
                                                    className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                    {__('Modifier')}
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(assignment)}
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
                                        <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                                            {__('Aucune affectation n a encore ete configuree.')}
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
