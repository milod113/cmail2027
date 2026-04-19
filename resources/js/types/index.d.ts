export interface User {
    id: number;
    name: string;
    username?: string;
    email: string;
    role?: string | null;
    role_details?: {
        id: number;
        nom_role: string;
    } | null;
    department_id?: number | null;
    role_id?: number | null;
    department_name?: string | null;
    can_publish_publication?: boolean;
    can_organize_event?: boolean;
    is_blocked?: boolean;
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
