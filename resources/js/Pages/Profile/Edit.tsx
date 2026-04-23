import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import { PageProps } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { User, Lock, Trash2, Mail, Shield, AlertTriangle, CheckCircle, Bell, Clock, Fingerprint, Award, Crown, Sparkles, Settings, Globe, Moon, Sun, MessageSquare, CheckCircle2 } from 'lucide-react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import SignatureSettings from '@/Components/SignatureSettings';
import UpdateOutOfOfficeSettingsForm from './Partials/UpdateOutOfOfficeSettingsForm';
import UpdateEscalationSettingsForm from './Partials/UpdateEscalationSettingsForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { useState, useEffect } from 'react';

export default function Edit({
    mustVerifyEmail,
    status,
    profile,
    userSettings,
    colleagues,
}: PageProps<{ mustVerifyEmail: boolean; status?: string; profile: any; userSettings: any; colleagues: any[] }>) {
    const { __ } = useTranslation();
    const { flash } = usePage().props as any;
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [activeSection, setActiveSection] = useState('profile');

    useEffect(() => {
        if (flash?.success) {
            setSuccessMessage(flash.success);
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [flash?.success]);

    useEffect(() => {
        if (status === 'verification-link-sent') {
            setSuccessMessage(__('Un nouveau lien de verification a ete envoye a votre adresse email.'));
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    const sections = [
        { id: 'profile', label: __('Profil'), icon: User, color: 'from-cyan-500 to-sky-600' },
        { id: 'absence', label: __('Absence'), icon: Clock, color: 'from-emerald-500 to-teal-600' },
        { id: 'escalation', label: __('Escalade'), icon: Bell, color: 'from-rose-500 to-orange-600' },
        { id: 'signature', label: __('Signature'), icon: MessageSquare, color: 'from-blue-500 to-indigo-600' },
        { id: 'security', label: __('Securite'), icon: Lock, color: 'from-violet-500 to-purple-600' },
        { id: 'danger', label: __('Danger'), icon: AlertTriangle, color: 'from-red-500 to-rose-600' },
    ];

    const scrollToSection = (sectionId: string) => {
        setActiveSection(sectionId);
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            const sections = document.querySelectorAll('[data-section]');
            let current = '';
            sections.forEach((section) => {
                const sectionTop = (section as HTMLElement).offsetTop;
                const sectionHeight = (section as HTMLElement).clientHeight;
                if (window.scrollY >= sectionTop - 200) {
                    current = section.getAttribute('data-section') || '';
                }
            });
            if (current) setActiveSection(current);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <AuthenticatedLayout
            title={__('Profil')}
            description={__('Gerez les parametres personnels de votre compte.')}
        >
            <Head title={__('Profil')} />

            {/* Hero Section with Animated Gradient */}
            <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-2xl lg:mb-12 lg:p-10">
                {/* Animated Background */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -right-1/2 -top-1/2 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-cyan-500/20 to-sky-500/20 blur-3xl animate-[pulse_6s_ease-in-out_infinite]" />
                    <div className="absolute -bottom-1/2 -left-1/2 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 blur-3xl animate-[pulse_6s_ease-in-out_infinite_1s]" />
                    <div className="absolute left-1/3 top-1/2 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl animate-[pulse_8s_ease-in-out_infinite_2s]" />

                    {/* Floating Particles */}
                    {[...Array(12)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute rounded-full bg-white/5"
                            style={{
                                width: `${Math.random() * 100 + 20}px`,
                                height: `${Math.random() * 100 + 20}px`,
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animation: `float ${Math.random() * 15 + 10}s infinite ease-in-out`,
                                animationDelay: `${Math.random() * 5}s`,
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-3">
                        <div className="inline-flex flex-wrap items-center gap-2">
                            <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                                <div className="flex items-center gap-1.5">
                                    <Shield className="h-3 w-3" />
                                    {__('Compte securise')}
                                </div>
                            </div>
                            {profile?.email_verified_at && (
                                <div className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-100 backdrop-blur-sm">
                                    <div className="flex items-center gap-1.5">
                                        <CheckCircle className="h-3 w-3" />
                                        {__('Verifie')}
                                    </div>
                                </div>
                            )}
                        </div>

                        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
                            {__('Mon Profil')}
                        </h1>

                        <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
                            {__('Gerez vos informations personnelles et les parametres de votre compte')}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-md">
                            <div className="flex items-center gap-2">
                                <Award className="h-4 w-4" />
                                {profile?.grade || __('Utilisateur')}
                            </div>
                        </div>
                        <div className="rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
                            <div className="flex items-center gap-2">
                                <Crown className="h-4 w-4" />
                                {profile?.role || __('Membre')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="relative z-10 mt-8 grid grid-cols-2 gap-3 border-t border-white/10 pt-6 sm:grid-cols-4 lg:mt-10">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-white">{profile?.posts_count || 0}</p>
                        <p className="text-xs text-slate-400">{__('Publications')}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-white">{profile?.comments_count || 0}</p>
                        <p className="text-xs text-slate-400">{__('Commentaires')}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-white">{profile?.likes_received || 0}</p>
                        <p className="text-xs text-slate-400">{__('J\'aime recus')}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-white">{profile?.member_since || '2024'}</p>
                        <p className="text-xs text-slate-400">{__('Membre depuis')}</p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs - Mobile Scrollable */}
            <div className="sticky top-16 z-40 mb-6 overflow-x-auto rounded-2xl bg-white/80 backdrop-blur-xl shadow-lg dark:bg-slate-900/80 lg:mb-8">
                <div className="flex min-w-max gap-1 p-1 lg:min-w-0 lg:justify-between">
                    {sections.map((section) => {
                        const Icon = section.icon;
                        return (
                            <button
                                key={section.id}
                                onClick={() => scrollToSection(section.id)}
                                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 lg:px-6 ${
                                    activeSection === section.id
                                        ? `bg-gradient-to-r ${section.color} text-white shadow-lg scale-105`
                                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                <span className="hidden sm:inline">{section.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Success Toast Notification */}
            {showSuccess && (
                <div className="fixed right-4 top-24 z-50 animate-in slide-in-from-top-2 fade-in duration-300 sm:right-6 lg:right-8">
                    <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3.5 text-white shadow-2xl shadow-emerald-500/30 backdrop-blur-sm">
                        <CheckCircle className="h-5 w-5 animate-bounce" />
                        <p className="text-sm font-medium">{successMessage}</p>
                    </div>
                </div>
            )}

            <div className="space-y-6 lg:space-y-8">
                {/* Profile Information Section */}
                <section id="profile" data-section="profile" className="scroll-mt-20">
                    <div className="group relative overflow-hidden rounded-3xl border border-slate-200/50 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/10 dark:border-slate-700/50 dark:bg-slate-900/90 dark:shadow-slate-950/50">
                        {/* Animated Border Gradient */}
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/0 to-sky-500/0 opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:from-cyan-500/20 group-hover:via-sky-500/20 group-hover:to-cyan-500/20" />

                        <div className="relative p-5 sm:p-7 lg:p-8">
                            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 blur-lg opacity-50 transition-opacity group-hover:opacity-75" />
                                        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 text-white shadow-lg sm:h-14 sm:w-14">
                                            <User className="h-6 w-6 sm:h-7 sm:w-7" />
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 sm:text-2xl">
                                            {__('Informations du profil')}
                                        </h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {__('Mettez a jour vos informations personnelles')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                    <Mail className="h-3.5 w-3.5" />
                                    <span className="truncate max-w-[200px]">{profile?.email}</span>
                                </div>
                            </div>
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                                profile={profile}
                                success={flash?.success}
                                className="max-w-xl"
                            />
                        </div>
                    </div>
                </section>

                {/* Out of Office Section */}
                <section id="absence" data-section="absence" className="scroll-mt-20">
                    <div className="group relative overflow-hidden rounded-3xl border border-slate-200/50 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/10 dark:border-slate-700/50 dark:bg-slate-900/90 dark:shadow-slate-950/50">
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/0 via-teal-500/0 to-emerald-500/0 opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:from-emerald-500/20 group-hover:via-teal-500/20 group-hover:to-emerald-500/20" />

                        <div className="relative p-5 sm:p-7 lg:p-8">
                            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 blur-lg opacity-50 transition-opacity group-hover:opacity-75" />
                                        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg sm:h-14 sm:w-14">
                                            <Bell className="h-6 w-6 sm:h-7 sm:w-7" />
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 sm:text-2xl">
                                            {__('Absence et delegation')}
                                        </h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {__('Definissez votre message d’absence et votre remplaçant.')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                    <Clock className="h-3 w-3" />
                                    {__('Parametres avances')}
                                </div>
                            </div>
                            <UpdateOutOfOfficeSettingsForm
                                settings={userSettings}
                                colleagues={colleagues}
                                className="max-w-xl"
                            />
                        </div>
                    </div>
                </section>

                <section id="escalation" data-section="escalation" className="scroll-mt-20">
                    <div className="group relative overflow-hidden rounded-3xl border border-slate-200/50 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl transition-all duration-500 hover:shadow-2xl hover:shadow-rose-500/10 dark:border-slate-700/50 dark:bg-slate-900/90 dark:shadow-slate-950/50">
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-rose-500/0 via-orange-500/0 to-rose-500/0 opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:from-rose-500/20 group-hover:via-orange-500/20 group-hover:to-rose-500/20" />

                        <div className="relative p-5 sm:p-7 lg:p-8">
                            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-600 blur-lg opacity-50 transition-opacity group-hover:opacity-75" />
                                        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-600 text-white shadow-lg sm:h-14 sm:w-14">
                                            <Bell className="h-6 w-6 sm:h-7 sm:w-7" />
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 sm:text-2xl">
                                            {__('Escalade automatique')}
                                        </h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {__('Choisissez un collegue de secours et le delai avant transfert automatique.')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400">
                                    <Bell className="h-3 w-3" />
                                    {__('Suivi automatique')}
                                </div>
                            </div>
                            <UpdateEscalationSettingsForm
                                settings={userSettings}
                                colleagues={colleagues}
                                className="max-w-xl"
                            />
                        </div>
                    </div>
                </section>

                {/* Signature Section */}
                <section id="signature" data-section="signature" className="scroll-mt-20">
                    <div className="group relative overflow-hidden rounded-3xl border border-slate-200/50 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 dark:border-slate-700/50 dark:bg-slate-900/90 dark:shadow-slate-950/50">
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/0 via-indigo-500/0 to-blue-500/0 opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:from-blue-500/10 group-hover:via-indigo-500/10 group-hover:to-blue-500/10" />
                        <div className="relative p-5 sm:p-7 lg:p-8">
                            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 blur-lg opacity-50 transition-opacity group-hover:opacity-75" />
                                        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg sm:h-14 sm:w-14">
                                            <MessageSquare className="h-6 w-6 sm:h-7 sm:w-7" />
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 sm:text-2xl">
                                            {__('Signature automatique')}
                                        </h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {__('Ajoutez une signature qui sera automatiquement inseree au bas de vos messages.')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {__('Efficace et professionnel')}
                                </div>
                            </div>
                            <SignatureSettings settings={userSettings} profile={profile} />
                        </div>
                    </div>
                </section>

                {/* Security Section */}
                <section id="security" data-section="security" className="scroll-mt-20">
                    <div className="group relative overflow-hidden rounded-3xl border border-slate-200/50 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl transition-all duration-500 hover:shadow-2xl hover:shadow-violet-500/10 dark:border-slate-700/50 dark:bg-slate-900/90 dark:shadow-slate-950/50">
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-violet-500/0 via-purple-500/0 to-violet-500/0 opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:from-violet-500/20 group-hover:via-purple-500/20 group-hover:to-violet-500/20" />

                        <div className="relative p-5 sm:p-7 lg:p-8">
                            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 blur-lg opacity-50 transition-opacity group-hover:opacity-75" />
                                        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg sm:h-14 sm:w-14">
                                            <Fingerprint className="h-6 w-6 sm:h-7 sm:w-7" />
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 sm:text-2xl">
                                            {__('Securite')}
                                        </h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {__('Protegez votre compte avec un mot de passe fort')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-600 dark:text-violet-400">
                                    <Shield className="h-3 w-3" />
                                    {__('Recommandation forte')}
                                </div>
                            </div>
                            <UpdatePasswordForm className="max-w-xl" />

                            {/* 2FA Coming Soon Badge */}
                            <div className="mt-6 flex items-center gap-3 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 p-3 dark:from-violet-950/30 dark:to-purple-950/30">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                                    <Globe className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-violet-700 dark:text-violet-300">
                                        {__('Authentification a deux facteurs')}
                                    </p>
                                    <p className="text-xs text-violet-600/70 dark:text-violet-400/70">
                                        {__('Bientot disponible pour plus de securite')}
                                    </p>
                                </div>
                                <div className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
                                    {__('Bientot')}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Danger Zone Section */}
                <section id="danger" data-section="danger" className="scroll-mt-20">
                    <div className="group relative overflow-hidden rounded-3xl border border-red-200/50 bg-gradient-to-br from-red-50/90 to-rose-50/90 shadow-xl shadow-red-200/20 backdrop-blur-xl transition-all duration-500 hover:shadow-2xl hover:shadow-red-300/30 dark:border-red-900/30 dark:from-red-950/30 dark:to-rose-950/30">
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-red-500/0 via-rose-500/0 to-red-500/0 opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:from-red-500/10 group-hover:via-rose-500/10 group-hover:to-red-500/10" />

                        <div className="relative p-5 sm:p-7 lg:p-8">
                            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 blur-lg opacity-50 transition-opacity group-hover:opacity-75" />
                                        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg sm:h-14 sm:w-14">
                                            <Trash2 className="h-6 w-6 sm:h-7 sm:w-7" />
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-red-700 dark:text-red-400 sm:text-2xl">
                                            {__('Zone dangereuse')}
                                        </h2>
                                        <p className="text-sm text-red-600/70 dark:text-red-400/70">
                                            {__('Actions irreversibles - Suppression definitive du compte')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400">
                                    <AlertTriangle className="h-3 w-3 animate-pulse" />
                                    {__('Irreversible')}
                                </div>
                            </div>
                            <DeleteUserForm className="max-w-xl" />
                        </div>
                    </div>
                </section>
            </div>

            {/* Custom Animations */}
            <style>{`
                @keyframes float {
                    0%, 100% {
                        transform: translateY(0px) translateX(0px) rotate(0deg);
                    }
                    25% {
                        transform: translateY(-15px) translateX(10px) rotate(5deg);
                    }
                    50% {
                        transform: translateY(-30px) translateX(-5px) rotate(-3deg);
                    }
                    75% {
                        transform: translateY(-10px) translateX(15px) rotate(2deg);
                    }
                }

                @keyframes pulse {
                    0%, 100% {
                        opacity: 0.3;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.7;
                        transform: scale(1.1);
                    }
                }

                @keyframes slideInFromTop {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-in {
                    animation: slideInFromTop 0.3s ease-out;
                }

                .animate-pulse {
                    animation: pulse 3s ease-in-out infinite;
                }

                .scroll-mt-20 {
                    scroll-margin-top: 5rem;
                }

                /* Smooth scrolling */
                html {
                    scroll-behavior: smooth;
                }

                /* Custom scrollbar */
                ::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }

                ::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.05);
                    border-radius: 10px;
                }

                ::-webkit-scrollbar-thumb {
                    background: linear-gradient(to bottom, #06b6d4, #0ea5e9);
                    border-radius: 10px;
                }

                ::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(to bottom, #0891b2, #0284c7);
                }

                .dark ::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                }

                /* Responsive adjustments */
                @media (max-width: 640px) {
                    .sticky {
                        top: 4rem;
                    }
                }
            `}</style>
        </AuthenticatedLayout>
    );
}
