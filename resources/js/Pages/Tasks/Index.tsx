import ShiftDashboard from '@/Components/ShiftDashboard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, ClipboardList, Search, Send, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';

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

export default function TasksIndex({ tasks }: { tasks: TaskItem[] }) {
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'upcoming' | 'overdue'>('all');
    const [priorityFilter, setPriorityFilter] = useState<'all' | 'urgent' | 'high' | 'normal' | 'low'>('all');

    const today = useMemo(() => startOfDay(new Date()), []);

    const filteredTasks = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return tasks.filter((task) => {
            const dueDate = parseDate(task.due_date);
            const reminderDate = parseDate(task.reminder_at);
            const searchableText = [
                task.title,
                task.description ?? '',
                task.message?.sujet ?? '',
            ].join(' ').toLowerCase();

            if (normalizedQuery !== '' && !searchableText.includes(normalizedQuery)) {
                return false;
            }

            if (statusFilter !== 'all' && task.status !== statusFilter) {
                return false;
            }

            if (priorityFilter !== 'all' && (task.priority ?? 'normal') !== priorityFilter) {
                return false;
            }

            switch (dateFilter) {
                case 'today':
                    return (dueDate !== null && isSameDay(dueDate, today))
                        || (reminderDate !== null && isSameDay(reminderDate, today));
                case 'upcoming': {
                    const nextDate = dueDate ?? reminderDate;
                    return nextDate !== null && startOfDay(nextDate).getTime() > today.getTime();
                }
                case 'overdue':
                    return task.status !== 'completed'
                        && dueDate !== null
                        && startOfDay(dueDate).getTime() < today.getTime();
                default:
                    return true;
            }
        });
    }, [dateFilter, priorityFilter, query, statusFilter, tasks, today]);

    const stats = useMemo(() => {
        const overdue = filteredTasks.filter((task) => {
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

        const completed = filteredTasks.filter((task) => task.status === 'completed').length;

        return {
            total: filteredTasks.length,
            overdue,
            todayCount,
            completed,
        };
    }, [filteredTasks, today]);

    return (
        <AuthenticatedLayout
            title="Mes taches"
            description="Suivez toutes les taches creees depuis vos messages."
        >
            <Head title="Mes taches" />

            <div className="space-y-8 pb-8">
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-600 via-sky-700 to-slate-900 p-6 shadow-xl shadow-cyan-500/20 md:p-8">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.16),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(34,211,238,0.22),_transparent_32%)]" />

                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100 backdrop-blur-sm">
                                <ClipboardList className="h-3.5 w-3.5" />
                                Gestion des taches
                            </div>
                            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
                                Taches creees depuis vos messages
                            </h1>
                            <p className="mt-3 text-base leading-relaxed text-cyan-50/90">
                                Transformez vos demandes importantes en actions concretes et suivez leur avancement pendant votre service.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Link
                                href={route('tasks.calendar')}
                                className="inline-flex items-center gap-2 rounded-2xl bg-white/12 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                            >
                                <CalendarDays className="h-4 w-4" />
                                Vue calendrier
                            </Link>
                            <Link
                                href={route('tasks.archives')}
                                className="inline-flex items-center gap-2 rounded-2xl bg-white/12 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                            >
                                <ClipboardList className="h-4 w-4" />
                                Archives des taches
                            </Link>
                            <Link
                                href={route('dashboard')}
                                className="inline-flex items-center gap-2 rounded-2xl bg-white/12 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Retour au dashboard
                            </Link>
                            <Link
                                href={route('messages.inbox')}
                                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50"
                            >
                                <Send className="h-4 w-4" />
                                Voir les messages
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="rounded-[2rem] border border-cyan-100/80 bg-white/90 p-5 shadow-xl shadow-cyan-500/5 backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/85 sm:p-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                                <Sparkles className="h-3.5 w-3.5" />
                                Navigation rapide
                            </div>
                            <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                                Filtrez vos taches en quelques secondes
                            </h2>
                            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                Recherchez par mot-cle, isolez les echeances critiques et gardez le focus sur les actions du jour.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <FilterStatCard label="Visibles" value={stats.total} tone="cyan" />
                            <FilterStatCard label="Aujourd hui" value={stats.todayCount} tone="emerald" />
                            <FilterStatCard label="En retard" value={stats.overdue} tone="rose" />
                            <FilterStatCard label="Terminees" value={stats.completed} tone="slate" />
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_repeat(3,minmax(0,1fr))]">
                        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
                            <Search className="h-4 w-4 text-slate-400" />
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Titre, description, sujet du message..."
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
                            label="Periode"
                            value={dateFilter}
                            onChange={(value) => setDateFilter(value as 'all' | 'today' | 'upcoming' | 'overdue')}
                            options={[
                                { value: 'all', label: 'Tout afficher' },
                                { value: 'today', label: 'Aujourd hui' },
                                { value: 'upcoming', label: 'A venir' },
                                { value: 'overdue', label: 'En retard' },
                            ]}
                        />
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                        <QuickFilterChip label="Tous" active={dateFilter === 'all'} onClick={() => setDateFilter('all')} />
                        <QuickFilterChip label="Aujourd hui" active={dateFilter === 'today'} onClick={() => setDateFilter('today')} />
                        <QuickFilterChip label="A venir" active={dateFilter === 'upcoming'} onClick={() => setDateFilter('upcoming')} />
                        <QuickFilterChip label="En retard" active={dateFilter === 'overdue'} onClick={() => setDateFilter('overdue')} />
                        <QuickFilterChip label="En attente" active={statusFilter === 'pending'} onClick={() => setStatusFilter('pending')} />
                        <QuickFilterChip label="Terminees" active={statusFilter === 'completed'} onClick={() => setStatusFilter('completed')} />
                    </div>
                </section>

                <ShiftDashboard tasks={filteredTasks} mode="active" />
            </div>
        </AuthenticatedLayout>
    );
}

function FilterStatCard({
    label,
    value,
    tone,
}: {
    label: string;
    value: number;
    tone: 'cyan' | 'emerald' | 'rose' | 'slate';
}) {
    const toneClass = {
        cyan: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300',
        emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
        rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
        slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    }[tone];

    return (
        <div className={`rounded-2xl px-4 py-3 ${toneClass}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
    );
}

function QuickFilterChip({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
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
