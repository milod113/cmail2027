import InputError from '@/Components/InputError';
import { useTranslation } from '@/Hooks/useTranslation';
import { router, useForm } from '@inertiajs/react';
import { Building2, Save, Workflow } from 'lucide-react';
import { FormEventHandler } from 'react';

type Establishment = {
    id: number;
    name: string;
};

type DepartmentFormData = {
    name: string;
    establishment_id: string;
};

export default function DepartmentForm({
    mode,
    establishments,
    department,
}: {
    mode: 'create' | 'edit';
    establishments: Establishment[];
    department?: {
        id: number;
        name: string;
        establishment_id: number;
    };
}) {
    const { __ } = useTranslation();
    const { data, setData, post, put, processing, errors } = useForm<DepartmentFormData>({
        name: department?.name ?? '',
        establishment_id: department ? String(department.establishment_id) : '',
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        if (mode === 'create') {
            post(route('departments.store'));
            return;
        }

        put(route('departments.update', department?.id));
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div>
                <label htmlFor="name" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {__('Nom du département')}
                </label>
                <div className="relative">
                    <Workflow className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                        id="name"
                        type="text"
                        value={data.name}
                        onChange={(event) => setData('name', event.target.value)}
                        className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 pe-4 ps-12 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                        placeholder={__('Service des urgences')}
                    />
                </div>
                <InputError message={errors.name} className="mt-2" />
            </div>

            <div>
                <label htmlFor="establishment_id" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {__('Établissement')}
                </label>
                <div className="relative">
                    <Building2 className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <select
                        id="establishment_id"
                        value={data.establishment_id}
                        onChange={(event) => setData('establishment_id', event.target.value)}
                        className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 pe-4 ps-12 text-slate-900 shadow-sm transition focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                    >
                        <option value="">{__('Sélectionner un établissement')}</option>
                        {establishments.map((establishment) => (
                            <option key={establishment.id} value={establishment.id}>
                                {establishment.name}
                            </option>
                        ))}
                    </select>
                </div>
                <InputError message={errors.establishment_id} className="mt-2" />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                    type="button"
                    onClick={() => router.visit(route('departments.index'))}
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
                    {mode === 'create' ? __('Créer un département') : __('Mettre à jour le département')}
                </button>
            </div>
        </form>
    );
}
