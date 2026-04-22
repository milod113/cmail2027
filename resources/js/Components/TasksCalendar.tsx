import { Link } from '@inertiajs/react';
import {
    Bell,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Clock3,
    ExternalLink,
    Flag,
    ListTodo,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';

type CalendarTask = {
    id: number;
    title: string;
    description: string | null;
    status: 'pending' | 'completed';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    due_date?: string | null;
    reminder_at?: string | null;
    show_url?: string;
    message?: {
        sujet: string | null;
    } | null;
};

type CalendarEntry = {
    id: string;
    title: string;
    description: string | null;
    status: 'pending' | 'completed';
    priority: CalendarTask['priority'];
    type: 'due_date' | 'reminder_at';
    label: string;
    dateKey: string;
    isoValue: string;
    showUrl?: string;
    messageSubject?: string | null;
};

const weekdayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function startOfDay(value: Date) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
}

function startOfMonth(value: Date) {
    return new Date(value.getFullYear(), value.getMonth(), 1);
}

function addDays(value: Date, amount: number) {
    const date = new Date(value);
    date.setDate(date.getDate() + amount);
    return date;
}

function addMonths(value: Date, amount: number) {
    return new Date(value.getFullYear(), value.getMonth() + amount, 1);
}

function formatDateKey(value: Date) {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function parseIsoDate(value: string | null | undefined) {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
}

function parseDateKey(value: string) {
    const [year, month, day] = value.split('-').map(Number);

    if (!year || !month || !day) {
        return null;
    }

    return new Date(year, month - 1, day);
}

function formatMonthLabel(value: Date) {
    return value.toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
    });
}

function formatLongDate(value: string) {
    const date = parseIsoDate(value);

    if (!date) {
        return null;
    }

    return date.toLocaleString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatShortTime(value: string) {
    const date = parseIsoDate(value);

    if (!date) {
        return null;
    }

    return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getMonthGrid(month: Date) {
    const firstDay = startOfMonth(month);
    const dayOffset = (firstDay.getDay() + 6) % 7;
    const gridStart = addDays(firstDay, -dayOffset);

    return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

function getPriorityLabel(priority: CalendarTask['priority']) {
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

function getPriorityClass(priority: CalendarTask['priority']) {
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

function getEntryTone(type: CalendarEntry['type']) {
    if (type === 'due_date') {
        return {
            badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
            dotClass: 'bg-rose-500',
        };
    }

    return {
        badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
        dotClass: 'bg-amber-500',
    };
}

function buildEntries(tasks: CalendarTask[]) {
    return tasks
        .flatMap((task) => {
            const entries: CalendarEntry[] = [];

            if (task.due_date) {
                const dueDate = parseIsoDate(task.due_date);

                if (dueDate) {
                    entries.push({
                        id: `due-${task.id}`,
                        title: task.title,
                        description: task.description,
                        status: task.status,
                        priority: task.priority,
                        type: 'due_date',
                        label: 'Date limite',
                        dateKey: formatDateKey(dueDate),
                        isoValue: task.due_date,
                        showUrl: task.show_url,
                        messageSubject: task.message?.sujet,
                    });
                }
            }

            if (task.reminder_at) {
                const reminderDate = parseIsoDate(task.reminder_at);

                if (reminderDate) {
                    entries.push({
                        id: `reminder-${task.id}`,
                        title: task.title,
                        description: task.description,
                        status: task.status,
                        priority: task.priority,
                        type: 'reminder_at',
                        label: 'Rappel',
                        dateKey: formatDateKey(reminderDate),
                        isoValue: task.reminder_at,
                        showUrl: task.show_url,
                        messageSubject: task.message?.sujet,
                    });
                }
            }

            return entries;
        })
        .sort((left, right) => left.isoValue.localeCompare(right.isoValue));
}

function getInitialSelectedDate(entries: CalendarEntry[]) {
    const today = startOfDay(new Date());
    const upcoming = entries.find((entry) => {
        const date = parseIsoDate(entry.isoValue);
        return date && startOfDay(date).getTime() >= today.getTime();
    });

    if (upcoming) {
        return upcoming.dateKey;
    }

    return entries[0]?.dateKey ?? formatDateKey(today);
}

export default function TasksCalendar({ tasks }: { tasks: CalendarTask[] }) {
    const entries = buildEntries(tasks);
    const initialSelectedDate = getInitialSelectedDate(entries);
    const initialMonth = parseIsoDate(entries[0]?.isoValue ?? null) ?? new Date();
    const [selectedDateKey, setSelectedDateKey] = useState(initialSelectedDate);
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(parseIsoDate(entries.find((entry) => entry.dateKey === initialSelectedDate)?.isoValue ?? null) ?? initialMonth));

    const todayKey = formatDateKey(new Date());
    const monthDays = getMonthGrid(currentMonth);
    const entriesByDay = entries.reduce<Record<string, CalendarEntry[]>>((carry, entry) => {
        carry[entry.dateKey] = [...(carry[entry.dateKey] ?? []), entry];
        return carry;
    }, {});
    const selectedEntries = entriesByDay[selectedDateKey] ?? [];
    const dueCount = entries.filter((entry) => entry.type === 'due_date').length;
    const reminderCount = entries.filter((entry) => entry.type === 'reminder_at').length;
    const selectedDayDate = parseDateKey(selectedDateKey);
    const overdueCount = entries.filter((entry) => {
        const date = parseIsoDate(entry.isoValue);

        return entry.type === 'due_date'
            && entry.status !== 'completed'
            && date !== null
            && startOfDay(date).getTime() < startOfDay(new Date()).getTime();
    }).length;

    return (
        <section className="overflow-hidden rounded-[2rem] border border-cyan-100/80 bg-white/90 shadow-xl shadow-cyan-500/5 backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/85">
            <div className="border-b border-cyan-100/80 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_40%),linear-gradient(135deg,_rgba(236,254,255,0.96),_rgba(255,255,255,0.92))] px-6 py-6 dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_42%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(2,6,23,0.92))]">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-700 dark:bg-slate-950/70 dark:text-cyan-300">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Vue calendrier
                        </div>
                        <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                            Planifiez vos taches autour des echeances et rappels
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                            Chaque tache peut apparaitre deux fois dans le calendrier : une fois pour le rappel, une fois pour la date limite.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <SummaryCard icon={<ListTodo className="h-4 w-4" />} label="Dates limites" value={dueCount} tone="cyan" />
                        <SummaryCard icon={<Bell className="h-4 w-4" />} label="Rappels" value={reminderCount} tone="amber" />
                        <SummaryCard icon={<Flag className="h-4 w-4" />} label="En retard" value={overdueCount} tone="rose" />
                    </div>
                </div>
            </div>

            {entries.length > 0 ? (
                <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
                    <div className="space-y-5">
                        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700/70 dark:bg-slate-950/50 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                    Mois actif
                                </p>
                                <h3 className="mt-1 text-2xl font-bold capitalize text-slate-900 dark:text-white">
                                    {formatMonthLabel(currentMonth)}
                                </h3>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCurrentMonth((value) => addMonths(value, -1))}
                                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-500/40 dark:hover:text-cyan-300"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Precedent
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const today = new Date();
                                        setCurrentMonth(startOfMonth(today));
                                        setSelectedDateKey(formatDateKey(today));
                                    }}
                                    className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:bg-cyan-500/20"
                                >
                                    <CalendarDays className="h-4 w-4" />
                                    Aujourd'hui
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrentMonth((value) => addMonths(value, 1))}
                                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-500/40 dark:hover:text-cyan-300"
                                >
                                    Suivant
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                            {weekdayLabels.map((label) => (
                                <div
                                    key={label}
                                    className="px-2 py-1 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400"
                                >
                                    {label}
                                </div>
                            ))}

                            {monthDays.map((day) => {
                                const dayKey = formatDateKey(day);
                                const dayEntries = entriesByDay[dayKey] ?? [];
                                const dueEntries = dayEntries.filter((entry) => entry.type === 'due_date').length;
                                const reminderEntries = dayEntries.filter((entry) => entry.type === 'reminder_at').length;
                                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                                const isSelected = dayKey === selectedDateKey;
                                const isToday = dayKey === todayKey;

                                return (
                                    <button
                                        key={dayKey}
                                        type="button"
                                        onClick={() => {
                                            setSelectedDateKey(dayKey);

                                            if (!isCurrentMonth) {
                                                setCurrentMonth(startOfMonth(day));
                                            }
                                        }}
                                        className={`min-h-28 rounded-3xl border p-3 text-left transition-all sm:min-h-32 ${
                                            isSelected
                                                ? 'border-cyan-400 bg-cyan-50 shadow-lg shadow-cyan-500/10 dark:border-cyan-500/50 dark:bg-cyan-500/10'
                                                : isCurrentMonth
                                                    ? 'border-slate-200/80 bg-white hover:border-cyan-200 hover:bg-cyan-50/40 dark:border-slate-700/70 dark:bg-slate-900/70 dark:hover:border-cyan-500/30 dark:hover:bg-slate-900'
                                                    : 'border-slate-200/60 bg-slate-50/60 text-slate-400 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-500'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                                                isToday
                                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                                    : 'text-inherit'
                                            }`}>
                                                {day.getDate()}
                                            </span>
                                            {dayEntries.length > 0 ? (
                                                <span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
                                                    {dayEntries.length}
                                                </span>
                                            ) : null}
                                        </div>

                                        <div className="mt-4 space-y-2">
                                            {dueEntries > 0 ? (
                                                <span className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                                                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                                                    {dueEntries} echeance{dueEntries > 1 ? 's' : ''}
                                                </span>
                                            ) : null}
                                            {reminderEntries > 0 ? (
                                                <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                                                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                                                    {reminderEntries} rappel{reminderEntries > 1 ? 's' : ''}
                                                </span>
                                            ) : null}
                                            {dayEntries.slice(0, 2).map((entry) => (
                                                <p
                                                    key={entry.id}
                                                    className="truncate text-xs font-medium text-slate-600 dark:text-slate-300"
                                                >
                                                    {entry.title}
                                                </p>
                                            ))}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <aside className="rounded-[1.75rem] border border-slate-200/80 bg-slate-50/80 p-5 dark:border-slate-700/70 dark:bg-slate-950/55">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                    Jour selectionne
                                </p>
                                <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                                    {selectedDayDate
                                        ? selectedDayDate.toLocaleDateString('fr-FR', {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })
                                        : selectedDateKey}
                                </h3>
                            </div>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm dark:bg-slate-900 dark:text-slate-300">
                                {selectedEntries.length} element{selectedEntries.length > 1 ? 's' : ''}
                            </span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <LegendPill label="Date limite" tone="rose" />
                            <LegendPill label="Rappel" tone="amber" />
                        </div>

                        <div className="mt-5 space-y-3">
                            {selectedEntries.length > 0 ? (
                                selectedEntries.map((entry) => {
                                    const tone = getEntryTone(entry.type);
                                    const timeLabel = formatShortTime(entry.isoValue);

                                    return (
                                        <article
                                            key={entry.id}
                                            className="rounded-3xl border border-white/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                                        >
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${tone.badgeClass}`}>
                                                    <span className={`h-2 w-2 rounded-full ${tone.dotClass}`} />
                                                    {entry.label}
                                                </span>
                                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityClass(entry.priority)}`}>
                                                    {getPriorityLabel(entry.priority)}
                                                </span>
                                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    entry.status === 'completed'
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                                                }`}>
                                                    {entry.status === 'completed' ? 'Terminee' : 'En attente'}
                                                </span>
                                            </div>

                                            <h4 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">
                                                {entry.title}
                                            </h4>

                                            {entry.description ? (
                                                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                                    {entry.description}
                                                </p>
                                            ) : null}

                                            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Clock3 className="h-3.5 w-3.5" />
                                                    {timeLabel ?? 'Heure non precisee'}
                                                </span>
                                                <span>{formatLongDate(entry.isoValue)}</span>
                                                {entry.messageSubject ? <span>Sujet : {entry.messageSubject}</span> : null}
                                            </div>

                                            {entry.showUrl ? (
                                                <Link
                                                    href={entry.showUrl}
                                                    className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:bg-cyan-500/20"
                                                >
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                    Ouvrir la tache
                                                </Link>
                                            ) : null}
                                        </article>
                                    );
                                })
                            ) : (
                                <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 px-5 py-8 text-center dark:border-slate-700 dark:bg-slate-900">
                                    <CalendarDays className="mx-auto h-8 w-8 text-slate-400 dark:text-slate-500" />
                                    <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                                        Aucune tache planifiee ce jour-la
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        Selectionnez une autre date pour voir les rappels et echeances associes.
                                    </p>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            ) : (
                <div className="px-6 py-12">
                    <div className="rounded-3xl border border-dashed border-cyan-200 bg-cyan-50/50 px-6 py-12 text-center dark:border-cyan-500/20 dark:bg-cyan-500/5">
                        <CalendarDays className="mx-auto h-10 w-10 text-cyan-600 dark:text-cyan-300" />
                        <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                            Aucune date de planning disponible
                        </h3>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                            Ajoutez une date limite ou un rappel a une tache pour la voir apparaitre dans ce calendrier.
                        </p>
                    </div>
                </div>
            )}
        </section>
    );
}

function SummaryCard({
    icon,
    label,
    value,
    tone,
}: {
    icon: ReactNode;
    label: string;
    value: number;
    tone: 'cyan' | 'amber' | 'rose';
}) {
    const toneClass = {
        cyan: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300',
        amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
        rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
    }[tone];

    return (
        <div className={`rounded-3xl px-4 py-3 ${toneClass}`}>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em]">
                {icon}
                {label}
            </div>
            <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>
    );
}

function LegendPill({ label, tone }: { label: string; tone: 'rose' | 'amber' }) {
    const toneClass = tone === 'rose'
        ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
        : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300';

    const dotClass = tone === 'rose' ? 'bg-rose-500' : 'bg-amber-500';

    return (
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}>
            <span className={`h-2 w-2 rounded-full ${dotClass}`} />
            {label}
        </span>
    );
}
