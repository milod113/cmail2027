import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import { Head } from '@inertiajs/react';
import DepartmentForm from './Form';

type Establishment = {
    id: number;
    name: string;
};

type ParentDepartment = {
    id: number;
    name: string;
    category: string;
    level_type: string;
};

type Manager = {
    id: number;
    name: string;
    email: string;
};

export default function Create({
    establishments,
    parentDepartments,
    managers,
}: {
    establishments: Establishment[];
    parentDepartments: ParentDepartment[];
    managers: Manager[];
}) {
    const { __ } = useTranslation();

    return (
        <AdminLayout
            title={__('Creer un departement')}
            description={__('Ajoutez un noeud hierarchique administratif, medical ou chirurgical.')}
        >
            <Head title={__('Creer un departement')} />

            <section className="mx-auto max-w-4xl rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80 sm:p-8">
                <DepartmentForm
                    mode="create"
                    establishments={establishments}
                    parentDepartments={parentDepartments}
                    managers={managers}
                />
            </section>
        </AdminLayout>
    );
}
