import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import { useTranslation } from '@/Hooks/useTranslation';
import { router } from '@inertiajs/react';
import { type ReactNode, FormEvent, useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock, MessageSquare, Save, Sparkles, X } from 'lucide-react';

type Recipient = {
    id: number;
    name: string;
    email: string;
};

type ScheduledPlanning = {
    id: number;
    subject: string;
    body: string;
    scheduled_at: string | null;
    receiver: Recipient | null;
};

type RecurringPlanning = {
    id: number;
    body: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    time_of_day: string;
    is_active: boolean;
    receiver: Recipient | null;
};

type PlanningModalProps = {
    show: boolean;
    mode: 'create' | 'edit';
    type: 'scheduled' | 'recurring';
    recipients: Recipient[];
    scheduledItem?: ScheduledPlanning | null;
    recurringItem?: RecurringPlanning | null;
    onClose: () => void;
};

type ErrorBag = Partial<
    Record<'receiver_id' | 'sujet' | 'contenu' | 'scheduled_at' | 'body' | 'frequency' | 'time_of_day', string>
>;

const scheduledDefaults = {
    receiver_id: '',
    sujet: '',
    contenu: '',
    scheduled_at: '',
};

const recurringDefaults = {
    receiver_id: '',
    body: '',
    frequency: 'daily' as const,
    time_of_day: '',
    is_active: true,
};

export default function PlanningModal({
    show,
    mode,
    type,
    recipients,
    scheduledItem,
    recurringItem,
    onClose,
}: PlanningModalProps) {
    const { __ } = useTranslation();
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<ErrorBag>({});
    const [scheduledData, setScheduledData] = useState(scheduledDefaults);
    const [recurringData, setRecurringData] = useState(recurringDefaults);

    useEffect(() => {
        if (!show) {
            return;
        }

        setErrors({});

        if (type === 'scheduled') {
            setScheduledData(
                scheduledItem
                    ? {
                          receiver_id: scheduledItem.receiver?.id ? String(scheduledItem.receiver.id) : '',
                          sujet: scheduledItem.subject,
                          contenu: scheduledItem.body,
                          scheduled_at: formatDateTimeLocal(scheduledItem.scheduled_at),
                      }
                    : scheduledDefaults,
            );
        }

        if (type === 'recurring') {
            setRecurringData(
                recurringItem
                    ? {
                          receiver_id: recurringItem.receiver?.id ? String(recurringItem.receiver.id) : '',
                          body: recurringItem.body,
                          frequency: recurringItem.frequency,
                          time_of_day: recurringItem.time_of_day.slice(0, 5),
                          is_active: recurringItem.is_active,
                      }
                    : recurringDefaults,
            );
        }
    }, [show, type, scheduledItem, recurringItem]);

    const closeModal = () => {
        setErrors({});
        onClose();
    };

    const submitScheduled = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProcessing(true);
        setErrors({});

        const payload = {
            receiver_id: scheduledData.receiver_id,
            sujet: scheduledData.sujet,
            contenu: scheduledData.contenu,
            scheduled_at: scheduledData.scheduled_at,
        };

        const options = {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: (nextErrors: Record<string, string>) => setErrors(nextErrors),
            onFinish: () => setProcessing(false),
        };

        if (mode === 'edit' && scheduledItem) {
            router.put(route('planifications.messages.update', scheduledItem.id), payload, options);
            return;
        }

        router.post(route('planifications.messages.store'), payload, options);
    };

    const submitRecurring = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProcessing(true);
        setErrors({});

        const payload = {
            receiver_id: recurringData.receiver_id,
            body: recurringData.body,
            frequency: recurringData.frequency,
            time_of_day: recurringData.time_of_day,
            is_active: recurringData.is_active,
        };

        const options = {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: (nextErrors: Record<string, string>) => setErrors(nextErrors),
            onFinish: () => setProcessing(false),
        };

        if (mode === 'edit' && recurringItem) {
            router.put(route('planifications.recurrents.update', recurringItem.id), payload, options);
            return;
        }

        router.post(route('planifications.recurrents.store'), payload, options);
    };

    const isScheduled = type === 'scheduled';
    const title = isScheduled
        ? mode === 'edit'
            ? __('Modifier un message programme')
            : __('Nouveau message programme')
        : mode === 'edit'
          ? __('Modifier un message recurrent')
          : __('Nouveau message recurrent');

    const subtitle = isScheduled
        ? __('Choisissez un destinataire, un contenu et une date precise pour l envoi.')
        : __('Definissez une routine automatique avec frequence et heure d execution.');

    const spotlightTitle = isScheduled ? __('Envoi unique maitrise') : __('Routine automatique elegante');
    const spotlightDescription = isScheduled
        ? __('Ideal pour preparer une communication importante et la laisser partir exactement au bon moment.')
        : __('Parfait pour les transmissions regulieres et les rappels qui reviennent sans friction.');

    return (
        <Modal show={show} onClose={closeModal} maxWidth="xl">
            <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-2xl dark:bg-slate-950">
                <div className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(8,145,178,0.96),rgba(3,105,161,0.96),rgba(15,23,42,1))]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_26%),radial-gradient(circle_at_80%_20%,rgba(125,211,252,0.2),transparent_22%)]" />
                    <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl" />

                    <div className="relative px-6 py-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                                    {isScheduled ? (
                                        <CalendarDays className="h-5 w-5 text-white" />
                                    ) : (
                                        <MessageSquare className="h-5 w-5 text-white" />
                                    )}
                                </div>
                                <div>
                                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-50">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        {__('Edition premium')}
                                    </div>
                                    <h2 className="mt-3 text-xl font-semibold text-white">{title}</h2>
                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-cyan-50/90">{subtitle}</p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                className="rounded-2xl p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_15rem]">
                            <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-50/80">
                                    {spotlightTitle}
                                </p>
                                <p className="mt-2 text-sm leading-7 text-white/90">{spotlightDescription}</p>
                            </div>
                            <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/20 p-4 backdrop-blur">
                                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                                    <CheckCircle2 className="h-4 w-4 text-cyan-200" />
                                    {mode === 'edit' ? __('Mode mise a jour') : __('Mode creation')}
                                </div>
                                <p className="mt-2 text-xs leading-6 text-cyan-50/80">
                                    {mode === 'edit'
                                        ? __('Vos ajustements seront appliques des la validation.')
                                        : __('Configurez les parametres puis confirmez pour enregistrer la planification.')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {isScheduled ? (
                    <form onSubmit={submitScheduled} className="space-y-6 p-6">
                        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
                            <div className="space-y-5">
                                <FieldPanel title={__('Message')} helper={__('Les informations principales de votre envoi programme.')}>
                                    <div>
                                        <InputLabel htmlFor="planning_receiver_id" value={__('Destinataire')} />
                                        <select
                                            id="planning_receiver_id"
                                            value={scheduledData.receiver_id}
                                            onChange={(event) =>
                                                setScheduledData((current) => ({ ...current, receiver_id: event.target.value }))
                                            }
                                            className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-400/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-500"
                                        >
                                            <option value="">{__('Selectionnez un destinataire')}</option>
                                            {recipients.map((recipient) => (
                                                <option key={recipient.id} value={recipient.id}>
                                                    {recipient.name} {recipient.email ? `(${recipient.email})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.receiver_id} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="planning_subject" value={__('Sujet')} />
                                        <input
                                            id="planning_subject"
                                            type="text"
                                            value={scheduledData.sujet}
                                            onChange={(event) =>
                                                setScheduledData((current) => ({ ...current, sujet: event.target.value }))
                                            }
                                            className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-400/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-500"
                                            placeholder={__('Objet du message')}
                                        />
                                        <InputError message={errors.sujet} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="planning_body" value={__('Contenu')} />
                                        <textarea
                                            id="planning_body"
                                            rows={6}
                                            value={scheduledData.contenu}
                                            onChange={(event) =>
                                                setScheduledData((current) => ({ ...current, contenu: event.target.value }))
                                            }
                                            className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-900 shadow-sm transition focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-400/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-500"
                                            placeholder={__('Redigez le message a programmer')}
                                        />
                                        <InputError message={errors.contenu} className="mt-2" />
                                    </div>
                                </FieldPanel>
                            </div>

                            <div className="space-y-5">
                                <FieldPanel
                                    title={__('Temporalite')}
                                    helper={__('Choisissez le moment exact ou Cmail devra effectuer l envoi.')}
                                >
                                    <div>
                                        <InputLabel htmlFor="planning_scheduled_at" value={__('Date et heure d envoi')} />
                                        <div className="relative mt-2">
                                            <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <input
                                                id="planning_scheduled_at"
                                                type="datetime-local"
                                                value={scheduledData.scheduled_at}
                                                onChange={(event) =>
                                                    setScheduledData((current) => ({
                                                        ...current,
                                                        scheduled_at: event.target.value,
                                                    }))
                                                }
                                                className="block w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 shadow-sm transition focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-400/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-500"
                                            />
                                        </div>
                                        <InputError message={errors.scheduled_at} className="mt-2" />
                                    </div>

                                    <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4 dark:border-cyan-500/20 dark:bg-cyan-500/10">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-cyan-800 dark:text-cyan-200">
                                            <Clock className="h-4 w-4" />
                                            {__('Conseil de planification')}
                                        </div>
                                        <p className="mt-2 text-xs leading-6 text-cyan-700/90 dark:text-cyan-100/80">
                                            {__('Utilisez cette vue pour anticiper les transmissions, confirmations et informations qui doivent partir sans stress au bon moment.')}
                                        </p>
                                    </div>
                                </FieldPanel>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-end">
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={processing}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                            >
                                <X className="h-4 w-4" />
                                {__('Annuler')}
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:shadow-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Save className="h-4 w-4" />
                                {processing
                                    ? __('Enregistrement...')
                                    : mode === 'edit'
                                      ? __('Mettre a jour')
                                      : __('Programmer')}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={submitRecurring} className="space-y-6 p-6">
                        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
                            <div className="space-y-5">
                                <FieldPanel
                                    title={__('Routine')}
                                    helper={__('Composez le message et choisissez a qui il sera adresse automatiquement.')}
                                >
                                    <div>
                                        <InputLabel htmlFor="recurring_receiver_id" value={__('Destinataire')} />
                                        <select
                                            id="recurring_receiver_id"
                                            value={recurringData.receiver_id}
                                            onChange={(event) =>
                                                setRecurringData((current) => ({ ...current, receiver_id: event.target.value }))
                                            }
                                            className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-400/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-500"
                                        >
                                            <option value="">{__('Selectionnez un destinataire')}</option>
                                            {recipients.map((recipient) => (
                                                <option key={recipient.id} value={recipient.id}>
                                                    {recipient.name} {recipient.email ? `(${recipient.email})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.receiver_id} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="recurring_body" value={__('Message recurrent')} />
                                        <textarea
                                            id="recurring_body"
                                            rows={6}
                                            value={recurringData.body}
                                            onChange={(event) =>
                                                setRecurringData((current) => ({ ...current, body: event.target.value }))
                                            }
                                            className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-900 shadow-sm transition focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-400/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-500"
                                            placeholder={__('Contenu a envoyer automatiquement')}
                                        />
                                        <InputError message={errors.body} className="mt-2" />
                                    </div>
                                </FieldPanel>
                            </div>

                            <div className="space-y-5">
                                <FieldPanel
                                    title={__('Cadence')}
                                    helper={__('Fixez un rythme stable et une heure simple a memoriser pour votre equipe.')}
                                >
                                    <div>
                                        <InputLabel htmlFor="recurring_frequency" value={__('Frequence')} />
                                        <select
                                            id="recurring_frequency"
                                            value={recurringData.frequency}
                                            onChange={(event) =>
                                                setRecurringData((current) => ({
                                                    ...current,
                                                    frequency: event.target.value as 'daily' | 'weekly' | 'monthly',
                                                }))
                                            }
                                            className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-400/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-500"
                                        >
                                            <option value="daily">{__('Tous les jours')}</option>
                                            <option value="weekly">{__('Chaque semaine')}</option>
                                            <option value="monthly">{__('Chaque mois')}</option>
                                        </select>
                                        <InputError message={errors.frequency} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="recurring_time_of_day" value={__('Heure d envoi')} />
                                        <div className="relative mt-2">
                                            <Clock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <input
                                                id="recurring_time_of_day"
                                                type="time"
                                                value={recurringData.time_of_day}
                                                onChange={(event) =>
                                                    setRecurringData((current) => ({
                                                        ...current,
                                                        time_of_day: event.target.value,
                                                    }))
                                                }
                                                className="block w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 shadow-sm transition focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-400/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-500"
                                            />
                                        </div>
                                        <InputError message={errors.time_of_day} className="mt-2" />
                                    </div>

                                    <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
                                        <input
                                            type="checkbox"
                                            checked={recurringData.is_active}
                                            onChange={(event) =>
                                                setRecurringData((current) => ({ ...current, is_active: event.target.checked }))
                                            }
                                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500/30 dark:border-slate-600 dark:bg-slate-950"
                                        />
                                        <span>
                                            <span className="inline-flex items-center gap-2 font-semibold">
                                                <MessageSquare className="h-4 w-4 text-cyan-500" />
                                                {__('Activer cette routine des son enregistrement')}
                                            </span>
                                            <span className="mt-1 block text-xs leading-6 text-slate-500 dark:text-slate-400">
                                                {__('Si cette option reste active, le cycle automatique commencera selon la frequence definie.')}
                                            </span>
                                        </span>
                                    </label>
                                </FieldPanel>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-end">
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={processing}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                            >
                                <X className="h-4 w-4" />
                                {__('Annuler')}
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:shadow-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Save className="h-4 w-4" />
                                {processing
                                    ? __('Enregistrement...')
                                    : mode === 'edit'
                                      ? __('Mettre a jour')
                                      : __('Creer la routine')}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </Modal>
    );
}

function FieldPanel({
    title,
    helper,
    children,
}: {
    title: string;
    helper: string;
    children: ReactNode;
}) {
    return (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/50">
            <div className="mb-5">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{helper}</p>
            </div>
            <div className="space-y-5">{children}</div>
        </section>
    );
}

function formatDateTimeLocal(value: string | null): string {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    const pad = (input: number) => String(input).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
