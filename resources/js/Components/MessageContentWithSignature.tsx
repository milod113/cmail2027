import { Building2, Mail, Phone, Sparkles } from 'lucide-react';
import type { ComponentType } from 'react';

type MessageContentWithSignatureProps = {
    content: string;
    className?: string;
};

type ParsedSignature = {
    body: string;
    signature: {
        name: string;
        title: string | null;
        department: string | null;
        institution: string | null;
        contactLine: string | null;
        email: string | null;
        phone: string | null;
        notes: string[];
    } | null;
};

function extractSignature(content: string): ParsedSignature {
    const normalized = content
        .replace(/\\n/g, '\n')
        .replace(/\r\n?/g, '\n')
        .trim();

    if (normalized === '') {
        return { body: '', signature: null };
    }

    const lines = normalized
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

    if (lines.length < 3) {
        return { body: normalized, signature: null };
    }

    const signatureStart = findSignatureStart(lines);

    if (signatureStart === -1) {
        return { body: normalized, signature: null };
    }

    const body = lines.slice(0, signatureStart).join('\n\n').trim();
    const signatureLines = lines.slice(signatureStart);
    const name = signatureLines[0]?.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();

    if (!name) {
        return { body: normalized, signature: null };
    }

    const title = signatureLines[1] ?? null;
    const department = signatureLines[2] ?? null;
    const institution = signatureLines[3] ?? null;
    const contactLine = signatureLines[4] ?? null;
    const notes = signatureLines.slice(5);

    const contactParts = (contactLine ?? '')
        .split('|')
        .map((part) => part.trim())
        .filter(Boolean);

    const email = contactParts.find((part) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(part)) ?? null;
    const phone = contactParts.find((part) => part !== email) ?? null;

    return {
        body,
        signature: {
            name,
            title,
            department,
            institution,
            contactLine,
            email,
            phone,
            notes,
        },
    };
}

function findSignatureStart(lines: string[]): number {
    for (let index = lines.length - 1; index >= 0; index -= 1) {
        const candidate = lines[index];
        const isMarkdownName = /^\*\*[^*\n]+\*\*$/.test(candidate);

        if (!isMarkdownName) {
            continue;
        }

        const trailing = lines.slice(index + 1);

        if (trailing.length >= 2 && trailing.some((line) => /chu|@|\|/i.test(line))) {
            return index;
        }
    }

    return -1;
}

function ContactPill({
    icon: Icon,
    label,
    value,
}: {
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-sm dark:border-slate-700/80 dark:bg-slate-950/40">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                <Icon className="h-3.5 w-3.5 text-cyan-500 dark:text-cyan-300" />
                <span>{label}</span>
            </div>
            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">{value}</p>
        </div>
    );
}

export default function MessageContentWithSignature({
    content,
    className = '',
}: MessageContentWithSignatureProps) {
    const { body, signature } = extractSignature(content);
    const initials = signature?.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');

    return (
        <div className={className}>
            {body ? <p className="whitespace-pre-wrap text-start">{body}</p> : null}

            {signature ? (
                <div className={`${body ? 'mt-6' : ''} overflow-hidden rounded-[28px] border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-sky-50/70 shadow-lg shadow-cyan-100/50 dark:border-cyan-500/20 dark:from-cyan-500/10 dark:via-slate-900/90 dark:to-sky-500/10 dark:shadow-none`}>
                    <div className="border-b border-cyan-100/80 bg-white/70 px-5 py-4 backdrop-blur-sm dark:border-cyan-500/10 dark:bg-slate-950/30">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 text-sm font-bold text-white shadow-md shadow-cyan-500/25">
                                    {initials || 'SG'}
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-base font-semibold text-slate-900 dark:text-white">{signature.name}</p>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-2.5 py-1 text-[11px] font-semibold text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300">
                                            <Sparkles className="h-3 w-3" />
                                            Signature
                                        </span>
                                    </div>
                                    {signature.title ? (
                                        <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">{signature.title}</p>
                                    ) : null}
                                    {signature.department ? (
                                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{signature.department}</p>
                                    ) : null}
                                    {signature.institution ? (
                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{signature.institution}</p>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 px-5 py-5">
                        {signature.contactLine ? (
                            <div className="rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200">
                                {signature.contactLine}
                            </div>
                        ) : null}

                        <div className="grid gap-3 md:grid-cols-2">
                            {signature.department ? <ContactPill icon={Building2} label="Service" value={signature.department} /> : null}
                            {signature.phone ? <ContactPill icon={Phone} label="Telephone" value={signature.phone} /> : null}
                            {signature.email ? <ContactPill icon={Mail} label="Email" value={signature.email} /> : null}
                        </div>

                        {signature.notes.length > 0 ? (
                            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 text-sm text-slate-600 shadow-sm dark:border-slate-700/80 dark:bg-slate-950/40 dark:text-slate-300">
                                <p className="whitespace-pre-wrap">{signature.notes.join('\n\n')}</p>
                            </div>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
