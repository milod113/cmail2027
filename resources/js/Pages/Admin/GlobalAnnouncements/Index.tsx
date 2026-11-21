import AdminLayout from '@/Layouts/AdminLayout';
import { FormEvent, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { Eye, Megaphone, Plus, Search } from 'lucide-react';

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type AnnouncementRow = {
    id: number;
    title: string;
    priority: string;
    is_published: boolean;
    requires_acknowledgement: boolean;
    is_pinned: boolean;
    audience_label: string;
    published_at: string | null;
    starts_at: string | null;
    ends_at: string | null;
    recipients_count: number;
    read_count: number;
    acknowledged_count: number;
    creator: {
        name: string;
        email: string;
    } | null;
};

export default function Index({
    filters,
    announcements,
}: {
    filters: {
        search: string;
        status: string;
    };
    announcements: {
        data: AnnouncementRow[];
        links: PaginationLink[];
        from: number | null;
        to: number | null;
        total: number;
    };
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');

    const submitFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(route('admin.announcements.index'), { search, status }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <AdminLayout
            title="Annonces globales"
            description="Pilotez les communications institutionnelles et suivez leur lecture."
            actions={
                <Link
                    href={route('admin.announcements.create')}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-cyan-600 dark:hover:bg-cyan-500"
                >
                    <Plus className="h-4 w-4" />
                    Nouvelle annonce
                </Link>
            }
        >
            <div className="space-y-5">
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <form onSubmit={submitFilters} className="flex flex-col gap-3 md:flex-row">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Rechercher une annonce ou son auteur..."
                                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                            />
                        </div>
                        <select
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        >
                            <option value="">Tous les statuts</option>
                            <option value="published">Publiées</option>
                            <option value="draft">Brouillons</option>
                            <option value="active">Actives</option>
                            <option value="expired">Expirées</option>
                        </select>
                        <button
                            type="submit"
                            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-cyan-600 dark:hover:bg-cyan-500"
                        >
                            Filtrer
                        </button>
                    </form>
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="border-b border-slate-200 px-5 py-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                        {announcements.total} annonces
                        {announcements.from && announcements.to ? ` - affichage ${announcements.from} à ${announcements.to}` : ''}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                            <thead className="bg-slate-50 dark:bg-slate-950/40">
                                <tr>
                                    {['Annonce', 'Audience', 'Statut', 'Suivi', 'Auteur', 'Actions'].map((heading) => (
                                        <th key={heading} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                            {heading}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {announcements.data.length > 0 ? announcements.data.map((announcement) => (
                                    <tr key={announcement.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-950/40">
                                        <td className="px-5 py-4">
                                            <div className="flex items-start gap-3">
                                                <div className="rounded-xl bg-cyan-50 p-2 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                                                    <Megaphone className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{announcement.title}</p>
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                            {announcement.priority}
                                                        </span>
                                                        {announcement.requires_acknowledgement ? (
                                                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                                                                Accusé requis
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">{announcement.audience_label}</td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${announcement.is_published ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                                                {announcement.is_published ? 'Publiée' : 'Brouillon'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                                            <div>{announcement.read_count}/{announcement.recipients_count} lus</div>
                                            <div>{announcement.acknowledged_count} accusés</div>
                                        </td>
                                        <td className="px-5 py-4 text-sm">
                                            <p className="font-semibold text-slate-900 dark:text-white">{announcement.creator?.name ?? '-'}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{announcement.creator?.email ?? '-'}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <Link
                                                href={route('admin.announcements.show', announcement.id)}
                                                className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                Voir
                                            </Link>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                            Aucune annonce trouvée.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 px-4 py-4 dark:border-slate-800">
                        {announcements.links.map((link, index) => (
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
