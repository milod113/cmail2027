import { useForm, usePage } from '@inertiajs/react';
import { useMemo, useEffect, type FormEvent } from 'react';
import { CheckCircle2, Edit3 } from 'lucide-react';
import { useTranslation } from '@/Hooks/useTranslation';

type SignatureSettingsProps = {
    settings: {
        custom_signature?: string | null;
        use_auto_signature?: boolean;
    };
    profile: {
        grade?: string | null;
        telephone?: string | null;
    };
};

export default function SignatureSettings({ settings, profile }: SignatureSettingsProps) {
    const { __ } = useTranslation();
    const { auth } = usePage().props as any;

    const { data, setData, put, processing, errors } = useForm({
        use_auto_signature: settings?.use_auto_signature ?? true,
        custom_signature: settings?.custom_signature ?? '',
    });

    const preview = useMemo(() => {
        if (!data.use_auto_signature) {
            return __('Signature automatique désactivée.');
        }

        const lines = [`**${auth?.user?.name ?? ''}**`];

        if (profile?.grade) {
            lines.push(profile.grade);
        }

        if (auth?.user?.department_name) {
            lines.push(auth.user.department_name);
        }

        if (profile?.telephone) {
            lines.push(`📞 ${profile.telephone}`);
        }

        if (data.custom_signature?.trim()) {
            lines.push(data.custom_signature.trim());
        }

        return lines.filter(Boolean).join('\n\n');
    }, [auth?.user?.name, auth?.user?.department_name, data.custom_signature, data.use_auto_signature, profile?.grade, profile?.telephone, __]);

    useEffect(() => {
        if (data.use_auto_signature && !data.custom_signature) {
            setData('custom_signature', settings?.custom_signature ?? '');
        }
    }, [data.use_auto_signature, settings?.custom_signature, setData]);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        put(route('profile.signature.update'), {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr,360px]">
            <div className="space-y-5 rounded-3xl border border-slate-200/70 bg-slate-50 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
                <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
                        <Edit3 className="h-5 w-5" />
                    </span>
                    <div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                            {__('Configurer la signature')}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {__('Activez ou personnalisez votre signature automatique pour tous vos messages.')}
                        </p>
                    </div>
                </div>

                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition-all duration-200 hover:border-blue-300 dark:border-slate-700 dark:bg-slate-900">
                    <input
                        type="checkbox"
                        checked={data.use_auto_signature}
                        onChange={(event) => setData('use_auto_signature', event.target.checked)}
                        className="h-5 w-5 rounded-md border-slate-300 text-blue-600 shadow-sm focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600"
                    />
                    <div>
                        <div className="font-medium text-slate-800 dark:text-slate-100">
                            {__('Activer la signature automatique')}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {__('La signature sera automatiquement ajoutee au bas de vos nouveaux messages.')}
                        </p>
                    </div>
                </label>

                {data.use_auto_signature && (
                    <div className="space-y-2">
                        <label htmlFor="custom_signature" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            {__('Texte personnalisé')}
                        </label>
                        <textarea
                            id="custom_signature"
                            value={data.custom_signature}
                            onChange={(event) => setData('custom_signature', event.target.value)}
                            rows={6}
                            className="block w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                            placeholder={__('Entrez votre phrase de fin, disponibilite ou autre detail de contact...')}
                        />
                        {errors.custom_signature && (
                            <p className="text-sm text-red-600 dark:text-red-400">{errors.custom_signature}</p>
                        )}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center justify-center rounded-3xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {processing ? __('Enregistrement...') : __('Enregistrer la signature')}
                </button>
            </div>

            <div className="space-y-4 rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                            {__('Aperçu en temps réel')}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {__('Voici comment votre signature apparaîtra dans votre message.')}
                        </p>
                    </div>
                    <div className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
                        {data.use_auto_signature ? __('Activée') : __('Désactivée')}
                    </div>
                </div>
                <div className="rounded-3xl border border-slate-200/80 bg-slate-50 p-4 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-6">{preview}</pre>
                </div>
                <div className="flex items-center gap-2 rounded-3xl bg-blue-50/80 px-4 py-3 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-200">
                    <CheckCircle2 className="h-4 w-4" />
                    {__('Votre signature est prête à être utilisée automatiquement dans vos messages.')}
                </div>
            </div>
        </form>
    );
}
