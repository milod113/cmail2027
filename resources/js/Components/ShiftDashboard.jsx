import { Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import {
    Activity,
    Archive,
    CheckCircle2,
    ClipboardList,
    Clock3,
    RotateCcw,
    Stethoscope,
    Trash2,
} from 'lucide-react';
import { useTranslation } from '@/Hooks/useTranslation';

function formatDate(value, locale) {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function ShiftDashboard({ tasks = [], mode = 'active' }) {
    const { __, locale } = useTranslation();
    const [busyKey, setBusyKey] = useState(null);
    const isArchivedMode = mode === 'archived';

    const stats = useMemo(() => {
        const completed = tasks.filter((task) => task.status === 'completed').length;
        const pending = tasks.length - completed;

        return {
            total: tasks.length,
            pending,
            completed,
        };
    }, [tasks]);

    const runTaskAction = (taskId, action, method = 'patch') => {
        setBusyKey(`${action}-${taskId}`);

        const options = {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setBusyKey(null),
        };

        if (method === 'delete') {
            router.delete(route(action, taskId), options);
            return;
        }

        router.patch(route(action, taskId), {}, options);
    };

    const toggleTask = (taskId) => runTaskAction(taskId, 'tasks.toggle-status');
    const archiveTask = (taskId) => runTaskAction(taskId, 'tasks.archive');
    const restoreTask = (taskId) => runTaskAction(taskId, 'tasks.restore');
    const destroyTask = (taskId) => {
        if (!window.confirm(__('Supprimer définitivement cette tâche ?'))) {
            return;
        }

        runTaskAction(taskId, 'tasks.destroy', 'delete');
    };

    const cards = [
        {
            label: __('Total'),
            value: stats.total,
            icon: ClipboardList,
            tone: 'from-cyan-500 to-sky-600',
            surface: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300',
        },
        {
            label: __('En attente'),
            value: stats.pending,
            icon: Clock3,
            tone: 'from-amber-500 to-orange-600',
            surface: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
        },
        {
            label: isArchivedMode ? __('Archivées') : __('Terminées'),
            value: isArchivedMode ? stats.total : stats.completed,
            icon: CheckCircle2,
            tone: 'from-emerald-500 to-teal-600',
            surface: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
        },
    ];

    return (
        <section className="overflow-hidden rounded-[2rem] border border-cyan-100/80 bg-white/90 shadow-xl shadow-cyan-100/40 backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/85 dark:shadow-slate-950/30">
            <div className="border-b border-cyan-100/80 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_42%),linear-gradient(135deg,_rgba(240,249,255,0.96),_rgba(255,255,255,0.9))] px-6 py-6 dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.14),_transparent_42%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(2,6,23,0.92))]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500 via-sky-500 to-teal-500 text-white shadow-lg shadow-cyan-500/25">
                            <Stethoscope className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-700 shadow-sm dark:bg-slate-950/70 dark:text-cyan-300">
                                <Activity className="h-3.5 w-3.5" />
                                {__('Shift Dashboard')}
                            </div>
                            <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                                {isArchivedMode ? __('Archives des tâches') : __('Tâches issues des messages')}
                            </h2>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                {isArchivedMode
                                    ? __('Consultez, restaurez ou supprimez les tâches archivées.')
                                    : __('Suivez les actions importantes transmises pendant votre service.')}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 lg:items-end">
                        <div className="grid gap-3 sm:grid-cols-3">
                            {cards.map((card) => {
                                const Icon = card.icon;

                                return (
                                    <div
                                        key={card.label}
                                        className="rounded-3xl border border-white/80 bg-white/85 p-4 shadow-md shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-950/70"
                                    >
                                        <div className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold ${card.surface}`}>
                                            <Icon className="h-4 w-4" />
                                            {card.label}
                                        </div>
                                        <div className={`mt-3 bg-gradient-to-r ${card.tone} bg-clip-text text-3xl font-bold text-transparent`}>
                                            {card.value}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {route().has('tasks.archives') && route().has('tasks.index') ? (
                            <Link
                                href={isArchivedMode ? route('tasks.index') : route('tasks.archives')}
                                className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-white/90 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-50 dark:border-cyan-500/20 dark:bg-slate-950/70 dark:text-cyan-300 dark:hover:border-cyan-500/40 dark:hover:bg-cyan-500/10"
                            >
                                {isArchivedMode ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                                {isArchivedMode ? __('Voir les tâches actives') : __('Voir les archives')}
                            </Link>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="p-6">
                {tasks.length > 0 ? (
                    <div className="space-y-4">
                        {tasks.map((task) => {
                            const isCompleted = task.status === 'completed';
                            const isBusy = busyKey !== null && busyKey.endsWith(`-${task.id}`);
                            const createdAtLabel = formatDate(task.created_at, locale);
                            const archivedAtLabel = formatDate(task.archived_at, locale);

                            return (
                                <article
                                    key={task.id}
                                    className={`rounded-3xl border p-4 transition-all duration-300 ${
                                        isCompleted
                                            ? 'border-emerald-200/80 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/10'
                                            : 'border-slate-200/80 bg-slate-50/80 hover:border-cyan-200 hover:bg-white dark:border-slate-700/70 dark:bg-slate-950/55 dark:hover:border-cyan-500/30 dark:hover:bg-slate-900'
                                    }`}
                                >
                                    <div className="flex items-start gap-4">
                                        {!isArchivedMode ? (
                                            <button
                                                type="button"
                                                onClick={() => toggleTask(task.id)}
                                                disabled={isBusy}
                                                className={`mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border transition ${
                                                    isCompleted
                                                        ? 'border-emerald-500 bg-emerald-500 text-white'
                                                        : 'border-slate-300 bg-white text-transparent hover:border-cyan-400 dark:border-slate-600 dark:bg-slate-950'
                                                } ${isBusy ? 'cursor-not-allowed opacity-60' : ''}`}
                                                aria-label={isCompleted ? __('Marquer comme en attente') : __('Marquer comme terminée')}
                                            >
                                                <CheckCircle2 className="h-4 w-4" />
                                            </button>
                                        ) : (
                                            <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-500">
                                                <Archive className="h-3.5 w-3.5" />
                                            </div>
                                        )}

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <h3 className={`text-base font-semibold ${isCompleted ? 'text-emerald-900 line-through dark:text-emerald-200' : 'text-slate-900 dark:text-white'}`}>
                                                        {task.title}
                                                    </h3>
                                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                                        {task.description || __('Aucune description fournie pour cette tâche.')}
                                                    </p>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                        isCompleted
                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                                                    }`}>
                                                        {isCompleted ? __('Terminée') : __('En attente')}
                                                    </span>
                                                    {task.message_id ? (
                                                        <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300">
                                                            {__('Message')} #{task.message_id}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>

                                            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                                {createdAtLabel ? (
                                                    <span>{__('Créée le')} {createdAtLabel}</span>
                                                ) : null}
                                                {archivedAtLabel ? (
                                                    <span>{__('Archivée le')} {archivedAtLabel}</span>
                                                ) : null}
                                                {task.message?.sujet ? (
                                                    <span>{__('Sujet')} : {task.message.sujet}</span>
                                                ) : null}
                                            </div>

                                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                                {isArchivedMode ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => restoreTask(task.id)}
                                                        disabled={isBusy}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:bg-cyan-500/20"
                                                    >
                                                        <RotateCcw className="h-3.5 w-3.5" />
                                                        {__('Restaurer')}
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => archiveTask(task.id)}
                                                        disabled={isBusy}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:border-amber-300 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
                                                    >
                                                        <Archive className="h-3.5 w-3.5" />
                                                        {__('Archiver')}
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => destroyTask(task.id)}
                                                    disabled={isBusy}
                                                    className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    {__('Supprimer')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <div className="rounded-3xl border border-dashed border-cyan-200 bg-cyan-50/50 px-6 py-12 text-center dark:border-cyan-500/20 dark:bg-cyan-500/5">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-cyan-600 shadow-md dark:bg-slate-900 dark:text-cyan-300">
                            <ClipboardList className="h-6 w-6" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                            {isArchivedMode ? __('Aucune archive disponible') : __('Aucune tâche pour ce service')}
                        </h3>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                            {isArchivedMode
                                ? __('Archivez une tâche pour la retrouver ici plus tard.')
                                : __('Créez une tâche depuis un message important pour suivre les actions à réaliser.')}
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
