import InputError from '@/Components/InputError';
import { useTranslation } from '@/Hooks/useTranslation';
import { router, useForm } from '@inertiajs/react';
import { Layers3, Save, ShieldCheck } from 'lucide-react';
import { FormEventHandler } from 'react';

type LevelFormData = {
    organization_category_id: string;
    name: string;
    code: string;
    rank: string;
    is_active: boolean;
    description: string;
};

export default function OrganizationLevelForm({
    mode,
    categories,
    level,
}: {
    mode: 'create' | 'edit';
    categories: { id: number; name: string; code: string }[];
    level?: {
        id: number;
        organization_category_id: number;
        name: string;
        code: string;
        rank: number;
        is_active: boolean;
        description?: string | null;
    };
}) {
    const { __ } = useTranslation();
    const { data, setData, post, put, processing, errors } = useForm<LevelFormData>({
        organization_category_id: level?.organization_category_id ? String(level.organization_category_id) : '',
        name: level?.name ?? '',
        code: level?.code ?? '',
        rank: level ? String(level.rank) : '',
        is_active: level?.is_active ?? true,
        description: level?.description ?? '',
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        if (mode === 'create') {
            post(route('organization-levels.store'));
            return;
        }

        put(route('organization-levels.update', level?.id));
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <div>
                    <label htmlFor="organization_category_id" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {__('Categorie')}
                    </label>
                    <select
                        id="organization_category_id"
                        value={data.organization_category_id}
                        onChange={(event) => setData('organization_category_id', event.target.value)}
                        className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 px-4 text-slate-900 shadow-sm transition focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                    >
                        <option value="">{__('Selectionner une categorie')}</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.organization_category_id} className="mt-2" />
                </div>

                <div>
                    <label htmlFor="name" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {__('Nom du niveau')}
                    </label>
                    <div className="relative">
                        <Layers3 className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(event) => setData('name', event.target.value)}
                            className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 pe-4 ps-12 text-slate-900 shadow-sm transition focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                            placeholder={__('Sous-direction')}
                        />
                    </div>
                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div>
                    <label htmlFor="code" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {__('Code')}
                    </label>
                    <div className="relative">
                        <ShieldCheck className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input
                            id="code"
                            type="text"
                            value={data.code}
                            onChange={(event) => setData('code', event.target.value.toUpperCase())}
                            className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 pe-4 ps-12 text-slate-900 shadow-sm transition focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                            placeholder={__('SOUS_DIRECTION')}
                        />
                    </div>
                    <InputError message={errors.code} className="mt-2" />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div>
                    <label htmlFor="rank" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {__('Ordre hierarchique')}
                    </label>
                    <input
                        id="rank"
                        type="number"
                        min="1"
                        value={data.rank}
                        onChange={(event) => setData('rank', event.target.value)}
                        className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 px-4 text-slate-900 shadow-sm transition focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                    />
                    <InputError message={errors.rank} className="mt-2" />
                </div>

                <div className="flex items-end">
                    <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                        <input
                            type="checkbox"
                            checked={data.is_active}
                            onChange={(event) => setData('is_active', event.target.checked)}
                            className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                        />
                        {__('Niveau actif')}
                    </label>
                </div>
            </div>

            <div>
                <label htmlFor="description" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {__('Description')}
                </label>
                <textarea
                    id="description"
                    rows={4}
                    value={data.description}
                    onChange={(event) => setData('description', event.target.value)}
                    className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 px-4 py-3 text-slate-900 shadow-sm transition focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                    placeholder={__('Niveau visible dans la configuration de l organigramme.')}
                />
                <InputError message={errors.description} className="mt-2" />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                    type="button"
                    onClick={() => router.visit(route('organization-levels.index'))}
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
                    {mode === 'create' ? __('Creer le niveau') : __('Mettre a jour le niveau')}
                </button>
            </div>
        </form>
    );
}
