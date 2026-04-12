import InputError from '@/Components/InputError';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import { Head, Link, useForm } from '@inertiajs/react';
import { Calendar, Filter, Paperclip, Save, Search, Send } from 'lucide-react';
import type { ChangeEvent, FormEvent } from 'react';
import { useMemo, useState } from 'react';

type Recipient = {
    id: number;
    name: string;
    email: string;
    role_id?: number | null;
    role?: { id: number; nom_role: string } | null;
};

type RoleOption = { id: number; nom_role: string };

type DraftData = {
    id: number;
    receiver_ids: number[];
    sujet: string;
    contenu: string;
    important: boolean;
    requires_receipt: boolean;
    scheduled_at: string;
    type_message: string;
    deadline_reponse: string;
    can_be_redirected: boolean;
    attachment_name?: string | null;
    attachment_url?: string | null;
};

type ComposeForm = {
    receiver_ids: number[];
    sujet: string;
    contenu: string;
    fichier: File | null;
    important: boolean;
    requires_receipt: boolean;
    scheduled_at: string;
    type_message: string;
    deadline_reponse: string;
    can_be_redirected: boolean;
};

export default function Compose({
    recipients,
    roles,
    draft = null,
}: {
    recipients: Recipient[];
    roles: RoleOption[];
    draft?: DraftData | null;
}) {
    const { __ } = useTranslation();
    const [roleFilter, setRoleFilter] = useState('');
    const [search, setSearch] = useState('');

    const { data, setData, post, processing, errors, progress } = useForm<ComposeForm>({
        receiver_ids: draft?.receiver_ids ?? [],
        sujet: draft?.sujet ?? '',
        contenu: draft?.contenu ?? '',
        fichier: null,
        important: draft?.important ?? false,
        requires_receipt: draft?.requires_receipt ?? false,
        scheduled_at: draft?.scheduled_at ?? '',
        type_message: draft?.type_message ?? 'normal',
        deadline_reponse: draft?.deadline_reponse ?? '',
        can_be_redirected: draft?.can_be_redirected ?? false,
    });

    const filteredRecipients = useMemo(() => {
        return recipients.filter((recipient) => {
            const matchesRole = roleFilter === '' || String(recipient.role?.id ?? recipient.role_id ?? '') === roleFilter;
            const term = search.trim().toLowerCase();
            const matchesSearch =
                term === '' ||
                recipient.name.toLowerCase().includes(term) ||
                recipient.email.toLowerCase().includes(term);

            return matchesRole && matchesSearch;
        });
    }, [recipients, roleFilter, search]);

    const selectedRecipients = useMemo(
        () => recipients.filter((recipient) => data.receiver_ids.includes(recipient.id)),
        [data.receiver_ids, recipients],
    );

    const toggleRecipient = (recipientId: number) => {
        setData(
            'receiver_ids',
            data.receiver_ids.includes(recipientId)
                ? data.receiver_ids.filter((id) => id !== recipientId)
                : [...data.receiver_ids, recipientId],
        );
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        setData('fichier', event.target.files?.[0] ?? null);
    };

    const submitWithAction = (action: 'draft' | 'send') => {
        const options = { forceFormData: true, preserveScroll: true };

        if (draft?.id) {
            post(action === 'send' ? route('drafts.send', draft.id) : route('drafts.update', draft.id), options);
            return;
        }

        if (action === 'draft') {
            post(route('drafts.store'), options);
            return;
        }

        post(route('messages.store'), options);
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        submitWithAction('send');
    };

    return (
        <AuthenticatedLayout
            title={draft ? __('Modifier le brouillon') : __('Nouveau message')}
            description={draft ? __('Mettez à jour votre brouillon puis envoyez-le quand vous êtes prêt.') : __('Rédigez un message et envoyez-le à un ou plusieurs destinataires.')}
        >
            <Head title={draft ? __('Modifier le brouillon') : __('Nouveau message')} />

            <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1.25fr,0.75fr]">
                <section className="space-y-6">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-6 flex items-center gap-3">
                            <Filter className="h-5 w-5 text-cyan-500" />
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{__('Destinataires')}</h2>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-[0.9fr,1.1fr]">
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="role-filter" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                        <Filter className="h-4 w-4 text-cyan-500" />
                                        {__('Filtrer par rôle')}
                                    </label>
                                    <select
                                        id="role-filter"
                                        value={roleFilter}
                                        onChange={(event) => setRoleFilter(event.target.value)}
                                        className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                    >
                                        <option value="">{__('Tous les rôles')}</option>
                                        {roles.map((role) => (
                                            <option key={role.id} value={role.id}>{role.nom_role}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="recipient-search" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                        <Search className="h-4 w-4 text-cyan-500" />
                                        {__('Rechercher par nom')}
                                    </label>
                                    <input
                                        id="recipient-search"
                                        type="text"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder={__('Tapez un nom ou un email')}
                                        className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                </div>

                                <InputError message={errors.receiver_ids || (errors as Record<string, string | undefined>)['receiver_ids.0']} className="mt-2" />
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/50">
                                <div className="mb-3 flex items-center justify-between">
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{__('Liste des destinataires')}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{filteredRecipients.length} {__('résultat(s)')}</p>
                                </div>

                                <div className="max-h-72 space-y-2 overflow-y-auto pe-1">
                                    {filteredRecipients.length > 0 ? filteredRecipients.map((recipient) => {
                                        const checked = data.receiver_ids.includes(recipient.id);

                                        return (
                                            <label
                                                key={recipient.id}
                                                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 ${
                                                    checked
                                                        ? 'border-cyan-400 bg-cyan-50 dark:border-cyan-500 dark:bg-cyan-950/30'
                                                        : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => toggleRecipient(recipient.id)}
                                                    className="mt-1 rounded border-cyan-600 text-cyan-600 focus:ring-cyan-600"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{recipient.name}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{recipient.email}</p>
                                                    <p className="mt-1 text-xs text-cyan-700 dark:text-cyan-300">{recipient.role?.nom_role ?? __('Sans rôle')}</p>
                                                </div>
                                            </label>
                                        );
                                    }) : (
                                        <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                            {__('Aucun destinataire trouvé avec ce filtre.')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {selectedRecipients.length > 0 ? (
                            <div className="mt-6 rounded-2xl border border-cyan-100 bg-cyan-50 p-4 dark:border-cyan-900/40 dark:bg-cyan-950/20">
                                <p className="mb-3 text-sm font-semibold text-cyan-800 dark:text-cyan-200">{__('Destinataires sélectionnés')}</p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedRecipients.map((recipient) => (
                                        <button
                                            key={recipient.id}
                                            type="button"
                                            onClick={() => toggleRecipient(recipient.id)}
                                            className="rounded-full bg-white px-3 py-1.5 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                        >
                                            {recipient.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">{__('Contenu du message')}</h2>

                        <div className="space-y-5">
                            <div>
                                <label htmlFor="sujet" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{__('Sujet')}</label>
                                <input
                                    id="sujet"
                                    type="text"
                                    value={data.sujet}
                                    onChange={(event) => setData('sujet', event.target.value)}
                                    placeholder={__('Objet de votre message')}
                                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                />
                                <InputError message={errors.sujet} className="mt-2" />
                            </div>

                            <div>
                                <label htmlFor="contenu" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{__('Message')}</label>
                                <textarea
                                    id="contenu"
                                    rows={10}
                                    value={data.contenu}
                                    onChange={(event) => setData('contenu', event.target.value)}
                                    placeholder={__('Saisissez le contenu de votre message...')}
                                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                />
                                <InputError message={errors.contenu} className="mt-2" />
                            </div>

                            <div>
                                <label htmlFor="fichier" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                    <Paperclip className="h-4 w-4 text-cyan-500" />
                                    {__('Pièce jointe')}
                                </label>
                                <input
                                    id="fichier"
                                    type="file"
                                    onChange={handleFileChange}
                                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500 file:me-4 file:rounded-lg file:border-0 file:bg-cyan-600 file:px-4 file:py-2 file:font-semibold file:text-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400"
                                />
                                <InputError message={errors.fichier} className="mt-2" />
                                {draft?.attachment_url ? (
                                    <div className="mt-3 text-sm">
                                        <span className="font-medium text-slate-700 dark:text-slate-200">{__('Pièce jointe actuelle')}: </span>
                                        <a href={draft.attachment_url} target="_blank" rel="noreferrer" className="text-cyan-600 dark:text-cyan-300">
                                            {draft.attachment_name ?? __('Fichier joint')}
                                        </a>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="space-y-6">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="mb-5 text-lg font-semibold text-slate-900 dark:text-white">{__('Paramètres')}</h3>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="type_message" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{__('Type de message')}</label>
                                <select
                                    id="type_message"
                                    value={data.type_message}
                                    onChange={(event) => setData('type_message', event.target.value)}
                                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                >
                                    <option value="normal">{__('Normal')}</option>
                                    <option value="urgent">{__('Urgent')}</option>
                                    <option value="information">{__('Information')}</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="scheduled_at" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                    <Calendar className="h-4 w-4 text-cyan-500" />
                                    {__('Envoi programmé')}
                                </label>
                                <input
                                    id="scheduled_at"
                                    type="datetime-local"
                                    value={data.scheduled_at}
                                    onChange={(event) => setData('scheduled_at', event.target.value)}
                                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                />
                                <InputError message={errors.scheduled_at} className="mt-2" />
                            </div>

                            <div>
                                <label htmlFor="deadline_reponse" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{__('Date limite de réponse')}</label>
                                <input
                                    id="deadline_reponse"
                                    type="datetime-local"
                                    value={data.deadline_reponse}
                                    onChange={(event) => setData('deadline_reponse', event.target.value)}
                                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                />
                                <InputError message={errors.deadline_reponse} className="mt-2" />
                            </div>

                            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                                <input type="checkbox" checked={data.important} onChange={(event) => setData('important', event.target.checked)} className="rounded border-cyan-600 text-cyan-600 focus:ring-cyan-600" />
                                <span className="text-sm text-slate-700 dark:text-slate-200">{__('Marquer comme important')}</span>
                            </label>

                            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                                <input type="checkbox" checked={data.requires_receipt} onChange={(event) => setData('requires_receipt', event.target.checked)} className="rounded border-cyan-600 text-cyan-600 focus:ring-cyan-600" />
                                <span className="text-sm text-slate-700 dark:text-slate-200">{__('Demander un accusé de réception')}</span>
                            </label>

                            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                                <input type="checkbox" checked={data.can_be_redirected} onChange={(event) => setData('can_be_redirected', event.target.checked)} className="rounded border-cyan-600 text-cyan-600 focus:ring-cyan-600" />
                                <span className="text-sm text-slate-700 dark:text-slate-200">{__('Autoriser la redirection')}</span>
                            </label>
                        </div>
                    </div>

                    <div className="rounded-3xl bg-gradient-to-br from-cyan-600 via-cyan-700 to-teal-800 p-6 text-white shadow-xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">{draft ? __('Brouillon actuel') : __('Prêt à envoyer')}</p>
                        <p className="mt-3 text-sm text-cyan-50/90">{__('Le message sera envoyé à tous les destinataires sélectionnés.')}</p>
                        <p className="mt-2 text-sm text-cyan-50/90">{__('Nombre de destinataires')}: {data.receiver_ids.length}</p>

                        {progress ? (
                            <div className="mt-5">
                                <div className="mb-2 flex items-center justify-between text-xs text-cyan-100">
                                    <span>{__('Téléversement du fichier')}</span>
                                    <span>{Math.round(progress.percentage ?? 0)}%</span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                                    <div className="h-full rounded-full bg-white" style={{ width: `${progress.percentage ?? 0}%` }} />
                                </div>
                            </div>
                        ) : null}

                        <div className="mt-6 grid gap-3">
                            <button
                                type="button"
                                onClick={() => submitWithAction('draft')}
                                disabled={processing}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-60"
                            >
                                <Save className="h-4 w-4" />
                                {processing ? __('Enregistrement...') : __('Enregistrer comme brouillon')}
                            </button>

                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50 disabled:opacity-60"
                            >
                                <Send className="h-4 w-4" />
                                {processing ? __('Envoi en cours...') : draft ? __('Envoyer ce brouillon') : __('Envoyer le message')}
                            </button>
                        </div>

                        {draft ? (
                            <Link href={route('drafts.index')} className="mt-4 inline-flex text-sm text-cyan-100 hover:text-white">
                                {__('Retour aux brouillons')}
                            </Link>
                        ) : null}
                    </div>
                </section>
            </form>
        </AuthenticatedLayout>
    );
}
