import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import { PageProps } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { User, Lock, Trash2, Mail, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { useState, useEffect } from 'react';

export default function Edit({
    mustVerifyEmail,
    status,
    profile,
}: PageProps<{ mustVerifyEmail: boolean; status?: string; profile: any }>) {
    const { __ } = useTranslation();
    const { flash } = usePage().props as any;
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

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

    return (
        <AuthenticatedLayout
            title={__('Profil')}
            description={__('Gerez les parametres personnels de votre compte.')}
        >
            <Head title={__('Profil')} />

            {/* Animated Gradient Header */}
            <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 via-sky-600 to-slate-900 p-8 shadow-2xl shadow-cyan-500/20 lg:mb-10">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent" />
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-pulse" />
                <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl animate-pulse delay-1000" />
                <div className="absolute right-1/3 top-1/2 h-48 w-48 rounded-full bg-sky-400/10 blur-3xl animate-pulse delay-700" />
                
                {/* Floating Particles */}
                <div className="absolute inset-0 overflow-hidden">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute rounded-full bg-white/5"
                            style={{
                                width: `${Math.random() * 100 + 20}px`,
                                height: `${Math.random() * 100 + 20}px`,
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animation: `float ${Math.random() * 10 + 10}s infinite ease-in-out`,
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                            <Shield className="h-3 w-3" />
                            {__('Compte securise')}
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                            {__('Mon Profil')}
                        </h1>
                        <p className="text-sm text-cyan-100 sm:text-base">
                            {__('Gerez vos informations personnelles et les parametres de votre compte')}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-md">
                            {profile?.grade || __('Utilisateur')}
                        </div>
                        {profile?.email_verified_at && (
                            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1.5 text-xs text-emerald-100 backdrop-blur-sm">
                                <CheckCircle className="h-3 w-3" />
                                {__('Verifie')}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Success Toast Notification */}
            {showSuccess && (
                <div className="fixed right-4 top-20 z-50 animate-in slide-in-from-top-2 fade-in duration-300 sm:right-6 lg:right-8">
                    <div className="flex items-center gap-3 rounded-2xl bg-emerald-500 px-4 py-3 text-white shadow-xl shadow-emerald-500/20 backdrop-blur-sm">
                        <CheckCircle className="h-5 w-5" />
                        <p className="text-sm font-medium">{successMessage}</p>
                    </div>
                </div>
            )}

            <div className="space-y-6 lg:space-y-8">
                {/* Profile Information Card */}
                <div className="group relative overflow-hidden rounded-3xl border border-white/20 bg-white/80 shadow-xl shadow-slate-200/40 backdrop-blur-xl transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/10 dark:border-slate-700/50 dark:bg-slate-900/80 dark:shadow-slate-950/50">
                    {/* Hover Gradient Border Effect */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/0 to-sky-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    
                    <div className="relative p-5 sm:p-7 lg:p-8">
                        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                                    <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-sky-700 text-white shadow-lg sm:h-14 sm:w-14">
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
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Mail className="h-3.5 w-3.5" />
                                <span>{profile?.email}</span>
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

                {/* Security Card */}
                <div className="group relative overflow-hidden rounded-3xl border border-white/20 bg-white/80 shadow-xl shadow-slate-200/40 backdrop-blur-xl transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/10 dark:border-slate-700/50 dark:bg-slate-900/80 dark:shadow-slate-950/50">
                    <div className="relative p-5 sm:p-7 lg:p-8">
                        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                                    <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-sky-700 text-white shadow-lg sm:h-14 sm:w-14">
                                        <Lock className="h-6 w-6 sm:h-7 sm:w-7" />
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
                            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                <Shield className="h-3 w-3" />
                                {__('Recommande')}
                            </div>
                        </div>
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>
                </div>

                {/* Danger Zone Card */}
                <div className="group relative overflow-hidden rounded-3xl border border-red-200/50 bg-red-50/50 shadow-xl shadow-red-200/20 backdrop-blur-xl transition-all duration-500 hover:shadow-2xl hover:shadow-red-300/30 dark:border-red-900/30 dark:bg-red-950/20">
                    <div className="relative p-5 sm:p-7 lg:p-8">
                        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
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
                                <AlertTriangle className="h-3 w-3" />
                                {__('Irreversible')}
                            </div>
                        </div>
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>

            {/* Add custom animations */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) translateX(0px); }
                    50% { transform: translateY(-20px) translateX(10px); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(1.05); }
                }
                .animate-pulse {
                    animation: pulse 3s ease-in-out infinite;
                }
                .delay-1000 {
                    animation-delay: 1s;
                }
                .delay-700 {
                    animation-delay: 0.7s;
                }
            `}</style>
        </AuthenticatedLayout>
    );
}

