import AdminLayout from '@/Layouts/AdminLayout';
import { Link } from '@inertiajs/react';
import { Activity, Building2, FileText, LifeBuoy, MessageSquare, Users } from 'lucide-react';

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
    };
    recentSupportTickets: Ticket[];
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
    ];
}

export default function Dashboard({ stats, recentSupportTickets }: DashboardProps) {
    return (
        <AdminLayout
            title="Dashboard Admin"
            description="Vue globale de l'activite, du support et des utilisateurs."
            actions={
                <Link
                    href={route('admin.support.index')}
                    className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-cyan-600 dark:hover:bg-cyan-500"
                >
                    Ouvrir le support
                </Link>
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
            </div>
        </AdminLayout>
    );
}
