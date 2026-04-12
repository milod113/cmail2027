import Dropdown from '@/Components/Dropdown';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { useTranslation } from '@/Hooks/useTranslation';
import { Link, usePage } from '@inertiajs/react';
import { Moon, Sun } from 'lucide-react';
import { PropsWithChildren, ReactNode, useEffect, useMemo, useState } from 'react';

type LayoutProps = PropsWithChildren<{
    title: string;
    description?: string;
    actions?: ReactNode;
}>;

type NavItem = {
    label: string;
    routeName: string;
    href: string;
    icon: JSX.Element;
};

function SidebarLink({
    item,
    mobile = false,
    onNavigate,
}: {
    item: NavItem;
    mobile?: boolean;
    onNavigate?: () => void;
}) {
    const isActive = route().current(item.routeName);

    return (
        <Link
            href={item.href}
            onClick={onNavigate}
            className={[
                'group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200',
                isActive
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/20'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
                mobile ? 'w-full' : '',
            ].join(' ')}
        >
            <span
                className={
                    isActive
                        ? 'text-white'
                        : 'text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400'
                }
            >
                {item.icon}
            </span>
            <span>{item.label}</span>
        </Link>
    );
}

export default function AuthenticatedLayout({
    title,
    description,
    actions,
    children,
}: LayoutProps) {
    const { auth } = usePage().props as {
        auth: { user: { name: string; email: string } };
    };
    const { __, isRtl } = useTranslation();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const storedTheme = window.localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldUseDark = storedTheme ? storedTheme === 'dark' : prefersDark;

        document.documentElement.classList.toggle('dark', shouldUseDark);
        setDarkMode(shouldUseDark);
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
        window.localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    const navigation = useMemo<NavItem[]>(
        () => [
            {
                label: __('Boîte de réception'),
                routeName: 'messages.inbox',
                href: route('messages.inbox'),
                icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 7.5h18v9a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 16.5v-9Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m3 7.5 8.47 6.352a.9.9 0 001.06 0L21 7.5" />
                    </svg>
                ),
            },
            {
                label: __('Messages envoyés'),
                routeName: 'messages.sent',
                href: route('messages.sent'),
                icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M6 12 3.75 3.75 20.25 12 3.75 20.25 6 12Zm0 0h7.5" />
                    </svg>
                ),
            },
            {
                label: __('Brouillons'),
                routeName: 'drafts.index',
                href: route('drafts.index'),
                icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.971L8.25 19.04 4.5 19.5l.46-3.75L16.862 4.487Z" />
                    </svg>
                ),
            },
            {
                label: __('Rôles'),
                routeName: 'roles.index',
                href: route('roles.index'),
                icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12.75 11.25 15 15 9.75" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3.75 12a8.25 8.25 0 1 0 16.5 0 8.25 8.25 0 0 0-16.5 0Z" />
                    </svg>
                ),
            },
            {
                label: __('Départements'),
                routeName: 'departments.index',
                href: route('departments.index'),
                icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3.75 20.25h16.5" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M5.25 20.25V6.75A2.25 2.25 0 0 1 7.5 4.5h9A2.25 2.25 0 0 1 18.75 6.75v13.5" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 8.25h6M9 12h6M9 15.75h3" />
                    </svg>
                ),
            },
            {
                label: __('Contacts'),
                routeName: 'contacts.index',
                href: route('contacts.index'),
                icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 19.5v-.75A3.75 3.75 0 0011.25 15h-3.5A3.75 3.75 0 004 18.75v.75" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9.5 11.25a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8.25 8.25v-.75A3.75 3.75 0 0015 15.169" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M14.25 5.339a3 3 0 1 1 0 5.822" />
                    </svg>
                ),
            },
            {
                label: __('Archives'),
                routeName: 'messages.archive',
                href: route('messages.archive'),
                icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20.25 7.5v10.125A2.625 2.625 0 0 1 17.625 20.25H6.375A2.625 2.625 0 0 1 3.75 17.625V7.5" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M21 5.25H3m5.25 5.25h7.5" />
                    </svg>
                ),
            },
        ],
        [__],
    );

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(13,148,136,0.14),_transparent_28%),linear-gradient(180deg,#f2f7f7_0%,#f8fafc_50%,#eef6ff_100%)] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.12),_transparent_25%),linear-gradient(180deg,#0f172a_0%,#111827_100%)] dark:text-slate-100">
            <div className="flex min-h-screen">
                <aside className="hidden w-80 shrink-0 border-r border-white/60 bg-white/75 px-6 py-8 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/70 lg:flex lg:flex-col">
                    <Link href={route('messages.inbox')} className="rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-600 via-cyan-600 to-sky-700 px-6 py-6 text-white shadow-2xl shadow-cyan-950/20">
                        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-100">
                            {__('Centre hospitalier')}
                        </div>
                        <div className="mt-3 text-3xl font-semibold">cmail2027</div>
                        <p className="mt-3 max-w-xs text-sm text-cyan-50/90">
                            {__('Plateforme de communication interne pour les départements, les unités et les établissements.')}
                        </p>
                    </Link>

                    <nav className="mt-8 space-y-2">
                        {navigation.map((item) => (
                            <SidebarLink key={item.routeName} item={item} />
                        ))}
                    </nav>

                    <div className="mt-auto rounded-3xl border border-slate-200/70 bg-slate-50/90 p-5 dark:border-slate-800 dark:bg-slate-900/80">
                        <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                            {__('Utilisateur connecté')}
                        </div>
                        <div className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">
                            {auth.user.name}
                        </div>
                        <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {auth.user.email}
                        </div>
                    </div>
                </aside>

                <div className="flex min-w-0 flex-1 flex-col">
                    <header className="border-b border-white/60 bg-white/75 px-4 py-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/60 sm:px-6 lg:px-10">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setMobileOpen((value) => !value)}
                                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 lg:hidden"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d={mobileOpen ? 'M6 18 18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
                                    </svg>
                                </button>

                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-600 dark:text-teal-400">
                                        {__('Messagerie centrale')}
                                    </p>
                                    <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                                        {title}
                                    </h1>
                                    {description ? (
                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                            {description}
                                        </p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="hidden lg:block">
                                    <LanguageSwitcher />
                                </div>

                                {actions}

                                <button
                                    type="button"
                                    onClick={() => setDarkMode((value) => !value)}
                                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-teal-200 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-teal-500/40 dark:hover:text-white"
                                    aria-label="Toggle theme"
                                    title={__('Changer le thème')}
                                >
                                    {darkMode ? (
                                        <Sun className="h-5 w-5" />
                                    ) : (
                                        <Moon className="h-5 w-5" />
                                    )}
                                </button>

                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-teal-200 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                                        >
                                            <span className="hidden sm:inline">{auth.user.name}</span>
                                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-sm font-semibold text-white">
                                                {auth.user.name.charAt(0).toUpperCase()}
                                            </span>
                                        </button>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content align={isRtl ? 'left' : 'right'} width="48">
                                        <Dropdown.Link href={route('profile.edit')}>
                                            {__('Profil')}
                                        </Dropdown.Link>
                                        <Dropdown.Link href={route('logout')} method="post" as="button">
                                            {__('Déconnexion')}
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        {mobileOpen ? (
                            <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900 lg:hidden">
                                <div className="mb-3 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setDarkMode((value) => !value)}
                                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-teal-200 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-teal-500/40 dark:hover:text-white"
                                        aria-label={__('Changer le thème')}
                                    >
                                        {darkMode ? (
                                            <Sun className="h-5 w-5" />
                                        ) : (
                                            <Moon className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                                <div className="mb-4 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-700 px-4 py-4 text-white">
                                    <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100">
                                        cmail2027
                                    </div>
                                    <div className="mt-2 text-lg font-semibold">{auth.user.name}</div>
                                </div>
                                <div className="mb-4">
                                    <LanguageSwitcher />
                                </div>
                                <nav className="space-y-2">
                                    {navigation.map((item) => (
                                        <SidebarLink
                                            key={item.routeName}
                                            item={item}
                                            mobile
                                            onNavigate={() => setMobileOpen(false)}
                                        />
                                    ))}
                                </nav>
                            </div>
                        ) : null}
                    </header>

                    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
