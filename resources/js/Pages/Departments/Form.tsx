import InputError from '@/Components/InputError';
import { useTranslation } from '@/Hooks/useTranslation';
import { router, useForm } from '@inertiajs/react';
import { Building2, Save, User2, Workflow } from 'lucide-react';
import { FormEventHandler } from 'react';

type Establishment = {
    id: number;
    name: string;
};

type ParentDepartment = {
    id: number;
    name: string;
    category: string;
    level_type: string;
};

type Manager = {
    id: number;
    name: string;
    email: string;
};

type DepartmentFormData = {
    name: string;
    establishment_id: string;
    parent_id: string;
    category: string;
    level_type: string;
    manager_user_id: string;
    is_active: boolean;
    sort_order: string;
    description: string;
};

export default function DepartmentForm({
    mode,
    establishments,
    parentDepartments,
    managers,
    department,
}: {
    mode: 'create' | 'edit';
    establishments: Establishment[];
    parentDepartments: ParentDepartment[];
    managers: Manager[];
    department?: {
        id: number;
        name: string;
        establishment_id: number;
        parent_id?: number | null;
        category: string;
        level_type: string;
        manager_user_id?: number | null;
        is_active: boolean;
        sort_order: number;
        description?: string | null;
    };
}) {
    const { __ } = useTranslation();
    const { data, setData, post, put, processing, errors } = useForm<DepartmentFormData>({
        name: department?.name ?? '',
        establishment_id: department ? String(department.establishment_id) : '',
        parent_id: department?.parent_id ? String(department.parent_id) : '',
        category: department?.category ?? 'administratif',
        level_type: department?.level_type ?? 'service',
        manager_user_id: department?.manager_user_id ? String(department.manager_user_id) : '',
        is_active: department?.is_active ?? true,
        sort_order: department ? String(department.sort_order) : '0',
        description: department?.description ?? '',
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
            <div className="grid gap-6 md:grid-cols-2">
                <div>
                    <label htmlFor="name" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {__('Nom du noeud')}
                    </label>
                    <div className="relative">
                        <Workflow className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(event) => setData('name', event.target.value)}
                            className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 pe-4 ps-12 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                            placeholder={__('Sous-direction des equipements')}
                        />
                    </div>
                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div>
                    <label htmlFor="establishment_id" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {__('Etablissement')}
                    </label>
                    <div className="relative">
                        <Building2 className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <select
                            id="establishment_id"
                            value={data.establishment_id}
                            onChange={(event) => setData('establishment_id', event.target.value)}
                            className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 pe-4 ps-12 text-slate-900 shadow-sm transition focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                        >
                            <option value="">{__('Selectionner un etablissement')}</option>
                            {establishments.map((establishment) => (
                                <option key={establishment.id} value={establishment.id}>
                                    {establishment.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <InputError message={errors.establishment_id} className="mt-2" />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div>
                    <label htmlFor="category" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {__('Categorie')}
                    </label>
                    <select
                        id="category"
                        value={data.category}
                        onChange={(event) => setData('category', event.target.value)}
                        className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 px-4 text-slate-900 shadow-sm transition focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                    >
                        <option value="administratif">{__('Administratif')}</option>
                        <option value="medical">{__('Medical')}</option>
                        <option value="chirurgical">{__('Chirurgical')}</option>
                    </select>
                    <InputError message={errors.category} className="mt-2" />
                </div>

                <div>
                    <label htmlFor="level_type" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {__('Niveau / type')}
                    </label>
                    <input
                        id="level_type"
                        type="text"
                        value={data.level_type}
                        onChange={(event) => setData('level_type', event.target.value)}
                        className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 px-4 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                        placeholder={__('direction, sous_direction, bureau, service, unite')}
                    />
                    <InputError message={errors.level_type} className="mt-2" />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div>
                    <label htmlFor="parent_id" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {__('Departement parent')}
                    </label>
                    <select
                        id="parent_id"
                        value={data.parent_id}
                        onChange={(event) => setData('parent_id', event.target.value)}
                        className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 px-4 text-slate-900 shadow-sm transition focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                    >
                        <option value="">{__('Aucun')}</option>
                        {parentDepartments.map((parentDepartment) => (
                            <option key={parentDepartment.id} value={parentDepartment.id}>
                                {parentDepartment.name} ({parentDepartment.level_type})
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.parent_id} className="mt-2" />
                </div>

                <div>
                    <label htmlFor="manager_user_id" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {__('Responsable')}
                    </label>
                    <div className="relative">
                        <User2 className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <select
                            id="manager_user_id"
                            value={data.manager_user_id}
                            onChange={(event) => setData('manager_user_id', event.target.value)}
                            className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 pe-4 ps-12 text-slate-900 shadow-sm transition focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                        >
                            <option value="">{__('Aucun')}</option>
                            {managers.map((manager) => (
                                <option key={manager.id} value={manager.id}>
                                    {manager.name} - {manager.email}
                                </option>
                            ))}
                        </select>
                    </div>
                    <InputError message={errors.manager_user_id} className="mt-2" />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div>
                    <label htmlFor="sort_order" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {__('Ordre d affichage')}
                    </label>
                    <input
                        id="sort_order"
                        type="number"
                        min="0"
                        value={data.sort_order}
                        onChange={(event) => setData('sort_order', event.target.value)}
                        className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 px-4 text-slate-900 shadow-sm transition focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                    />
                    <InputError message={errors.sort_order} className="mt-2" />
                </div>

                <div className="flex items-end">
                    <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                        <input
                            type="checkbox"
                            checked={data.is_active}
                            onChange={(event) => setData('is_active', event.target.checked)}
                            className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                        />
                        {__('Element actif')}
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
                    placeholder={__('Description interne du noeud hierarchique.')}
                />
                <InputError message={errors.description} className="mt-2" />
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
                    {mode === 'create' ? __('Creer le departement') : __('Mettre a jour le departement')}
                </button>
            </div>
        </form>
    );
}
