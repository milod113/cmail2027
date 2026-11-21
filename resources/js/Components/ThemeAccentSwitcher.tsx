type ThemeAccent = 'classic' | 'sunrise';

type ThemeAccentSwitcherProps = {
    value: ThemeAccent;
    onChange: (theme: ThemeAccent) => void;
    compact?: boolean;
};

const options: { value: ThemeAccent; label: string; swatch: string }[] = [
    { value: 'classic', label: 'Cyan', swatch: 'from-cyan-500 via-sky-600 to-slate-900' },
    { value: 'sunrise', label: 'Orange', swatch: 'from-orange-500 via-amber-500 to-rose-700' },
];

export default function ThemeAccentSwitcher({
    value,
    onChange,
    compact = false,
}: ThemeAccentSwitcherProps) {
    return (
        <div
            className={`rounded-2xl border border-slate-200 bg-white/90 p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900/90 ${
                compact ? 'inline-flex items-center gap-1' : 'inline-flex items-center gap-1.5'
            }`}
        >
            {options.map((option) => {
                const active = option.value === value;

                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                            active
                                ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                        }`}
                        aria-pressed={active}
                        title={option.label}
                    >
                        <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${option.swatch}`} />
                        {!compact ? <span>{option.label}</span> : null}
                    </button>
                );
            })}
        </div>
    );
}
