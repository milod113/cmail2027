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

type UserSetting = {
    is_out_of_office: boolean;
    ooo_message: string | null;
    redirect_messages: boolean;
    delegate_user_id: number | null;
};

export default function UpdateOutOfOfficeSettingsForm({
    settings,
    colleagues,
    className = '',
}: {
    settings: UserSetting;
    colleagues: Colleague[];
    className?: string;
}) {
    const { __ } = useTranslation();
    const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
        is_out_of_office: settings.is_out_of_office,
        ooo_message: settings.ooo_message ?? '',
        redirect_messages: settings.redirect_messages,
        delegate_user_id: settings.delegate_user_id ? String(settings.delegate_user_id) : '',
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        patch(route('profile.settings.update'), {
            preserveScroll: true,
        });
    };

    return (
        <section className={className}>
            <header className="mb-6">
                <h2 className="text-lg font-medium text-slate-800 dark:text-slate-100">
                    {__('Absence et délégation')}
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {__('Configurez votre réponse d’absence et la délégation automatique de vos messages.')}
                </p>
            </header>

            <form onSubmit={submit} className="space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950/40">
                    <label className="flex items-start justify-between gap-4">
                        <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                                {__('Je suis actuellement absent')}
                            </p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {__('Active une réponse automatique et les options de délégation pendant votre absence.')}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                const nextValue = !data.is_out_of_office;
                                setData('is_out_of_office', nextValue);

                                if (!nextValue) {
                                    setData('redirect_messages', false);
                                    setData('delegate_user_id', '');
                                }
                            }}
                            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
                                data.is_out_of_office ? 'bg-cyan-600' : 'bg-slate-300 dark:bg-slate-700'
                            }`}
                        >
                            <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                                    data.is_out_of_office ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </label>
                </div>

                {data.is_out_of_office && (
                    <>
                        <div>
                            <label htmlFor="ooo_message" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                {__('Message d’absence')}
                            </label>
                            <textarea
                                id="ooo_message"
                                rows={4}
                                value={data.ooo_message}
                                onChange={(event) => setData('ooo_message', event.target.value)}
                                className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-500"
                                placeholder={__('Je suis actuellement absent. Votre message a bien été reçu.')}
                            />
                            <InputError className="mt-2" message={errors.ooo_message} />
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950/40">
                            <label className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                        {__('Déléguer mes messages')}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        {__('Envoie une copie des nouveaux messages reçus à un collègue remplaçant.')}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const nextValue = !data.redirect_messages;
                                        setData('redirect_messages', nextValue);

                                        if (!nextValue) {
                                            setData('delegate_user_id', '');
                                        }
                                    }}
                                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
                                        data.redirect_messages ? 'bg-cyan-600' : 'bg-slate-300 dark:bg-slate-700'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                                            data.redirect_messages ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </label>
                        </div>

                        {data.redirect_messages && (
                            <div>
                                <label htmlFor="delegate_user_id" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {__('Collègue remplaçant')}
                                </label>
                                <select
                                    id="delegate_user_id"
                                    value={data.delegate_user_id}
                                    onChange={(event) => setData('delegate_user_id', event.target.value)}
                                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-500"
                                >
                                    <option value="">{__('Choisir un collègue')}</option>
                                    {colleagues.map((colleague) => (
                                        <option key={colleague.id} value={colleague.id}>
                                            {colleague.name} ({colleague.email})
                                        </option>
                                    ))}
                                </select>
                                <InputError className="mt-2" message={errors.delegate_user_id} />
                            </div>
                        )}
                    </>
                )}

                <div className="flex items-center gap-3 border-t border-slate-200 pt-6 dark:border-slate-700">
                    <PrimaryButton disabled={processing} className="bg-gradient-to-r from-cyan-600 to-sky-700 text-white">
                        {__('Enregistrer les paramètres')}
                    </PrimaryButton>
                    {recentlySuccessful && (
                        <p className="text-sm text-slate-600 dark:text-slate-400">{__('Enregistré.')}</p>
                    )}
                </div>
            </form>
        </section>
    );
}
