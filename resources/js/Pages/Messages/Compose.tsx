import InputError from '@/Components/InputError';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import { Head, Link, useForm } from '@inertiajs/react';
import { 
  Calendar, 
  Filter, 
  Paperclip, 
  Save, 
  Search, 
  Send, 
  Flag, 
  Receipt, 
  Share2, 
  Clock, 
  AlertCircle,
  Users,
  Mail,
  FileText,
  X,
  CheckCircle2,
  Zap,
  Info,
  ChevronRight
} from 'lucide-react';
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
    id?: number;
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
    existing_attachment_path?: string | null;
    forwarded_from_message_id?: number | null;
    forwarded_from?: {
        id: number;
        sender_name?: string | null;
        sender_email?: string | null;
        sent_at?: string | null;
        attachment_name?: string | null;
        has_attachment?: boolean;
    } | null;
};

type ComposeForm = {
    receiver_ids: number[];
    sujet: string;
    contenu: string;
    fichier: File | null;
    existing_attachment_path: string;
    important: boolean;
    requires_receipt: boolean;
    scheduled_at: string;
    type_message: string;
    deadline_reponse: string;
    can_be_redirected: boolean;
    forwarded_from_message_id: number | null;
};

function StatusBadge({ type, children }: { type: 'info' | 'warning' | 'success' | 'default'; children: React.ReactNode }) {
    const styles = {
        info: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/20',
        warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
        success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
        default: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
    };

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[type]}`}>
            {children}
        </span>
    );
}

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
    const [showRecipientList, setShowRecipientList] = useState(true);
    const isDraft = typeof draft?.id === 'number';

    const { data, setData, post, processing, errors, progress } = useForm<ComposeForm>({
        receiver_ids: draft?.receiver_ids ?? [],
        sujet: draft?.sujet ?? '',
        contenu: draft?.contenu ?? '',
        fichier: null,
        existing_attachment_path: draft?.existing_attachment_path ?? '',
        important: draft?.important ?? false,
        requires_receipt: draft?.requires_receipt ?? false,
        scheduled_at: draft?.scheduled_at ?? '',
        type_message: draft?.type_message ?? 'normal',
        deadline_reponse: draft?.deadline_reponse ?? '',
        can_be_redirected: draft?.can_be_redirected ?? false,
        forwarded_from_message_id: draft?.forwarded_from_message_id ?? null,
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
        const file = event.target.files?.[0] ?? null;
        setData('fichier', file);

        if (file) {
            setData('existing_attachment_path', '');
        }
    };

    const submitWithAction = (action: 'draft' | 'send') => {
        const options = { forceFormData: true, preserveScroll: true };

        if (isDraft && draft?.id) {
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

    const messageTypeOptions = [
        { value: 'normal', label: __('Normal'), icon: Mail, color: 'slate' },
        { value: 'urgent', label: __('Urgent'), icon: Zap, color: 'red' },
        { value: 'information', label: __('Information'), icon: Info, color: 'blue' },
    ];

    const currentTypeOption = messageTypeOptions.find(opt => opt.value === data.type_message) || messageTypeOptions[0];
    const CurrentIcon = currentTypeOption.icon;
    const forwardedSource = draft?.forwarded_from ?? null;

    return (
        <AuthenticatedLayout
            title={isDraft ? __('Modifier le brouillon') : __('Nouveau message')}
            description={isDraft ? __('Mettez à jour votre brouillon puis envoyez-le quand vous êtes prêt.') : __('Rédigez un message et envoyez-le à un ou plusieurs destinataires.')}
            actions={
                isDraft && (
                    <Link
                        href={route('drafts.index')}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:border-cyan-300 hover:bg-white hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-cyan-500/40 dark:hover:text-cyan-300"
                    >
                        <ChevronRight className="h-4 w-4" />
                        {__('Retour aux brouillons')}
                    </Link>
                )
            }
        >
            <Head title={isDraft ? __('Modifier le brouillon') : __('Nouveau message')} />

            <form onSubmit={submit} className="space-y-6">
                {forwardedSource && (
                    <div className="rounded-3xl border border-cyan-200/70 bg-gradient-to-r from-cyan-50 to-sky-50 p-5 shadow-sm dark:border-cyan-900/40 dark:from-cyan-950/20 dark:to-sky-950/20">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 shadow-md">
                                <Share2 className="h-5 w-5 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                                    {__('Transfert de message')}
                                </h2>
                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                    {__('Le contenu du message original a ete ajoute automatiquement.')}
                                </p>
                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                    {__('Expediteur')}: {forwardedSource.sender_name ?? __('Inconnu')}
                                    {forwardedSource.sender_email ? ` (${forwardedSource.sender_email})` : ''}
                                </p>
                                {forwardedSource.has_attachment && (
                                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                                        {__('La piece jointe originale n est pas rejointe automatiquement')}
                                        {forwardedSource.attachment_name ? `: ${forwardedSource.attachment_name}` : '.'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content - Left Column (2/3) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Recipients Section */}
                        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-lg backdrop-blur-sm dark:border-slate-800/50 dark:bg-slate-900/80">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 shadow-md">
                                        <Users className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                            {__('Destinataires')}
                                        </h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {__('Sélectionnez les destinataires de votre message')}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowRecipientList(!showRecipientList)}
                                    className="text-sm text-cyan-600 hover:text-cyan-700 dark:text-cyan-400"
                                >
                                    {showRecipientList ? __('Masquer la liste') : __('Afficher la liste')}
                                </button>
                            </div>

                            {/* Selected Recipients Tags */}
                            {selectedRecipients.length > 0 && (
                                <div className="mb-4 rounded-xl bg-gradient-to-r from-cyan-50 to-sky-50 p-4 dark:from-cyan-950/30 dark:to-sky-950/30">
                                    <p className="mb-3 text-sm font-medium text-cyan-800 dark:text-cyan-200">
                                        {__('Destinataires sélectionnés')} ({selectedRecipients.length})
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedRecipients.map((recipient) => (
                                            <button
                                                key={recipient.id}
                                                type="button"
                                                onClick={() => toggleRecipient(recipient.id)}
                                                className="group inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-red-50 hover:text-red-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                                            >
                                                {recipient.name}
                                                <X className="h-3 w-3 opacity-60 transition-opacity group-hover:opacity-100" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {showRecipientList && (
                                <div className="grid gap-4 lg:grid-cols-[1fr,1.5fr]">
                                    {/* Filters */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                <Filter className="mr-1 inline h-3.5 w-3.5 text-cyan-500" />
                                                {__('Filtrer par rôle')}
                                            </label>
                                            <select
                                                value={roleFilter}
                                                onChange={(event) => setRoleFilter(event.target.value)}
                                                className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                            >
                                                <option value="">{__('Tous les rôles')}</option>
                                                {roles.map((role) => (
                                                    <option key={role.id} value={role.id}>{role.nom_role}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                <Search className="mr-1 inline h-3.5 w-3.5 text-cyan-500" />
                                                {__('Rechercher')}
                                            </label>
                                            <input
                                                type="text"
                                                value={search}
                                                onChange={(event) => setSearch(event.target.value)}
                                                placeholder={__('Nom ou email...')}
                                                className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                            />
                                        </div>
                                    </div>

                                    {/* Recipients List */}
                                    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-950/30">
                                        <div className="mb-2 flex items-center justify-between px-2">
                                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                {__('Liste des destinataires')}
                                            </p>
                                            <p className="text-xs text-slate-400">{filteredRecipients.length} {__('contacts')}</p>
                                        </div>
                                        <div className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
                                            {filteredRecipients.length > 0 ? (
                                                filteredRecipients.map((recipient) => {
                                                    const checked = data.receiver_ids.includes(recipient.id);
                                                    return (
                                                        <label
                                                            key={recipient.id}
                                                            className={`flex cursor-pointer items-start gap-3 rounded-xl p-3 transition-all ${
                                                                checked
                                                                    ? 'bg-cyan-50 ring-1 ring-cyan-300 dark:bg-cyan-950/30 dark:ring-cyan-500/50'
                                                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={() => toggleRecipient(recipient.id)}
                                                                className="mt-0.5 rounded border-slate-300 text-cyan-600 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600"
                                                            />
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                                                    {recipient.name}
                                                                </p>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                                    {recipient.email}
                                                                </p>
                                                                <p className="mt-0.5 text-xs text-cyan-600 dark:text-cyan-400">
                                                                    {recipient.role?.nom_role ?? __('Sans rôle')}
                                                                </p>
                                                            </div>
                                                        </label>
                                                    );
                                                })
                                            ) : (
                                                <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                                                    {__('Aucun destinataire trouvé')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <InputError message={errors.receiver_ids || (errors as Record<string, string | undefined>)['receiver_ids.0']} className="mt-4" />
                        </div>

                        {/* Message Content Section */}
                        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-lg backdrop-blur-sm dark:border-slate-800/50 dark:bg-slate-900/80">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
                                    <FileText className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        {__('Contenu du message')}
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {__('Rédigez votre message ci-dessous')}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label htmlFor="sujet" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {__('Sujet')}
                                    </label>
                                    <input
                                        id="sujet"
                                        type="text"
                                        value={data.sujet}
                                        onChange={(event) => setData('sujet', event.target.value)}
                                        placeholder={__('Objet de votre message')}
                                        className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                    <InputError message={errors.sujet} className="mt-2" />
                                </div>

                                <div>
                                    <label htmlFor="contenu" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {__('Message')}
                                    </label>
                                    <textarea
                                        id="contenu"
                                        rows={10}
                                        value={data.contenu}
                                        onChange={(event) => setData('contenu', event.target.value)}
                                        placeholder={__('Saisissez le contenu de votre message...')}
                                        className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                    <InputError message={errors.contenu} className="mt-2" />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        <Paperclip className="mr-1 inline h-3.5 w-3.5 text-cyan-500" />
                                        {__('Pièce jointe')}
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="fichier"
                                            type="file"
                                            onChange={handleFileChange}
                                            className="block w-full cursor-pointer rounded-xl border border-slate-200 bg-white text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-cyan-600 file:to-sky-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white file:shadow-sm file:transition-all hover:file:from-cyan-700 hover:file:to-sky-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400"
                                        />
                                    </div>
                                    <InputError message={errors.fichier} className="mt-2" />
                                    {draft?.attachment_url && (
                                        <div className="mt-3 rounded-lg bg-slate-100 p-3 dark:bg-slate-800/50">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{__('Pièce jointe actuelle')}: </span>
                                            <a href={draft.attachment_url} target="_blank" rel="noreferrer" className="text-sm text-cyan-600 hover:underline dark:text-cyan-400">
                                                {draft.attachment_name ?? __('Fichier joint')}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Settings (1/3) */}
                    <div className="space-y-6">
                        {/* Settings Card */}
                        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-lg backdrop-blur-sm dark:border-slate-800/50 dark:bg-slate-900/80">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-md">
                                    <Mail className="h-5 w-5 text-white" />
                                </div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    {__('Paramètres')}
                                </h2>
                            </div>

                            <div className="space-y-5">
                                {/* Message Type */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {__('Type de message')}
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {messageTypeOptions.map((option) => {
                                            const Icon = option.icon;
                                            const isSelected = data.type_message === option.value;
                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => setData('type_message', option.value)}
                                                    className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-xs font-medium transition-all ${
                                                        isSelected
                                                            ? 'border-cyan-400 bg-cyan-50 text-cyan-700 shadow-sm dark:border-cyan-500 dark:bg-cyan-950/30 dark:text-cyan-300'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400'
                                                    }`}
                                                >
                                                    <Icon className="h-4 w-4" />
                                                    <span>{option.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Scheduled Date */}
                                <div>
                                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                        <Calendar className="h-4 w-4 text-cyan-500" />
                                        {__('Envoi programmé')}
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={data.scheduled_at}
                                        onChange={(event) => setData('scheduled_at', event.target.value)}
                                        className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                    <InputError message={errors.scheduled_at} className="mt-2" />
                                </div>

                                {/* Deadline */}
                                <div>
                                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                        <Clock className="h-4 w-4 text-cyan-500" />
                                        {__('Date limite de réponse')}
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={data.deadline_reponse}
                                        onChange={(event) => setData('deadline_reponse', event.target.value)}
                                        className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                    <InputError message={errors.deadline_reponse} className="mt-2" />
                                </div>

                                {/* Checkboxes */}
                                <div className="space-y-3">
                                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 transition-all hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50">
                                        <input
                                            type="checkbox"
                                            checked={data.important}
                                            onChange={(event) => setData('important', event.target.checked)}
                                            className="rounded border-slate-300 text-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-600"
                                        />
                                        <div className="flex items-center gap-2">
                                            <Flag className="h-4 w-4 text-amber-500" />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">{__('Marquer comme important')}</span>
                                        </div>
                                    </label>

                                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 transition-all hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50">
                                        <input
                                            type="checkbox"
                                            checked={data.requires_receipt}
                                            onChange={(event) => setData('requires_receipt', event.target.checked)}
                                            className="rounded border-slate-300 text-cyan-600 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600"
                                        />
                                        <div className="flex items-center gap-2">
                                            <Receipt className="h-4 w-4 text-cyan-600" />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">{__('Demander un accusé de réception')}</span>
                                        </div>
                                    </label>

                                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 transition-all hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50">
                                        <input
                                            type="checkbox"
                                            checked={data.can_be_redirected}
                                            onChange={(event) => setData('can_be_redirected', event.target.checked)}
                                            className="rounded border-slate-300 text-cyan-600 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600"
                                        />
                                        <div className="flex items-center gap-2">
                                            <Share2 className="h-4 w-4 text-cyan-600" />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">{__('Autoriser la redirection')}</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons Card */}
                        <div className="rounded-3xl bg-gradient-to-br from-cyan-700 via-cyan-800 to-slate-900 p-6 text-white shadow-xl">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                                    <Send className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">{isDraft ? __('Brouillon') : __('Nouveau message')}</p>
                                    <p className="text-xs text-cyan-100/70">{data.receiver_ids.length} {__('destinataire(s)')}</p>
                                </div>
                            </div>

                            {progress && (
                                <div className="mb-4">
                                    <div className="mb-1 flex items-center justify-between text-xs text-cyan-100">
                                        <span>{__('Téléversement')}</span>
                                        <span>{Math.round(progress.percentage ?? 0)}%</span>
                                    </div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
                                        <div className="h-full rounded-full bg-white transition-all duration-300" style={{ width: `${progress.percentage ?? 0}%` }} />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                <button
                                    type="button"
                                    onClick={() => submitWithAction('draft')}
                                    disabled={processing}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-white/20 disabled:opacity-50"
                                >
                                    <Save className="h-4 w-4" />
                                    {processing ? __('Enregistrement...') : __('Sauvegarder en brouillon')}
                                </button>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-cyan-700 transition-all hover:bg-cyan-50 hover:shadow-lg disabled:opacity-50"
                                >
                                    <Send className="h-4 w-4" />
                                    {processing ? __('Envoi en cours...') : isDraft ? __('Envoyer maintenant') : __('Envoyer le message')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
