import { useForm, usePage } from '@inertiajs/react';
import { useMemo, useEffect, type FormEvent, type ReactNode } from 'react';
import {
    Building2,
    CheckCircle2,
    Edit3,
    Landmark,
    Mail,
    Phone,
    Sparkles,
} from 'lucide-react';
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

type AuthUser = {
    name?: string;
    email?: string;
    department_name?: string | null;
};

export default function SignatureSettings({ settings, profile }: SignatureSettingsProps) {
    const { __ } = useTranslation();
    const { auth } = usePage().props as { auth?: { user?: AuthUser } };

    const { data, setData, put, processing, errors } = useForm({
        use_auto_signature: settings?.use_auto_signature ?? true,
        custom_signature: settings?.custom_signature ?? '',
    });

    const signatureProfile = useMemo(() => {
        const user = auth?.user;

        return {
            enabled: data.use_auto_signature,
            name: user?.name ?? '',
            email: user?.email ?? '',
            grade: profile?.grade ?? '',
            department: user?.department_name ?? '',
            phone: profile?.telephone ?? '',
            institution: 'CHU de Tlemcen',
            customText: data.custom_signature?.trim() ?? '',
        };
    }, [auth?.user, data.custom_signature, data.use_auto_signature, profile?.grade, profile?.telephone]);

    const preview = useMemo(() => {
        if (!signatureProfile.enabled) {
            return __('Signature automatique desactivee.');
        }

        return [
            signatureProfile.name ? `**${signatureProfile.name}**` : '',
            signatureProfile.grade,
            signatureProfile.department,
            signatureProfile.institution,
            [signatureProfile.email, signatureProfile.phone].filter(Boolean).join(' | '),
            signatureProfile.customText,
        ]
            .filter(Boolean)
            .join('\n');
    }, [__, signatureProfile]);

    useEffect(() => {
        if (data.use_auto_signature && !data.custom_signature) {
            setData('custom_signature', settings?.custom_signature ?? '');
        }
    }, [data.use_auto_signature, data.custom_signature, setData, settings?.custom_signature]);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        put(route('profile.signature.update'), {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
            <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-xl shadow-slate-200/40 dark:border-slate-800/80 dark:bg-slate-950 dark:shadow-none">
                <div className="border-b border-slate-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_40%),linear-gradient(135deg,_rgba(248,250,252,0.96),_rgba(255,255,255,0.92))] p-6 dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_40%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(2,6,23,0.92))]">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-4">
                            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 text-white shadow-lg shadow-cyan-500/20">
                                <Edit3 className="h-5 w-5" />
                            </span>
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-700 dark:bg-slate-950/70 dark:text-cyan-300">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Signature institutionnelle
                                </div>
                                <h3 className="mt-3 text-xl font-bold text-slate-900 dark:text-white">
                                    {__('Signature de messagerie')}
                                </h3>
                                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                    {__('Votre signature sera ajoutee automatiquement au bas de vos messages avec un format sobre, clair et institutionnel.')}
                                </p>
                            </div>
                        </div>

                        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                            data.use_auto_signature
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                            <CheckCircle2 className="h-4 w-4" />
                            {data.use_auto_signature ? __('Activee') : __('Desactivee')}
                        </div>
                    </div>
                </div>

                <div className="space-y-6 p-6">
                    <label className="flex cursor-pointer items-start gap-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-4 transition-all hover:border-cyan-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:hover:border-cyan-500/40 dark:hover:bg-slate-900">
                        <div className="pt-0.5">
                            <input
                                type="checkbox"
                                checked={data.use_auto_signature}
                                onChange={(event) => setData('use_auto_signature', event.target.checked)}
                                className="h-5 w-5 rounded-md border-slate-300 text-cyan-600 shadow-sm focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600"
                            />
                        </div>
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-slate-900 dark:text-white">
                                    {__('Activer la signature automatique')}
                                </p>
                                <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-[11px] font-semibold text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                                    {__('Recommande')}
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {__('Le nom, le poste, la direction et les coordonnees seront ajoutes automatiquement a chaque message sortant.')}
                            </p>
                        </div>
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <InfoPill icon={<Edit3 className="h-4 w-4" />} label={__('Nom complet')} value={signatureProfile.name || __('Non renseigne')} />
                        <InfoPill icon={<Building2 className="h-4 w-4" />} label={__('Poste / fonction')} value={signatureProfile.grade || __('Non renseigne')} />
                        <InfoPill icon={<Landmark className="h-4 w-4" />} label={__('Direction / service')} value={signatureProfile.department || __('Aucun service')} />
                        <InfoPill icon={<Mail className="h-4 w-4" />} label={__('Email')} value={signatureProfile.email || __('Non renseigne')} />
                        <InfoPill icon={<Phone className="h-4 w-4" />} label={__('Telephone')} value={signatureProfile.phone || __('Non renseigne')} />
                        <InfoPill icon={<Building2 className="h-4 w-4" />} label={__('Etablissement')} value={signatureProfile.institution} />
                    </div>

                    {data.use_auto_signature ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <label htmlFor="custom_signature" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                    {__('Mention complementaire')}
                                </label>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {__('Ajoutez une formule de politesse ou une precision utile si necessaire.')}
                                </span>
                            </div>

                            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-3 shadow-inner dark:border-slate-700 dark:bg-slate-950">
                                <textarea
                                    id="custom_signature"
                                    value={data.custom_signature}
                                    onChange={(event) => setData('custom_signature', event.target.value)}
                                    rows={5}
                                    className="block w-full resize-none rounded-[1.25rem] border border-white bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-500/50 dark:focus:ring-cyan-500/20"
                                    placeholder={__('Disponible pour tout complement d information.')}
                                />
                            </div>

                            {errors.custom_signature ? (
                                <p className="text-sm text-red-600 dark:text-red-400">{errors.custom_signature}</p>
                            ) : null}
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                            {__('La signature automatique est actuellement desactivee. Vous pouvez la reactiver a tout moment.')}
                        </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-cyan-50/80 px-4 py-3 text-sm text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-200">
                        <span>{__('Le format institutionnel est applique automatiquement et reste lisible dans tous les messages.')}</span>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center justify-center rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {processing ? __('Enregistrement...') : __('Enregistrer la signature')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-xl shadow-slate-200/30 dark:border-slate-800/80 dark:bg-slate-950 dark:shadow-none">
                <div className="border-b border-slate-200/70 bg-slate-50/80 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/60">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                                {__('Apercu en temps reel')}
                            </h4>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {__('Voici comment votre signature apparaitra a la fin de votre message.')}
                            </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                            data.use_auto_signature
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                            {data.use_auto_signature ? __('Signature active') : __('Signature inactive')}
                        </span>
                    </div>
                </div>

                <div className="space-y-5 p-5">
                    <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                        <div className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                        {__('Exemple de message')}
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                                        {__('Objet : Coordination de service')}
                                    </p>
                                </div>
                                <Mail className="h-4 w-4 text-slate-400" />
                            </div>

                            <div className="space-y-4 px-4 py-4">
                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                    {__('Bonjour, veuillez trouver ci-dessous ma signature telle qu elle sera inseree automatiquement.')}
                                </p>

                                {signatureProfile.enabled ? (
                                    <div className="overflow-hidden rounded-[1.5rem] border border-cyan-200/70 bg-[linear-gradient(135deg,#f8fafc_0%,#ecfeff_100%)] dark:border-cyan-500/20 dark:bg-[linear-gradient(135deg,#0f172a_0%,#082f49_100%)]">
                                        <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-500" />
                                        <div className="space-y-4 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                                                        {signatureProfile.name || __('Nom utilisateur')}
                                                    </p>
                                                    {signatureProfile.grade ? (
                                                        <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                                                            {signatureProfile.grade}
                                                        </p>
                                                    ) : null}
                                                    {signatureProfile.department ? (
                                                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                                            {signatureProfile.department}
                                                        </p>
                                                    ) : null}
                                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                        {signatureProfile.institution}
                                                    </p>
                                                </div>
                                                <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-700 shadow-sm dark:bg-slate-950/80 dark:text-cyan-300">
                                                    {__('Signature mail')}
                                                </span>
                                            </div>

                                            {(signatureProfile.email || signatureProfile.phone) ? (
                                                <div className="rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200">
                                                    {[signatureProfile.email, signatureProfile.phone].filter(Boolean).join(' | ')}
                                                </div>
                                            ) : null}

                                            {signatureProfile.customText ? (
                                                <div className="rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
                                                    {signatureProfile.customText}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center dark:border-slate-700 dark:bg-slate-900/60">
                                        <CheckCircle2 className="mx-auto h-8 w-8 text-slate-400 dark:text-slate-500" />
                                        <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                                            {__('Signature desactivee')}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                            {__('Activez la signature automatique pour voir ici un rendu complet et institutionnel.')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-cyan-200/80 bg-cyan-50/70 px-4 py-3 text-xs text-cyan-800 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-200">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            {__('Votre signature est prete a etre utilisee automatiquement dans vos messages.')}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/60">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            {__('Version texte')}
                        </p>
                        <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-6 text-slate-700 dark:text-slate-300">
                            {preview}
                        </pre>
                    </div>
                </div>
            </div>
        </form>
    );
}

function InfoPill({
    icon,
    label,
    value,
}: {
    icon: ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 text-cyan-600 dark:text-cyan-300">{icon}</div>
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        {label}
                    </p>
                    <p className="mt-1 truncate text-sm font-medium text-slate-900 dark:text-white">
                        {value}
                    </p>
                </div>
            </div>
        </div>
    );
}
