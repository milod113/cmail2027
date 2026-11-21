import InputError from '@/Components/InputError';
import { useTranslation } from '@/Hooks/useTranslation';
import { router, useForm } from '@inertiajs/react';
import { CalendarDays, Save, UserRoundCheck, Users } from 'lucide-react';
import { FormEventHandler } from 'react';

type UserOption = { id: number; name: string; email: string };
type PositionOption = { id: number; title: string; department?: { id: number; name: string } | null };

type AssignmentFormData = {
    user_id: string;
    position_id: string;
    is_primary: boolean;
    is_acting: boolean;
    starts_at: string;
    ends_at: string;
    is_active: boolean;
};

export default function UserPositionForm({
    mode,
    users,
    positions,
    assignment,
}: {
    mode: 'create' | 'edit';
    users: UserOption[];
    positions: PositionOption[];
    assignment?: {
        id: number;
        user_id: number;
        position_id: number;
        is_primary: boolean;
        is_acting: boolean;
        starts_at?: string | null;
        ends_at?: string | null;
        is_active: boolean;
    };
}) {
    const { __ } = useTranslation();
    const { data, setData, post, put, processing, errors } = useForm<AssignmentFormData>({
        user_id: assignment ? String(assignment.user_id) : '',
        position_id: assignment ? String(assignment.position_id) : '',
        is_primary: assignment?.is_primary ?? true,
        is_acting: assignment?.is_acting ?? false,
        starts_at: assignment?.starts_at ?? '',
        ends_at: assignment?.ends_at ?? '',
        is_active: assignment?.is_active ?? true,
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        if (mode === 'create') {
            post(route('user-positions.store'));
            return;
        }

        put(route('user-positions.update', assignment?.id));
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <div>
                    <label htmlFor="user_id" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {__('Utilisateur')}
                    </label>
                    <div className="relative">
                        <Users className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <select
                            id="user_id"
                            value={data.user_id}
                            onChange={(event) => setData('user_id', event.target.value)}
                            className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 pe-4 ps-12 text-slate-900 shadow-sm transition focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                        >
                            <option value="">{__('Selectionner un utilisateur')}</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.name} - {user.email}
                                </option>
                            ))}
                        </select>
                    </div>
                    <InputError message={errors.user_id} className="mt-2" />
                </div>

                <div>
                    <label htmlFor="position_id" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {__('Poste')}
                    </label>
                    <div className="relative">
                        <UserRoundCheck className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <select
                            id="position_id"
                            value={data.position_id}
                            onChange={(event) => setData('position_id', event.target.value)}
                            className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 pe-4 ps-12 text-slate-900 shadow-sm transition focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                        >
                            <option value="">{__('Selectionner un poste')}</option>
                            {positions.map((position) => (
                                <option key={position.id} value={position.id}>
                                    {position.title}{position.department ? ` - ${position.department.name}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <InputError message={errors.position_id} className="mt-2" />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div>
                    <label htmlFor="starts_at" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {__('Debut')}
                    </label>
                    <div className="relative">
                        <CalendarDays className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input
                            id="starts_at"
                            type="date"
                            value={data.starts_at}
                            onChange={(event) => setData('starts_at', event.target.value)}
                            className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 pe-4 ps-12 text-slate-900 shadow-sm transition focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                        />
                    </div>
                    <InputError message={errors.starts_at} className="mt-2" />
                </div>

                <div>
                    <label htmlFor="ends_at" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {__('Fin')}
                    </label>
                    <div className="relative">
                        <CalendarDays className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input
                            id="ends_at"
                            type="date"
                            value={data.ends_at}
                            onChange={(event) => setData('ends_at', event.target.value)}
                            className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 pe-4 ps-12 text-slate-900 shadow-sm transition focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                        />
                    </div>
                    <InputError message={errors.ends_at} className="mt-2" />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    <input
                        type="checkbox"
                        checked={data.is_primary}
                        onChange={(event) => setData('is_primary', event.target.checked)}
                        className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    {__('Poste principal')}
                </label>

                <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    <input
                        type="checkbox"
                        checked={data.is_acting}
                        onChange={(event) => setData('is_acting', event.target.checked)}
                        className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    {__('Interim')}
                </label>

                <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    <input
                        type="checkbox"
                        checked={data.is_active}
                        onChange={(event) => setData('is_active', event.target.checked)}
                        className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    {__('Affectation active')}
                </label>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                    type="button"
                    onClick={() => router.visit(route('user-positions.index'))}
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
                    {mode === 'create' ? __('Creer l affectation') : __('Mettre a jour l affectation')}
                </button>
            </div>
        </form>
    );
}
