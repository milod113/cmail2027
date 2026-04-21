import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

type SystemFeedbackCardProps = {
    title: string;
    message?: string | null;
};

function SystemIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className={className}
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.75 17 8.25 21m7.5-4 1.5 4m-9 0h7.5M3.75 5.25h16.5A1.5 1.5 0 0 1 21.75 6.75v8.5a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5v-8.5a1.5 1.5 0 0 1 1.5-1.5Z"
            />
        </svg>
    );
}

function FeedbackIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className={className}
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 8.25h9m-9 3h6m-8.25 8.25 1.77-3.04a1.5 1.5 0 0 1 1.3-.75h9.93a1.5 1.5 0 0 0 1.5-1.5V5.25a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v12.75a1.5 1.5 0 0 0 1.5 1.5Z"
            />
        </svg>
    );
}

function FilledStarIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            aria-hidden="true"
        >
            <path
                fillRule="evenodd"
                d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.75 2.305l-4.117 3.527 1.258 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354l-4.629 2.826c-.996.608-2.231-.289-1.96-1.425l1.258-5.273-4.117-3.527c-.886-.76-.414-2.212.75-2.305l5.404-.434 2.082-5.005Z"
                clipRule="evenodd"
            />
        </svg>
    );
}

function StarIcon({
    active,
    onClick,
}: {
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="transition hover:scale-110"
            aria-label={`Noter ${active ? 'selectionnee' : 'non selectionnee'}`}
        >
            <FilledStarIcon
                className={`h-8 w-8 ${
                    active ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'
                }`}
            />
        </button>
    );
}

export default function SystemFeedbackCard({
    title,
    message,
}: SystemFeedbackCardProps) {
    const { data, setData, post, processing, errors } = useForm({
        rating: 0,
        comment: '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(route('feedbacks.store'), {
            preserveScroll: true,
        });
    };

    return (
        <section className="relative overflow-hidden rounded-3xl border border-cyan-200/80 bg-gradient-to-br from-cyan-50 via-sky-50 to-white p-6 shadow-lg shadow-cyan-100/70 dark:border-cyan-500/20 dark:from-cyan-500/10 dark:via-slate-900 dark:to-slate-900">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-cyan-200/50 blur-3xl dark:bg-cyan-500/10" />
            <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-sky-200/40 blur-2xl dark:bg-sky-500/10" />

            <div className="relative">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700 shadow-sm dark:bg-slate-900/70 dark:text-cyan-300">
                            <SystemIcon className="h-4 w-4" />
                            Systeme
                        </div>
                        <h2 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
                            {title}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {message || 'Aidez-nous a ameliorer votre experience sur Cmail en partageant une note et un commentaire.'}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-white/80 p-4 shadow-sm dark:bg-slate-900/70">
                        <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300">
                                <FeedbackIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">Campagne feedback</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">1 a 5 etoiles</p>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={submit} className="mt-6 space-y-5">
                    <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            Quelle note donnez-vous a Cmail ?
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            {[1, 2, 3, 4, 5].map((value) => (
                                <StarIcon
                                    key={value}
                                    active={data.rating >= value}
                                    onClick={() => setData('rating', value)}
                                />
                            ))}
                            <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                                {data.rating > 0 ? `${data.rating}/5` : 'Choisissez une note'}
                            </span>
                        </div>
                        {errors.rating ? (
                            <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{errors.rating}</p>
                        ) : null}
                    </div>

                    <div>
                        <label
                            htmlFor="feedback-comment"
                            className="text-sm font-semibold text-slate-800 dark:text-slate-200"
                        >
                            Votre avis
                        </label>
                        <textarea
                            id="feedback-comment"
                            value={data.comment}
                            onChange={(event) => setData('comment', event.target.value)}
                            rows={4}
                            placeholder="Partagez ce que vous aimez, ce qui manque, ou ce que nous devrions ameliorer."
                            className="mt-2 block w-full rounded-2xl border border-cyan-200 bg-white/90 px-4 py-3 text-sm text-slate-800 shadow-sm transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:border-cyan-500/20 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:ring-cyan-500/20"
                        />
                        {errors.comment ? (
                            <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{errors.comment}</p>
                        ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="submit"
                            disabled={processing || data.rating < 1}
                            className="inline-flex items-center rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {processing ? 'Envoi...' : 'Envoyer mon avis'}
                        </button>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Le commentaire est optionnel, la note est requise.
                        </p>
                    </div>
                </form>
            </div>
        </section>
    );
}
