import InputError from '@/Components/InputError';
import { useTranslation } from '@/Hooks/useTranslation';
import { isPositionCodeTaken, suggestPositionCode } from '@/Utils/positionCode';
import { router, useForm } from '@inertiajs/react';
import {
    BriefcaseBusiness,
    GitBranch,
    PenLine,
    Save,
    ShieldCheck,
    Sparkles,
    TriangleAlert,
    Workflow,
} from 'lucide-react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';

type DepartmentOption = { id: number; name: string; parent?: { id: number; name: string } | null; category?: string | null; level_type?: string | null };
type RoleOption = { id: number; nom_role: string };
type ReportingOption = { id: number; title: string; department?: { id: number; name: string } | null };

type PositionFormData = {
    title: string;
    code: string;
    department_id: string;
    role_id: string;
    reports_to_position_id: string;
    is_head: boolean;
    is_active: boolean;
    hierarchy_order: string;
    description: string;
};

export default function PositionForm({
    mode,
    departments,
    roles,
    reportingPositions,
    existingCodes,
    position,
}: {
    mode: 'create' | 'edit';
    departments: DepartmentOption[];
    roles: RoleOption[];
    reportingPositions: ReportingOption[];
    /** Codes deja utilises par d'autres postes, pour anticiper l'unicite cote client. */
    existingCodes?: string[];
    position?: {
        id: number;
        title: string;
        code?: string | null;
        department_id?: number | null;
        role_id?: number | null;
        reports_to_position_id?: number | null;
        is_head: boolean;
        is_active: boolean;
        hierarchy_order: number;
        description?: string | null;
    };
}) {
    const { __ } = useTranslation();
    const { data, setData, post, put, processing, errors } = useForm<PositionFormData>({
        title: position?.title ?? '',
        code: position?.code ?? '',
        department_id: position?.department_id ? String(position.department_id) : '',
        role_id: position?.role_id ? String(position.role_id) : '',
        reports_to_position_id: position?.reports_to_position_id ? String(position.reports_to_position_id) : '',
        is_head: position?.is_head ?? false,
        is_active: position?.is_active ?? true,
        hierarchy_order: position ? String(position.hierarchy_order) : '0',
        description: position?.description ?? '',
    });

    // ------------------------------------------------------------------
    // Suggestion intelligente du code.
    //
    // - Mode "auto" : le champ suit en direct la suggestion calculee depuis
    //   le departement selectionne + le titre saisi.
    // - Des que l'utilisateur edite le champ a la main, il prend le controle :
    //   la suggestion ne l'ecrase plus jamais brutalement.
    // - Le bouton "Generer / Regenerer" reapplique la suggestion et rend
    //   la main au mode auto.
    // - En edition, un code existant est considere comme personnalise afin de
    //   ne jamais ecraser silencieusement une valeur enregistree en base.
    // ------------------------------------------------------------------
    const [isCodeManual, setIsCodeManual] = useState(mode === 'edit' && Boolean(position?.code));

    const selectedDepartment = useMemo(
        () => departments.find((department) => String(department.id) === data.department_id),
        [departments, data.department_id],
    );

    const suggestedCode = useMemo(
        () =>
            suggestPositionCode({
                departmentName: selectedDepartment?.name,
                departmentLevelType: selectedDepartment?.level_type,
                title: data.title,
                existingCodes,
            }),
        [selectedDepartment?.name, selectedDepartment?.level_type, data.title, existingCodes],
    );

    useEffect(() => {
        if (isCodeManual || data.code === suggestedCode) {
            return;
        }

        setData('code', suggestedCode);
    }, [suggestedCode, isCodeManual]);

    const isCodeTaken = isPositionCodeTaken(data.code, existingCodes);

    const showCustomBadge =
        isCodeManual &&
        suggestedCode !== '' &&
        data.code.trim() !== '' &&
        data.code.trim().toUpperCase() !== suggestedCode.toUpperCase();

    const handleCodeChange = (value: string) => {
        setIsCodeManual(true);
        setData('code', value.toUpperCase());
    };

    const handleGenerateCode = () => {
        if (!suggestedCode) {
            return;
        }

        setIsCodeManual(false);
        setData('code', suggestedCode);
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        if (mode === 'create') {
            post(route('positions.store'));
            return;
        }

        put(route('positions.update', position?.id));
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <div>
                    <label htmlFor="title" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {__('Titre du poste')}
                    </label>
                    <div className="relative">
                        <BriefcaseBusiness className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input
                            id="title"
                            type="text"
                            value={data.title}
                            onChange={(event) => setData('title', event.target.value)}
                            className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 pe-4 ps-12 text-slate-900 shadow-sm transition focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                            placeholder={__('Chef de bureau')}
                        />
                    </div>
                    <InputError message={errors.title} className="mt-2" />
                </div>

                <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <label htmlFor="code" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                            {__('Code')}
                        </label>
                        <button
                            type="button"
                            onClick={handleGenerateCode}
                            disabled={!suggestedCode}
                            title={__('Construit le code a partir du departement et du titre du poste.')}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-200 bg-white px-3 py-1.5 text-xs font-semibold text-cyan-700 shadow-sm transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-cyan-500/20 dark:bg-slate-950 dark:text-cyan-300 dark:hover:bg-slate-900"
                        >
                            <Sparkles className="h-3.5 w-3.5" />
                            {isCodeManual ? __('Generer') : __('Regenerer')}
                        </button>
                    </div>
                    <div className="relative">
                        <ShieldCheck className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input
                            id="code"
                            type="text"
                            value={data.code}
                            onChange={(event) => handleCodeChange(event.target.value)}
                            className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 pe-4 ps-12 font-mono uppercase tracking-wider text-slate-900 shadow-sm transition focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                            placeholder={__('DG-DIR')}
                        />
                    </div>

                    <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {__('Code suggere automatiquement a partir du departement et du titre du poste. Il reste modifiable manuellement.')}
                    </p>

                    {isCodeTaken ? (
                        <p className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            {__('Ce code existe deja pour un autre poste : ajustez-le ou relancez la generation pour obtenir un code unique.')}
                        </p>
                    ) : showCustomBadge ? (
                        <p className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-cyan-700 dark:text-cyan-300">
                            <PenLine className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span>
                                {__('Code personnalise')}
                                {' — '}
                                {__('suggestion actuelle')} : <span className="font-mono">{suggestedCode}</span>
                            </span>
                        </p>
                    ) : null}

                    <InputError message={errors.code} className="mt-2" />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div>
                    <label htmlFor="department_id" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {__('Departement parent')}
                    </label>
                    <select
                        id="department_id"
                        value={data.department_id}
                        onChange={(event) => setData('department_id', event.target.value)}
                        className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 px-4 text-slate-900 shadow-sm transition focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                    >
                        <option value="">{__('Selectionner un departement')}</option>
                        {departments.map((department) => (
                            <option key={department.id} value={department.id}>
                                {department.name}{department.parent ? ` - ${department.parent.name}` : ''}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.department_id} className="mt-2" />
                </div>

                <div>
                    <label htmlFor="role_id" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {__('Role lie')}
                    </label>
                    <select
                        id="role_id"
                        value={data.role_id}
                        onChange={(event) => setData('role_id', event.target.value)}
                        className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 px-4 text-slate-900 shadow-sm transition focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                    >
                        <option value="">{__('Aucun')}</option>
                        {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                                {role.nom_role}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.role_id} className="mt-2" />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div>
                    <label htmlFor="reports_to_position_id" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {__('Reporte a')}
                    </label>
                    <div className="relative">
                        <GitBranch className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <select
                            id="reports_to_position_id"
                            value={data.reports_to_position_id}
                            onChange={(event) => setData('reports_to_position_id', event.target.value)}
                            className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 pe-4 ps-12 text-slate-900 shadow-sm transition focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                        >
                            <option value="">{__('Aucun')}</option>
                            {reportingPositions.map((reportingPosition) => (
                                <option key={reportingPosition.id} value={reportingPosition.id}>
                                    {reportingPosition.title}{reportingPosition.department ? ` - ${reportingPosition.department.name}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <InputError message={errors.reports_to_position_id} className="mt-2" />
                </div>

                <div>
                    <label htmlFor="hierarchy_order" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {__('Ordre hierarchique')}
                    </label>
                    <input
                        id="hierarchy_order"
                        type="number"
                        min="0"
                        value={data.hierarchy_order}
                        onChange={(event) => setData('hierarchy_order', event.target.value)}
                        className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 px-4 text-slate-900 shadow-sm transition focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                    />
                    <InputError message={errors.hierarchy_order} className="mt-2" />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    <input
                        type="checkbox"
                        checked={data.is_head}
                        onChange={(event) => setData('is_head', event.target.checked)}
                        className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    {__('Poste responsable du departement')}
                </label>

                <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    <input
                        type="checkbox"
                        checked={data.is_active}
                        onChange={(event) => setData('is_active', event.target.checked)}
                        className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    {__('Poste actif')}
                </label>
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
                    placeholder={__('Description interne du poste.')}
                />
                <InputError message={errors.description} className="mt-2" />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                    type="button"
                    onClick={() => router.visit(route('positions.index'))}
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
                    {mode === 'create' ? __('Creer le poste') : __('Mettre a jour le poste')}
                </button>
            </div>
        </form>
    );
}