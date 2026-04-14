import { InertiaLinkProps, Link } from '@inertiajs/react';

export default function NavLink({
    active = false,
    className = '',
    children,
    ...props
}: InertiaLinkProps & { active: boolean }) {
    return (
        <Link
            {...props}
            className={
                'relative inline-flex items-center px-1 pt-1 text-sm font-medium transition-all duration-300 ease-in-out focus:outline-none ' +
                (active
                    ? 'text-slate-900 dark:text-white ' +
                      'after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 ' +
                      'after:bg-gradient-to-r after:from-cyan-600 after:to-sky-700 ' +
                      'after:rounded-full after:shadow-lg after:shadow-cyan-500/30 ' +
                      'dark:after:from-cyan-400 dark:after:to-sky-500'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white ' +
                      'after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 ' +
                      'after:bg-transparent hover:after:bg-slate-300 dark:hover:after:bg-slate-600 ' +
                      'after:rounded-full after:transition-all after:duration-300') +
                className
            }
        >
            {children}
        </Link>
    );
}
