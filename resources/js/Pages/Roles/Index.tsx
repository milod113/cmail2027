import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import { PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, ShieldCheck, Trash2, UserCog } from 'lucide-react';

type Role = {
    id: number;
    nom_role: string;
    is_protected: boolean;
    is_unique: boolean;
    users_count: number;
};

export default function Index({
    roles,
}: PageProps<{
    roles: Role[];
}>) {
    const { flash } = usePage<PageProps>().props;
    const { __ } = useTranslation();

    const handleDelete = (role: Role) => {
        if (!window.confirm(__('Supprimer le rôle ":name" ?', { name: role.nom_role }))) {
            return;
        }

        router.delete(route('roles.destroy', role.id));
    };

    return (
        <AuthenticatedLayout
            title={__('Rôles')}
            description={__('Gérez les rôles des utilisateurs et les règles de protection.')}
            actions={
                <Link
                    href={route('roles.create')}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 via-sky-700 to-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-900/20 transition hover:-translate-y-0.5 hover:brightness-95"
                >
                    <Plus className="h-4 w-4" />
                    {__('Créer un rôle')}
                </Link>
            }
        >
            <Head title={__('Rôles')} />

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
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    {__('Annuaire des rôles')}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {__('Créez et maintenez les rôles système utilisés dans toute l’application.')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200/70 dark:divide-slate-800">
                            <thead className="bg-slate-50/80 dark:bg-slate-950/40">
                                <tr>
                                    {[__('ID'), __('Nom du rôle'), __('Protégé'), __('Unique'), __('Utilisateurs assignés'), __('Actions')].map((label) => (
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
                                {roles.length > 0 ? (
                                    roles.map((role) => (
                                        <tr key={role.id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-950/30">
                                            <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                                                #{role.id}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-200">
                                                <div className="flex items-center gap-3">
                                                    <UserCog className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                                                    {role.nom_role}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${role.is_protected ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                                                    {role.is_protected ? __('Oui') : __('Non')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${role.is_unique ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                                                    {role.is_unique ? __('Oui') : __('Non')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-300">
                                                {role.users_count}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Link
                                                        href={route('roles.edit', role.id)}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                        {__('Modifier')}
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(role)}
                                                        disabled={role.is_protected || role.users_count > 0}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
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
                                        <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                                            {__('Aucun rôle trouvé pour le moment.')}
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
