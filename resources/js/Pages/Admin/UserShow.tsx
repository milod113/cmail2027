import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AdminLayout from '@/Layouts/AdminLayout';
import { PageProps } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    BadgeCheck,
    BarChart3,
    Building2,
    CheckCircle2,
    Clock3,
    Eye,
    Mail,
    MessageSquare,
    Send,
    ShieldCheck,
    Sparkles,
    UserRound,
    UserRoundCheck,
    UserX,
    Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type RoleOption = {
    id: number;
    nom_role: string;
};

type DepartmentOption = {
    id: number;
    name: string;
};

type ActivityItem = {
    id: number;
    subject: string;
    type_message: string | null;
    sent_at: string | null;
    is_delivered: boolean;
    is_read?: boolean;
    archived?: boolean;
    counterpart: {
        name: string;
        email: string;
    } | null;
};

type ManagedUser = {
    id: number;
    name: string;
    username: string | null;
    email: string;
    department_id: number | null;
    department_name: string | null;
    role_id: number | null;
    role_name: string | null;
    is_active: boolean;
    is_online: boolean;
    is_super_admin: boolean;
    can_publish_publication: boolean;
    can_organize_event: boolean;
    can_organize_meetings: boolean;
    access_level: 'user' | 'publisher' | 'admin';
    profile: {
        matricule: string | null;
        grade: string | null;
        telephone: string | null;
        adresse: string | null;
        photo: string | null;
    };
    activity: {
        stats: {
            sent_count: number;
            received_count: number;
            unread_received_count: number;
            archived_count: number;
        };
        recent_sent: ActivityItem[];
        recent_received: ActivityItem[];
    };
};

type UserShowProps = PageProps<{
    managedUser: ManagedUser;
    roles: RoleOption[];
    departments: DepartmentOption[];
}>;

type TabKey = 'profile' | 'permissions' | 'history';

function formatDate(value: string | null): string {
    if (!value) {
        return '-';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function resolveTabFromHash(hash: string): TabKey {
    if (hash === '#permissions') {
        return 'permissions';
    }

    if (hash === '#history') {
        return 'history';
    }

    return 'profile';
}

function StatusPill({ active }: { active: boolean }) {
    return (
        <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                active
                    ? 'bg-emerald-500/15 text-emerald-100 border border-emerald-400/30'
                    : 'bg-rose-500/15 text-rose-100 border border-rose-400/30'
            }`}
        >
            {active ? <UserRoundCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
            {active ? 'Actif' : 'Bloque'}
        </span>
    );
}

function StatCard({
    label,
    value,
    helper,
    icon,
    tone,
}: {
    label: string;
    value: number | string;
    helper: string;
    icon: JSX.Element;
    tone: string;
}) {
    return (
        <div className={`rounded-2xl border p-4 shadow-sm ${tone}`}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</p>
                    <p className="mt-2 text-3xl font-bold">{value}</p>
                    <p className="mt-1 text-xs opacity-80">{helper}</p>
                </div>
                <div className="rounded-xl bg-white/70 p-3 shadow-sm dark:bg-slate-900/40">{icon}</div>
            </div>
        </div>
    );
}

function ActivityTable({
    title,
    emptyLabel,
    rows,
    direction,
}: {
    title: string;
    emptyLabel: string;
    rows: ActivityItem[];
    direction: 'sent' | 'received';
}) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                    {title}
                </h3>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                    <thead className="bg-slate-50 dark:bg-slate-950/40">
                        <tr>
                            {['Sujet', direction === 'sent' ? 'Destinataire' : 'Expediteur', 'Type', 'Date', 'Statut'].map((heading) => (
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
                        {rows.length > 0 ? (
                            rows.map((row) => (
                                <tr key={`${direction}-${row.id}`} className="transition hover:bg-slate-50 dark:hover:bg-slate-950/40">
                                    <td className="px-5 py-4">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{row.subject || 'Sans sujet'}</p>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            #{row.id}
                                        </p>
                                    </td>
                                    <td className="px-5 py-4 text-sm">
                                        <p className="font-medium text-slate-900 dark:text-white">{row.counterpart?.name ?? 'Utilisateur inconnu'}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{row.counterpart?.email ?? '-'}</p>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                            {row.type_message ?? 'normal'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                                        {formatDate(row.sent_at)}
                                    </td>
                                    <td className="px-5 py-4 text-sm">
                                        {direction === 'sent' ? (
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                    row.is_delivered
                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                                                        : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                                                }`}
                                            >
                                                {row.is_delivered ? 'Livre' : 'En attente'}
                                            </span>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                        row.is_read
                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                                                            : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                                                    }`}
                                                >
                                                    {row.is_read ? 'Lu' : 'Non lu'}
                                                </span>
                                                {row.archived ? (
                                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                        Archive
                                                    </span>
                                                ) : null}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                    {emptyLabel}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function UserShow({ managedUser, roles, departments }: UserShowProps) {
    const fileInput = useRef<HTMLInputElement>(null);
    const { flash } = usePage<PageProps>().props;
    const [activeTab, setActiveTab] = useState<TabKey>('profile');

    useEffect(() => {
        setActiveTab(resolveTabFromHash(window.location.hash));

        const syncHash = () => setActiveTab(resolveTabFromHash(window.location.hash));
        window.addEventListener('hashchange', syncHash);

        return () => window.removeEventListener('hashchange', syncHash);
    }, []);

    const { data, setData, post, processing, errors } = useForm({
        name: managedUser.name,
        username: managedUser.username ?? '',
        email: managedUser.email,
        department_id: managedUser.department_id ? String(managedUser.department_id) : '',
        matricule: managedUser.profile.matricule ?? '',
        grade: managedUser.profile.grade ?? '',
        telephone: managedUser.profile.telephone ?? '',
        adresse: managedUser.profile.adresse ?? '',
        photo: null as File | null,
        _method: 'PATCH',
    });

    const selectTab = (tab: TabKey) => {
        setActiveTab(tab);
        window.history.replaceState(null, '', `#${tab}`);
    };

    const submitProfile = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        selectTab('profile');

        post(route('admin.users.profile.update', managedUser.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                if (fileInput.current) {
                    fileInput.current.value = '';
                }
            },
        });
    };

    const handleStatusToggle = () => {
        selectTab('permissions');

        router.patch(
            route('admin.users.block', managedUser.id),
            { is_active: !managedUser.is_active },
            { preserveScroll: true },
        );
    };

    const handleRoleChange = (roleId: string) => {
        selectTab('permissions');

        router.patch(
            route('admin.users.change-role', managedUser.id),
            {
                role_id: roleId === '' ? null : Number(roleId),
                access_level: managedUser.access_level,
                can_organize_event: managedUser.can_organize_event,
                can_organize_meetings: managedUser.can_organize_meetings,
            },
            { preserveScroll: true },
        );
    };

    const handleAccessLevelChange = (accessLevel: ManagedUser['access_level']) => {
        selectTab('permissions');

        router.patch(
            route('admin.users.change-role', managedUser.id),
            {
                role_id: managedUser.role_id,
                access_level: accessLevel,
                can_organize_event: managedUser.can_organize_event,
                can_organize_meetings: managedUser.can_organize_meetings,
            },
            { preserveScroll: true },
        );
    };

    const handleOrganizerPermissionChange = (allowed: boolean) => {
        selectTab('permissions');

        router.patch(
            route('admin.users.change-role', managedUser.id),
            {
                role_id: managedUser.role_id,
                access_level: managedUser.access_level,
                can_organize_event: allowed,
                can_organize_meetings: managedUser.can_organize_meetings,
            },
            { preserveScroll: true },
        );
    };

    const handleMeetingsPermissionChange = (allowed: boolean) => {
        selectTab('permissions');

        router.patch(
            route('admin.users.change-role', managedUser.id),
            {
                role_id: managedUser.role_id,
                access_level: managedUser.access_level,
                can_organize_event: managedUser.can_organize_event,
                can_organize_meetings: allowed,
            },
            { preserveScroll: true },
        );
    };

    const photoUrl = managedUser.profile.photo ? `/storage/${managedUser.profile.photo}` : null;
    const tabs: { id: TabKey; label: string; icon: JSX.Element }[] = [
        { id: 'profile', label: 'Profil', icon: <UserRound className="h-4 w-4" /> },
        { id: 'permissions', label: 'Permissions', icon: <ShieldCheck className="h-4 w-4" /> },
        { id: 'history', label: 'Historique', icon: <BarChart3 className="h-4 w-4" /> },
    ];

    return (
        <AdminLayout
            title={`Gestion utilisateur - ${managedUser.name}`}
            description="Pilotez le profil, les permissions et l'activite messagerie de cet utilisateur."
            actions={
                <Link
                    href={route('admin.users.index')}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Retour liste
                </Link>
            }
        >
            <Head title={`Admin utilisateur - ${managedUser.name}`} />

            <div className="space-y-6">
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 shadow-2xl lg:p-8">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.18),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.16),_transparent_30%)]" />
                    <div className="absolute -right-20 top-0 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
                    <div className="absolute -bottom-24 left-0 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />

                    <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                        <div className="flex items-start gap-5">
                            {photoUrl ? (
                                <img
                                    src={photoUrl}
                                    alt={managedUser.name}
                                    className="h-24 w-24 rounded-3xl border border-white/20 object-cover shadow-xl"
                                />
                            ) : (
                                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/10 text-white shadow-xl backdrop-blur-sm">
                                    <UserRound className="h-10 w-10" />
                                </div>
                            )}

                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <StatusPill active={managedUser.is_active} />
                                    <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        {managedUser.access_level}
                                    </span>
                                    {managedUser.is_online ? (
                                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                                            <Zap className="h-3.5 w-3.5" />
                                            En ligne
                                        </span>
                                    ) : null}
                                </div>

                                <div>
                                    <h2 className="text-3xl font-bold tracking-tight text-white">{managedUser.name}</h2>
                                    <p className="mt-1 text-sm text-slate-300">{managedUser.email}</p>
                                    <p className="mt-1 text-sm text-cyan-100">
                                        {managedUser.profile.grade || managedUser.role_name || 'Utilisateur'}
                                        {' • '}
                                        {managedUser.department_name || 'Sans departement'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[22rem]">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white backdrop-blur-sm">
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Messages envoyes</p>
                                <p className="mt-2 text-3xl font-bold">{managedUser.activity.stats.sent_count}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white backdrop-blur-sm">
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Messages recus</p>
                                <p className="mt-2 text-3xl font-bold">{managedUser.activity.stats.received_count}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="sticky top-16 z-10 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/85 p-1 shadow-lg backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/85">
                    <div className="flex min-w-max gap-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => selectTab(tab.id)}
                                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                                    activeTab === tab.id
                                        ? 'bg-gradient-to-r from-cyan-600 to-sky-700 text-white shadow-lg shadow-cyan-500/20'
                                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </section>

                {activeTab === 'profile' ? (
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]">
                        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-6 flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600">Edition</p>
                                    <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Profil utilisateur</h3>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        Modifiez les informations principales et professionnelles.
                                    </p>
                                </div>
                                {flash.success ? (
                                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                                        {flash.success}
                                    </div>
                                ) : null}
                            </div>

                            <form onSubmit={submitProfile} className="space-y-6">
                                <div className="grid gap-5 md:grid-cols-2">
                                    <div>
                                        <InputLabel htmlFor="name" value="Nom complet" />
                                        <TextInput
                                            id="name"
                                            value={data.name}
                                            onChange={(event) => setData('name', event.target.value)}
                                            className="mt-1 block w-full"
                                            required
                                        />
                                        <InputError message={errors.name} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="username" value="Nom utilisateur" />
                                        <TextInput
                                            id="username"
                                            value={data.username}
                                            onChange={(event) => setData('username', event.target.value)}
                                            className="mt-1 block w-full"
                                        />
                                        <InputError message={errors.username} className="mt-2" />
                                    </div>
                                </div>

                                <div className="grid gap-5 md:grid-cols-2">
                                    <div>
                                        <InputLabel htmlFor="email" value="Email" />
                                        <TextInput
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(event) => setData('email', event.target.value)}
                                            className="mt-1 block w-full"
                                            required
                                        />
                                        <InputError message={errors.email} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="department_id" value="Service / Departement" />
                                        <select
                                            id="department_id"
                                            value={data.department_id}
                                            onChange={(event) => setData('department_id', event.target.value)}
                                            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                        >
                                            <option value="">Aucun service</option>
                                            {departments.map((department) => (
                                                <option key={department.id} value={department.id}>
                                                    {department.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.department_id} className="mt-2" />
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                                    Informations professionnelles
                                </div>

                                <div className="grid gap-5 md:grid-cols-2">
                                    <div>
                                        <InputLabel htmlFor="matricule" value="Matricule" />
                                        <TextInput
                                            id="matricule"
                                            value={data.matricule}
                                            onChange={(event) => setData('matricule', event.target.value)}
                                            className="mt-1 block w-full"
                                        />
                                        <InputError message={errors.matricule} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="grade" value="Grade" />
                                        <TextInput
                                            id="grade"
                                            value={data.grade}
                                            onChange={(event) => setData('grade', event.target.value)}
                                            className="mt-1 block w-full"
                                        />
                                        <InputError message={errors.grade} className="mt-2" />
                                    </div>
                                </div>

                                <div className="grid gap-5 md:grid-cols-2">
                                    <div>
                                        <InputLabel htmlFor="telephone" value="Telephone" />
                                        <TextInput
                                            id="telephone"
                                            value={data.telephone}
                                            onChange={(event) => setData('telephone', event.target.value)}
                                            className="mt-1 block w-full"
                                        />
                                        <InputError message={errors.telephone} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="photo" value="Photo de profil" />
                                        {photoUrl ? (
                                            <img
                                                src={photoUrl}
                                                alt={managedUser.name}
                                                className="mb-3 mt-2 h-24 w-24 rounded-2xl border border-slate-200 object-cover shadow-sm dark:border-slate-700"
                                            />
                                        ) : null}
                                        <input
                                            ref={fileInput}
                                            id="photo"
                                            type="file"
                                            accept="image/*"
                                            onChange={(event) => setData('photo', event.target.files?.[0] ?? null)}
                                            className="mt-1 block w-full text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-600 file:px-4 file:py-2 file:font-semibold file:text-white dark:text-slate-300"
                                        />
                                        <InputError message={errors.photo} className="mt-2" />
                                    </div>
                                </div>

                                <div>
                                    <InputLabel htmlFor="adresse" value="Adresse" />
                                    <textarea
                                        id="adresse"
                                        rows={4}
                                        value={data.adresse}
                                        onChange={(event) => setData('adresse', event.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                    <InputError message={errors.adresse} className="mt-2" />
                                </div>

                                <PrimaryButton disabled={processing} className="bg-gradient-to-r from-cyan-600 to-sky-700 text-white hover:from-cyan-700 hover:to-sky-800">
                                    {processing ? 'Enregistrement...' : 'Enregistrer les modifications'}
                                </PrimaryButton>
                            </form>
                        </section>

                        <aside className="space-y-6">
                            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 text-white shadow-lg">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Resume</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Vue rapide du compte gere</p>
                                    </div>
                                </div>

                                <div className="mt-5 space-y-4">
                                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Role</p>
                                        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                                            {managedUser.role_name || 'Aucun role'}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Service</p>
                                        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                                            {managedUser.department_name || 'Non affecte'}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Matricule</p>
                                        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                                            {managedUser.profile.matricule || 'Non renseigne'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Acces rapide</h3>
                                <div className="mt-4 flex flex-col gap-3">
                                    <Link
                                        href={route('contacts.show', managedUser.id)}
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:bg-cyan-500/20"
                                    >
                                        <Eye className="h-4 w-4" />
                                        Voir la fiche utilisateur
                                    </Link>

                                    <Link
                                        href={route('messages.composeparam', { recipient_id: managedUser.id })}
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                                    >
                                        <MessageSquare className="h-4 w-4" />
                                        Envoyer un message
                                    </Link>
                                </div>
                            </div>
                        </aside>
                    </div>
                ) : null}

                {activeTab === 'permissions' ? (
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
                        <section className="space-y-6">
                            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                                <div className="mb-6">
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600">Administration</p>
                                    <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Permissions et controles</h3>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        Ajustez les privileges et appliquez les actions administratives.
                                    </p>
                                </div>

                                <div className="grid gap-5 md:grid-cols-2">
                                    <div>
                                        <InputLabel htmlFor="role_id" value="Role metier" />
                                        <select
                                            id="role_id"
                                            value={managedUser.role_id ?? ''}
                                            onChange={(event) => handleRoleChange(event.target.value)}
                                            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                        >
                                            <option value="">Aucun role</option>
                                            {roles.map((role) => (
                                                <option key={role.id} value={role.id}>
                                                    {role.nom_role}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="access_level" value="Niveau d'acces" />
                                        <select
                                            id="access_level"
                                            value={managedUser.access_level}
                                            onChange={(event) => handleAccessLevelChange(event.target.value as ManagedUser['access_level'])}
                                            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                        >
                                            <option value="user">Standard</option>
                                            <option value="publisher">Droit publier</option>
                                            <option value="admin">Droit admin</option>
                                        </select>
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="organizer" value="Organisation evenement" />
                                        <select
                                            id="organizer"
                                            value={managedUser.can_organize_event ? '1' : '0'}
                                            onChange={(event) => handleOrganizerPermissionChange(event.target.value === '1')}
                                            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                        >
                                            <option value="0">Non</option>
                                            <option value="1">Oui</option>
                                        </select>
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="meetings-organizer" value="Organisation staff" />
                                        <select
                                            id="meetings-organizer"
                                            value={managedUser.can_organize_meetings ? '1' : '0'}
                                            onChange={(event) => handleMeetingsPermissionChange(event.target.value === '1')}
                                            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                        >
                                            <option value="0">Non</option>
                                            <option value="1">Oui</option>
                                        </select>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Publication</p>
                                        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                                            {managedUser.can_publish_publication ? 'Autorisee' : 'Non autorisee'}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            Derive du niveau d'acces actuel.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Action de compte</h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Activez ou bloquez immediatement le compte utilisateur.
                                </p>

                                <button
                                    type="button"
                                    onClick={handleStatusToggle}
                                    className={`mt-5 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition ${
                                        managedUser.is_active
                                            ? 'bg-rose-600 hover:bg-rose-500'
                                            : 'bg-emerald-600 hover:bg-emerald-500'
                                    }`}
                                >
                                    {managedUser.is_active ? <UserX className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                    {managedUser.is_active ? 'Bloquer ce compte' : 'Debloquer ce compte'}
                                </button>
                            </div>
                        </section>

                        <aside className="space-y-6">
                            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Etat des habilitations</h3>
                                <div className="mt-5 space-y-3">
                                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Compte</p>
                                        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                                            {managedUser.is_active ? 'Actif' : 'Bloque'}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Acces admin</p>
                                        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                                            {managedUser.access_level === 'admin' || managedUser.is_super_admin ? 'Oui' : 'Non'}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Publication</p>
                                        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                                            {managedUser.can_publish_publication ? 'Autorisee' : 'Desactivee'}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Organisation</p>
                                        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                                            {managedUser.can_organize_event ? 'Autorisee' : 'Desactivee'}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Staffs</p>
                                        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                                            {managedUser.can_organize_meetings ? 'Autorisee' : 'Desactivee'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                ) : null}

                {activeTab === 'history' ? (
                    <div className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <StatCard
                                label="Envoyes"
                                value={managedUser.activity.stats.sent_count}
                                helper="Messages emis par cet utilisateur"
                                icon={<Send className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />}
                                tone="border-cyan-200 bg-cyan-50 text-cyan-900 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-100"
                            />
                            <StatCard
                                label="Recus"
                                value={managedUser.activity.stats.received_count}
                                helper="Messages recus dans la boite"
                                icon={<Mail className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />}
                                tone="border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100"
                            />
                            <StatCard
                                label="Non lus"
                                value={managedUser.activity.stats.unread_received_count}
                                helper="Messages recus non consultes"
                                icon={<Clock3 className="h-5 w-5 text-amber-700 dark:text-amber-300" />}
                                tone="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100"
                            />
                            <StatCard
                                label="Archives"
                                value={managedUser.activity.stats.archived_count}
                                helper="Messages archives toutes boites"
                                icon={<BadgeCheck className="h-5 w-5 text-violet-700 dark:text-violet-300" />}
                                tone="border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-100"
                            />
                        </div>

                        <ActivityTable
                            title="Messages envoyes recents"
                            emptyLabel="Aucun message envoye recemment."
                            rows={managedUser.activity.recent_sent}
                            direction="sent"
                        />

                        <ActivityTable
                            title="Messages recus recents"
                            emptyLabel="Aucun message recu recemment."
                            rows={managedUser.activity.recent_received}
                            direction="received"
                        />
                    </div>
                ) : null}
            </div>
        </AdminLayout>
    );
}
