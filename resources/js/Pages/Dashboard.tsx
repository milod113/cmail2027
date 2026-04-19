import ActionRequiredWidget from '@/Components/ActionRequiredWidget';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PendingRequestsWidget from '@/Components/PendingRequestsWidget';
import PublicationsFeed from '@/Components/PublicationsFeed';
import { Head, Link } from '@inertiajs/react';
import { Bell, CalendarDays, FileText, Mail } from 'lucide-react';

type DashboardProps = {
    publications: Array<{
        id: number;
        title?: string | null;
        content: string;
        photo_url?: string | null;
        created_at: string;
        likes_count: number;
        comments_count: number;
        is_liked_by_current_user: boolean;
        user: {
            id: number;
            name: string;
            email?: string;
        };
        comments: Array<{
            id: number;
            content: string;
            created_at: string;
            user: {
                id: number;
                name: string;
                email?: string;
            };
        }>;
    }>;
    stats: {
        unread_messages: number;
        pending_invitations: number;
        drafts: number;
        unread_notifications: number;
        publications_count: number;
    };
    pendingSentRequests: Array<{
        id: number;
        subject: string;
        body: string;
        excerpt: string;
        sent_at: string | null;
        created_at: string | null;
        receiver: {
            id: number;
            name: string;
            email?: string | null;
        } | null;
    }>;
    actionRequiredMessages: Array<{
        id: number;
        subject: string;
        body: string;
        excerpt: string;
        sent_at: string | null;
        created_at: string | null;
        sender: {
            id: number;
            name: string;
            email?: string | null;
        } | null;
    }>;
};

function statCards(stats: DashboardProps['stats']) {
    return [
        {
            label: 'Messages non lus',
            value: stats.unread_messages,
            helper: 'Dans votre boîte de réception',
            icon: <Mail className="h-5 w-5" />,
        },
        {
            label: 'Invitations en attente',
            value: stats.pending_invitations,
            helper: 'Confirmez vos événements',
            icon: <CalendarDays className="h-5 w-5" />,
        },
        {
            label: 'Brouillons',
            value: stats.drafts,
            helper: 'Messages enregistrés',
            icon: <FileText className="h-5 w-5" />,
        },
        {
            label: 'Notifications',
            value: stats.unread_notifications,
            helper: 'Alertes récentes',
            icon: <Bell className="h-5 w-5" />,
        },
    ];
}

export default function Dashboard({ publications, stats, pendingSentRequests, actionRequiredMessages }: DashboardProps) {
    return (
        <AuthenticatedLayout
            title="Dashboard"
            description="Vue d'ensemble de vos messages, invitations et publications internes."
        >
            <Head title="Dashboard" />

            <div className="space-y-6">
                <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-sm shadow-slate-200/50 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                        <div className="max-w-3xl">
                            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                                Bonjour, bienvenue sur votre tableau de bord
                            </h1>
                            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                Retrouvez vos actions prioritaires, le suivi de votre activité et les dernières publications internes.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <Link
                                href={route('messages.create')}
                                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                            >
                                Nouveau message
                            </Link>
                            <Link
                                href={route('messages.inbox')}
                                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                            >
                                Boîte de réception
                            </Link>
                            <Link
                                href={route('events.invitations')}
                                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                            >
                                Mes invitations
                            </Link>
                            <Link
                                href={route('contacts.index')}
                                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                            >
                                Annuaire
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                                <div className="rounded-2xl bg-cyan-50 p-2 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                                    {card.icon}
                                </div>
                            </div>
                        </article>
                    ))}
                </section>

                <ActionRequiredWidget actionRequiredMessages={actionRequiredMessages} />

                <PendingRequestsWidget pendingSentRequests={pendingSentRequests} />

                <PublicationsFeed publications={publications} />
            </div>
        </AuthenticatedLayout>
    );
}
