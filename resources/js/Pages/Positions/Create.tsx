import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import { Head } from '@inertiajs/react';
import PositionForm from './Form';

export default function Create(props: any) {
    const { __ } = useTranslation();

    return (
        <AdminLayout
            title={__('Creer un poste')}
            description={__('Ajoutez un poste dans un departement et definissez sa place dans la chaine hierarchique.')}
        >
            <Head title={__('Creer un poste')} />

            <section className="mx-auto max-w-4xl rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80 sm:p-8">
                <PositionForm mode="create" {...props} />
            </section>
        </AdminLayout>
    );
}
