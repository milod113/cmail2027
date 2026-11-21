import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import { Head } from '@inertiajs/react';
import OrganizationLevelForm from './Form';

type Level = {
    id: number;
    organization_category_id: number;
    name: string;
    code: string;
    rank: number;
    is_active: boolean;
    description?: string | null;
};

type Category = {
    id: number;
    name: string;
    code: string;
};

export default function Edit({ level, categories }: { level: Level; categories: Category[] }) {
    const { __ } = useTranslation();

    return (
        <AdminLayout
            title={__('Modifier le niveau organisationnel')}
            description={__('Ajustez le libelle, le rang et la disponibilite du niveau.')}
        >
            <Head title={__('Modifier le niveau organisationnel')} />

            <section className="mx-auto max-w-3xl rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80 sm:p-8">
                <OrganizationLevelForm mode="edit" level={level} categories={categories} />
            </section>
        </AdminLayout>
    );
}
