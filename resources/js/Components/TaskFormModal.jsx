import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import { useTranslation } from '@/Hooks/useTranslation';
import { useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
    AlertTriangle,
    BellRing,
    CalendarDays,
    ClipboardList,
    Flag,
    Sparkles,
    X,
    CheckCircle2,
    Circle,
    Plus,
    Trash2,
    Clock,
    Calendar,
    AlarmClock,
    Star,
    TrendingUp,
    Zap,
    Award,
    ListTodo,
    Loader2,
} from 'lucide-react';

const priorityOptions = [
    { value: 'low', label: 'Basse', icon: Circle, color: 'slate' },
    { value: 'normal', label: 'Normale', icon: Star, color: 'sky' },
    { value: 'high', label: 'Haute', icon: TrendingUp, color: 'amber' },
    { value: 'urgent', label: 'Urgente', icon: Zap, color: 'rose' },
];

function FormField({ label, hint, children, error, required = false }) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {label}
                {required && <span className="ml-0.5 text-rose-500">*</span>}
            </label>
            {hint && <p className="text-xs text-slate-500">{hint}</p>}
            {children}
            <InputError message={error} />
        </div>
    );
}

export default function TaskFormModal({
    show,
    messageId,
    messageSubject = null,
    onClose,
    onSubmitted,
    submitRouteName = 'tasks.store-from-message',
}) {
    const { __ } = useTranslation();
    const [subtasks, setSubtasks] = useState([]);
    const [newSubtask, setNewSubtask] = useState('');

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        title: '',
        description: '',
        priority: 'normal',
        due_date: '',
        reminder_at: '',
    });

    useEffect(() => {
        if (!show) {
            reset();
            clearErrors();
            setSubtasks([]);
            setNewSubtask('');
        }
    }, [show]);

    const closeModal = () => {
        reset();
        clearErrors();
        setSubtasks([]);
        setNewSubtask('');
        onClose();
    };

    const addSubtask = () => {
        if (newSubtask.trim()) {
            setSubtasks([...subtasks, { id: Date.now(), title: newSubtask.trim(), done: false }]);
            setNewSubtask('');
        }
    };

    const toggleSubtask = (id) => {
        setSubtasks(subtasks.map(sub =>
            sub.id === id ? { ...sub, done: !sub.done } : sub
        ));
    };

    const removeSubtask = (id) => {
        setSubtasks(subtasks.filter(sub => sub.id !== id));
    };

    const submit = (e) => {
        e.preventDefault();

        post(route(submitRouteName, messageId), {
            data: {
                ...data,
                subtasks: subtasks.filter(s => !s.done).map(s => s.title),
                completed_subtasks: subtasks.filter(s => s.done).map(s => s.title),
            },
            preserveScroll: true,
            onSuccess: () => {
                onSubmitted?.();
                closeModal();
            },
        });
    };

    return (
        <Modal show={show} onClose={closeModal} maxWidth="2xl">
            <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900">
                {/* Header */}
                <div className="border-b border-slate-200 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 shadow-md">
                                <ListTodo className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {__('Créer une tâche')}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    {__('Transformez ce message en action à suivre')}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={closeModal}
                            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {messageSubject && (
                        <div className="mt-4 rounded-lg bg-slate-50 px-4 py-2 dark:bg-slate-800">
                            <p className="text-xs text-slate-500 dark:text-slate-400">{__('Message associé')}</p>
                            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 line-clamp-1">
                                {messageSubject}
                            </p>
                        </div>
                    )}
                </div>

                {/* Form */}
                <form onSubmit={submit} className="px-6 py-6">
                    <div className="space-y-6">
                        {/* Title */}
                        <FormField label={__('Titre')} error={errors.title} required>
                            <input
                                type="text"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                placeholder={__('Ex: Finaliser le rapport mensuel')}
                                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                required
                            />
                        </FormField>

                        {/* Description */}
                        <FormField label={__('Description')} hint={__('Optionnelle')} error={errors.description}>
                            <textarea
                                rows={3}
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder={__('Détails, contexte ou instructions supplémentaires...')}
                                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            />
                        </FormField>

                        {/* Priority */}
                        <FormField label={__('Priorité')} error={errors.priority}>
                            <div className="flex flex-wrap gap-2">
                                {priorityOptions.map((option) => {
                                    const Icon = option.icon;
                                    const isSelected = data.priority === option.value;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setData('priority', option.value)}
                                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                                                isSelected
                                                    ? `bg-${option.color}-100 text-${option.color}-700 dark:bg-${option.color}-500/20 dark:text-${option.color}-300`
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                            }`}
                                        >
                                            <Icon className="h-3.5 w-3.5" />
                                            {__(option.label)}
                                        </button>
                                    );
                                })}
                            </div>
                        </FormField>

                        {/* Due Date & Reminder */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField label={__('Date limite')} error={errors.due_date}>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="datetime-local"
                                        value={data.due_date}
                                        onChange={(e) => setData('due_date', e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            </FormField>

                            <FormField label={__('Rappel')} error={errors.reminder_at}>
                                <div className="relative">
                                    <BellRing className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="datetime-local"
                                        value={data.reminder_at}
                                        onChange={(e) => setData('reminder_at', e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            </FormField>
                        </div>

                        {/* Subtasks */}
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {__('Sous-tâches')}
                                </label>
                                <p className="text-xs text-slate-500">{__('Optionnelles')}</p>
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newSubtask}
                                    onChange={(e) => setNewSubtask(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addSubtask()}
                                    placeholder={__('Ajouter une sous-tâche...')}
                                    className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                />
                                <button
                                    type="button"
                                    onClick={addSubtask}
                                    className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                                >
                                    <Plus className="h-4 w-4" />
                                    {__('Ajouter')}
                                </button>
                            </div>

                            {subtasks.length > 0 && (
                                <div className="space-y-2">
                                    {subtasks.map((subtask) => (
                                        <div
                                            key={subtask.id}
                                            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => toggleSubtask(subtask.id)}
                                                className="flex-shrink-0"
                                            >
                                                {subtask.done ? (
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                ) : (
                                                    <Circle className="h-4 w-4 text-slate-400" />
                                                )}
                                            </button>
                                            <span className={`flex-1 text-sm ${subtask.done ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'}`}>
                                                {subtask.title}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeSubtask(subtask.id)}
                                                className="text-slate-400 transition hover:text-rose-500"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Info Note */}
                        <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-500/10">
                            <div className="flex gap-3">
                                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                                <p className="text-xs text-amber-800 dark:text-amber-300">
                                    {__('La tâche sera créée et liée à ce message. Le destinataire recevra une notification.')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-6 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            {__('Annuler')}
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-sky-600 px-4 py-2 text-sm font-medium text-white shadow-md transition hover:shadow-lg disabled:opacity-50"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {__('Création...')}
                                </>
                            ) : (
                                <>
                                    <Award className="h-4 w-4" />
                                    {__('Créer la tâche')}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
