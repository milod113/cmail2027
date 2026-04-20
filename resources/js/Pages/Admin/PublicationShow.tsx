import AdminLayout from '@/Layouts/AdminLayout';
import InputError from '@/Components/InputError';
import { Link, useForm, router } from '@inertiajs/react';
import { Archive, ArrowLeft, Save, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';

type CommentItem = {
    id: number;
    content: string;
    created_at: string | null;
    user: {
        id: number;
        name: string;
        email: string;
    } | null;
};

type PublicationDetail = {
    id: number;
    title: string | null;
    content: string;
    photo_url: string | null;
    archived: boolean;
    created_at: string | null;
    updated_at: string | null;
    likes_count: number;
    comments_count: number;
    user: {
        id: number;
        name: string;
        email: string;
    } | null;
    comments: CommentItem[];
};

type PublicationShowProps = {
    publication: PublicationDetail;
};

function formatDate(value: string | null): string {
    if (!value) {
        return '-';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('fr-FR');
}

export default function PublicationShow({ publication }: PublicationShowProps) {
    const form = useForm({
        title: publication.title ?? '',
        content: publication.content,
        photo: null as File | null,
        remove_photo: false,
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.transform((data) => ({
            ...data,
            _method: 'patch',
        }));

        form.post(route('admin.publications.update', publication.id), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const toggleArchive = () => {
        router.patch(
            route('admin.publications.archive', publication.id),
            { archived: !publication.archived },
            { preserveScroll: true },
        );
    };

    const deletePublication = () => {
        const confirmed = window.confirm('Supprimer cette publication ? Cette action est irreversible.');

        if (!confirmed) {
            return;
        }

        router.delete(route('admin.publications.destroy', publication.id));
    };

    return (
        <AdminLayout
            title="Publication"
            description="Affichez le detail, modifiez le contenu, archivez ou supprimez la publication."
            actions={
                <Link
                    href={route('admin.publications.index')}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Retour liste
                </Link>
            }
        >
            <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                <section className="space-y-5">
                    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Titre
                                </label>
                                <input
                                    type="text"
                                    value={form.data.title}
                                    onChange={(event) => form.setData('title', event.target.value)}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-500/20"
                                    placeholder="Titre optionnel"
                                />
                                <InputError message={form.errors.title} className="mt-2" />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Contenu
                                </label>
                                <textarea
                                    rows={10}
                                    value={form.data.content}
                                    onChange={(event) => form.setData('content', event.target.value)}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-500/20"
                                />
                                <InputError message={form.errors.content} className="mt-2" />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Image
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) => form.setData('photo', event.target.files?.[0] ?? null)}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-cyan-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:file:bg-cyan-500/10 dark:file:text-cyan-300"
                                />
                                <InputError message={form.errors.photo} className="mt-2" />
                                {publication.photo_url ? (
                                    <label className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                        <input
                                            type="checkbox"
                                            checked={form.data.remove_photo}
                                            onChange={(event) => form.setData('remove_photo', event.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-950"
                                        />
                                        Supprimer l'image actuelle
                                    </label>
                                ) : null}
                            </div>

                            <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <Save className="h-4 w-4" />
                                    Enregistrer
                                </button>
                                <button
                                    type="button"
                                    onClick={toggleArchive}
                                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                                        publication.archived
                                            ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                                            : 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
                                    }`}
                                >
                                    <Archive className="h-4 w-4" />
                                    {publication.archived ? 'Restaurer' : 'Archiver'}
                                </button>
                                <button
                                    type="button"
                                    onClick={deletePublication}
                                    className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    </form>
                </section>

                <section className="space-y-5">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Apercu</h2>
                        <div className="mt-4 space-y-4">
                            {publication.photo_url ? (
                                <img
                                    src={publication.photo_url}
                                    alt={publication.title ?? 'Publication'}
                                    className="w-full rounded-2xl object-cover"
                                />
                            ) : null}
                            <div>
                                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                                    {publication.title?.trim() || 'Sans titre'}
                                </p>
                                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-200">
                                    {publication.content}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Informations</h2>
                        <div className="mt-4 grid gap-3 text-sm text-slate-600 dark:text-slate-300">
                            <p><span className="font-semibold text-slate-900 dark:text-white">Auteur:</span> {publication.user?.name ?? '-'}</p>
                            <p><span className="font-semibold text-slate-900 dark:text-white">Email:</span> {publication.user?.email ?? '-'}</p>
                            <p><span className="font-semibold text-slate-900 dark:text-white">Statut:</span> {publication.archived ? 'Archivee' : 'Active'}</p>
                            <p><span className="font-semibold text-slate-900 dark:text-white">Creation:</span> {formatDate(publication.created_at)}</p>
                            <p><span className="font-semibold text-slate-900 dark:text-white">Mise a jour:</span> {formatDate(publication.updated_at)}</p>
                            <p><span className="font-semibold text-slate-900 dark:text-white">Likes:</span> {publication.likes_count}</p>
                            <p><span className="font-semibold text-slate-900 dark:text-white">Commentaires:</span> {publication.comments_count}</p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Commentaires recents</h2>
                        <div className="mt-4 space-y-3">
                            {publication.comments.length > 0 ? (
                                publication.comments.map((comment) => (
                                    <div key={comment.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            {comment.user?.name ?? 'Utilisateur inconnu'}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            {formatDate(comment.created_at)}
                                        </p>
                                        <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                                            {comment.content}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500 dark:text-slate-400">Aucun commentaire pour cette publication.</p>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
