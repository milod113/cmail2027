import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import { Head } from '@inertiajs/react';
import RoleForm from './Form';

type Role = {
    id: number;
    nom_role: string;
    is_protected: boolean;
    is_unique: boolean;
};

export default function Edit({ role }: { role: Role }) {
    const { __ } = useTranslation();

    return (
        <AuthenticatedLayout
            title={__('Modifier le rôle')}
            description={__('Mettez à jour un rôle système existant.')}
        >
            <Head title={__('Modifier le rôle')} />

            <section className="mx-auto max-w-3xl rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80 sm:p-8">
                <RoleForm mode="edit" role={role} />
            </section>
        </AuthenticatedLayout>
    );
}
