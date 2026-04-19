import AdminLayout from '@/Layouts/AdminLayout';
import { FormEvent, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, Search, ShieldX, Trash2 } from 'lucide-react';

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type ReportRecord = {
    id: number;
    status: string;
    reason_category: string;
    comment: string | null;
    created_at: string | null;
    reporter: {
        id: number;
        name: string;
        email: string;
    } | null;
    message: {
        id: number;
        subject: string;
        content: string;
        sent_at: string | null;
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
    } | null;
};

type AdminReportsDashboardProps = {
    filters: {
        search: string;
        status: string;
        report: string;
    };
    reports: {
        data: ReportRecord[];
        links: PaginationLink[];
        total: number;
    };
    selectedReport: ReportRecord | null;
};

function formatDate(value: string | null): string {
    if (!value) {
        return '-';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('fr-FR');
}

function formatReason(reason: string): string {
    const labels: Record<string, string> = {
        spam: 'Spam',
        harassment: 'Inapproprie',
        technical: 'Technique',
        other: 'Autre',
    };

    return labels[reason] ?? reason;
}

function statusBadgeClass(status: string): string {
    if (status === 'resolved') {
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300';
    }

    if (status === 'dismissed') {
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }

    return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300';
}

export default function AdminReportsDashboard({
    filters,
    reports,
    selectedReport,
}: AdminReportsDashboardProps) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');

    const statusOptions = useMemo(
        () => [
            { value: '', label: 'Tous les statuts' },
            { value: 'pending', label: 'En attente' },
            { value: 'resolved', label: 'Resolus' },
            { value: 'dismissed', label: 'Rejetes' },
        ],
        [],
    );

    const submitFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            route('admin.reports.index'),
            {
                search,
                status,
                report: filters.report || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const openReport = (reportId: number) => {
        router.get(
            route('admin.reports.index'),
            {
                search,
                status,
                report: reportId,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const updateStatus = (nextStatus: 'pending' | 'resolved' | 'dismissed') => {
        if (!selectedReport) {
            return;
        }

        router.patch(
            route('admin.reports.update', selectedReport.id),
            { status: nextStatus },
            {
                preserveScroll: true,
            },
        );
    };

    const deleteSourceMessage = () => {
        if (!selectedReport?.message) {
            return;
        }

        const confirmed = window.confirm(
            'Supprimer ce message ? Avec la configuration actuelle, le signalement associe sera aussi retire.',
        );

        if (!confirmed) {
            return;
        }

        router.delete(route('admin.reports.message.destroy', selectedReport.id), {
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout
            title="Signalements messages"
            description="Supervisez les messages signales et traitez les tickets de moderation."
        >
            <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
                <section className="space-y-4">
                    <form
                        onSubmit={submitFilters}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                        <div className="flex flex-col gap-3 md:flex-row">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Rechercher un signaleur, un sujet, un contenu ou une raison..."
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
                            {reports.total} signalements
                        </div>

                        <div className="divide-y divide-slate-200 dark:divide-slate-800">
                            {reports.data.length > 0 ? (
                                reports.data.map((report) => (
                                    <button
                                        key={report.id}
                                        type="button"
                                        onClick={() => openReport(report.id)}
                                        className={`w-full px-5 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-950/40 ${
                                            selectedReport?.id === report.id ? 'bg-cyan-50/70 dark:bg-cyan-500/10' : ''
                                        }`}
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                Signalement #{report.id} - {report.reporter?.name ?? 'Utilisateur inconnu'}
                                            </p>
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(report.status)}`}
                                            >
                                                {report.status}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            {formatReason(report.reason_category)} - {formatDate(report.created_at)}
                                        </p>
                                        <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                            {report.message?.subject ?? 'Message indisponible'}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                            {report.message?.content ?? 'Le message source nest plus disponible.'}
                                        </p>
                                    </button>
                                ))
                            ) : (
                                <p className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                    Aucun signalement trouve.
                                </p>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 px-4 py-4 dark:border-slate-800">
                            {reports.links.map((link, index) => (
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
                    {selectedReport ? (
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                        Signalement #{selectedReport.id}
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {selectedReport.reporter?.name ?? 'Utilisateur inconnu'} ({selectedReport.reporter?.email ?? '-'})
                                    </p>
                                </div>
                                <span
                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(selectedReport.status)}`}
                                >
                                    {selectedReport.status}
                                </span>
                            </div>

                            <div className="grid gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                                <p>
                                    <span className="font-semibold">Categorie:</span> {formatReason(selectedReport.reason_category)}
                                </p>
                                <p>
                                    <span className="font-semibold">Date:</span> {formatDate(selectedReport.created_at)}
                                </p>
                                <p>
                                    <span className="font-semibold">Expediteur du message:</span>{' '}
                                    {selectedReport.message?.sender?.name ?? 'N/A'}
                                </p>
                                <p>
                                    <span className="font-semibold">Destinataire:</span>{' '}
                                    {selectedReport.message?.receiver?.name ?? 'N/A'}
                                </p>
                                <p>
                                    <span className="font-semibold">Envoi du message:</span>{' '}
                                    {formatDate(selectedReport.message?.sent_at ?? null)}
                                </p>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Message incrimine</h3>
                                <div className="mt-2 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                        {selectedReport.message?.subject ?? 'Message indisponible'}
                                    </p>
                                    <p className="mt-2 whitespace-pre-line text-sm text-slate-700 dark:text-slate-200">
                                        {selectedReport.message?.content ?? 'Le message source nest plus disponible.'}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Commentaire du signaleur</h3>
                                <p className="mt-2 whitespace-pre-line rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                                    {selectedReport.comment?.trim() ? selectedReport.comment : 'Aucun commentaire fourni.'}
                                </p>
                            </div>

                            <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Actions</h3>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => updateStatus('resolved')}
                                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        Marquer comme resolu
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateStatus('dismissed')}
                                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
                                    >
                                        <ShieldX className="h-4 w-4" />
                                        Rejeter le signalement
                                    </button>
                                    <button
                                        type="button"
                                        onClick={deleteSourceMessage}
                                        disabled={!selectedReport.message}
                                        className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Supprimer le message incrimine
                                    </button>
                                </div>
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                        <p>
                                            Avec le schema actuel, supprimer le message supprime aussi le signalement associe
                                            car la relation base de donnees est en cascade.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-full min-h-[380px] items-center justify-center rounded-xl border border-dashed border-slate-300 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                            Selectionnez un signalement pour afficher le detail et agir.
                        </div>
                    )}
                </section>
            </div>
        </AdminLayout>
    );
}
