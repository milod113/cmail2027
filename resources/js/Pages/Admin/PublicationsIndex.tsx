import AdminLayout from '@/Layouts/AdminLayout';
import { FormEvent, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { Archive, Eye, Pencil, Search, Trash2 } from 'lucide-react';

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PublicationRow = {
    id: number;
    title: string | null;
    content: string;
    photo_url: string | null;
    archived: boolean;
    created_at: string | null;
    updated_at: string | null;
    likes_count: number;
    comments_count: number;
    user: {
        id: number;
        name: string;
        email: string;
    } | null;
};

type PublicationsIndexProps = {
    filters: {
        search: string;
        status: string;
    };
    publications: {
        data: PublicationRow[];
        links: PaginationLink[];
        from: number | null;
        to: number | null;
        total: number;
    };
};

function formatDate(value: string | null): string {
    if (!value) {
        return '-';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('fr-FR');
}

export default function PublicationsIndex({ filters, publications }: PublicationsIndexProps) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');

    const submitFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            route('admin.publications.index'),
            { search, status },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const toggleArchive = (publication: PublicationRow) => {
        router.patch(
            route('admin.publications.archive', publication.id),
            { archived: !publication.archived },
            { preserveScroll: true },
        );
    };

    const deletePublication = (publication: PublicationRow) => {
        const confirmed = window.confirm('Supprimer cette publication ? Cette action est irreversible.');

        if (!confirmed) {
            return;
        }

        router.delete(route('admin.publications.destroy', publication.id), {
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout
            title="Gestion des publications"
            description="Consultez, modifiez, archivez ou supprimez les publications internes."
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
                                placeholder="Rechercher un auteur, un titre ou un contenu..."
                                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-500/20"
                            />
                        </div>
                        <select
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        >
                            <option value="">Tous les statuts</option>
                            <option value="active">Actives</option>
                            <option value="archived">Archivees</option>
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
                        {publications.total} publications
                        {publications.from && publications.to ? ` - affichage ${publications.from} a ${publications.to}` : ''}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                            <thead className="bg-slate-50 dark:bg-slate-950/40">
                                <tr>
                                    {['Publication', 'Auteur', 'Statut', 'Engagement', 'Date', 'Actions'].map((heading) => (
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
                                {publications.data.length > 0 ? (
                                    publications.data.map((publication) => (
                                        <tr key={publication.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-950/40">
                                            <td className="px-5 py-4">
                                                <div className="flex items-start gap-3">
                                                    {publication.photo_url ? (
                                                        <img
                                                            src={publication.photo_url}
                                                            alt={publication.title ?? 'Publication'}
                                                            className="h-14 w-14 rounded-xl object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                                                            POST
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                            {publication.title?.trim() || 'Sans titre'}
                                                        </p>
                                                        <p className="mt-1 max-w-md text-sm text-slate-600 dark:text-slate-300">
                                                            {publication.content}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-sm">
                                                <p className="font-semibold text-slate-900 dark:text-white">{publication.user?.name ?? '-'}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{publication.user?.email ?? '-'}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                        publication.archived
                                                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                                                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                                                    }`}
                                                >
                                                    {publication.archived ? 'Archivee' : 'Active'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                                                <div>{publication.likes_count} likes</div>
                                                <div>{publication.comments_count} commentaires</div>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                                                {formatDate(publication.created_at)}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex min-w-[220px] flex-wrap gap-2">
                                                    <Link
                                                        href={route('admin.publications.show', publication.id)}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                        Voir
                                                    </Link>
                                                    <Link
                                                        href={route('admin.publications.show', publication.id)}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                        Modifier
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleArchive(publication)}
                                                        className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                                                            publication.archived
                                                                ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                                                                : 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
                                                        }`}
                                                    >
                                                        <Archive className="h-3.5 w-3.5" />
                                                        {publication.archived ? 'Restaurer' : 'Archiver'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => deletePublication(publication)}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Supprimer
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                            Aucune publication trouvee.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 px-4 py-4 dark:border-slate-800">
                        {publications.links.map((link, index) => (
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
