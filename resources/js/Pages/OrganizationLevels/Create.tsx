import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import { Head } from '@inertiajs/react';
import OrganizationLevelForm from './Form';

type Category = {
    id: number;
    name: string;
    code: string;
};

export default function Create({ categories }: { categories: Category[] }) {
    const { __ } = useTranslation();

    return (
        <AdminLayout
            title={__('Creer un niveau organisationnel')}
            description={__('Ajoutez un niveau reutilisable pour structurer l organigramme.')}
        >
            <Head title={__('Creer un niveau organisationnel')} />

            <section className="mx-auto max-w-3xl rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80 sm:p-8">
                <OrganizationLevelForm mode="create" categories={categories} />
            </section>
        </AdminLayout>
    );
}
