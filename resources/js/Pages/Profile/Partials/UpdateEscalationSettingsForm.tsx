import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { useTranslation } from '@/Hooks/useTranslation';
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

type Colleague = {
    id: number;
    name: string;
    email: string;
};

type EscalationSetting = {
    escalation_enabled: boolean;
    backup_user_id: number | null;
    escalation_timeout: number | null;
};

export default function UpdateEscalationSettingsForm({
    settings,
    colleagues,
    className = '',
}: {
    settings: EscalationSetting;
    colleagues: Colleague[];
    className?: string;
}) {
    const { __ } = useTranslation();
    const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
        escalation_enabled: settings.escalation_enabled ?? false,
        backup_user_id: settings.backup_user_id ? String(settings.backup_user_id) : '',
        escalation_timeout: String(settings.escalation_timeout ?? 15),
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        patch(route('profile.escalation.update'), {
            preserveScroll: true,
        });
    };

    return (
        <section className={className}>
            <header className="mb-6">
                <h2 className="text-lg font-medium text-slate-800 dark:text-slate-100">
                    {__('Escalade des messages')}
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {__('Transferez automatiquement un message non lu a un collegue de secours apres un delai defini.')}
                </p>
            </header>

            <form onSubmit={submit} className="space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950/40">
                    <label className="flex items-start justify-between gap-4">
                        <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                                {__('Activer l escalade automatique')}
                            </p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {__('Si vous ne lisez pas un message a temps, il sera transmis a votre collegue de secours.')}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                const nextValue = !data.escalation_enabled;
                                setData('escalation_enabled', nextValue);

                                if (!nextValue) {
                                    setData('backup_user_id', '');
                                }
                            }}
                            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
                                data.escalation_enabled ? 'bg-rose-600' : 'bg-slate-300 dark:bg-slate-700'
                            }`}
                        >
                            <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                                    data.escalation_enabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </label>
                </div>

                {data.escalation_enabled && (
                    <>
                        <div>
                            <label htmlFor="backup_user_id" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                {__('Collegue de secours')}
                            </label>
                            <select
                                id="backup_user_id"
                                value={data.backup_user_id}
                                onChange={(event) => setData('backup_user_id', event.target.value)}
                                className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-rose-500"
                            >
                                <option value="">{__('Choisir un collegue')}</option>
                                {colleagues.map((colleague) => (
                                    <option key={colleague.id} value={colleague.id}>
                                        {colleague.name} ({colleague.email})
                                    </option>
                                ))}
                            </select>
                            <InputError className="mt-2" message={errors.backup_user_id} />
                        </div>

                        <div>
                            <label htmlFor="escalation_timeout" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                {__('Delai avant escalade (minutes)')}
                            </label>
                            <input
                                id="escalation_timeout"
                                type="number"
                                min={1}
                                max={1440}
                                value={data.escalation_timeout}
                                onChange={(event) => setData('escalation_timeout', event.target.value)}
                                className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-rose-500"
                            />
                            <InputError className="mt-2" message={errors.escalation_timeout} />
                        </div>
                    </>
                )}

                <div className="flex items-center gap-3 border-t border-slate-200 pt-6 dark:border-slate-700">
                    <PrimaryButton disabled={processing} className="bg-gradient-to-r from-rose-600 to-orange-600 text-white">
                        {__('Enregistrer l escalade')}
                    </PrimaryButton>
                    {recentlySuccessful && (
                        <p className="text-sm text-slate-600 dark:text-slate-400">{__('Enregistre.')}</p>
                    )}
                </div>
            </form>
        </section>
    );
}
