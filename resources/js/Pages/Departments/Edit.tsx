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

type Department = {
    id: number;
    name: string;
    establishment_id: number;
    parent_id?: number | null;
    category: string;
    level_type: string;
    manager_user_id?: number | null;
    is_active: boolean;
    sort_order: number;
    description?: string | null;
};

export default function Edit({
    department,
    establishments,
    parentDepartments,
    managers,
}: {
    department: Department;
    establishments: Establishment[];
    parentDepartments: ParentDepartment[];
    managers: Manager[];
}) {
    const { __ } = useTranslation();

    return (
        <AdminLayout
            title={__('Modifier le departement')}
            description={__('Mettez a jour la place de ce noeud dans la hierarchie du CHU.')}
        >
            <Head title={__('Modifier le departement')} />

            <section className="mx-auto max-w-4xl rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80 sm:p-8">
                <DepartmentForm
                    mode="edit"
                    department={department}
                    establishments={establishments}
                    parentDepartments={parentDepartments}
                    managers={managers}
                />
            </section>
        </AdminLayout>
    );
}
