import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import { Head } from '@inertiajs/react';
import RoleForm from './Form';

export default function Create() {
    const { __ } = useTranslation();

    return (
        <AuthenticatedLayout
            title={__('Créer un rôle')}
            description={__('Ajoutez un nouveau rôle pour les utilisateurs du système.')}
        >
            <Head title={__('Créer un rôle')} />

            <section className="mx-auto max-w-3xl rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80 sm:p-8">
                <RoleForm mode="create" />
            </section>
        </AuthenticatedLayout>
    );
}
