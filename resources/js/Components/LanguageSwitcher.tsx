import { router } from '@inertiajs/react';
import { ChevronDown, Languages } from 'lucide-react';
import { useTranslation } from '@/Hooks/useTranslation';
import type { ChangeEvent } from 'react';

const locales = [
    { value: 'fr', label: 'Français', short: 'FR' },
    { value: 'ar', label: 'العربية', short: 'AR' },
] as const;

export default function LanguageSwitcher() {
    const { __, locale } = useTranslation();
    const activeLocale =
        locales.find((item) => item.value === locale) ?? locales[0];

    const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const nextLocale = event.target.value;

        if (nextLocale === locale) {
            return;
        }

        router.post(
            route('language.switch'),
            { locale: nextLocale },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    document.documentElement.lang = nextLocale;
                    document.documentElement.dir = nextLocale === 'ar' ? 'rtl' : 'ltr';
                },
            },
        );
    };

    return (
        <div className="w-full max-w-[13rem]">
            <label
                htmlFor="language-switcher"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 text-start"
            >
                {__('Langue')}
            </label>

            <div className="group relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Languages className="h-4.5 w-4.5" />
                </div>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center gap-2 pr-3">
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-slate-600">
                        {activeLocale.short}
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-400 transition group-focus-within:text-slate-600" />
                </div>

                <select
                    id="language-switcher"
                    value={locale}
                    onChange={handleChange}
                    className="block w-full appearance-none rounded-2xl border border-slate-200 bg-white/95 py-2.5 pl-10 pr-20 text-sm font-medium text-slate-700 shadow-sm outline-none transition hover:border-slate-300 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 text-start"
                >
                    {locales.map((item) => (
                        <option key={item.value} value={item.value}>
                            {__(item.label)}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
