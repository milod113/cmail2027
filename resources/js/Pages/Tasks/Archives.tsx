import ShiftDashboard from '@/Components/ShiftDashboard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Archive, ArrowLeft, Send } from 'lucide-react';

type TaskItem = {
    id: number;
    message_id: number | null;
    title: string;
    description: string | null;
    status: 'pending' | 'completed';
    archived_at: string | null;
    created_at: string | null;
    message: {
        id: number;
        sujet: string | null;
    } | null;
};

export default function TasksArchives({ tasks }: { tasks: TaskItem[] }) {
    return (
        <AuthenticatedLayout
            title="Archives des tâches"
            description="Consultez les tâches archivées et restaurez celles dont vous avez encore besoin."
        >
            <Head title="Archives des tâches" />

            <div className="space-y-8 pb-8">
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 p-6 shadow-xl shadow-slate-900/20 md:p-8">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.16),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.08),_transparent_30%)]" />

                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100 backdrop-blur-sm">
                                <Archive className="h-3.5 w-3.5" />
                                Archives
                            </div>
                            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
                                Archives des tâches
                            </h1>
                            <p className="mt-3 text-base leading-relaxed text-slate-200">
                                Gardez un historique propre de vos actions et restaurez une tâche si elle redevient nécessaire.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Link
                                href={route('tasks.index')}
                                className="inline-flex items-center gap-2 rounded-2xl bg-white/12 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Retour aux tâches
                            </Link>
                            <Link
                                href={route('messages.inbox')}
                                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50"
                            >
                                <Send className="h-4 w-4" />
                                Voir les messages
                            </Link>
                        </div>
                    </div>
                </section>

                <ShiftDashboard tasks={tasks} mode="archived" />
            </div>
        </AuthenticatedLayout>
    );
}
