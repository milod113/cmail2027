import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    BadgeCheck,
    Building2,
    IdCard,
    Mail,
    MapPin,
    Phone,
    ShieldCheck,
    UserRound,
} from 'lucide-react';

type Contact = {
    id: number;
    name: string;
    username?: string | null;
    email: string;
    is_online: boolean;
    is_blocked: boolean;
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
            label: __('Blocked'),
            className: 'bg-rose-500/15 text-rose-100',
        };
    }

    if (contact.is_online) {
        return {
            label: __('Online'),
            className: 'bg-emerald-500/15 text-emerald-100',
        };
    }

    return {
        label: __('Offline'),
        className: 'bg-white/15 text-cyan-100',
    };
}

export default function ContactsShow({ contact }: { contact: Contact }) {
    const { __ } = useTranslation();
    const profile = contact.profile;
    const badge = getStatusBadge(contact, __);
    const photoUrl = profile?.photo ? `/storage/${profile.photo}` : null;

    const infoItems = [
        { label: __('Email'), value: contact.email, icon: Mail },
        {
            label: __('Username'),
            value: contact.username ? `@${contact.username}` : __('Not provided'),
            icon: UserRound,
        },
        { label: __('Matricule'), value: profile?.matricule || __('Not provided'), icon: IdCard },
        { label: __('Grade'), value: profile?.grade || __('Not provided'), icon: BadgeCheck },
        { label: __('Phone'), value: profile?.telephone || __('Not provided'), icon: Phone },
        {
            label: __('Department'),
            value: contact.department?.name || __('No department assigned'),
            icon: Building2,
        },
        {
            label: __('Role'),
            value: contact.role?.nom_role || __('No role assigned'),
            icon: ShieldCheck,
        },
        { label: __('Address'), value: profile?.adresse || __('Not provided'), icon: MapPin },
    ];

    return (
        <AuthenticatedLayout
            title={__('Contact profile')}
            description={__('View general information for this user.')}
        >
            <Head title={`${__('Contact profile')} - ${contact.name}`} />

            <div className="space-y-6 lg:space-y-8">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 via-sky-600 to-slate-900 p-8 shadow-2xl shadow-cyan-500/20 lg:p-10">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent" />
                    <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />

                    <div className="relative z-10">
                        <Link
                            href={route('contacts.index')}
                            className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {__('Back to contacts')}
                        </Link>

                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-5">
                                {photoUrl ? (
                                    <img
                                        src={photoUrl}
                                        alt={contact.name}
                                        className="h-24 w-24 rounded-3xl border border-white/20 object-cover shadow-xl"
                                    />
                                ) : (
                                    <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/10 text-white shadow-xl backdrop-blur-sm">
                                        <UserRound className="h-10 w-10" />
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
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
                                            {badge.label}
                                        </span>
                                        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                                            {contact.email_verified_at ? __('Verified email') : __('Unverified email')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-3xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur-md">
                                <p className="text-xs uppercase tracking-[0.3em] text-cyan-100">
                                    {__('Contact view')}
                                </p>
                                <p className="mt-2 text-sm text-white/90">
                                    {__('This page shows profile information in read-only mode.')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
                    <section className="rounded-3xl border border-white/20 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/80">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {__('General information')}
                            </h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {__('Main details for this contact are shown here in read-only mode.')}
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            {infoItems.map(({ label, value, icon: Icon }) => (
                                <div
                                    key={label}
                                    className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
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
                            ))}
                        </div>
                    </section>

                    <aside className="space-y-6">
                        <section className="rounded-3xl border border-white/20 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/80">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                {__('Quick summary')}
                            </h2>

                            <div className="mt-5 space-y-4">
                                <div className="rounded-2xl bg-cyan-50/80 p-4 dark:bg-cyan-500/10">
                                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700 dark:text-cyan-300">
                                        {__('Department')}
                                    </p>
                                    <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                                        {contact.department?.name || __('Not assigned')}
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-slate-100/80 p-4 dark:bg-slate-800/60">
                                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                                        {__('Role')}
                                    </p>
                                    <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                                        {contact.role?.nom_role || __('Not assigned')}
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-emerald-50/80 p-4 dark:bg-emerald-500/10">
                                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">
                                        {__('Account status')}
                                    </p>
                                    <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                                        {contact.is_blocked
                                            ? __('Blocked account')
                                            : contact.is_online
                                              ? __('Currently online')
                                              : __('Currently offline')}
                                    </p>
                                </div>
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
