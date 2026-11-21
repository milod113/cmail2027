import InputError from '@/Components/InputError';
import { useTranslation } from '@/Hooks/useTranslation';
import { router, useForm } from '@inertiajs/react';
import { Building2, Network, Save, User2, Workflow } from 'lucide-react';
import { FormEventHandler } from 'react';

type Option = { id: number; name: string };
type CategoryOption = { id: number; name: string; code: string };
type LevelOption = { id: number; name: string; rank: number; organization_category_id: number; organization_category?: { id: number; name: string; code: string } | null };
type ParentOption = { id: number; name: string; organization_category_id: number; organization_level: { id: number; name: string; rank: number } | null };
type ManagerOption = { id: number; name: string; email: string };

type UnitFormData = {
    organization_category_id: string;
    establishment_id: string;
    organization_level_id: string;
    department_id: string;
    parent_id: string;
    manager_user_id: string;
    name: string;
    code: string;
    is_active: boolean;
    description: string;
};

export default function OrganizationalUnitForm({
    mode,
    categories,
    establishments,
    levels,
    departments,
    parentUnits,
    managers,
    unit,
}: {
    mode: 'create' | 'edit';
    categories: CategoryOption[];
    establishments: Option[];
    levels: LevelOption[];
    departments: Option[];
    parentUnits: ParentOption[];
    managers: ManagerOption[];
    unit?: {
        id: number;
        organization_category_id: number;
        establishment_id?: number | null;
        organization_level_id: number;
        department_id?: number | null;
        parent_id?: number | null;
        manager_user_id?: number | null;
        name: string;
        code?: string | null;
        is_active: boolean;
        description?: string | null;
    };
}) {
    const { __ } = useTranslation();
    const { data, setData, post, put, processing, errors } = useForm<UnitFormData>({
        organization_category_id: unit?.organization_category_id ? String(unit.organization_category_id) : '',
        establishment_id: unit?.establishment_id ? String(unit.establishment_id) : '',
        organization_level_id: unit ? String(unit.organization_level_id) : '',
        department_id: unit?.department_id ? String(unit.department_id) : '',
        parent_id: unit?.parent_id ? String(unit.parent_id) : '',
        manager_user_id: unit?.manager_user_id ? String(unit.manager_user_id) : '',
        name: unit?.name ?? '',
        code: unit?.code ?? '',
        is_active: unit?.is_active ?? true,
        description: unit?.description ?? '',
    });

    const filteredLevels = data.organization_category_id === ''
        ? levels
        : levels.filter((level) => String(level.organization_category_id) === data.organization_category_id);

    const filteredParents = data.organization_category_id === ''
        ? parentUnits
        : parentUnits.filter((parent) => String(parent.organization_category_id) === data.organization_category_id);

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        if (mode === 'create') {
            post(route('organizational-units.store'));
            return;
        }

        put(route('organizational-units.update', unit?.id));
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <div>
                    <label htmlFor="organization_category_id" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {__('Categorie d organigramme')}
                    </label>
                    <select
                        id="organization_category_id"
                        value={data.organization_category_id}
                        onChange={(event) => {
                            setData('organization_category_id', event.target.value);
                            setData('organization_level_id', '');
                            setData('parent_id', '');
                        }}
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
                        {__('Nom de l unite')}
                    </label>
                    <div className="relative">
                        <Workflow className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(event) => setData('name', event.target.value)}
                            className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 pe-4 ps-12 text-slate-900 shadow-sm transition focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                            placeholder={__('Bureau de communication')}
                        />
                    </div>
                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div>
                    <label htmlFor="code" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {__('Code')}
                    </label>
                    <div className="relative">
                        <Network className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input
                            id="code"
                            type="text"
                            value={data.code}
                            onChange={(event) => setData('code', event.target.value.toUpperCase())}
                            className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 pe-4 ps-12 text-slate-900 shadow-sm transition focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                            placeholder={__('BUREAU-COM')}
                        />
                    </div>
                    <InputError message={errors.code} className="mt-2" />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div>
                    <label htmlFor="establishment_id" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {__('Etablissement')}
                    </label>
                    <select
                        id="establishment_id"
                        value={data.establishment_id}
                        onChange={(event) => setData('establishment_id', event.target.value)}
                        className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 px-4 text-slate-900 shadow-sm transition focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                    >
                        <option value="">{__('Aucun')}</option>
                        {establishments.map((establishment) => (
                            <option key={establishment.id} value={establishment.id}>
                                {establishment.name}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.establishment_id} className="mt-2" />
                </div>

                <div>
                    <label htmlFor="organization_level_id" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {__('Niveau organisationnel')}
                    </label>
                    <select
                        id="organization_level_id"
                        value={data.organization_level_id}
                        onChange={(event) => setData('organization_level_id', event.target.value)}
                        className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 px-4 text-slate-900 shadow-sm transition focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                    >
                        <option value="">{__('Selectionner un niveau')}</option>
                        {filteredLevels.map((level) => (
                            <option key={level.id} value={level.id}>
                                #{level.rank} - {level.name}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.organization_level_id} className="mt-2" />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div>
                    <label htmlFor="parent_id" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {__('Unite parente')}
                    </label>
                    <select
                        id="parent_id"
                        value={data.parent_id}
                        onChange={(event) => setData('parent_id', event.target.value)}
                        className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 px-4 text-slate-900 shadow-sm transition focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                    >
                        <option value="">{__('Aucune')}</option>
                        {filteredParents.map((parent) => (
                            <option key={parent.id} value={parent.id}>
                                {parent.name}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.parent_id} className="mt-2" />
                </div>

                <div>
                    <label htmlFor="department_id" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {__('Departement lie')}
                    </label>
                    <select
                        id="department_id"
                        value={data.department_id}
                        onChange={(event) => setData('department_id', event.target.value)}
                        className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 px-4 text-slate-900 shadow-sm transition focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                    >
                        <option value="">{__('Aucun')}</option>
                        {departments.map((department) => (
                            <option key={department.id} value={department.id}>
                                {department.name}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.department_id} className="mt-2" />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
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

                <div className="flex items-end">
                    <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                        <input
                            type="checkbox"
                            checked={data.is_active}
                            onChange={(event) => setData('is_active', event.target.checked)}
                            className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                        />
                        {__('Unite active')}
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
                    placeholder={__('Description interne de cette unite dans l organigramme.')}
                />
                <InputError message={errors.description} className="mt-2" />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                    type="button"
                    onClick={() => router.visit(route('organizational-units.index'))}
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
                    {mode === 'create' ? __('Creer l unite') : __('Mettre a jour l unite')}
                </button>
            </div>
        </form>
    );
}
