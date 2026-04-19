import AdminLayout from '@/Layouts/AdminLayout';
import { FormEvent, useState } from 'react';
import { router } from '@inertiajs/react';
import { Search } from 'lucide-react';

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type AuditMessage = {
    id: number;
    subject: string;
    content_preview: string;
    sent_at: string | null;
    type_message: string;
    sender: {
        id: number;
        name: string;
        email: string;
    } | null;
    receiver: {
        id: number;
        name: string;
        email: string;
    } | null;
};

type MessageAuditProps = {
    filters: {
        search: string;
    };
    messages: {
        data: AuditMessage[];
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

export default function MessageAudit({ filters, messages }: MessageAuditProps) {
    const [search, setSearch] = useState(filters.search ?? '');

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            route('admin.audit.messages'),
            { search },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    return (
        <AdminLayout
            title="Audit des messages"
            description="Lecture seule de tous les echanges avec pagination serveur."
        >
            <div className="space-y-5">
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <form onSubmit={submitSearch} className="flex flex-col gap-3 md:flex-row">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Rechercher expéditeur, destinataire, sujet ou contenu..."
                                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-500/20"
                            />
                        </div>
                        <button
                            type="submit"
                            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-cyan-600 dark:hover:bg-cyan-500"
                        >
                            Rechercher
                        </button>
                    </form>
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="border-b border-slate-200 px-5 py-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                        Lecture seule - {messages.total} messages
                        {messages.from && messages.to ? ` (affichage ${messages.from} a ${messages.to})` : ''}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                            <thead className="bg-slate-50 dark:bg-slate-950/40">
                                <tr>
                                    {['Date', 'Expediteur', 'Destinataire', 'Sujet', 'Contenu court', 'Type'].map((heading) => (
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
                                {messages.data.length > 0 ? (
                                    messages.data.map((message) => (
                                        <tr key={message.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-950/40">
                                            <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-200">{formatDate(message.sent_at)}</td>
                                            <td className="px-5 py-4 text-sm">
                                                <p className="font-semibold text-slate-900 dark:text-white">{message.sender?.name ?? '-'}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{message.sender?.email ?? '-'}</p>
                                            </td>
                                            <td className="px-5 py-4 text-sm">
                                                <p className="font-semibold text-slate-900 dark:text-white">{message.receiver?.name ?? '-'}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{message.receiver?.email ?? '-'}</p>
                                            </td>
                                            <td className="px-5 py-4 text-sm font-medium text-slate-800 dark:text-slate-100">{message.subject}</td>
                                            <td className="max-w-[380px] px-5 py-4 text-sm text-slate-600 dark:text-slate-300">{message.content_preview}</td>
                                            <td className="px-5 py-4 text-sm">
                                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                    {message.type_message}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                            Aucun message trouve avec ces filtres.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 px-4 py-4 dark:border-slate-800">
                        {messages.links.map((link, index) => (
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
