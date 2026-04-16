import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PublicationsFeed from '@/Components/PublicationsFeed';
import { Head } from '@inertiajs/react';

type DashboardProps = {
    publications: Array<{
        id: number;
        title?: string | null;
        content: string;
        photo_url?: string | null;
        created_at: string;
        likes_count: number;
        comments_count: number;
        is_liked_by_current_user: boolean;
        user: {
            id: number;
            name: string;
            email?: string;
        };
        comments: Array<{
            id: number;
            content: string;
            created_at: string;
            user: {
                id: number;
                name: string;
                email?: string;
            };
        }>;
    }>;
};

export default function Dashboard({ publications }: DashboardProps) {
    return (
        <AuthenticatedLayout
            title="Dashboard"
            description="Publications internes, annonces et échanges de l'organisation."
        >
            <Head title="Dashboard" />

            <div className="space-y-6">
                <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-sm shadow-slate-200/50 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
                    <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                        Fil des publications
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                        Retrouvez ici les actualités internes, notes de service et annonces partagées par les responsables autorisés.
                    </p>
                </section>

                <PublicationsFeed publications={publications} />
            </div>
        </AuthenticatedLayout>
    );
}
