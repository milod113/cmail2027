import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AdminLayout from '@/Layouts/AdminLayout';
import { PageProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    CheckCircle2,
    KeyRound,
    Lock,
    ShieldCheck,
    Sparkles,
    Upload,
    UserPlus,
    UserRound,
    UserRoundCheck,
    UserX,
    Zap,
} from 'lucide-react';
import { type FormEvent, useEffect, useRef, useState } from 'react';

type RoleOption = {
    id: number;
    nom_role: string;
};

type DepartmentOption = {
    id: number;
    name: string;
};

type UserCreateProps = PageProps<{
    roles: RoleOption[];
    departments: DepartmentOption[];
}>;

type TabKey = 'profile' | 'permissions';

function SummaryCard({
    label,
    value,
    helper,
}: {
    label: string;
    value: string;
    helper: string;
}) {
    return (
        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helper}</p>
        </div>
    );
}

function StatusPill({ active }: { active: boolean }) {
    return (
        <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                active
                    ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-100'
                    : 'border-rose-400/30 bg-rose-500/15 text-rose-100'
            }`}
        >
            {active ? <UserRoundCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
            {active ? 'Compte actif' : 'Compte bloque'}
        </span>
    );
}

export default function UserCreate({ roles, departments }: UserCreateProps) {
    const fileInput = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<TabKey>('profile');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        username: '',
        email: '',
        department_id: '',
        role_id: '',
        matricule: '',
        grade: '',
        telephone: '',
        adresse: '',
        photo: null as File | null,
        access_level: 'user' as 'user' | 'publisher' | 'admin',
        can_organize_event: '0',
        is_active: '1',
        password: '',
        password_confirmation: '',
    });

    const isActive = data.is_active === '1';
    const canPublish = ['publisher', 'admin'].includes(data.access_level);
    const isAdmin = data.access_level === 'admin';
    const selectedDepartment = departments.find((department) => String(department.id) === data.department_id);
    const selectedRole = roles.find((role) => String(role.id) === data.role_id);

    const tabs: { id: TabKey; label: string; icon: JSX.Element }[] = [
        { id: 'profile', label: 'Profil', icon: <UserRound className="h-4 w-4" /> },
        { id: 'permissions', label: 'Permissions', icon: <ShieldCheck className="h-4 w-4" /> },
    ];

    useEffect(() => {
        if (!data.photo) {
            setPreviewUrl(null);
            return;
        }

        const objectUrl = URL.createObjectURL(data.photo);
        setPreviewUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [data.photo]);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(route('admin.users.store'), {
            forceFormData: true,
            preserveScroll: true,
            onError: (formErrors) => {
                if (formErrors.role_id || formErrors.access_level || formErrors.can_organize_event || formErrors.is_active) {
                    setActiveTab('permissions');
                    return;
                }

                setActiveTab('profile');
            },
            onSuccess: () => {
                if (fileInput.current) {
                    fileInput.current.value = '';
                }
            },
        });
    };

    return (
        <AdminLayout
            title="Creation utilisateur"
            description="Creez un compte complet avec son profil, son mot de passe et ses privileges admin."
            actions={
                <Link
                    href={route('admin.users.index')}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Retour liste
                </Link>
            }
        >
            <Head title="Creer un utilisateur" />

            <form onSubmit={submit} className="space-y-6">
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 shadow-2xl lg:p-8">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.18),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.16),_transparent_30%)]" />
                    <div className="absolute -right-20 top-0 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
                    <div className="absolute -bottom-24 left-0 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />

                    <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                        <div className="flex items-start gap-5">
                            {previewUrl ? (
                                <img
                                    src={previewUrl}
                                    alt="Apercu profil"
                                    className="h-24 w-24 rounded-3xl border border-white/20 object-cover shadow-xl"
                                />
                            ) : (
                                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/10 text-white shadow-xl backdrop-blur-sm">
                                    <UserPlus className="h-10 w-10" />
                                </div>
                            )}

                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <StatusPill active={isActive} />
                                    <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        {data.access_level}
                                    </span>
                                    {data.can_organize_event === '1' ? (
                                        <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-100">
                                            <Zap className="h-3.5 w-3.5" />
                                            Organisateur
                                        </span>
                                    ) : null}
                                </div>

                                <div>
                                    <h2 className="text-3xl font-bold tracking-tight text-white">
                                        {data.name || 'Nouveau compte utilisateur'}
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-300">
                                        {data.email || 'Email professionnel a renseigner'}
                                    </p>
                                    <p className="mt-1 text-sm text-cyan-100">
                                        {data.grade || selectedRole?.nom_role || 'Role a definir'}
                                        {' • '}
                                        {selectedDepartment?.name || 'Service non affecte'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[22rem]">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white backdrop-blur-sm">
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Publication</p>
                                <p className="mt-2 text-3xl font-bold">{canPublish ? 'Oui' : 'Non'}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white backdrop-blur-sm">
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Acces admin</p>
                                <p className="mt-2 text-3xl font-bold">{isAdmin ? 'Oui' : 'Non'}</p>
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
                                onClick={() => setActiveTab(tab.id)}
                                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                                    activeTab === tab.id
                                        ? 'bg-slate-900 text-white shadow-sm dark:bg-cyan-600'
                                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,1fr)]">
                    <section className="space-y-6">
                        {activeTab === 'profile' ? (
                            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                                <div className="mb-6">
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600">Identite</p>
                                    <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Profil utilisateur</h3>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        Renseignez les informations principales et les details du profil hospitalier.
                                    </p>
                                </div>

                                <div className="grid gap-5 md:grid-cols-2">
                                    <div>
                                        <InputLabel htmlFor="name" value="Nom complet" />
                                        <TextInput
                                            id="name"
                                            value={data.name}
                                            onChange={(event) => setData('name', event.target.value)}
                                            className="mt-1 block w-full"
                                        />
                                        <InputError message={errors.name} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="username" value="Nom d'utilisateur" />
                                        <TextInput
                                            id="username"
                                            value={data.username}
                                            onChange={(event) => setData('username', event.target.value)}
                                            className="mt-1 block w-full"
                                        />
                                        <InputError message={errors.username} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="email" value="Email" />
                                        <TextInput
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(event) => setData('email', event.target.value)}
                                            className="mt-1 block w-full"
                                        />
                                        <InputError message={errors.email} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="department_id" value="Service / departement" />
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
                                        <InputLabel htmlFor="grade" value="Grade / fonction" />
                                        <TextInput
                                            id="grade"
                                            value={data.grade}
                                            onChange={(event) => setData('grade', event.target.value)}
                                            className="mt-1 block w-full"
                                        />
                                        <InputError message={errors.grade} className="mt-2" />
                                    </div>

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
                                        <div className="mt-1 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                                            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                                                <Upload className="h-4 w-4 text-cyan-500" />
                                                Importer une photo
                                            </div>
                                            <input
                                                ref={fileInput}
                                                id="photo"
                                                type="file"
                                                accept="image/*"
                                                onChange={(event) => setData('photo', event.target.files?.[0] ?? null)}
                                                className="mt-3 block w-full text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-600 file:px-4 file:py-2 file:font-semibold file:text-white dark:text-slate-300"
                                            />
                                            <InputError message={errors.photo} className="mt-2" />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5">
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

                                <div className="mt-6 grid gap-5 md:grid-cols-2">
                                    <div>
                                        <InputLabel htmlFor="password" value="Mot de passe initial" />
                                        <TextInput
                                            id="password"
                                            type="password"
                                            value={data.password}
                                            onChange={(event) => setData('password', event.target.value)}
                                            className="mt-1 block w-full"
                                        />
                                        <InputError message={errors.password} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="password_confirmation" value="Confirmation mot de passe" />
                                        <TextInput
                                            id="password_confirmation"
                                            type="password"
                                            value={data.password_confirmation}
                                            onChange={(event) => setData('password_confirmation', event.target.value)}
                                            className="mt-1 block w-full"
                                        />
                                        <InputError message={errors.password_confirmation} className="mt-2" />
                                    </div>
                                </div>
                            </section>
                        ) : null}

                        {activeTab === 'permissions' ? (
                            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                                <div className="mb-6">
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600">Habilitations</p>
                                    <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Privileges et acces</h3>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        Definissez le role metier, les droits de publication, l'organisation et l'etat du compte.
                                    </p>
                                </div>

                                <div className="grid gap-5 md:grid-cols-2">
                                    <div>
                                        <InputLabel htmlFor="role_id" value="Role metier" />
                                        <select
                                            id="role_id"
                                            value={data.role_id}
                                            onChange={(event) => setData('role_id', event.target.value)}
                                            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                        >
                                            <option value="">Aucun role</option>
                                            {roles.map((role) => (
                                                <option key={role.id} value={role.id}>
                                                    {role.nom_role}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.role_id} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="access_level" value="Niveau d'acces" />
                                        <select
                                            id="access_level"
                                            value={data.access_level}
                                            onChange={(event) => setData('access_level', event.target.value as 'user' | 'publisher' | 'admin')}
                                            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                        >
                                            <option value="user">Standard</option>
                                            <option value="publisher">Droit publier</option>
                                            <option value="admin">Droit admin</option>
                                        </select>
                                        <InputError message={errors.access_level} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="can_organize_event" value="Peut organiser des evenements" />
                                        <select
                                            id="can_organize_event"
                                            value={data.can_organize_event}
                                            onChange={(event) => setData('can_organize_event', event.target.value)}
                                            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                        >
                                            <option value="0">Non</option>
                                            <option value="1">Oui</option>
                                        </select>
                                        <InputError message={errors.can_organize_event} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="is_active" value="Etat initial du compte" />
                                        <select
                                            id="is_active"
                                            value={data.is_active}
                                            onChange={(event) => setData('is_active', event.target.value)}
                                            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                        >
                                            <option value="1">Actif</option>
                                            <option value="0">Bloque</option>
                                        </select>
                                        <InputError message={errors.is_active} className="mt-2" />
                                    </div>
                                </div>

                                <div className="mt-6 grid gap-4 md:grid-cols-3">
                                    <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-500/20 dark:bg-cyan-500/10">
                                        <p className="text-xs uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">Publication</p>
                                        <p className="mt-2 text-sm font-semibold text-cyan-900 dark:text-cyan-100">
                                            {canPublish ? 'Autorisee' : 'Desactivee'}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
                                        <p className="text-xs uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">Organisation</p>
                                        <p className="mt-2 text-sm font-semibold text-amber-900 dark:text-amber-100">
                                            {data.can_organize_event === '1' ? 'Autorisee' : 'Desactivee'}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-500/20 dark:bg-violet-500/10">
                                        <p className="text-xs uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300">Administration</p>
                                        <p className="mt-2 text-sm font-semibold text-violet-900 dark:text-violet-100">
                                            {isAdmin ? 'Acces admin' : 'Acces standard'}
                                        </p>
                                    </div>
                                </div>
                            </section>
                        ) : null}

                        <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">Validation finale</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Le compte sera cree avec son profil et ses privileges en une seule operation.
                                </p>
                            </div>
                            <PrimaryButton
                                disabled={processing}
                                className="bg-gradient-to-r from-cyan-600 to-sky-700 text-white hover:from-cyan-700 hover:to-sky-800"
                            >
                                {processing ? 'Creation...' : 'Creer l utilisateur'}
                            </PrimaryButton>
                        </div>
                    </section>

                    <aside className="space-y-6">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 text-white shadow-lg">
                                    <Sparkles className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Resume creation</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Projection du compte en cours</p>
                                </div>
                            </div>

                            <div className="mt-5 space-y-4">
                                <SummaryCard
                                    label="Role"
                                    value={selectedRole?.nom_role || 'Aucun role'}
                                    helper="Role metier assigne"
                                />
                                <SummaryCard
                                    label="Service"
                                    value={selectedDepartment?.name || 'Non affecte'}
                                    helper="Departement rattache"
                                />
                                <SummaryCard
                                    label="Matricule"
                                    value={data.matricule || 'Non renseigne'}
                                    helper="Reference interne"
                                />
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Habilitations calculees</h3>
                            <div className="mt-5 space-y-3">
                                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                        <ShieldCheck className="h-4 w-4 text-cyan-500" />
                                        <span className="text-sm font-semibold">Niveau d'acces</span>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{data.access_level}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                        <Building2 className="h-4 w-4 text-amber-500" />
                                        <span className="text-sm font-semibold">Organisation evenement</span>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                        {data.can_organize_event === '1' ? 'Oui' : 'Non'}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        <span className="text-sm font-semibold">Publication</span>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                        {canPublish ? 'Droit publier actif' : 'Droit publier inactif'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Securite compte</h3>
                            <div className="mt-5 space-y-4">
                                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                        <KeyRound className="h-4 w-4 text-cyan-500" />
                                        <span className="text-sm font-semibold">Mot de passe</span>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                        {data.password ? 'Defini et pret a etre enregistre' : 'A definir'}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                        <Lock className="h-4 w-4 text-violet-500" />
                                        <span className="text-sm font-semibold">Etat initial</span>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                        {isActive ? 'Compte cree en mode actif' : 'Compte cree en mode bloque'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </form>
        </AdminLayout>
    );
}
