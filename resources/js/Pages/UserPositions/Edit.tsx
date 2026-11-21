import AdminLayout from '@/Layouts/AdminLayout';
import { useTranslation } from '@/Hooks/useTranslation';
import { Head } from '@inertiajs/react';
import UserPositionForm from './Form';

export default function Edit(props: any) {
    const { __ } = useTranslation();

    return (
        <AdminLayout
            title={__('Modifier une affectation')}
            description={__('Mettez a jour la liaison entre un utilisateur et un poste.')}
        >
            <Head title={__('Modifier une affectation')} />

            <section className="mx-auto max-w-4xl rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80 sm:p-8">
                <UserPositionForm mode="edit" {...props} />
            </section>
        </AdminLayout>
    );
}
