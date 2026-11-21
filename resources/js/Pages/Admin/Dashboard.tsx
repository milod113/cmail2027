import AdminLayout from '@/Layouts/AdminLayout';
import { Link } from '@inertiajs/react';
import { Activity, Building2, FileText, LifeBuoy, Megaphone, MessageSquare, Users } from 'lucide-react';

type Ticket = {
    id: number;
    status: string;
    category: string;
    impact: string;
    description: string;
    created_at: string | null;
    user: {
        id: number;
        name: string;
        email: string;
    } | null;
};

type DashboardProps = {
    stats: {
        users_total: number;
        users_blocked: number;
        departments_total: number;
        support_open: number;
        messages_total: number;
        publications_total: number;
        announcements_total: number;
        announcements_published: number;
    };
    recentSupportTickets: Ticket[];
    recentAnnouncements: {
        id: number;
        title: string;
        priority: string;
        is_published: boolean;
        published_at: string | null;
        recipients_count: number;
        read_count: number;
        creator: {
            name: string;
            email: string;
        } | null;
    }[];
};

function statCards(stats: DashboardProps['stats']) {
    return [
        {
            label: 'Utilisateurs',
            value: stats.users_total,
            helper: `${stats.users_blocked} bloques`,
            icon: <Users className="h-5 w-5" />,
        },
        {
            label: 'Departements',
            value: stats.departments_total,
            helper: 'Structure hospitaliere',
            icon: <Building2 className="h-5 w-5" />,
        },
        {
            label: 'Support ouvert',
            value: stats.support_open,
            helper: 'Tickets en attente',
            icon: <LifeBuoy className="h-5 w-5" />,
        },
        {
            label: 'Messages',
            value: stats.messages_total,
            helper: 'Trafic global',
            icon: <MessageSquare className="h-5 w-5" />,
        },
        {
            label: 'Publications',
            value: stats.publications_total,
            helper: 'Contenu interne',
            icon: <FileText className="h-5 w-5" />,
        },
        {
            label: 'Activite',
            value: stats.messages_total + stats.publications_total,
            helper: 'Messages + publications',
            icon: <Activity className="h-5 w-5" />,
        },
        {
            label: 'Annonces',
            value: stats.announcements_total,
            helper: `${stats.announcements_published} publiees`,
            icon: <Megaphone className="h-5 w-5" />,
        },
    ];
}

function formatDate(value: string | null): string {
    if (!value) {
        return '-';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('fr-FR');
}

export default function Dashboard({ stats, recentSupportTickets, recentAnnouncements }: DashboardProps) {
    return (
        <AdminLayout
            title="Dashboard Admin"
            description="Vue globale de l'activite, du support et des utilisateurs."
            actions={
                <div className="flex flex-wrap gap-2">
                    <Link
                        href={route('admin.announcements.create')}
                        className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-cyan-600 dark:hover:bg-cyan-500"
                    >
                        Nouvelle annonce
                    </Link>
                    <Link
                        href={route('admin.support.index')}
                        className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        Ouvrir le support
                    </Link>
                </div>
            }
        >
            <div className="space-y-6">
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {statCards(stats).map((card) => (
                        <article
                            key={card.label}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
                                    <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{card.value}</p>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{card.helper}</p>
                                </div>
                                <div className="rounded-xl bg-cyan-50 p-2 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                                    {card.icon}
                                </div>
                            </div>
                        </article>
                    ))}
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                            Derniers tickets support
                        </h2>
                        <Link
                            href={route('admin.support.index')}
                            className="text-sm font-medium text-cyan-700 transition hover:text-cyan-600 dark:text-cyan-300"
                        >
                            Voir tout
                        </Link>
                    </div>
                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {recentSupportTickets.length > 0 ? (
                            recentSupportTickets.map((ticket) => (
                                <div key={ticket.id} className="flex flex-col gap-2 px-5 py-4 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            Ticket #{ticket.id} - {ticket.user?.name ?? 'Utilisateur inconnu'}
                                        </p>
                                        <p className="text-sm text-slate-600 dark:text-slate-300">{ticket.description}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                            {ticket.category}
                                        </span>
                                        <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                                            {ticket.status}
                                        </span>
                                        <Link
                                            href={route('admin.support.index', { ticket: ticket.id })}
                                            className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                        >
                                            Ouvrir
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                Aucun ticket recent.
                            </p>
                        )}
                    </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                            Annonces globales recentes
                        </h2>
                        <Link
                            href={route('admin.announcements.index')}
                            className="text-sm font-medium text-cyan-700 transition hover:text-cyan-600 dark:text-cyan-300"
                        >
                            Gerer
                        </Link>
                    </div>
                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {recentAnnouncements.length > 0 ? (
                            recentAnnouncements.map((announcement) => (
                                <div key={announcement.id} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            {announcement.title}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            {announcement.creator?.name ?? 'Administration'} · {formatDate(announcement.published_at)}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                            {announcement.priority}
                                        </span>
                                        <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                                            {announcement.read_count}/{announcement.recipients_count} lus
                                        </span>
                                        <Link
                                            href={route('admin.announcements.show', announcement.id)}
                                            className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                        >
                                            Ouvrir
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                Aucune annonce globale recente.
                            </p>
                        )}
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
