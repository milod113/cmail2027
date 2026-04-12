export interface User {
    id: number;
    name: string;
    username?: string;
    email: string;
    department_id?: number | null;
    role_id?: number | null;
    is_online?: boolean;
    is_super_admin?: boolean;
    email_verified_at?: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    flash: {
        success?: string;
    };
    current_locale: 'fr' | 'ar';
    translations: Record<string, string>;
};
