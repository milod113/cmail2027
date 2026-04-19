import AdminLayout from '@/Layouts/AdminLayout';
import { FormEvent, useMemo, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { ExternalLink, Search, SendHorizonal } from 'lucide-react';

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type SupportTicket = {
    id: number;
    status: string;
    category: string;
    impact: string;
    description: string;
    page_url: string | null;
    browser: string | null;
    platform: string | null;
    screen_resolution: string | null;
    user_agent: string | null;
    screenshot_url: string | null;
    created_at: string | null;
    user: {
        id: number;
        name: string;
        email: string;
    } | null;
};

type SupportIndexProps = {
    filters: {
        search: string;
        status: string;
        ticket: string;
    };
    tickets: {
        data: SupportTicket[];
        links: PaginationLink[];
        total: number;
    };
    selectedTicket: SupportTicket | null;
};

export default function SupportIndex({ filters, tickets, selectedTicket }: SupportIndexProps) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const responseForm = useForm({
        response: '',
    });

    const statusOptions = useMemo(
        () => [
            { value: '', label: 'Tous les statuts' },
            { value: 'open', label: 'Ouvert' },
            { value: 'answered', label: 'Repondu' },
            { value: 'in_progress', label: 'En cours' },
            { value: 'closed', label: 'Clos' },
        ],
        [],
    );

    const submitFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            route('admin.support.index'),
            {
                search,
                status,
                ticket: filters.ticket || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const openTicket = (ticketId: number) => {
        router.get(
            route('admin.support.index'),
            {
                search,
                status,
                ticket: ticketId,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const submitResponse = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedTicket) {
            return;
        }

        responseForm.post(route('admin.support.respond', selectedTicket.id), {
            preserveScroll: true,
            onSuccess: () => responseForm.reset(),
        });
    };

    return (
        <AdminLayout
            title="Support technique"
            description="Consultez les signalements, ouvrez un ticket et repondez via Cmail."
        >
            <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
                <section className="space-y-4">
                    <form onSubmit={submitFilters} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex flex-col gap-3 md:flex-row">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Rechercher par utilisateur, categorie, description..."
                                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-500/20"
                                />
                            </div>
                            <select
                                value={status}
                                onChange={(event) => setStatus(event.target.value)}
                                className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                            >
                                {statusOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="submit"
                                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-cyan-600 dark:hover:bg-cyan-500"
                            >
                                Filtrer
                            </button>
                        </div>
                    </form>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="border-b border-slate-200 px-5 py-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                            {tickets.total} tickets
                        </div>

                        <div className="divide-y divide-slate-200 dark:divide-slate-800">
                            {tickets.data.length > 0 ? (
                                tickets.data.map((ticket) => (
                                    <button
                                        key={ticket.id}
                                        type="button"
                                        onClick={() => openTicket(ticket.id)}
                                        className={`w-full px-5 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-950/40 ${
                                            selectedTicket?.id === ticket.id ? 'bg-cyan-50/70 dark:bg-cyan-500/10' : ''
                                        }`}
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                Ticket #{ticket.id} - {ticket.user?.name ?? 'Utilisateur inconnu'}
                                            </p>
                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                {ticket.status}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            {ticket.category} / {ticket.impact}
                                        </p>
                                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{ticket.description}</p>
                                    </button>
                                ))
                            ) : (
                                <p className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">Aucun ticket trouve.</p>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 px-4 py-4 dark:border-slate-800">
                            {tickets.links.map((link, index) => (
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
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    {selectedTicket ? (
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ticket #{selectedTicket.id}</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {selectedTicket.user?.name} ({selectedTicket.user?.email})
                                    </p>
                                </div>
                                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                                    {selectedTicket.status}
                                </span>
                            </div>

                            <div className="grid gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                                <p>
                                    <span className="font-semibold">Categorie:</span> {selectedTicket.category}
                                </p>
                                <p>
                                    <span className="font-semibold">Impact:</span> {selectedTicket.impact}
                                </p>
                                <p>
                                    <span className="font-semibold">Navigateur:</span> {selectedTicket.browser ?? 'N/A'}
                                </p>
                                <p>
                                    <span className="font-semibold">Plateforme:</span> {selectedTicket.platform ?? 'N/A'}
                                </p>
                                <p>
                                    <span className="font-semibold">Resolution:</span> {selectedTicket.screen_resolution ?? 'N/A'}
                                </p>
                                {selectedTicket.page_url ? (
                                    <a
                                        href={selectedTicket.page_url}
                                        className="inline-flex w-fit items-center gap-1 font-semibold text-cyan-700 hover:underline dark:text-cyan-300"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Ouvrir l'URL capturee
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                ) : null}
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Description du probleme</h3>
                                <p className="mt-2 whitespace-pre-line rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                                    {selectedTicket.description}
                                </p>
                            </div>

                            {selectedTicket.screenshot_url ? (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Capture d'ecran</h3>
                                    <img
                                        src={selectedTicket.screenshot_url}
                                        alt={`Capture ticket ${selectedTicket.id}`}
                                        className="mt-2 max-h-72 w-full rounded-xl border border-slate-200 object-contain dark:border-slate-700"
                                    />
                                </div>
                            ) : null}

                            <form onSubmit={submitResponse} className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                                <label htmlFor="response" className="text-sm font-semibold text-slate-900 dark:text-white">
                                    Repondre a l'utilisateur (envoi Cmail)
                                </label>
                                <textarea
                                    id="response"
                                    value={responseForm.data.response}
                                    onChange={(event) => responseForm.setData('response', event.target.value)}
                                    rows={6}
                                    placeholder="Detaillez la solution, les etapes de correction ou les informations a demander."
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-500/20"
                                />
                                {responseForm.errors.response ? (
                                    <p className="text-xs font-medium text-rose-600 dark:text-rose-300">{responseForm.errors.response}</p>
                                ) : null}
                                <button
                                    type="submit"
                                    disabled={responseForm.processing || !responseForm.data.response.trim()}
                                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cyan-600 dark:hover:bg-cyan-500"
                                >
                                    <SendHorizonal className="h-4 w-4" />
                                    {responseForm.processing ? 'Envoi...' : 'Envoyer la reponse'}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="flex h-full min-h-[380px] items-center justify-center rounded-xl border border-dashed border-slate-300 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                            Selectionnez un ticket pour afficher les details et repondre.
                        </div>
                    )}
                </section>
            </div>
        </AdminLayout>
    );
}
