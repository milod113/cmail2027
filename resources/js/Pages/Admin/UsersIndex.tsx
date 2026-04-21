import AdminLayout from '@/Layouts/AdminLayout';
import { FormEvent, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { Eye, Plus, Search, UserRoundCheck, UserX } from 'lucide-react';

type RoleOption = {
    id: number;
    nom_role: string;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type UserRow = {
    id: number;
    name: string;
    last_name: string;
    first_name: string;
    email: string;
    role_id: number | null;
    role_name: string | null;
    department_name: string | null;
    service_name: string | null;
    is_active: boolean;
    is_super_admin: boolean;
    can_publish_publication: boolean;
    can_organize_event: boolean;
    access_level: 'user' | 'publisher' | 'admin';
    created_at: string | null;
};

type UsersIndexProps = {
    filters: {
        search: string;
    };
    roles: RoleOption[];
    users: {
        data: UserRow[];
        links: PaginationLink[];
        from: number | null;
        to: number | null;
        total: number;
    };
};

export default function UsersIndex({ filters, roles, users }: UsersIndexProps) {
    const [search, setSearch] = useState(filters.search ?? '');

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            route('admin.users.index'),
            { search },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handleStatusToggle = (user: UserRow) => {
        router.patch(
            route('admin.users.block', user.id),
            { is_active: !user.is_active },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleRoleChange = (user: UserRow, roleId: string) => {
        router.patch(
            route('admin.users.change-role', user.id),
            {
                role_id: roleId === '' ? null : Number(roleId),
                access_level: user.access_level,
                can_organize_event: user.can_organize_event,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleAccessLevelChange = (user: UserRow, accessLevel: UserRow['access_level']) => {
        router.patch(
            route('admin.users.change-role', user.id),
            {
                role_id: user.role_id,
                access_level: accessLevel,
                can_organize_event: user.can_organize_event,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleOrganizerPermissionChange = (user: UserRow, allowed: boolean) => {
        router.patch(
            route('admin.users.change-role', user.id),
            {
                role_id: user.role_id,
                access_level: user.access_level,
                can_organize_event: allowed,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <AdminLayout
            title="Gestion des utilisateurs"
            description="Recherchez, bloquez/debloquez les comptes et ajustez les privileges."
            actions={
                <Link
                    href={route('admin.users.create')}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-cyan-600 dark:hover:bg-cyan-500"
                >
                    <Plus className="h-4 w-4" />
                    Nouvel utilisateur
                </Link>
            }
        >
            <div className="space-y-5">
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <form onSubmit={submitSearch} className="flex flex-col gap-3 md:flex-row">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Rechercher un utilisateur, un role, un departement..."
                                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-500/20"
                            />
                        </div>
                        <button
                            type="submit"
                            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-cyan-600 dark:hover:bg-cyan-500"
                        >
                            Rechercher
                        </button>
                    </form>
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {users.total} utilisateurs
                            {users.from && users.to ? ` - affichage ${users.from} a ${users.to}` : ''}
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                            <thead className="bg-slate-50 dark:bg-slate-950/40">
                                <tr>
                                    {['Nom', 'Prenom', 'Service / Departement', 'Role metier', 'Etat', 'Privileges', 'Publication', 'Organisateur', 'Actions'].map((heading) => (
                                        <th
                                            key={heading}
                                            className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400"
                                        >
                                            {heading}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {users.data.length > 0 ? (
                                    users.data.map((user) => (
                                        <tr key={user.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-950/40">
                                            <td className="px-5 py-4">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.last_name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.first_name}</p>
                                                <p className="text-xs text-slate-400 dark:text-slate-500">{user.name}</p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                    {user.service_name ?? 'Sans departement'}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {user.department_name ?? 'Aucun service'}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <select
                                                    value={user.role_id ?? ''}
                                                    onChange={(event) => handleRoleChange(user, event.target.value)}
                                                    className="w-52 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition hover:border-cyan-500 focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                                >
                                                    <option value="">Aucun role</option>
                                                    {roles.map((role) => (
                                                        <option key={role.id} value={role.id}>
                                                            {role.nom_role}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                                                        user.is_active
                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                                                            : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
                                                    }`}
                                                >
                                                    {user.is_active ? (
                                                        <>
                                                            <UserRoundCheck className="h-3.5 w-3.5" />
                                                            Actif
                                                        </>
                                                    ) : (
                                                        <>
                                                            <UserX className="h-3.5 w-3.5" />
                                                            Bloque
                                                        </>
                                                    )}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <select
                                                    value={user.access_level}
                                                    onChange={(event) => handleAccessLevelChange(user, event.target.value as UserRow['access_level'])}
                                                    className="w-44 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition hover:border-cyan-500 focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                                >
                                                    <option value="user">Standard</option>
                                                    <option value="publisher">Droit publier</option>
                                                    <option value="admin">Droit admin</option>
                                                </select>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                        user.can_publish_publication
                                                            ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300'
                                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                                    }`}
                                                >
                                                    {user.can_publish_publication ? 'Autorise' : 'Non autorise'}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <select
                                                    value={user.can_organize_event ? '1' : '0'}
                                                    onChange={(event) => handleOrganizerPermissionChange(user, event.target.value === '1')}
                                                    className="w-36 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition hover:border-cyan-500 focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                                >
                                                    <option value="0">Non</option>
                                                    <option value="1">Oui</option>
                                                </select>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex min-w-[180px] flex-col gap-2">
                                                    <Link
                                                        href={route('admin.users.show', user.id)}
                                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:bg-cyan-500/20"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                        Gerer
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleStatusToggle(user)}
                                                        role="switch"
                                                        aria-checked={user.is_active}
                                                        className={`inline-flex min-w-[120px] items-center justify-between rounded-full border px-2 py-1.5 text-xs font-semibold transition ${
                                                            user.is_active
                                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                                                                : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'
                                                        }`}
                                                    >
                                                        <span className="px-2">{user.is_active ? 'Actif' : 'Bloque'}</span>
                                                        <span
                                                            className={`relative h-5 w-9 rounded-full transition ${
                                                                user.is_active ? 'bg-emerald-500/80' : 'bg-rose-500/80'
                                                            }`}
                                                        >
                                                            <span
                                                                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
                                                                    user.is_active ? 'left-[18px]' : 'left-0.5'
                                                                }`}
                                                            />
                                                        </span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                            Aucun utilisateur trouve.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 px-4 py-4 dark:border-slate-800">
                        {users.links.map((link, index) => (
                            <button
                                key={`${link.label}-${index}`}
                                type="button"
                                disabled={!link.url}
                                onClick={() => link.url && router.visit(link.url, { preserveScroll: true, preserveState: true })}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                                    link.active
                                        ? 'bg-cyan-600 text-white'
                                        : 'border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
                                }`}
                            />
                        ))}
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
