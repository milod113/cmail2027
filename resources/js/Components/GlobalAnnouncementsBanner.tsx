import RichTextContent from '@/Components/RichTextContent';
import { router } from '@inertiajs/react';
import { BellRing, CheckCircle2, Crown, Pin, ShieldAlert } from 'lucide-react';

type AnnouncementBannerItem = {
    id: number;
    title: string;
    content: string;
    priority: string;
    requires_acknowledgement: boolean;
    is_pinned: boolean;
    audience_label: string;
    is_read: boolean;
    is_acknowledged: boolean;
    starts_at: string | null;
    ends_at: string | null;
};

function formatDate(value: string | null): string | null {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date.toLocaleString('fr-FR');
}

export default function GlobalAnnouncementsBanner({
    announcements,
}: {
    announcements: AnnouncementBannerItem[];
}) {
    if (announcements.length === 0) {
        return null;
    }

    return (
        <div className="border-b border-cyan-100 bg-gradient-to-r from-cyan-50 via-white to-sky-50 dark:border-cyan-500/20 dark:from-cyan-950/30 dark:via-slate-950 dark:to-slate-950">
            <div className="space-y-3 px-4 py-4 sm:px-6 lg:px-8">
                {announcements.map((announcement) => {
                    const priorityClasses = announcement.priority === 'urgent'
                        ? 'border-rose-200 bg-rose-50/90 dark:border-rose-500/20 dark:bg-rose-500/10'
                        : announcement.priority === 'important'
                            ? 'border-amber-200 bg-amber-50/90 dark:border-amber-500/20 dark:bg-amber-500/10'
                            : 'border-cyan-200 bg-white/90 dark:border-cyan-500/20 dark:bg-slate-900/70';

                    return (
                        <section
                            key={announcement.id}
                            className={`rounded-2xl border px-4 py-4 shadow-sm backdrop-blur-sm ${priorityClasses}`}
                        >
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white dark:bg-cyan-600">
                                            <BellRing className="h-3.5 w-3.5" />
                                            Annonce globale
                                        </span>
                                        {announcement.is_pinned ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300">
                                                <Pin className="h-3.5 w-3.5" />
                                                Prioritaire
                                            </span>
                                        ) : null}
                                        {announcement.priority === 'urgent' ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-800 dark:bg-rose-500/15 dark:text-rose-300">
                                                <ShieldAlert className="h-3.5 w-3.5" />
                                                Urgent
                                            </span>
                                        ) : null}
                                        {announcement.priority === 'important' ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                                                <Crown className="h-3.5 w-3.5" />
                                                Important
                                            </span>
                                        ) : null}
                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                            {announcement.audience_label}
                                        </span>
                                    </div>

                                    <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">
                                        {announcement.title}
                                    </h3>

                                    <div className="mt-3">
                                        <RichTextContent html={announcement.content} compact />
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                                        {announcement.starts_at ? <span>Début: {formatDate(announcement.starts_at)}</span> : null}
                                        {announcement.ends_at ? <span>Fin: {formatDate(announcement.ends_at)}</span> : null}
                                        {announcement.is_read ? (
                                            <span className="font-semibold text-emerald-700 dark:text-emerald-300">Déjà lue</span>
                                        ) : (
                                            <span>Non lue</span>
                                        )}
                                        {announcement.is_acknowledged ? (
                                            <span className="font-semibold text-emerald-700 dark:text-emerald-300">Accusé enregistré</span>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 xl:w-[260px] xl:justify-end">
                                    {!announcement.is_read ? (
                                        <button
                                            type="button"
                                            onClick={() => router.post(route('announcements.read', announcement.id), {}, { preserveScroll: true, preserveState: true })}
                                            className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300"
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                            Marquer comme lue
                                        </button>
                                    ) : null}

                                    {announcement.requires_acknowledgement && !announcement.is_acknowledged ? (
                                        <button
                                            type="button"
                                            onClick={() => router.post(route('announcements.acknowledge', announcement.id), {}, { preserveScroll: true, preserveState: true })}
                                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-cyan-600 dark:hover:bg-cyan-500"
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                            Accuser réception
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    );
}
