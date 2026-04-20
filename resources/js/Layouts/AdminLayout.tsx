import { PropsWithChildren, ReactNode } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import {
    LayoutDashboard,
    Users,
    Building2,
    LifeBuoy,
    ShieldCheck,
    Flag,
    ArrowLeft,
    FileText,
} from 'lucide-react';

type AdminLayoutProps = PropsWithChildren<{
    title: string;
    description?: string;
    actions?: ReactNode;
}>;

type AdminNavItem = {
    label: string;
    routeName: string;
    href: string;
    icon: JSX.Element;
};

function AdminNavLink({ item }: { item: AdminNavItem }) {
    const active = route().current(item.routeName);

    return (
        <Link
            href={item.href}
            className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                active
                    ? 'bg-cyan-50 text-cyan-700 shadow-sm dark:bg-cyan-500/15 dark:text-cyan-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
        >
            <span
                className={`${
                    active ? 'text-cyan-600 dark:text-cyan-300' : 'text-slate-400 group-hover:text-cyan-500'
                }`}
            >
                {item.icon}
            </span>
            <span>{item.label}</span>
        </Link>
    );
}

export default function AdminLayout({ title, description, actions, children }: AdminLayoutProps) {
    const { auth } = usePage<PageProps>().props;

    const navigation: AdminNavItem[] = [
        {
            label: 'Dashboard',
            routeName: 'admin.dashboard',
            href: route('admin.dashboard'),
            icon: <LayoutDashboard className="h-4.5 w-4.5" />,
        },
        {
            label: 'Utilisateurs',
            routeName: 'admin.users.index',
            href: route('admin.users.index'),
            icon: <Users className="h-4.5 w-4.5" />,
        },
        {
            label: 'Roles',
            routeName: 'roles.index',
            href: route('roles.index'),
            icon: <ShieldCheck className="h-4.5 w-4.5" />,
        },
        {
            label: 'Departements',
            routeName: 'departments.index',
            href: route('departments.index'),
            icon: <Building2 className="h-4.5 w-4.5" />,
        },
        {
            label: 'Support',
            routeName: 'admin.support.index',
            href: route('admin.support.index'),
            icon: <LifeBuoy className="h-4.5 w-4.5" />,
        },
        {
            label: 'Signalements',
            routeName: 'admin.reports.index',
            href: route('admin.reports.index'),
            icon: <Flag className="h-4.5 w-4.5" />,
        },
        {
            label: 'Audit',
            routeName: 'admin.audit.messages',
            href: route('admin.audit.messages'),
            icon: <ShieldCheck className="h-4.5 w-4.5" />,
        },
        {
            label: 'Publications',
            routeName: 'admin.publications.index',
            href: route('admin.publications.index'),
            icon: <FileText className="h-4.5 w-4.5" />,
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <Head title={title} />

            <div className="mx-auto flex min-h-screen w-full max-w-[1680px]">
                <aside className="hidden w-72 shrink-0 border-r border-slate-200/70 bg-white/90 px-4 py-5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 lg:flex lg:flex-col">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600">Admin Panel</p>
                        <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">Cmail 2027</h2>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Administration hospitaliere</p>
                    </div>

                    <nav className="mt-5 space-y-1">
                        {navigation.map((item) => (
                            <AdminNavLink key={item.routeName} item={item} />
                        ))}
                    </nav>

                    <div className="mt-auto space-y-3 pt-5">
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Connecte en tant que</p>
                            <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">{auth.user.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{auth.user.email}</p>
                        </div>
                        <Link
                            href={route('dashboard')}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Retour a l'application
                        </Link>
                    </div>
                </aside>

                <div className="flex min-w-0 flex-1 flex-col">
                    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/95 px-4 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 sm:px-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600">Administration</p>
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
                                {description ? (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
                                ) : null}
                            </div>
                            {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
                        </div>
                    </header>

                    <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
                </div>
            </div>
        </div>
    );
}
