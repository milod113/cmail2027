import { usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';

type Replacements = Record<string, string | number>;

export function useTranslation() {
    const { current_locale, translations } = usePage<PageProps>().props;

    const __ = (key: string, replacements: Replacements = {}) => {
        let translation = translations[key] ?? key;

        Object.entries(replacements).forEach(([placeholder, value]) => {
            translation = translation.replace(`:${placeholder}`, String(value));
        });

        return translation;
    };

    return {
        __,
        locale: current_locale,
        isRtl: current_locale === 'ar',
    };
}
