import AdminLayout from '@/Layouts/AdminLayout';
import RichTextContent from '@/Components/RichTextContent';
import { Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Crown,
    Eye,
    Megaphone,
    Pin,
    RadioTower,
    ShieldAlert,
    Users,
} from 'lucide-react';

type Recipient = {
    id: number;
    name: string;
    email: string;
    is_read: boolean;
    read_at: string | null;
    is_acknowledged: boolean;
    acknowledged_at: string | null;
};

type AnnouncementDetail = {
    id: number;
    title: string;
    content: string;
    priority: string;
    is_published: boolean;
    requires_acknowledgement: boolean;
    is_pinned: boolean;
    audience_type: string;
    audience_label: string;
    role_id: number | null;
    department_id: number | null;
    published_at: string | null;
    starts_at: string | null;
    ends_at: string | null;
    recipients_count: number;
    read_count: number;
    acknowledged_count: number;
    creator: {
        id: number;
        name: string;
        email: string;
    } | null;
    recipients: Recipient[];
};

function formatDate(value: string | null): string {
    if (!value) {
        return '-';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('fr-FR');
}

function StatCard({
    label,
    value,
    helper,
    icon: Icon,
}: {
    label: string;
    value: string;
    helper: string;
    icon: React.ComponentType<{ className?: string }>;
}) {
    return (
        <article className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/70">{label}</p>
                    <p className="mt-2 text-2xl font-bold text-white">{value}</p>
                    <p className="mt-1 text-xs text-slate-200/70">{helper}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 text-cyan-100">
                    <Icon className="h-4.5 w-4.5" />
                </div>
            </div>
        </article>
    );
}

export default function Show({ announcement }: { announcement: AnnouncementDetail }) {
    const togglePublish = () => {
        router.patch(
            route('admin.announcements.publish', announcement.id),
            { is_published: !announcement.is_published },
            { preserveScroll: true },
        );
    };

    const readPercentage = announcement.recipients_count > 0
        ? Math.round((announcement.read_count / announcement.recipients_count) * 100)
        : 0;
    const acknowledgePercentage = announcement.recipients_count > 0
        ? Math.round((announcement.acknowledged_count / announcement.recipients_count) * 100)
        : 0;

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
    }[announcement.priority as 'normal' | 'important' | 'urgent'];

    return (
        <AdminLayout
            title="Annonce globale"
            description="Suivez la diffusion, la lecture et les accusés de réception dans un centre de supervision premium."
            actions={
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={togglePublish}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                            announcement.is_published
                                ? 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
                                : 'bg-slate-900 text-white hover:bg-slate-700 dark:bg-cyan-600 dark:hover:bg-cyan-500'
                        }`}
                    >
                        <RadioTower className="h-4 w-4" />
                        {announcement.is_published ? 'Repasser en brouillon' : 'Publier'}
                    </button>
                    <Link
                        href={route('admin.announcements.index')}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Retour liste
                    </Link>
                </div>
            }
        >
            <div className="space-y-6">
                <section className="relative overflow-hidden rounded-[2rem] border border-cyan-100 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950 px-6 py-7 text-white shadow-2xl shadow-cyan-900/20 dark:border-cyan-500/20">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.22),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.18),_transparent_24%)]" />
                    <div className="relative">
                        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                            <div className="max-w-3xl">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100 backdrop-blur">
                                        <Megaphone className="h-3.5 w-3.5" />
                                        Communication globale
                                    </span>
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityMeta.className}`}>
                                        {priorityMeta.label}
                                    </span>
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                        announcement.is_published
                                            ? 'bg-emerald-400/15 text-emerald-100'
                                            : 'bg-slate-200/10 text-slate-100'
                                    }`}>
                                        {announcement.is_published ? 'Publiée' : 'Brouillon'}
                                    </span>
                                    {announcement.requires_acknowledgement ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-100">
                                            <ShieldAlert className="h-3.5 w-3.5" />
                                            Accusé requis
                                        </span>
                                    ) : null}
                                    {announcement.is_pinned ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-semibold text-cyan-100">
                                            <Pin className="h-3.5 w-3.5" />
                                            Épinglée
                                        </span>
                                    ) : null}
                                </div>

                                <h1 className="mt-4 text-3xl font-bold tracking-tight text-white lg:text-4xl">
                                    {announcement.title}
                                </h1>
                                <p className="mt-3 text-sm leading-7 text-slate-200/90">
                                    Audience : {announcement.audience_label}. Communication pilotée depuis le centre de supervision administratif.
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px] xl:grid-cols-2">
                                <StatCard
                                    label="Destinataires"
                                    value={String(announcement.recipients_count)}
                                    helper="Audience synchronisée"
                                    icon={Users}
                                />
                                <StatCard
                                    label="Lectures"
                                    value={`${readPercentage}%`}
                                    helper={`${announcement.read_count} lectures confirmées`}
                                    icon={Eye}
                                />
                                <StatCard
                                    label="Accusés"
                                    value={`${acknowledgePercentage}%`}
                                    helper={`${announcement.acknowledged_count} retours enregistrés`}
                                    icon={CheckCircle2}
                                />
                                <StatCard
                                    label="Créateur"
                                    value={announcement.creator?.name ?? '-'}
                                    helper={announcement.creator?.email ?? 'Administration'}
                                    icon={Crown}
                                />
                            </div>
                        </div>

                        <div className="mt-6 grid gap-4 lg:grid-cols-2">
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                                <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/70">Fenêtre de diffusion</p>
                                <div className="mt-3 grid gap-2 text-sm text-slate-100/90">
                                    <p>Début : {formatDate(announcement.starts_at)}</p>
                                    <p>Fin : {formatDate(announcement.ends_at)}</p>
                                    <p>Publication : {formatDate(announcement.published_at)}</p>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                                <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/70">Progression</p>
                                <div className="mt-3 space-y-3">
                                    <div>
                                        <div className="mb-1 flex items-center justify-between text-xs text-slate-200/80">
                                            <span>Taux de lecture</span>
                                            <span>{readPercentage}%</span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500"
                                                style={{ width: `${readPercentage}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="mb-1 flex items-center justify-between text-xs text-slate-200/80">
                                            <span>Taux d'accusé</span>
                                            <span>{acknowledgePercentage}%</span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                                                style={{ width: `${acknowledgePercentage}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_430px]">
                    <section className="space-y-6">
                        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/85">
                            <div className="border-b border-slate-200/70 bg-gradient-to-r from-slate-50 via-white to-cyan-50/70 px-6 py-5 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/30">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-600 dark:text-cyan-300">
                                    Message officiel
                                </p>
                                <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                                    Contenu de l'annonce
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Lecture institutionnelle du contenu diffusé aux équipes concernées.
                                </p>
                            </div>
                            <div className="px-6 py-6">
                                <div className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-cyan-50/50 px-6 py-6 dark:border-slate-700 dark:from-slate-950 dark:to-cyan-950/10">
                                    <RichTextContent html={announcement.content} />
                                </div>
                            </div>
                        </div>
                    </section>

                    <aside className="space-y-6">
                        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/85">
                            <div className="border-b border-slate-200/70 bg-gradient-to-r from-slate-50 via-white to-cyan-50/70 px-6 py-5 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/30">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-600 dark:text-cyan-300">
                                    Suivi exécutif
                                </p>
                                <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                                    Métadonnées de diffusion
                                </h2>
                            </div>
                            <div className="grid gap-3 px-6 py-6 text-sm text-slate-600 dark:text-slate-300">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-950/60">
                                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Créateur</p>
                                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">{announcement.creator?.name ?? '-'}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{announcement.creator?.email ?? '-'}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-950/60">
                                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Audience</p>
                                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">{announcement.audience_label}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-950/60">
                                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Publication</p>
                                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">{formatDate(announcement.published_at)}</p>
                                </div>
                            </div>
                        </section>

                        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/85">
                            <div className="border-b border-slate-200/70 bg-gradient-to-r from-slate-50 via-white to-cyan-50/70 px-6 py-5 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/30">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-600 dark:text-cyan-300">
                                    Destinataires
                                </p>
                                <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                                    Lecture et accusés
                                </h2>
                            </div>
                            <div className="max-h-[820px] space-y-3 overflow-y-auto px-6 py-6">
                                {announcement.recipients.length > 0 ? (
                                    announcement.recipients.map((recipient) => (
                                        <article
                                            key={recipient.id}
                                            className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-cyan-200 hover:bg-white dark:border-slate-700 dark:bg-slate-950/60 dark:hover:border-cyan-500/30 dark:hover:bg-slate-900"
                                        >
                                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                                        {recipient.name}
                                                    </p>
                                                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                                        {recipient.email}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                        recipient.is_read
                                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
                                                            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                    }`}>
                                                        {recipient.is_read ? 'Lu' : 'Non lu'}
                                                    </span>
                                                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                        recipient.is_acknowledged
                                                            ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300'
                                                            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                    }`}>
                                                        {recipient.is_acknowledged ? 'Accusé reçu' : 'En attente'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="mt-3 grid gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                <p>Lecture : {formatDate(recipient.read_at)}</p>
                                                <p>Accusé : {formatDate(recipient.acknowledged_at)}</p>
                                            </div>
                                        </article>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Aucun destinataire synchronisé.
                                    </p>
                                )}
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </AdminLayout>
    );
}
