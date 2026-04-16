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
  Zap,
  Info,
  ChevronRight,
  CheckCircle2,
  UserPlus,
  UserMinus,
  Upload,
  Sparkles,
  CornerDownRight,
  Phone,
  MessageSquare,
  Star,
  Archive,
  Bell,
  Eye,
  Shield,
  Globe,
  Lock,
  MoreVertical,
  Trash2,
  Edit3,
  Copy,
  Download,
  Printer
} from 'lucide-react';
import type { ChangeEvent, FormEvent } from 'react';
import { useMemo, useState, useRef, useEffect } from 'react';

type Recipient = {
    id: number;
    name: string;
    email: string;
    role_id?: number | null;
    role?: { id: number; nom_role: string } | null;
    is_out_of_office: boolean;
    redirect_messages: boolean;
    has_auto_delegation: boolean;
    delegate_user?: {
        id: number;
        name: string;
        email: string;
    } | null;
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

// Animated status badge component
function StatusBadge({ type, children, animated = false }: { type: 'info' | 'warning' | 'success' | 'default'; children: React.ReactNode; animated?: boolean }) {
    const styles = {
        info: 'bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 border-cyan-200 dark:from-cyan-500/10 dark:to-blue-500/10 dark:text-cyan-300 dark:border-cyan-500/20',
        warning: 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-200 dark:from-amber-500/10 dark:to-orange-500/10 dark:text-amber-300 dark:border-amber-500/20',
        success: 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200 dark:from-emerald-500/10 dark:to-green-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
        default: 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 border-slate-200 dark:from-slate-800 dark:to-gray-800 dark:text-slate-300 dark:border-slate-700'
    };

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold backdrop-blur-sm transition-all duration-200 hover:scale-105 ${styles[type]} ${animated ? 'animate-pulse' : ''}`}>
            {children}
        </span>
    );
}

// Custom checkbox component
function Checkbox({ checked, onChange, label, icon: Icon, description }: { checked: boolean; onChange: (checked: boolean) => void; label: string; icon?: React.ElementType; description?: string }) {
    return (
        <label className="group flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200/80 bg-white/50 p-4 transition-all duration-200 hover:border-cyan-300 hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-sky-50/50 dark:border-slate-700/80 dark:bg-slate-900/50 dark:hover:border-cyan-500/40 dark:hover:from-cyan-950/20 dark:hover:to-sky-950/20">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="mt-1 h-5 w-5 rounded-md border-2 border-slate-300 text-cyan-600 shadow-sm focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600"
            />
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />}
                    <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
                </div>
                {description && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
                )}
            </div>
        </label>
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
    const [activeTab, setActiveTab] = useState<'compose' | 'settings' | 'preview'>('compose');
    const [charCount, setCharCount] = useState(0);
    const [isFocused, setIsFocused] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
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

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [data.contenu]);

    // Update character count
    useEffect(() => {
        setCharCount(data.contenu.length);
    }, [data.contenu]);

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
    const filteredOutOfOfficeRecipients = useMemo(
        () => filteredRecipients.filter((recipient) => recipient.is_out_of_office),
        [filteredRecipients],
    );
    const selectedOutOfOfficeRecipients = useMemo(
        () => selectedRecipients.filter((recipient) => recipient.is_out_of_office),
        [selectedRecipients],
    );

    const recipientAbsenceNote = (recipient: Recipient): string => {
        if (recipient.has_auto_delegation && recipient.delegate_user) {
            return `${recipient.name} (${__('delegation vers')} ${recipient.delegate_user.name})`;
        }

        return recipient.name;
    };

    const toggleRecipient = (recipientId: number) => {
        setData(
            'receiver_ids',
            data.receiver_ids.includes(recipientId)
                ? data.receiver_ids.filter((id) => id !== recipientId)
                : [...data.receiver_ids, recipientId],
        );
    };

    const selectAllFilteredRecipients = () => {
        const visibleRecipientIds = filteredRecipients.map((recipient) => recipient.id);
        setData('receiver_ids', Array.from(new Set([...data.receiver_ids, ...visibleRecipientIds])));
    };

    const deselectAllFilteredRecipients = () => {
        const visibleRecipientIds = new Set(filteredRecipients.map((recipient) => recipient.id));
        setData(
            'receiver_ids',
            data.receiver_ids.filter((recipientId) => !visibleRecipientIds.has(recipientId)),
        );
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        setData('fichier', file);
        if (file) {
            setData('existing_attachment_path', '');
        }
    };

    const removeFile = () => {
        setData('fichier', null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
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
        { value: 'normal', label: __('Normal'), icon: Mail, color: 'slate', gradient: 'from-slate-500 to-gray-600' },
        { value: 'urgent', label: __('Urgent'), icon: Zap, color: 'red', gradient: 'from-red-500 to-orange-600' },
        { value: 'information', label: __('Information'), icon: Info, color: 'blue', gradient: 'from-blue-500 to-cyan-600' },
    ];

    const currentTypeOption = messageTypeOptions.find(opt => opt.value === data.type_message) || messageTypeOptions[0];
    const CurrentIcon = currentTypeOption.icon;
    const forwardedSource = draft?.forwarded_from ?? null;

    // Get recipient count display
    const recipientCountText = data.receiver_ids.length === 0
        ? __('Aucun destinataire')
        : data.receiver_ids.length === 1
            ? __('1 destinataire')
            : `${data.receiver_ids.length} ${__('destinataires')}`;

    return (
        <AuthenticatedLayout
            title={isDraft ? __('Modifier le brouillon') : __('Nouveau message')}
            description={isDraft ? __('Mettez à jour votre brouillon puis envoyez-le quand vous êtes prêt.') : __('Rédigez un message et envoyez-le à un ou plusieurs destinataires.')}
            actions={
                isDraft && (
                    <Link
                        href={route('drafts.index')}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-cyan-300 hover:bg-white hover:text-cyan-700 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-cyan-500/40 dark:hover:text-cyan-300"
                    >
                        <ChevronRight className="h-4 w-4" />
                        {__('Retour aux brouillons')}
                    </Link>
                )
            }
        >
            <Head title={isDraft ? __('Modifier le brouillon') : __('Nouveau message')} />

            <form onSubmit={submit} className="space-y-6 pb-20 md:pb-0">
                {/* Mobile Tab Navigation */}
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md dark:bg-slate-900/95 md:hidden">
                    <div className="flex gap-1 rounded-2xl border border-slate-200/80 bg-white/50 p-1 dark:border-slate-700/80 dark:bg-slate-900/50">
                        {[
                            { id: 'compose', label: __('Composer'), icon: Edit3 },
                            { id: 'settings', label: __('Options'), icon: Settings },
                            { id: 'preview', label: __('Aperçu'), icon: Eye },
                        ].map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
                                        activeTab === tab.id
                                            ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-white shadow-lg'
                                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {forwardedSource && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-500 rounded-3xl border border-cyan-200/70 bg-gradient-to-r from-cyan-50 via-sky-50 to-blue-50 p-5 shadow-lg dark:border-cyan-900/40 dark:from-cyan-950/20 dark:via-sky-950/20 dark:to-blue-950/20">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 shadow-lg">
                                <Share2 className="h-5 w-5 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                                    {__('Transfert de message')}
                                </h2>
                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                    {__('Le contenu du message original a ete ajoute automatiquement.')}
                                </p>
                                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                    <span className="flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        {forwardedSource.sender_name ?? __('Inconnu')}
                                    </span>
                                    {forwardedSource.sender_email && (
                                        <span>{forwardedSource.sender_email}</span>
                                    )}
                                    {forwardedSource.sent_at && (
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {new Date(forwardedSource.sent_at).toLocaleString()}
                                        </span>
                                    )}
                                </div>
                                {forwardedSource.has_attachment && (
                                    <p className="mt-2 flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        {__('La piece jointe originale n\'est pas rejointe automatiquement')}
                                        {forwardedSource.attachment_name ? `: ${forwardedSource.attachment_name}` : '.'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid gap-6 lg:gap-8 xl:grid-cols-3">
                    {/* Main Content - Left Column (2/3) */}
                    <div className={`space-y-6 xl:col-span-2 ${activeTab !== 'compose' ? 'hidden xl:block' : ''}`}>
                        {/* Recipients Section - Modern Card Design */}
                        <div className="group rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:border-slate-800/50 dark:bg-slate-900/80 sm:p-6">
                            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 shadow-md">
                                        <Users className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                            {__('Destinataires')}
                                        </h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {recipientCountText}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowRecipientList(!showRecipientList)}
                                    className="inline-flex items-center gap-1 text-sm font-medium text-cyan-600 transition-all hover:gap-2 hover:text-cyan-700 dark:text-cyan-400"
                                >
                                    {showRecipientList ? (
                                        <>Masquer <ChevronRight className="h-4 w-4 rotate-90" /></>
                                    ) : (
                                        <>Afficher <ChevronRight className="h-4 w-4" /></>
                                    )}
                                </button>
                            </div>

                            {/* Selected Recipients Tags - Modern Chips */}
                            {selectedRecipients.length > 0 && (
                                <div className="mb-5 rounded-2xl bg-gradient-to-r from-cyan-50/80 to-sky-50/80 p-4 backdrop-blur-sm dark:from-cyan-950/30 dark:to-sky-950/30">
                                    <div className="mb-3 flex items-center justify-between">
                                        <p className="text-sm font-semibold text-cyan-800 dark:text-cyan-200">
                                            {__('Sélectionnés')} ({selectedRecipients.length})
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setData('receiver_ids', [])}
                                            className="text-xs text-red-500 transition-colors hover:text-red-600"
                                        >
                                            {__('Tout effacer')}
                                        </button>
                                    </div>
                                    {selectedOutOfOfficeRecipients.length > 0 && (
                                        <div className="mb-3 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 dark:border-amber-500/30 dark:bg-amber-500/10">
                                            <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-200">
                                                <AlertCircle className="h-3.5 w-3.5" />
                                                {__('Attention: certains destinataires selectionnes sont absents.')}
                                            </p>
                                            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                                                {selectedOutOfOfficeRecipients.slice(0, 4).map(recipientAbsenceNote).join(', ')}
                                                {selectedOutOfOfficeRecipients.length > 4
                                                    ? ` ${__('et')} ${selectedOutOfOfficeRecipients.length - 4} ${__('autre(s)')}`
                                                    : ''}
                                            </p>
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                        {selectedRecipients.map((recipient) => (
                                            <button
                                                key={recipient.id}
                                                type="button"
                                                onClick={() => toggleRecipient(recipient.id)}
                                                className={`group inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium shadow-sm transition-all duration-200 hover:scale-105 ${
                                                    recipient.is_out_of_office
                                                        ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 hover:from-red-100 hover:to-rose-100 dark:from-amber-500/20 dark:to-orange-500/20 dark:text-amber-200'
                                                        : 'bg-white text-slate-700 shadow-sm hover:bg-red-50 hover:text-red-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-red-950/30'
                                                }`}
                                            >
                                                {recipient.is_out_of_office && <AlertCircle className="h-3.5 w-3.5" />}
                                                <span className="max-w-[150px] truncate">{recipient.name}</span>
                                                <X className="h-3 w-3 opacity-60 transition-opacity group-hover:opacity-100" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {showRecipientList && (
                                <div className="grid gap-5 lg:grid-cols-[280px,1fr]">
                                    {/* Filters - Modern Inputs */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                                                <Filter className="h-4 w-4 text-cyan-500" />
                                                {__('Filtrer par rôle')}
                                            </label>
                                            <select
                                                value={roleFilter}
                                                onChange={(event) => setRoleFilter(event.target.value)}
                                                className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                            >
                                                <option value="">{__('Tous les rôles')}</option>
                                                {roles.map((role) => (
                                                    <option key={role.id} value={role.id}>{role.nom_role}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                                                <Search className="h-4 w-4 text-cyan-500" />
                                                {__('Rechercher')}
                                            </label>
                                            <input
                                                type="text"
                                                value={search}
                                                onChange={(event) => setSearch(event.target.value)}
                                                placeholder={__('Nom ou email...')}
                                                className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition-all focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                            />
                                        </div>
                                    </div>

                                    {/* Recipients List - Modern Card Grid */}
                                    <div className="rounded-xl border border-slate-200 bg-slate-50/30 p-3 dark:border-slate-800 dark:bg-slate-950/20">
                                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-2">
                                            <div>
                                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                    {__('Liste des destinataires')}
                                                </p>
                                                <p className="text-xs text-slate-400">{filteredRecipients.length} {__('contacts')}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={selectAllFilteredRecipients}
                                                    disabled={filteredRecipients.length === 0}
                                                    className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-gradient-to-r from-cyan-50 to-sky-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition-all hover:scale-105 hover:border-cyan-300 disabled:opacity-50 dark:border-cyan-500/20 dark:from-cyan-500/10 dark:to-sky-500/10 dark:text-cyan-300"
                                                >
                                                    <UserPlus className="h-3 w-3" />
                                                    {__('Tout')}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={deselectAllFilteredRecipients}
                                                    disabled={filteredRecipients.length === 0}
                                                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:scale-105 hover:border-slate-300 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                                                >
                                                    <UserMinus className="h-3 w-3" />
                                                    {__('Aucun')}
                                                </button>
                                            </div>
                                        </div>
                                        {filteredOutOfOfficeRecipients.length > 0 && (
                                            <div className="mx-2 mb-3 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 dark:border-amber-500/30 dark:bg-amber-500/10">
                                                <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-200">
                                                    <AlertCircle className="h-3.5 w-3.5" />
                                                    {__('Absents')}: {filteredOutOfOfficeRecipients.length}
                                                </p>
                                                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                                                    {filteredOutOfOfficeRecipients.slice(0, 5).map(recipientAbsenceNote).join(', ')}
                                                    {filteredOutOfOfficeRecipients.length > 5
                                                        ? ` ${__('et')} ${filteredOutOfOfficeRecipients.length - 5} ${__('autre(s)')}`
                                                        : ''}
                                                </p>
                                            </div>
                                        )}
                                        <div className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
                                            {filteredRecipients.length > 0 ? (
                                                filteredRecipients.map((recipient) => {
                                                    const checked = data.receiver_ids.includes(recipient.id);
                                                    return (
                                                        <label
                                                            key={recipient.id}
                                                            className={`flex cursor-pointer items-start gap-3 rounded-xl p-3 transition-all duration-200 ${
                                                                checked
                                                                    ? 'bg-gradient-to-r from-cyan-50 to-sky-50 ring-1 ring-cyan-300 dark:from-cyan-950/30 dark:to-sky-950/30 dark:ring-cyan-500/50'
                                                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={() => toggleRecipient(recipient.id)}
                                                                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600"
                                                            />
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                                                    {recipient.name}
                                                                </p>
                                                                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                                                    {recipient.email}
                                                                </p>
                                                                <p className="mt-0.5 text-xs text-cyan-600 dark:text-cyan-400">
                                                                    {recipient.role?.nom_role ?? __('Sans rôle')}
                                                                </p>
                                                                {recipient.is_out_of_office && (
                                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                                        <StatusBadge type="warning">
                                                                            <AlertCircle className="h-3 w-3" />
                                                                            {__("Absent")}
                                                                        </StatusBadge>
                                                                        {recipient.has_auto_delegation && recipient.delegate_user ? (
                                                                            <StatusBadge type="info">
                                                                                <CornerDownRight className="h-3 w-3" />
                                                                                {recipient.delegate_user.name}
                                                                            </StatusBadge>
                                                                        ) : (
                                                                            <StatusBadge type="default">
                                                                                {__("Sans delegation")}
                                                                            </StatusBadge>
                                                                        )}
                                                                    </div>
                                                                )}
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

                        {/* Message Content Section - Modern Editor */}
                        <div className="group rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:border-slate-800/50 dark:bg-slate-900/80 sm:p-6">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
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
                                {/* Subject Line with Character Counter */}
                                <div>
                                    <label htmlFor="sujet" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {__('Sujet')} <span className="text-xs text-slate-400">({data.sujet.length}/255)</span>
                                    </label>
                                    <input
                                        id="sujet"
                                        type="text"
                                        value={data.sujet}
                                        onChange={(event) => setData('sujet', event.target.value.slice(0, 255))}
                                        placeholder={__('Objet de votre message...')}
                                        className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition-all focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                    <InputError message={errors.sujet} className="mt-2" />
                                </div>

                                {/* Message Body with Rich Text Area */}
                                <div>
                                    <label htmlFor="contenu" className="mb-2 flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-300">
                                        <span>{__('Message')}</span>
                                        <span className={`text-xs ${charCount > 5000 ? 'text-red-500' : 'text-slate-400'}`}>
                                            {charCount}/5000
                                        </span>
                                    </label>
                                    <div className={`relative rounded-xl transition-all duration-200 ${isFocused ? 'ring-2 ring-cyan-400/20' : ''}`}>
                                        <textarea
                                            ref={textareaRef}
                                            id="contenu"
                                            rows={8}
                                            value={data.contenu}
                                            onFocus={() => setIsFocused(true)}
                                            onBlur={() => setIsFocused(false)}
                                            onChange={(event) => {
                                                const val = event.target.value.slice(0, 5000);
                                                setData('contenu', val);
                                            }}
                                            placeholder={__('Saisissez le contenu de votre message...')}
                                            className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition-all focus:border-cyan-400 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                        />
                                    </div>
                                    <InputError message={errors.contenu} className="mt-2" />
                                </div>

                                {/* File Attachment - Modern Upload */}
                                <div>
                                    <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                                        <Paperclip className="h-4 w-4 text-cyan-500" />
                                        {__('Pièce jointe')}
                                        <span className="text-xs text-slate-400">(Max 10MB)</span>
                                    </label>
                                    <div className="relative">
                                        {data.fichier ? (
                                            <div className="flex items-center justify-between rounded-xl border border-cyan-200 bg-gradient-to-r from-cyan-50 to-sky-50 p-3 dark:border-cyan-800/50 dark:from-cyan-950/30 dark:to-sky-950/30">
                                                <div className="flex items-center gap-3">
                                                    <Paperclip className="h-5 w-5 text-cyan-600" />
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{data.fichier.name}</p>
                                                        <p className="text-xs text-slate-500">{(data.fichier.size / 1024).toFixed(1)} KB</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={removeFile}
                                                    className="rounded-full p-1 text-red-500 transition-colors hover:bg-red-100 hover:text-red-600"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 transition-all hover:border-cyan-400 hover:bg-cyan-50/30 dark:border-slate-700 dark:bg-slate-900/30 dark:hover:border-cyan-500">
                                                <Upload className="mb-2 h-8 w-8 text-slate-400" />
                                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                                    {__('Cliquez pour télécharger ou glissez-déposez')}
                                                </span>
                                                <input
                                                    ref={fileInputRef}
                                                    id="fichier"
                                                    type="file"
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                />
                                            </label>
                                        )}
                                    </div>
                                    <InputError message={errors.fichier} className="mt-2" />
                                    {draft?.attachment_url && !data.fichier && (
                                        <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-100 p-3 dark:bg-slate-800/50">
                                            <div className="flex items-center gap-2">
                                                <Paperclip className="h-4 w-4 text-slate-500" />
                                                <span className="text-sm text-slate-700 dark:text-slate-300">{draft.attachment_name ?? __('Fichier joint')}</span>
                                            </div>
                                            <a
                                                href={draft.attachment_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="rounded-lg px-2 py-1 text-sm text-cyan-600 transition-colors hover:bg-cyan-100 dark:text-cyan-400 dark:hover:bg-cyan-950/30"
                                            >
                                                {__('Télécharger')}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Settings (1/3) */}
                    <div className={`space-y-6 ${activeTab !== 'settings' ? 'hidden xl:block' : ''}`}>
                        {/* Message Type Selection - Modern Cards */}
                        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:border-slate-800/50 dark:bg-slate-900/80 sm:p-6">
                            <div className="mb-5 flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-md">
                                    <Sparkles className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                        {__('Paramètres')}
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {__('Personnalisez votre message')}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Message Type - 3D Cards */}
                                <div>
                                    <label className="mb-3 block text-sm font-medium text-slate-700 dark:text-slate-300">
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
                                                    className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all duration-200 hover:scale-105 ${
                                                        isSelected
                                                            ? `border-${option.color}-400 bg-gradient-to-br from-${option.color}-50 to-${option.color}-100 text-${option.color}-700 shadow-lg dark:border-${option.color}-500 dark:from-${option.color}-950/30 dark:to-${option.color}-950/20 dark:text-${option.color}-300`
                                                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400'
                                                    }`}
                                                >
                                                    <Icon className={`h-5 w-5 ${isSelected ? `text-${option.color}-500` : ''}`} />
                                                    <span>{option.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Scheduled Date & Deadline - Modern Inputs */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                            <Calendar className="h-4 w-4 text-cyan-500" />
                                            {__('Envoi programmé')}
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={data.scheduled_at}
                                            onChange={(event) => setData('scheduled_at', event.target.value)}
                                            className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                        />
                                        <InputError message={errors.scheduled_at} className="mt-1" />
                                    </div>

                                    <div>
                                        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                            <Clock className="h-4 w-4 text-cyan-500" />
                                            {__('Date limite de réponse')}
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={data.deadline_reponse}
                                            onChange={(event) => setData('deadline_reponse', event.target.value)}
                                            className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-all focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                        />
                                        <InputError message={errors.deadline_reponse} className="mt-1" />
                                    </div>
                                </div>

                                {/* Checkboxes - Modern Cards */}
                                <div className="space-y-3">
                                    <Checkbox
                                        checked={data.important}
                                        onChange={(val) => setData('important', val)}
                                        label={__('Marquer comme important')}
                                        icon={Flag}
                                        description={__("Le message sera mis en évidence pour les destinataires")}
                                    />

                                    <Checkbox
                                        checked={data.requires_receipt}
                                        onChange={(val) => setData('requires_receipt', val)}
                                        label={__('Demander un accusé de réception')}
                                        icon={Receipt}
                                        description={__("Recevez une notification quand le message est lu")}
                                    />

                                    <Checkbox
                                        checked={data.can_be_redirected}
                                        onChange={(val) => setData('can_be_redirected', val)}
                                        label={__('Autoriser la redirection')}
                                        icon={Share2}
                                        description={__("Permet aux destinataires de rediriger ce message")}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons - Modern Gradient Card */}
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-700 via-cyan-800 to-slate-900 p-5 text-white shadow-xl transition-all duration-300 hover:shadow-2xl sm:p-6">
                            {/* Decorative elements */}
                            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
                            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

                            <div className="relative z-10">
                                <div className="mb-5 flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                                        <Send className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-base font-semibold">{isDraft ? __('Brouillon') : __('Nouveau message')}</p>
                                        <p className="text-xs text-cyan-100/70">{recipientCountText}</p>
                                    </div>
                                </div>

                                {progress && (
                                    <div className="mb-5">
                                        <div className="mb-1 flex items-center justify-between text-xs text-cyan-100">
                                            <span>{__('Téléversement')}</span>
                                            <span>{Math.round(progress.percentage ?? 0)}%</span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-white/20">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-white to-cyan-200 transition-all duration-500"
                                                style={{ width: `${progress.percentage ?? 0}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <button
                                        type="button"
                                        onClick={() => submitWithAction('draft')}
                                        disabled={processing}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 hover:shadow-lg disabled:opacity-50"
                                    >
                                        <Save className="h-4 w-4" />
                                        {processing ? __('Enregistrement...') : __('Sauvegarder en brouillon')}
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 text-sm font-semibold text-cyan-700 shadow-lg transition-all duration-200 hover:bg-cyan-50 hover:shadow-xl disabled:opacity-50"
                                    >
                                        <Send className="h-4 w-4" />
                                        {processing ? __('Envoi en cours...') : isDraft ? __('Envoyer maintenant') : __('Envoyer le message')}
                                    </button>
                                </div>

                                {/* Keyboard shortcut hint */}
                                <p className="mt-4 text-center text-xs text-cyan-200/50">
                                    {__('Ctrl + Enter pour envoyer')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}

// Missing Settings icon import
function Settings(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}
