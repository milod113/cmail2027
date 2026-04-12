import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import { Head } from '@inertiajs/react';
import DepartmentForm from './Form';

type Establishment = {
    id: number;
    name: string;
};

export default function Create({
    establishments,
}: {
    establishments: Establishment[];
}) {
    const { __ } = useTranslation();

    return (
        <AuthenticatedLayout
            title={__('Créer un département')}
            description={__('Ajoutez un nouveau département et liez-le à un établissement.')}
        >
            <Head title={__('Créer un département')} />

            <section className="mx-auto max-w-3xl rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80 sm:p-8">
                <DepartmentForm mode="create" establishments={establishments} />
            </section>
        </AuthenticatedLayout>
    );
}
