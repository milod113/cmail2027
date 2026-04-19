import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    BadgeCheck,
    Building2,
    IdCard,
    Mail,
    MapPin,
    MessageSquare,
    Phone,
    ShieldCheck,
    UserRound,
    Send,
    Sparkles,
    Zap,
    Clock,
    AlertCircle,
    CheckCircle2,
    Globe,
    Lock,
    Eye,
    Star,
} from 'lucide-react';

type Contact = {
    id: number;
    name: string;
    username?: string | null;
    email: string;
    is_online: boolean;
    is_blocked: boolean;
    is_favorite: boolean;
    email_verified_at?: string | null;
    department?: {
        id: number;
        name: string;
    } | null;
    role?: {
        id: number;
        nom_role: string;
    } | null;
    profile?: {
        matricule?: string | null;
        grade?: string | null;
        telephone?: string | null;
        adresse?: string | null;
        photo?: string | null;
    } | null;
};

function getStatusBadge(contact: Contact, __: (key: string) => string) {
    if (contact.is_blocked) {
        return {
            label: __('Bloqué'),
            description: __("Ce compte a été bloqué"),
            icon: Lock,
            color: 'rose',
            gradient: 'from-rose-500 to-pink-600',
            className: 'bg-rose-500/15 text-rose-100 border-rose-400/30',
        };
    }

    if (contact.is_online) {
        return {
            label: __('En ligne'),
            description: __("Disponible immédiatement"),
            icon: Zap,
            color: 'emerald',
            gradient: 'from-emerald-500 to-teal-600',
            className: 'bg-emerald-500/15 text-emerald-100 border-emerald-400/30',
        };
    }

    return {
        label: __('Hors ligne'),
        description: __("Non disponible actuellement"),
        icon: Clock,
        color: 'slate',
        gradient: 'from-slate-500 to-gray-600',
        className: 'bg-white/15 text-cyan-100 border-white/20',
    };
}

// Animated status indicator component
function StatusIndicator({ isActive, label }: { isActive: boolean; label: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className={`relative h-2.5 w-2.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                {isActive && (
                    <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-75" />
                )}
            </div>
            <span className="text-xs text-slate-600 dark:text-slate-400">{label}</span>
        </div>
    );
}

export default function ContactsShow({ contact }: { contact: Contact }) {
    const { __ } = useTranslation();
    const profile = contact.profile;
    const badge = getStatusBadge(contact, __);
    const photoUrl = profile?.photo ? `/storage/${profile.photo}` : null;
    const StatusIcon = badge.icon;
    const toggleFavorite = () => {
        if (contact.is_favorite) {
            router.delete(route('contacts.favorite.destroy', contact.id), { preserveScroll: true });
            return;
        }

        router.post(route('contacts.favorite.store', contact.id), {}, { preserveScroll: true });
    };

    const infoItems = [
        { label: __('Email'), value: contact.email, icon: Mail, color: 'cyan' },
        {
            label: __("Nom d'utilisateur"),
            value: contact.username ? `@${contact.username}` : __('Non renseigné'),
            icon: UserRound,
            color: 'blue',
        },
        { label: __('Matricule'), value: profile?.matricule || __('Non renseigné'), icon: IdCard, color: 'purple' },
        { label: __('Grade'), value: profile?.grade || __('Non renseigné'), icon: BadgeCheck, color: 'emerald' },
        { label: __('Téléphone'), value: profile?.telephone || __('Non renseigné'), icon: Phone, color: 'orange' },
        {
            label: __('Département'),
            value: contact.department?.name || __('Aucun département assigné'),
            icon: Building2,
            color: 'indigo',
        },
        {
            label: __('Rôle'),
            value: contact.role?.nom_role || __('Aucun rôle assigné'),
            icon: ShieldCheck,
            color: 'violet',
        },
        { label: __('Adresse'), value: profile?.adresse || __('Non renseignée'), icon: MapPin, color: 'rose' },
    ];

    return (
        <AuthenticatedLayout
            title={__('Profil du contact')}
            description={__('Consultez les informations générales de cet utilisateur.')}
        >
            <Head title={`${__('Profil du contact')} - ${contact.name}`} />

            <div className="space-y-6 lg:space-y-8">
                {/* Hero Section - Enhanced Gradient */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 via-sky-600 to-slate-900 p-8 shadow-2xl shadow-cyan-500/20 lg:p-10">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent" />
                    <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />

                    {/* Animated particles */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute -left-4 top-1/4 h-2 w-2 rounded-full bg-white/20 animate-pulse" />
                        <div className="absolute left-1/3 bottom-1/4 h-1.5 w-1.5 rounded-full bg-white/30 animate-pulse delay-300" />
                        <div className="absolute right-1/4 top-1/3 h-2.5 w-2.5 rounded-full bg-white/15 animate-pulse delay-700" />
                    </div>

                    <div className="relative z-10">
                        <Link
                            href={route('contacts.index')}
                            className="group mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/25 hover:gap-3"
                        >
                            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                            {__('Retour aux contacts')}
                        </Link>

                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-5">
                                {photoUrl ? (
                                    <div className="relative group">
                                        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-400 to-sky-500 opacity-75 blur-lg group-hover:opacity-100 transition duration-500" />
                                        <img
                                            src={photoUrl}
                                            alt={contact.name}
                                            className="relative h-24 w-24 rounded-3xl border-2 border-white/20 object-cover shadow-xl transition-transform duration-300 group-hover:scale-105"
                                        />
                                    </div>
                                ) : (
                                    <div className="relative group">
                                        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-400 to-sky-500 opacity-75 blur-lg group-hover:opacity-100 transition duration-500" />
                                        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-white/20 to-white/5 text-white shadow-xl backdrop-blur-sm transition-transform duration-300 group-hover:scale-105">
                                            <UserRound className="h-10 w-10" />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                        {contact.name}
                                    </h1>
                                    <p className="text-sm text-cyan-100 sm:text-base">
                                        {profile?.grade || contact.role?.nom_role || __('Utilisateur')}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${badge.className}`}>
                                            <StatusIcon className="h-3 w-3" />
                                            {badge.label}
                                        </div>
                                        <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                                            {contact.email_verified_at ? (
                                                <>
                                                    <CheckCircle2 className="h-3 w-3 text-emerald-300" />
                                                    {__('Email vérifié')}
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle className="h-3 w-3 text-amber-300" />
                                                    {__('Email non vérifié')}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-3xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur-md">
                                <p className="text-xs uppercase tracking-[0.3em] text-cyan-100">
                                    {__('Consultation')}
                                </p>
                                <p className="mt-2 text-sm text-white/90">
                                    {__('Cette page affiche les informations en mode lecture seule.')}
                                </p>
                                {contact.is_favorite && (
                                    <p className="text-center text-xs font-semibold text-amber-600 dark:text-amber-300">
                                        {__('Ce contact fait partie de vos favoris.')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
                    {/* Main Content - General Information */}
                    <section className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl dark:border-slate-700/50 dark:bg-slate-900/80">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 shadow-md">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {__('Informations générales')}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    {__('Les détails principaux de ce contact sont affichés ci-dessous.')}
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            {infoItems.map(({ label, value, icon: Icon, color }) => {
                                const colorClasses = {
                                    cyan: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300',
                                    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
                                    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300',
                                    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
                                    orange: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
                                    indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300',
                                    violet: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
                                    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
                                };
                                return (
                                    <div
                                        key={label}
                                        className="group rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 transition-all duration-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/40"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 ${colorClasses[color as keyof typeof colorClasses]}`}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                                                    {label}
                                                </p>
                                                <p className="mt-2 break-words text-sm font-medium text-slate-800 dark:text-slate-100">
                                                    {value}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Sidebar - Status & Actions */}
                    <aside className="space-y-6">
                        {/* Account Status Card - Enhanced */}
                        <section className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl dark:border-slate-700/50 dark:bg-slate-900/80">
                            {/* Decorative gradient background */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${badge.gradient} opacity-5`} />

                            <div className="relative">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${badge.gradient} shadow-md`}>
                                            <StatusIcon className="h-5 w-5 text-white" />
                                        </div>
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                            {__('Statut du compte')}
                                        </h2>
                                    </div>
                                    <div className={`rounded-full px-2 py-1 text-xs font-bold ${badge.className}`}>
                                        {badge.label}
                                    </div>
                                </div>

                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                    {badge.description}
                                </p>

                                {/* Status indicators */}
                                <div className="mt-4 space-y-2">
                                    <StatusIndicator
                                        isActive={contact.is_online && !contact.is_blocked}
                                        label={__("Connecté au système")}
                                    />
                                    <StatusIndicator
                                        isActive={!!contact.email_verified_at}
                                        label={__("Email vérifié")}
                                    />
                                    <StatusIndicator
                                        isActive={!contact.is_blocked}
                                        label={__("Compte actif")}
                                    />
                                </div>

                                {/* Last active placeholder */}
                                <div className="mt-4 rounded-xl bg-slate-100/80 p-3 dark:bg-slate-800/60">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {__("Dernière activité")}
                                    </p>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {contact.is_online ? __("Actuellement en ligne") : __("Il y a quelques minutes")}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Quick Summary Card */}
                        <section className="rounded-3xl border border-white/20 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/80">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                {__('Résumé rapide')}
                            </h2>

                            <div className="mt-5 space-y-4">
                                <div className="group rounded-2xl bg-gradient-to-br from-cyan-50 to-sky-50 p-4 transition-all duration-300 hover:shadow-md dark:from-cyan-500/10 dark:to-sky-500/10">
                                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700 dark:text-cyan-300">
                                        {__('Département')}
                                    </p>
                                    <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                                        {contact.department?.name || __('Non assigné')}
                                    </p>
                                </div>

                                <div className="group rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 p-4 transition-all duration-300 hover:shadow-md dark:from-violet-500/10 dark:to-purple-500/10">
                                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-700 dark:text-violet-300">
                                        {__('Rôle')}
                                    </p>
                                    <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                                        {contact.role?.nom_role || __('Non assigné')}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Contact Action Button - Moved Here, Below Status */}
                        <section className="rounded-3xl border border-white/20 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl dark:border-slate-700/50 dark:bg-slate-900/80">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
                                        <MessageSquare className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 dark:text-white">
                                            {__('Envoyer un message')}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {__("Commencer une conversation")}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={toggleFavorite}
                                    className={`inline-flex w-full items-center justify-center gap-3 rounded-2xl border px-6 py-3 text-sm font-semibold transition-all duration-300 ${
                                        contact.is_favorite
                                            ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'
                                            : 'border-slate-200 bg-white text-slate-700 hover:border-amber-200 hover:text-amber-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                                    }`}
                                >
                                    <Star className={`h-4 w-4 ${contact.is_favorite ? 'fill-current' : ''}`} />
                                    {contact.is_favorite ? __('Retirer des favoris') : __('Ajouter aux favoris')}
                                </button>

                                <Link
                                    href={route('messages.composeparam', { recipient_id: contact.id })}
                                    className="group relative inline-flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-600 px-6 py-4 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                    <Send className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                    {__('Contacter')}
                                    <Sparkles className="h-4 w-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                </Link>

                                <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                                    {__("Cliquez pour envoyer un message à")} <span className="font-medium text-slate-600 dark:text-slate-300">{contact.name}</span>
                                </p>
                            </div>
                        </section>

                        {/* Security Note */}
                        <div className="rounded-2xl border border-amber-200/50 bg-amber-50/50 p-4 backdrop-blur-sm dark:border-amber-500/20 dark:bg-amber-500/5">
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                <div>
                                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                                        {__('Confidentialité')}
                                    </p>
                                    <p className="text-xs text-amber-700/70 dark:text-amber-400/70">
                                        {__('Les messages sont chiffrés de bout en bout')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
