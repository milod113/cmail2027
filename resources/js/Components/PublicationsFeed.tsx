import InputError from '@/Components/InputError';
import RichTextContent from '@/Components/RichTextContent';
import RichTextEditor from '@/Components/RichTextEditor';
import { richTextToPlainText } from '@/Utils/richText';
import { PageProps } from '@/types';
import { router, useForm, usePage } from '@inertiajs/react';
import { ChangeEvent, FormEvent, useState } from 'react';
import { Heart, ImagePlus, MessageCircle, SendHorizonal, X, MoreHorizontal, Bookmark, Share2, Sparkles } from 'lucide-react';

type FeedUser = {
    id: number;
    name: string;
    email?: string;
};

type FeedComment = {
    id: number;
    content: string;
    created_at: string;
    user: FeedUser;
};

type FeedPublication = {
    id: number;
    title?: string | null;
    content: string;
    photo_url?: string | null;
    created_at: string;
    likes_count: number;
    comments_count: number;
    is_liked_by_current_user: boolean;
    user: FeedUser;
    comments: FeedComment[];
};

type PublicationsFeedProps = {
    publications: FeedPublication[];
};

function formatRelativeTime(value: string): string {
    const date = new Date(value);
    const now = new Date();
    const diffInSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const formatter = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });

    const ranges: Array<[Intl.RelativeTimeFormatUnit, number]> = [
        ['year', 60 * 60 * 24 * 365],
        ['month', 60 * 60 * 24 * 30],
        ['week', 60 * 60 * 24 * 7],
        ['day', 60 * 60 * 24],
        ['hour', 60 * 60],
        ['minute', 60],
        ['second', 1],
    ];

    for (const [unit, secondsInUnit] of ranges) {
        if (Math.abs(diffInSeconds) >= secondsInUnit || unit === 'second') {
            return formatter.format(-Math.round(diffInSeconds / secondsInUnit), unit);
        }
    }

    return '';
}

function initials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

function PublicationComments({ publication }: { publication: FeedPublication }) {
    const form = useForm({
        content: '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!form.data.content.trim()) return;

        form.post(route('publications.comments.store', publication.id), {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    return (
        <div className="animate-fadeIn space-y-5 border-t border-slate-200/60 pt-5 dark:border-slate-700/60">
            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                {publication.comments.length > 0 ? (
                    publication.comments.map((comment, index) => (
                        <div
                            key={comment.id}
                            className="group animate-slideInUp rounded-2xl bg-gradient-to-br from-slate-50/80 to-white p-4 shadow-sm transition-all hover:shadow-md dark:from-slate-800/50 dark:to-slate-800/30"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-semibold text-white shadow-sm dark:from-cyan-500 dark:to-cyan-600">
                                    {initials(comment.user.name)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            {comment.user.name}
                                        </p>
                                        <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {formatRelativeTime(comment.created_at)}
                                        </p>
                                    </div>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                        {comment.content}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-8 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                            <MessageCircle className="h-5 w-5 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Aucun commentaire pour le moment
                        </p>
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                            Soyez le premier à commenter !
                        </p>
                    </div>
                )}
            </div>

            <form onSubmit={submit} className="relative">
                <div className="flex items-end gap-3">
                    <div className="flex-1">
                        <textarea
                            id={`comment-${publication.id}`}
                            value={form.data.content}
                            onChange={(event) => form.setData('content', event.target.value)}
                            rows={2}
                            className="w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-500 dark:focus:bg-slate-800 dark:focus:ring-cyan-500/10"
                            placeholder="Écrire un commentaire..."
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={form.processing || !form.data.content.trim()}
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white transition-all hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 dark:from-cyan-500 dark:to-cyan-600"
                    >
                        <SendHorizonal className="h-4 w-4" />
                    </button>
                </div>
                <InputError message={form.errors.content} className="mt-2" />
            </form>
        </div>
    );
}

export default function PublicationsFeed({ publications }: PublicationsFeedProps) {
    const { auth } = usePage<PageProps>().props;
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [expandedPost, setExpandedPost] = useState<number | null>(null);
    const canCreatePublication = Boolean(auth.user.can_publish_publication)
        || ['admin', 'superadmin', 'directeur'].includes((auth.user.role ?? '').toLowerCase());

    const publicationForm = useForm({
        title: '',
        content: '',
        photo: null as File | null,
    });
    const publicationPlainText = richTextToPlainText(publicationForm.data.content);

    const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        publicationForm.setData('photo', file);

        setPhotoPreview((currentPreview) => {
            if (currentPreview) {
                URL.revokeObjectURL(currentPreview);
            }
            return file ? URL.createObjectURL(file) : null;
        });
    };

    const clearPhoto = () => {
        publicationForm.setData('photo', null);
        setPhotoPreview((currentPreview) => {
            if (currentPreview) {
                URL.revokeObjectURL(currentPreview);
            }
            return null;
        });
    };

    const submitPublication = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!publicationPlainText) return;

        publicationForm.post(route('publications.store'), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                publicationForm.reset();
                clearPhoto();
            },
        });
    };

    return (
        <div className="space-y-8">
            {/* Create Post Section */}
            {canCreatePublication && (
                <section className="group relative animate-fadeInDown overflow-hidden rounded-3xl bg-white/80 shadow-xl shadow-slate-200/50 backdrop-blur-xl transition-all hover:shadow-2xl dark:bg-slate-800/50 dark:shadow-slate-900/30">
                    {/* Decorative gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100 dark:from-cyan-500/5"></div>
                    
                    <div className="relative p-6 md:p-8">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 shadow-md dark:from-cyan-500 dark:to-cyan-600">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    Nouvelle publication
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Partagez une annonce ou une information importante
                                </p>
                            </div>
                        </div>

                        <form onSubmit={submitPublication} className="space-y-5">
                            <div>
                                <input
                                    id="publication-title"
                                    type="text"
                                    value={publicationForm.data.title}
                                    onChange={(event) => publicationForm.setData('title', event.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white/80 px-5 py-3.5 text-base text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:shadow-lg focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-500 dark:focus:bg-slate-800 dark:focus:ring-cyan-500/10"
                                    placeholder="Titre de la publication (optionnel)"
                                />
                                <InputError message={publicationForm.errors.title} className="mt-2" />
                            </div>

                            <div>
                                <RichTextEditor
                                    value={publicationForm.data.content}
                                    onChange={(value) => publicationForm.setData('content', value)}
                                    placeholder="Ecrivez votre publication..."
                                    minHeightClassName="min-h-[180px]"
                                />
                                <InputError message={publicationForm.errors.content} className="mt-2" />
                            </div>

                            <div>
                                <label
                                    htmlFor="publication-photo"
                                    className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 px-5 py-6 text-sm font-medium text-slate-600 transition-all hover:border-cyan-400 hover:bg-cyan-50/50 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-800/30 dark:text-slate-300 dark:hover:border-cyan-500 dark:hover:bg-cyan-500/5 dark:hover:text-cyan-300"
                                >
                                    <ImagePlus className="h-5 w-5" />
                                    <span>Choisir une photo</span>
                                </label>
                                <input
                                    id="publication-photo"
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    className="hidden"
                                />
                                <InputError message={publicationForm.errors.photo as string | undefined} className="mt-2" />

                                {photoPreview && (
                                    <div className="group/photo relative mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition-all dark:border-slate-700 dark:bg-slate-800">
                                        <img
                                            src={photoPreview}
                                            alt="Aperçu de la publication"
                                            className="h-64 w-full object-cover transition-transform duration-500 group-hover/photo:scale-105"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover/photo:opacity-100">
                                            <button
                                                type="button"
                                                onClick={clearPhoto}
                                                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-all hover:scale-105 hover:shadow-lg"
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={publicationForm.processing || !publicationPlainText}
                                    className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 dark:from-cyan-500 dark:to-cyan-600"
                                >
                                    <span className="relative z-10">Publier</span>
                                    <SendHorizonal className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </button>
                            </div>
                        </form>
                    </div>
                </section>
            )}

            {/* Posts Feed */}
            <section className="space-y-6">
                {publications.length > 0 ? (
                    publications.map((publication, index) => {
                        const isExpanded = expandedPost === publication.id;
                        const plainContent = richTextToPlainText(publication.content);
                        const hasLongContent = plainContent.length > 220 || plainContent.split(/\n{2,}/).length > 2;

                        return (
                            <article
                                key={publication.id}
                                className="group animate-fadeInUp relative overflow-hidden rounded-3xl bg-white/80 shadow-xl shadow-slate-200/50 backdrop-blur-xl transition-all hover:shadow-2xl dark:bg-slate-800/50 dark:shadow-slate-900/30"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                            {/* Decorative gradient line */}
                            <div className="absolute left-0 top-0 h-1 w-0 bg-gradient-to-r from-cyan-500 to-sky-500 transition-all duration-700 group-hover:w-full"></div>
                            
                            <div className="p-6 md:p-8">
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-base font-bold text-white shadow-lg transition-transform group-hover:scale-105 dark:from-cyan-500 dark:to-cyan-600">
                                            {initials(publication.user.name)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                                {publication.user.name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                                    {formatRelativeTime(publication.created_at)}
                                                </span>
                                                <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                                    Publication
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700">
                                        <MoreHorizontal className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="mt-5">
                                    {publication.title && (
                                        <h4 className="mb-3 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                            {publication.title}
                                        </h4>
                                    )}

                                    <div className="mt-4">
                                        <div className="relative max-w-3xl">
                                            <RichTextContent html={publication.content} collapsed={!isExpanded && hasLongContent} />
                                            {!isExpanded && hasLongContent ? (
                                                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/95 to-transparent dark:from-slate-800/95"></div>
                                            ) : null}
                                        </div>
                                    </div>

                                    {hasLongContent && (
                                        <button
                                            onClick={() => setExpandedPost(isExpanded ? null : publication.id)}
                                            className="mt-3 inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50/80 px-3 py-1 text-sm font-semibold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:border-cyan-500/50 dark:hover:bg-cyan-500/15"
                                        >
                                            {isExpanded ? 'Voir moins' : 'Lire la suite'}
                                        </button>
                                    )}
                                </div>

                                {/* Image */}
                                {publication.photo_url && (
                                    <div className="group/image mt-5 overflow-hidden rounded-2xl">
                                        <img
                                            src={publication.photo_url}
                                            alt={publication.title || 'Photo de publication'}
                                            className="max-h-[500px] w-full cursor-pointer object-cover transition-transform duration-700 group-hover/image:scale-105"
                                        />
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="mt-6 flex items-center justify-between border-y border-slate-200/60 py-3 dark:border-slate-700/60">
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => router.post(route('publications.like.toggle', publication.id), {}, { preserveScroll: true })}
                                            className={`group/btn flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                                                publication.is_liked_by_current_user
                                                    ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20'
                                                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            <Heart className={`h-5 w-5 transition-transform group-hover/btn:scale-110 ${
                                                publication.is_liked_by_current_user ? 'fill-current' : ''
                                            }`} />
                                            <span>{publication.likes_count}</span>
                                        </button>

                                        <button className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700">
                                            <MessageCircle className="h-5 w-5" />
                                            <span>{publication.comments_count}</span>
                                        </button>
                                    </div>

                                    <div className="flex gap-1">
                                        <button className="rounded-full p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700">
                                            <Bookmark className="h-4 w-4" />
                                        </button>
                                        <button className="rounded-full p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700">
                                            <Share2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Comments Section */}
                                <div className="mt-6">
                                    <PublicationComments publication={publication} />
                                </div>
                            </div>
                            </article>
                        );
                    })
                ) : (
                    <div className="animate-fadeIn rounded-3xl border border-dashed border-slate-300 bg-white/80 p-16 text-center backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/30">
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
                            <MessageCircle className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            Aucune publication pour le moment
                        </h3>
                        <p className="mt-2 text-slate-500 dark:text-slate-400">
                            Les nouvelles internes apparaîtront ici dès qu'une publication sera partagée.
                        </p>
                    </div>
                )}
            </section>

            {/* Custom CSS for animations */}
            <style>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes fadeInDown {
                    from {
                        opacity: 0;
                        transform: translateY(-30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                
                @keyframes slideInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-fadeInUp {
                    animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
                
                .animate-fadeInDown {
                    animation: fadeInDown 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out forwards;
                }
                
                .animate-slideInUp {
                    animation: slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
                
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.05);
                    border-radius: 10px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 10px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 0, 0, 0.3);
                }
                
                .dark .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                }
                
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}
