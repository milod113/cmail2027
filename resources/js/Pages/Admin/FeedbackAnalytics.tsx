import AdminLayout from '@/Layouts/AdminLayout';
import { router } from '@inertiajs/react';
import { Star, MessageSquareText, ChartColumnIncreasing, Sparkles, Send } from 'lucide-react';

type FeedbackComment = {
    id: number;
    rating: number;
    comment: string | null;
    created_at: string | null;
    user: {
        id: number;
        name: string;
        email: string;
    } | null;
};

type DistributionItem = {
    rating: number;
    count: number;
    percentage: number;
};

type FeedbackAnalyticsProps = {
    analytics: {
        average_rating: number;
        total_feedbacks: number;
        recent_comments: FeedbackComment[];
        distribution: DistributionItem[];
    };
};

function formatDate(value: string | null) {
    if (!value) {
        return '-';
    }

    return new Date(value).toLocaleString('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

function renderStars(rating: number) {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
                <Star
                    key={value}
                    className={`h-4 w-4 ${
                        value <= rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300 dark:text-slate-600'
                    }`}
                />
            ))}
        </div>
    );
}

export default function FeedbackAnalytics({ analytics }: FeedbackAnalyticsProps) {
    const statCards = [
        {
            label: 'Moyenne',
            value: `${analytics.average_rating.toFixed(1)}/5`,
            helper: 'Note moyenne des utilisateurs',
            icon: <Star className="h-5 w-5" />,
            tone: 'from-amber-500 to-orange-500',
        },
        {
            label: 'Total avis',
            value: String(analytics.total_feedbacks),
            helper: 'Feedbacks systeme enregistres',
            icon: <MessageSquareText className="h-5 w-5" />,
            tone: 'from-cyan-500 to-sky-600',
        },
        {
            label: 'Commentaires recents',
            value: String(analytics.recent_comments.length),
            helper: '10 derniers verbatims utiles',
            icon: <ChartColumnIncreasing className="h-5 w-5" />,
            tone: 'from-emerald-500 to-teal-600',
        },
    ];

    return (
        <AdminLayout
            title="Feedback Analytics"
            description="Analysez les retours des utilisateurs sur l'experience Cmail."
            actions={
                <button
                    type="button"
                    onClick={() => router.post(route('admin.feedback.request'))}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-cyan-600 dark:hover:bg-cyan-500"
                >
                    <Send className="h-4 w-4" />
                    Lancer le feedback
                </button>
            }
        >
            <div className="space-y-6">
                <section className="relative overflow-hidden rounded-[2rem] border border-cyan-200/70 bg-gradient-to-br from-cyan-50 via-white to-sky-50 p-6 shadow-lg shadow-cyan-100/60 dark:border-cyan-500/20 dark:from-cyan-500/10 dark:via-slate-900 dark:to-slate-900">
                    <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-cyan-200/60 blur-3xl dark:bg-cyan-500/10" />
                    <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-sky-200/50 blur-2xl dark:bg-sky-500/10" />
                    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 shadow-sm dark:bg-slate-900/70 dark:text-cyan-300">
                                <Sparkles className="h-4 w-4" />
                                Retour systeme
                            </div>
                            <h2 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">
                                Votre radar de satisfaction Cmail
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                Retrouvez la moyenne des notes, la repartition par etoiles et les derniers commentaires
                                laisses par les utilisateurs.
                            </p>
                        </div>

                        <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                Score global
                            </p>
                            <div className="mt-2 flex items-end gap-3">
                                <p className="text-5xl font-black text-slate-900 dark:text-white">
                                    {analytics.average_rating.toFixed(1)}
                                </p>
                                <p className="pb-1 text-sm font-medium text-slate-500 dark:text-slate-400">/ 5</p>
                            </div>
                            <div className="mt-3">{renderStars(Math.round(analytics.average_rating))}</div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    {statCards.map((card) => (
                        <article
                            key={card.label}
                            className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
                                    <p className="mt-3 text-4xl font-bold text-slate-900 dark:text-white">{card.value}</p>
                                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{card.helper}</p>
                                </div>
                                <div className={`rounded-2xl bg-gradient-to-br ${card.tone} p-3 text-white`}>
                                    {card.icon}
                                </div>
                            </div>
                        </article>
                    ))}
                </section>

                <div className="grid gap-6 xl:grid-cols-[0.95fr,1.25fr]">
                    <section className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Repartition des notes</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Vision rapide de la satisfaction</p>
                            </div>
                            <ChartColumnIncreasing className="h-5 w-5 text-cyan-500" />
                        </div>

                        <div className="mt-6 space-y-4">
                            {analytics.distribution.map((item) => (
                                <div key={item.rating} className="space-y-2">
                                    <div className="flex items-center justify-between gap-3 text-sm">
                                        <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
                                            <span>{item.rating} etoile{item.rating > 1 ? 's' : ''}</span>
                                            {renderStars(item.rating)}
                                        </div>
                                        <div className="text-slate-500 dark:text-slate-400">
                                            {item.count} avis - {item.percentage}%
                                        </div>
                                    </div>
                                    <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-600 transition-all"
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Derniers commentaires</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Les 10 derniers retours textuels envoyes par les utilisateurs
                            </p>
                        </div>

                        {analytics.recent_comments.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                                    <thead className="bg-slate-50 dark:bg-slate-950/40">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                Utilisateur
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                Note
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                Commentaire
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                Date
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                        {analytics.recent_comments.map((feedback) => (
                                            <tr key={feedback.id} className="align-top">
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-slate-900 dark:text-white">
                                                        {feedback.user?.name ?? 'Utilisateur inconnu'}
                                                    </p>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                                        {feedback.user?.email ?? '-'}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-2">
                                                        {renderStars(feedback.rating)}
                                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                            {feedback.rating}/5
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm leading-6 text-slate-700 dark:text-slate-300">
                                                    {feedback.comment}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                                                    {formatDate(feedback.created_at)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="px-6 py-14 text-center text-sm text-slate-500 dark:text-slate-400">
                                Aucun commentaire disponible pour le moment.
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </AdminLayout>
    );
}
