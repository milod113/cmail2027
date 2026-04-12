import { router } from '@inertiajs/react';
import { useTranslation } from '@/Hooks/useTranslation';
import type { ChangeEvent } from 'react';

const locales = [
    { value: 'fr', label: 'Français' },
    { value: 'ar', label: 'العربية' },
] as const;

export default function LanguageSwitcher() {
    const { __, locale } = useTranslation();

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
        <div className="w-full max-w-xs">
            <label
                htmlFor="language-switcher"
                className="mb-2 block text-sm font-medium text-slate-700 text-start"
            >
                {__('Langue')}
            </label>

            <div className="relative">
                <select
                    id="language-switcher"
                    value={locale}
                    onChange={handleChange}
                    className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 text-start"
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
