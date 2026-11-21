import AdminLayout from '@/Layouts/AdminLayout';
import InputError from '@/Components/InputError';
import RichTextContent from '@/Components/RichTextContent';
import RichTextEditor from '@/Components/RichTextEditor';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    BellRing,
    CalendarClock,
    CheckCircle2,
    Crown,
    Megaphone,
    Pin,
    Save,
    ShieldCheck,
    Users,
} from 'lucide-react';
import type { FormEvent } from 'react';

type Option = {
    id: number;
    nom_role?: string;
    name?: string;
};

function SectionCard({
    eyebrow,
    title,
    description,
    icon: Icon,
    children,
}: {
    eyebrow: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
}) {
    return (
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/85">
            <div className="border-b border-slate-200/70 bg-gradient-to-r from-slate-50 via-white to-cyan-50/70 px-6 py-5 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/30">
                <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 p-3 text-white shadow-lg shadow-cyan-500/25">
                        <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-600 dark:text-cyan-300">
                            {eyebrow}
                        </p>
                        <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                            {title}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {description}
                        </p>
                    </div>
                </div>
            </div>
            <div className="px-6 py-6">{children}</div>
        </section>
    );
}

function ToggleCard({
    checked,
    onChange,
    title,
    description,
    icon: Icon,
    tone = 'cyan',
}: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    tone?: 'cyan' | 'amber' | 'emerald';
}) {
    const tones = {
        cyan: checked
            ? 'border-cyan-300 bg-cyan-50/80 dark:border-cyan-500/40 dark:bg-cyan-500/10'
            : 'border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-950/60',
        amber: checked
            ? 'border-amber-300 bg-amber-50/80 dark:border-amber-500/40 dark:bg-amber-500/10'
            : 'border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-950/60',
        emerald: checked
            ? 'border-emerald-300 bg-emerald-50/80 dark:border-emerald-500/40 dark:bg-emerald-500/10'
            : 'border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-950/60',
    };

    return (
        <label className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition ${tones[tone]}`}>
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500/30 dark:border-slate-600 dark:bg-slate-900"
            />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>
            </div>
        </label>
    );
}

export default function Create({
    roles,
    departments,
}: {
    roles: Option[];
    departments: Option[];
}) {
    const form = useForm({
        title: '',
        content: '',
        audience_type: 'all',
        role_id: '',
        department_id: '',
        priority: 'important',
        starts_at: '',
        ends_at: '',
        is_published: true,
        requires_acknowledgement: false,
        is_pinned: true,
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            role_id: data.role_id === '' ? null : Number(data.role_id),
            department_id: data.department_id === '' ? null : Number(data.department_id),
        }));
        form.post(route('admin.announcements.store'));
    };

    const audienceLabel =
        form.data.audience_type === 'all'
            ? 'Tous les utilisateurs'
            : form.data.audience_type === 'role'
              ? 'Audience par rôle'
              : 'Audience par département';

    const priorityMeta = {
        normal: {
            label: 'Normale',
            className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        },
        important: {
            label: 'Importante',
            className: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
        },
        urgent: {
            label: 'Urgente',
            className: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
        },
    }[form.data.priority as 'normal' | 'important' | 'urgent'];

    return (
        <AdminLayout
            title="Nouvelle annonce globale"
            description="Composez une communication institutionnelle premium et pilotez sa diffusion depuis le centre d'annonces."
            actions={
                <Link
                    href={route('admin.announcements.index')}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Retour liste
                </Link>
            }
        >
            <Head title="Nouvelle annonce globale" />

            <div className="space-y-6">
                <section className="relative overflow-hidden rounded-[2rem] border border-cyan-100 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950 px-6 py-7 text-white shadow-2xl shadow-cyan-900/20 dark:border-cyan-500/20">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.22),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.16),_transparent_24%)]" />
                    <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                        <div className="max-w-3xl">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100 backdrop-blur">
                                    <Megaphone className="h-3.5 w-3.5" />
                                    Centre de diffusion
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-100 backdrop-blur">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    Communication institutionnelle
                                </span>
                            </div>
                            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white lg:text-4xl">
                                Concevoir une annonce globale premium
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200/90">
                                Préparez une annonce officielle, segmentez précisément l'audience et activez un suivi de lecture digne d'un centre de communication exécutif.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 xl:w-[460px] xl:grid-cols-1">
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                                <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/80">Audience</p>
                                <p className="mt-2 text-sm font-semibold text-white">{audienceLabel}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                                <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/80">Priorité</p>
                                <p className="mt-2 text-sm font-semibold text-white">{priorityMeta.label}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                                <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/80">Mode</p>
                                <p className="mt-2 text-sm font-semibold text-white">
                                    {form.data.is_published ? 'Publication immédiate' : 'Brouillon préparatoire'}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[minmax(0,1.22fr)_420px]">
                    <div className="space-y-6">
                        <SectionCard
                            eyebrow="Contenu"
                            title="Message institutionnel"
                            description="Structurez le fond de l'annonce avec un titre fort, une rédaction claire et un rendu premium."
                            icon={Megaphone}
                        >
                            <div className="space-y-5">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Titre de l'annonce
                                    </label>
                                    <input
                                        type="text"
                                        value={form.data.title}
                                        onChange={(event) => form.setData('title', event.target.value)}
                                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-500/10"
                                        placeholder="Exemple : Note de service - Renforcement des validations internes"
                                    />
                                    <InputError className="mt-2" message={form.errors.title} />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Corps de l'annonce
                                    </label>
                                    <RichTextEditor
                                        value={form.data.content}
                                        onChange={(value) => form.setData('content', value)}
                                        placeholder="Rédigez une communication claire, structurée et conforme à la charte institutionnelle..."
                                        minHeightClassName="min-h-[340px]"
                                    />
                                    <InputError className="mt-2" message={form.errors.content} />
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard
                            eyebrow="Ciblage"
                            title="Audience et portée de diffusion"
                            description="Choisissez le périmètre de diffusion et alignez l’annonce avec la bonne structure organisationnelle."
                            icon={Users}
                        >
                            <div className="grid gap-5 lg:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Type d'audience
                                    </label>
                                    <select
                                        value={form.data.audience_type}
                                        onChange={(event) => form.setData('audience_type', event.target.value)}
                                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-500/10"
                                    >
                                        <option value="all">Tous les utilisateurs</option>
                                        <option value="role">Par rôle</option>
                                        <option value="department">Par département</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Niveau de priorité
                                    </label>
                                    <select
                                        value={form.data.priority}
                                        onChange={(event) => form.setData('priority', event.target.value)}
                                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-500/10"
                                    >
                                        <option value="normal">Normale</option>
                                        <option value="important">Importante</option>
                                        <option value="urgent">Urgente</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-4 lg:grid-cols-2">
                                {form.data.audience_type === 'role' ? (
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Rôle ciblé
                                        </label>
                                        <select
                                            value={form.data.role_id}
                                            onChange={(event) => form.setData('role_id', event.target.value)}
                                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-500/10"
                                        >
                                            <option value="">Choisir un rôle</option>
                                            {roles.map((role) => (
                                                <option key={role.id} value={role.id}>
                                                    {role.nom_role}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError className="mt-2" message={form.errors.role_id} />
                                    </div>
                                ) : null}

                                {form.data.audience_type === 'department' ? (
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Département ciblé
                                        </label>
                                        <select
                                            value={form.data.department_id}
                                            onChange={(event) => form.setData('department_id', event.target.value)}
                                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-500/10"
                                        >
                                            <option value="">Choisir un département</option>
                                            {departments.map((department) => (
                                                <option key={department.id} value={department.id}>
                                                    {department.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError className="mt-2" message={form.errors.department_id} />
                                    </div>
                                ) : null}
                            </div>
                        </SectionCard>

                        <SectionCard
                            eyebrow="Temporalité"
                            title="Fenêtre d'affichage"
                            description="Cadrez la période d'exposition pour maîtriser la visibilité de l'annonce dans l'application."
                            icon={CalendarClock}
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Début d'affichage
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={form.data.starts_at}
                                        onChange={(event) => form.setData('starts_at', event.target.value)}
                                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-500/10"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Fin d'affichage
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={form.data.ends_at}
                                        onChange={(event) => form.setData('ends_at', event.target.value)}
                                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-500/10"
                                    />
                                    <InputError className="mt-2" message={form.errors.ends_at} />
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard
                            eyebrow="Diffusion"
                            title="Options de pilotage"
                            description="Décidez si l'annonce doit être publiée immédiatement, épinglée et soumise à accusé de réception."
                            icon={BellRing}
                        >
                            <div className="grid gap-4 lg:grid-cols-3">
                                <ToggleCard
                                    checked={form.data.is_published}
                                    onChange={(checked) => form.setData('is_published', checked)}
                                    title="Publier maintenant"
                                    description="Diffuse immédiatement l'annonce dès l'enregistrement."
                                    icon={CheckCircle2}
                                    tone="emerald"
                                />
                                <ToggleCard
                                    checked={form.data.requires_acknowledgement}
                                    onChange={(checked) => form.setData('requires_acknowledgement', checked)}
                                    title="Accusé requis"
                                    description="Demande un accusé de réception explicite aux destinataires."
                                    icon={ShieldCheck}
                                    tone="amber"
                                />
                                <ToggleCard
                                    checked={form.data.is_pinned}
                                    onChange={(checked) => form.setData('is_pinned', checked)}
                                    title="Épingler"
                                    description="Maintient l'annonce en tête des communications visibles."
                                    icon={Pin}
                                    tone="cyan"
                                />
                            </div>

                            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-cyan-50/70 px-5 py-4 dark:border-slate-700 dark:from-slate-950 dark:to-cyan-950/20">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                        Validation finale
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        Enregistrez une version prête à publier, fidèle à l'identité institutionnelle Cmail.
                                    </p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 via-sky-700 to-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-900/20 transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <Save className="h-4 w-4" />
                                    Enregistrer l'annonce
                                </button>
                            </div>
                        </SectionCard>
                    </div>

                    <aside className="space-y-6">
                        <section className="overflow-hidden rounded-[2rem] border border-cyan-100 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950 text-white shadow-2xl shadow-cyan-900/20 dark:border-cyan-500/20">
                            <div className="border-b border-white/10 px-6 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                                        <Megaphone className="h-5 w-5 text-cyan-100" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">
                                            Aperçu premium
                                        </p>
                                        <h2 className="mt-1 text-lg font-semibold text-white">
                                            Communication diffusée
                                        </h2>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-5 px-6 py-6">
                                <div className="flex flex-wrap gap-2">
                                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                                        <Megaphone className="h-3.5 w-3.5" />
                                        Annonce globale
                                    </span>
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityMeta.className}`}>
                                        {priorityMeta.label}
                                    </span>
                                    {form.data.is_pinned ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-semibold text-cyan-100">
                                            <Pin className="h-3.5 w-3.5" />
                                            Épinglée
                                        </span>
                                    ) : null}
                                </div>

                                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
                                    <p className="text-xl font-semibold leading-tight text-white">
                                        {form.data.title.trim() || "Titre de l'annonce"}
                                    </p>
                                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-cyan-100/75">
                                        {audienceLabel}
                                    </p>
                                    <div className="mt-4 border-t border-white/10 pt-4 text-sm leading-7 text-slate-100/90">
                                        <RichTextContent html={form.data.content} compact />
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                                        <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/70">Mode</p>
                                        <p className="mt-2 text-sm font-semibold text-white">
                                            {form.data.is_published ? 'Publication immédiate' : 'Brouillon institutionnel'}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                                        <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/70">Suivi</p>
                                        <p className="mt-2 text-sm font-semibold text-white">
                                            {form.data.requires_acknowledgement ? 'Accusé obligatoire' : 'Lecture simple'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/85">
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                                Recommandations de diffusion
                            </h3>
                            <div className="mt-4 space-y-3">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-950/60">
                                    <div className="flex items-start gap-3">
                                        <Crown className="mt-0.5 h-4 w-4 text-amber-500" />
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Annonce importante</p>
                                            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                                Utilisez ce niveau pour les notes de service, décisions de direction et communications à forte portée institutionnelle.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-950/60">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="mt-0.5 h-4 w-4 text-rose-500" />
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Annonce urgente</p>
                                            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                                Réservez ce niveau aux interruptions critiques, consignes immédiates ou informations à traitement prioritaire.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </aside>
                </form>
            </div>
        </AdminLayout>
    );
}
