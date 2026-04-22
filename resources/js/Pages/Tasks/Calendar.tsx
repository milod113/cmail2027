import TasksCalendar from '@/Components/TasksCalendar';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarDays,
    ChevronRight,
    ClipboardList,
    Inbox,
    Search,
    Sparkles,
} from 'lucide-react';
import { useState } from 'react';

type TaskItem = {
    id: number;
    message_id: number | null;
    title: string;
    description: string | null;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    status: 'pending' | 'completed';
    due_date?: string | null;
    reminder_at?: string | null;
    archived_at: string | null;
    created_at: string | null;
    show_url?: string;
    message: {
        id: number;
        sujet: string | null;
        view_url?: string;
    } | null;
};

function parseDate(value: string | null | undefined) {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(value: Date) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
}

function isSameDay(left: Date, right: Date) {
    return left.getFullYear() === right.getFullYear()
        && left.getMonth() === right.getMonth()
        && left.getDate() === right.getDate();
}

function formatDateTime(value: string | null | undefined) {
    const date = parseDate(value);

    if (!date) {
        return null;
    }

    return date.toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function priorityLabel(priority: TaskItem['priority']) {
    switch (priority) {
        case 'urgent':
            return 'Urgente';
        case 'high':
            return 'Haute';
        case 'low':
            return 'Basse';
        default:
            return 'Normale';
    }
}

function priorityTone(priority: TaskItem['priority']) {
    switch (priority) {
        case 'urgent':
            return 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300';
        case 'high':
            return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300';
        case 'low':
            return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
        default:
            return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300';
    }
}

export default function TasksCalendarPage({ tasks }: { tasks: TaskItem[] }) {
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
    const [priorityFilter, setPriorityFilter] = useState<'all' | 'urgent' | 'high' | 'normal' | 'low'>('all');
    const [dateFilter, setDateFilter] = useState<'all' | 'due' | 'reminder' | 'overdue' | 'today' | 'upcoming'>('all');

    const today = startOfDay(new Date());
    const normalizedQuery = query.trim().toLowerCase();

    const filteredTasks = tasks.filter((task) => {
        const haystack = [
            task.title,
            task.description ?? '',
            task.message?.sujet ?? '',
        ].join(' ').toLowerCase();

        if (normalizedQuery !== '' && !haystack.includes(normalizedQuery)) {
            return false;
        }

        if (statusFilter !== 'all' && task.status !== statusFilter) {
            return false;
        }

        if (priorityFilter !== 'all' && (task.priority ?? 'normal') !== priorityFilter) {
            return false;
        }

        const dueDate = parseDate(task.due_date);
        const reminderDate = parseDate(task.reminder_at);
        const nextDate = dueDate ?? reminderDate;

        switch (dateFilter) {
            case 'due':
                return dueDate !== null;
            case 'reminder':
                return reminderDate !== null;
            case 'overdue':
                return task.status !== 'completed'
                    && dueDate !== null
                    && startOfDay(dueDate).getTime() < today.getTime();
            case 'today':
                return (dueDate !== null && isSameDay(dueDate, today))
                    || (reminderDate !== null && isSameDay(reminderDate, today));
            case 'upcoming':
                return nextDate !== null && startOfDay(nextDate).getTime() > today.getTime();
            default:
                return true;
        }
    });

    const overdueCount = filteredTasks.filter((task) => {
        const dueDate = parseDate(task.due_date);

        return task.status !== 'completed'
            && dueDate !== null
            && startOfDay(dueDate).getTime() < today.getTime();
    }).length;

    const todayCount = filteredTasks.filter((task) => {
        const dueDate = parseDate(task.due_date);
        const reminderDate = parseDate(task.reminder_at);

        return (dueDate !== null && isSameDay(dueDate, today))
            || (reminderDate !== null && isSameDay(reminderDate, today));
    }).length;

    const reminderCount = filteredTasks.filter((task) => task.reminder_at).length;

    const nextTasks = [...filteredTasks]
        .sort((left, right) => {
            const leftDate = left.due_date ?? left.reminder_at ?? left.created_at ?? '';
            const rightDate = right.due_date ?? right.reminder_at ?? right.created_at ?? '';

            return leftDate.localeCompare(rightDate);
        })
        .slice(0, 8);

    return (
        <AuthenticatedLayout
            title="Calendrier des taches"
            description="Visualisez toutes vos taches, rappels et echeances dans une grande vue calendrier."
        >
            <Head title="Calendrier des taches" />

            <div className="space-y-8 pb-8">
                <section className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#082f49_0%,#0f766e_45%,#0f172a_100%)] p-6 shadow-2xl shadow-cyan-500/10 md:p-8">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.16),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(45,212,191,0.18),_transparent_32%)]" />

                    <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100 backdrop-blur-sm">
                                <Sparkles className="h-3.5 w-3.5" />
                                Vue calendrier premium
                            </div>
                            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl xl:text-5xl">
                                Calendrier central des taches
                            </h1>
                            <p className="mt-3 max-w-2xl text-base leading-relaxed text-cyan-50/90">
                                Une grande vue pour piloter les rappels, les dates limites et les actions a venir sans perdre le fil.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <StatCard label="Taches filtrees" value={filteredTasks.length} tone="cyan" />
                            <StatCard label="A traiter aujourd hui" value={todayCount} tone="emerald" />
                            <StatCard label="En retard" value={overdueCount} tone="rose" />
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px]">
                    <div className="space-y-6">
                        <div className="rounded-[2rem] border border-cyan-100/80 bg-white/90 p-5 shadow-xl shadow-cyan-500/5 backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/85 sm:p-6">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                <div className="max-w-2xl">
                                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
                                        Filtres intelligents
                                    </p>
                                    <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                                        Affichez uniquement ce qui compte
                                    </h2>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <Link
                                        href={route('tasks.index')}
                                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-cyan-500 dark:hover:text-cyan-300"
                                    >
                                        <ClipboardList className="h-4 w-4" />
                                        Liste des taches
                                    </Link>
                                    <Link
                                        href={route('tasks.archives')}
                                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-cyan-500 dark:hover:text-cyan-300"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Archives
                                    </Link>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))]">
                                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
                                    <Search className="h-4 w-4 text-slate-400" />
                                    <input
                                        value={query}
                                        onChange={(event) => setQuery(event.target.value)}
                                        placeholder="Titre, description, sujet..."
                                        className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
                                    />
                                </label>

                                <FilterSelect
                                    label="Statut"
                                    value={statusFilter}
                                    onChange={(value) => setStatusFilter(value as 'all' | 'pending' | 'completed')}
                                    options={[
                                        { value: 'all', label: 'Tous' },
                                        { value: 'pending', label: 'En attente' },
                                        { value: 'completed', label: 'Terminees' },
                                    ]}
                                />
                                <FilterSelect
                                    label="Priorite"
                                    value={priorityFilter}
                                    onChange={(value) => setPriorityFilter(value as 'all' | 'urgent' | 'high' | 'normal' | 'low')}
                                    options={[
                                        { value: 'all', label: 'Toutes' },
                                        { value: 'urgent', label: 'Urgente' },
                                        { value: 'high', label: 'Haute' },
                                        { value: 'normal', label: 'Normale' },
                                        { value: 'low', label: 'Basse' },
                                    ]}
                                />
                                <FilterSelect
                                    label="Vue"
                                    value={dateFilter}
                                    onChange={(value) => setDateFilter(value as 'all' | 'due' | 'reminder' | 'overdue' | 'today' | 'upcoming')}
                                    options={[
                                        { value: 'all', label: 'Tout afficher' },
                                        { value: 'due', label: 'Echeances' },
                                        { value: 'reminder', label: 'Rappels' },
                                        { value: 'overdue', label: 'En retard' },
                                        { value: 'today', label: 'Aujourd hui' },
                                        { value: 'upcoming', label: 'A venir' },
                                    ]}
                                />
                            </div>

                            <div className="mt-5 flex flex-wrap gap-2">
                                <QuickChip label="Tous" active={dateFilter === 'all'} onClick={() => setDateFilter('all')} />
                                <QuickChip label="Rappels" active={dateFilter === 'reminder'} onClick={() => setDateFilter('reminder')} />
                                <QuickChip label="Echeances" active={dateFilter === 'due'} onClick={() => setDateFilter('due')} />
                                <QuickChip label="Aujourd hui" active={dateFilter === 'today'} onClick={() => setDateFilter('today')} />
                                <QuickChip label="En retard" active={dateFilter === 'overdue'} onClick={() => setDateFilter('overdue')} />
                                <QuickChip label="A venir" active={dateFilter === 'upcoming'} onClick={() => setDateFilter('upcoming')} />
                            </div>
                        </div>

                        <TasksCalendar tasks={filteredTasks} />
                    </div>

                    <aside className="space-y-6">
                        <div className="rounded-[2rem] border border-cyan-100/80 bg-white/90 p-5 shadow-xl shadow-cyan-500/5 backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/85 sm:p-6">
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
                                Lecture rapide
                            </p>
                            <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                                Agenda filtre
                            </h2>

                            <div className="mt-5 space-y-3">
                                <MiniStat label="Rappels actifs" value={reminderCount} tone="amber" />
                                <MiniStat label="Resultat recherche" value={filteredTasks.length} tone="slate" />
                                <MiniStat label="Messages relies" value={filteredTasks.filter((task) => task.message_id !== null).length} tone="cyan" />
                            </div>
                        </div>

                        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-700 dark:bg-slate-900 sm:p-6">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                        Prochaines cartes
                                    </p>
                                    <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                                        Taches visibles
                                    </h3>
                                </div>
                                <Link
                                    href={route('messages.inbox')}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-cyan-500 dark:hover:text-cyan-300"
                                >
                                    <Inbox className="h-4 w-4" />
                                </Link>
                            </div>

                            <div className="mt-5 space-y-3">
                                {nextTasks.length > 0 ? (
                                    nextTasks.map((task) => (
                                        <Link
                                            key={task.id}
                                            href={task.show_url || route('tasks.index')}
                                            className="group block rounded-3xl border border-slate-200 bg-slate-50/80 p-4 transition-all hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-white hover:shadow-md dark:border-slate-700 dark:bg-slate-950/50 dark:hover:border-cyan-500/40 dark:hover:bg-slate-950"
                                        >
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${priorityTone(task.priority)}`}>
                                                    {priorityLabel(task.priority)}
                                                </span>
                                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                                    task.status === 'completed'
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                                                }`}>
                                                    {task.status === 'completed' ? 'Terminee' : 'En attente'}
                                                </span>
                                            </div>

                                            <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                                                {task.title}
                                            </p>
                                            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                                {task.description || task.message?.sujet || 'Tache sans description.'}
                                            </p>

                                            <div className="mt-3 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                                                {task.reminder_at ? <p>Rappel : {formatDateTime(task.reminder_at)}</p> : null}
                                                {task.due_date ? <p>Echeance : {formatDateTime(task.due_date)}</p> : null}
                                            </div>

                                            <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-cyan-700 transition group-hover:gap-2 dark:text-cyan-300">
                                                Ouvrir la tache
                                                <ChevronRight className="h-3.5 w-3.5" />
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center dark:border-slate-700 dark:bg-slate-950">
                                        <CalendarDays className="mx-auto h-8 w-8 text-slate-400 dark:text-slate-500" />
                                        <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                                            Aucun resultat pour ces filtres
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                            Elargissez les filtres pour revoir tout votre planning.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </aside>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: 'cyan' | 'emerald' | 'rose' }) {
    const toneClass = {
        cyan: 'bg-white/10 text-white',
        emerald: 'bg-emerald-400/15 text-white',
        rose: 'bg-rose-400/15 text-white',
    }[tone];

    return (
        <div className={`rounded-2xl px-4 py-3 backdrop-blur-sm ${toneClass}`}>
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-100">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
    );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone: 'amber' | 'slate' | 'cyan' }) {
    const toneClass = {
        amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
        slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
        cyan: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300',
    }[tone];

    return (
        <div className={`rounded-2xl px-4 py-3 ${toneClass}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
    );
}

function QuickChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                active
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
            }`}
        >
            {label}
        </button>
    );
}

function FilterSelect({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
}) {
    return (
        <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {label}
            </span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="w-full bg-transparent outline-none"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}
