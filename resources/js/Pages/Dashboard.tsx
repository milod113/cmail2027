import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Dashboard() {
    return (
        <AuthenticatedLayout
            title="Dashboard"
            description="Starter dashboard redirect target for authenticated users."
        >
            <Head title="Dashboard" />

            <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
                <p className="text-slate-700 dark:text-slate-300">
                    The authenticated shell is ready. Primary navigation now lives in Inbox, Sent, Drafts, Contacts, and Archive.
                </p>
            </div>
        </AuthenticatedLayout>
    );
}
