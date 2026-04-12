import InputError from '@/Components/InputError';
import { useTranslation } from '@/Hooks/useTranslation';
import { router, useForm } from '@inertiajs/react';
import { Save, UserCog } from 'lucide-react';
import { FormEventHandler } from 'react';

type RoleFormValues = {
    nom_role: string;
    is_protected: boolean;
    is_unique: boolean;
};

export default function RoleForm({
    mode,
    role,
}: {
    mode: 'create' | 'edit';
    role?: {
        id: number;
        nom_role: string;
        is_protected: boolean;
        is_unique: boolean;
    };
}) {
    const { __ } = useTranslation();
    const { data, setData, post, put, processing, errors } = useForm<RoleFormValues>({
        nom_role: role?.nom_role ?? '',
        is_protected: role?.is_protected ?? false,
        is_unique: role?.is_unique ?? false,
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        if (mode === 'create') {
            post(route('roles.store'));
            return;
        }

        put(route('roles.update', role?.id));
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div>
                <label htmlFor="nom_role" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {__('Nom du rôle')}
                </label>
                <div className="relative">
                    <UserCog className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                        id="nom_role"
                        type="text"
                        value={data.nom_role}
                        onChange={(event) => setData('nom_role', event.target.value)}
                        className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 pe-4 ps-12 text-slate-900 shadow-sm transition focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                        placeholder={__('Chef de service')}
                    />
                </div>
                <InputError message={errors.nom_role} className="mt-2" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 dark:border-slate-700 dark:bg-slate-900">
                    <input
                        type="checkbox"
                        checked={data.is_protected}
                        onChange={(event) => setData('is_protected', event.target.checked)}
                        className="mt-1 rounded border-cyan-600 text-cyan-600 focus:ring-cyan-600"
                    />
                    <span>
                        <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {__('Rôle protégé')}
                        </span>
                        <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">
                            {__('Empêche la suppression ou la modification une fois créé.')}
                        </span>
                    </span>
                </label>

                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 dark:border-slate-700 dark:bg-slate-900">
                    <input
                        type="checkbox"
                        checked={data.is_unique}
                        onChange={(event) => setData('is_unique', event.target.checked)}
                        className="mt-1 rounded border-cyan-600 text-cyan-600 focus:ring-cyan-600"
                    />
                    <span>
                        <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {__('Rôle unique')}
                        </span>
                        <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">
                            {__('Limite ce rôle à un seul utilisateur assigné.')}
                        </span>
                    </span>
                </label>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                    type="button"
                    onClick={() => router.visit(route('roles.index'))}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                    {__('Annuler')}
                </button>
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 via-sky-700 to-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-900/20 transition hover:-translate-y-0.5 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    <Save className="h-4 w-4" />
                    {mode === 'create' ? __('Créer un rôle') : __('Mettre à jour le rôle')}
                </button>
            </div>
        </form>
    );
}
