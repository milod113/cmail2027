import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import { Head } from '@inertiajs/react';
import DepartmentForm from './Form';

type Establishment = {
    id: number;
    name: string;
};

type Department = {
    id: number;
    name: string;
    establishment_id: number;
};

export default function Edit({
    department,
    establishments,
}: {
    department: Department;
    establishments: Establishment[];
}) {
    const { __ } = useTranslation();

    return (
        <AuthenticatedLayout
            title={__('Modifier le département')}
            description={__('Mettez à jour les détails du département et l’établissement lié.')}
        >
            <Head title={__('Modifier le département')} />

            <section className="mx-auto max-w-3xl rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80 sm:p-8">
                <DepartmentForm
                    mode="edit"
                    department={department}
                    establishments={establishments}
                />
            </section>
        </AuthenticatedLayout>
    );
}
