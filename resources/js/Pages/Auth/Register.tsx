import InputError from '@/Components/InputError';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { useTranslation } from '@/Hooks/useTranslation';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    Lock,
    Mail,
    MessageCircleMore,
    Shield,
    User,
    UserPlus,
} from 'lucide-react';
import { FormEventHandler } from 'react';

export default function Register() {
    const { __ } = useTranslation();
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title={__('Créer un compte')} />

            <div className="min-h-screen bg-white text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-100">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,#ecfeff_0%,#ffffff_55%,#e0f2fe_100%)] dark:bg-[linear-gradient(135deg,#082f49_0%,#0f172a_72%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(8,145,178,0.14),transparent_25%)]" />

                <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
                    <header className="flex items-center justify-between gap-4">
                        <Link href="/" className="flex items-center gap-3 text-2xl font-bold text-cyan-700 dark:text-cyan-100">
                            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 via-sky-700 to-slate-900 text-white shadow-lg shadow-cyan-900/25">
                                <MessageCircleMore className="h-6 w-6" />
                            </span>
                            <span>Cmail</span>
                        </Link>

                        <Link
                            href={route('login')}
                            className="inline-flex items-center justify-center rounded-xl border-2 border-cyan-600 px-5 py-3 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-600 hover:text-white dark:border-cyan-300 dark:text-cyan-300 dark:hover:bg-cyan-300 dark:hover:text-slate-950"
                        >
                            {__('Connexion')}
                        </Link>
                    </header>

                    <div className="mt-4 flex justify-end">
                        <LanguageSwitcher />
                    </div>

                    <main className="flex flex-1 items-center py-10">
                        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
                            <section className="hidden lg:block">
                                <div className="max-w-xl">
                                    <div className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-4 py-2 text-sm font-semibold text-cyan-800 shadow-sm dark:bg-cyan-500/20 dark:text-cyan-300">
                                        <Shield className="h-4 w-4" />
                                        {__('Expérience Cmail unifiée')}
                                    </div>

                                    <h1 className="mt-6 bg-gradient-to-r from-slate-800 via-cyan-600 to-sky-700 bg-clip-text text-5xl font-extrabold leading-tight text-transparent dark:from-slate-50 dark:to-cyan-300">
                                        {__('Créez votre accès et rejoignez l’espace de communication hospitalière.')}
                                    </h1>

                                    <p className="mt-6 text-lg leading-8 text-slate-500 dark:text-slate-300">
                                        {__('Une inscription simple, dans la même identité bleue que le reste de l’application, pour garder une expérience claire et cohérente.')}
                                    </p>
                                </div>
                            </section>

                            <section className="mx-auto w-full max-w-xl">
                                <div className="overflow-hidden rounded-[2rem] border border-cyan-100 bg-white/90 shadow-[0_30px_60px_-25px_rgba(15,23,42,0.22)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-[0_30px_60px_-25px_rgba(0,0,0,0.5)]">
                                    <div className="bg-gradient-to-r from-cyan-600 via-sky-700 to-slate-900 px-8 py-7 text-white">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                                                <UserPlus className="h-6 w-6" />
                                            </span>
                                            <div>
                                                <h2 className="text-2xl font-bold">{__('Créer un compte')}</h2>
                                                <p className="text-sm text-cyan-50/90">
                                                    {__('Rejoignez votre espace Cmail.')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-8 py-8">
                                        <form onSubmit={submit} className="space-y-6">
                                            <div>
                                                <label htmlFor="name" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                    {__('Nom')}
                                                </label>
                                                <div className="relative">
                                                    <User className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        id="name"
                                                        name="name"
                                                        value={data.name}
                                                        autoComplete="name"
                                                        autoFocus
                                                        required
                                                        onChange={(e) => setData('name', e.target.value)}
                                                        className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 pe-4 ps-12 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                                                    />
                                                </div>
                                                <InputError message={errors.name} className="mt-2" />
                                            </div>

                                            <div>
                                                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                    {__('Email')}
                                                </label>
                                                <div className="relative">
                                                    <Mail className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        id="email"
                                                        type="email"
                                                        name="email"
                                                        value={data.email}
                                                        autoComplete="username"
                                                        required
                                                        onChange={(e) => setData('email', e.target.value)}
                                                        className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 pe-4 ps-12 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                                                    />
                                                </div>
                                                <InputError message={errors.email} className="mt-2" />
                                            </div>

                                            <div>
                                                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                    {__('Mot de passe')}
                                                </label>
                                                <div className="relative">
                                                    <Lock className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        id="password"
                                                        type="password"
                                                        name="password"
                                                        value={data.password}
                                                        autoComplete="new-password"
                                                        required
                                                        onChange={(e) => setData('password', e.target.value)}
                                                        className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 pe-4 ps-12 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                                                    />
                                                </div>
                                                <InputError message={errors.password} className="mt-2" />
                                            </div>

                                            <div>
                                                <label htmlFor="password_confirmation" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                    {__('Confirmer le mot de passe')}
                                                </label>
                                                <div className="relative">
                                                    <Lock className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        id="password_confirmation"
                                                        type="password"
                                                        name="password_confirmation"
                                                        value={data.password_confirmation}
                                                        autoComplete="new-password"
                                                        required
                                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                                        className="block w-full rounded-2xl border border-cyan-100 bg-cyan-50/40 py-3.5 pe-4 ps-12 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-cyan-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:border-cyan-300 dark:focus:ring-cyan-300"
                                                    />
                                                </div>
                                                <InputError message={errors.password_confirmation} className="mt-2" />
                                            </div>

                                            <div className="flex items-center justify-between gap-4">
                                                <Link
                                                    href={route('login')}
                                                    className="text-sm font-medium text-cyan-700 underline-offset-4 transition hover:underline dark:text-cyan-300"
                                                >
                                                    {__('Déjà inscrit ?')}
                                                </Link>

                                                <button
                                                    type="submit"
                                                    disabled={processing}
                                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 via-sky-700 to-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-900/20 transition hover:-translate-y-0.5 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
                                                >
                                                    <UserPlus className="h-5 w-5" />
                                                    {__('Créer un compte')}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
