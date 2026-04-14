import { InertiaLinkProps, Link } from '@inertiajs/react';

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}: InertiaLinkProps & { active?: boolean }) {
    return (
        <Link
            {...props}
            className={`flex w-full items-center gap-3 rounded-xl border-l-4 py-3 pe-4 ps-4 text-base font-medium transition-all duration-300 ease-in-out focus:outline-none ${
                active
                    ? 'border-cyan-600 bg-gradient-to-r from-cyan-50 to-sky-50 text-cyan-700 shadow-sm dark:border-cyan-400 dark:from-cyan-900/30 dark:to-sky-900/30 dark:text-cyan-300'
                    : 'border-transparent text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800/50 dark:hover:text-white'
            } ${className}`}
        >
            {children}
        </Link>
    );
}
