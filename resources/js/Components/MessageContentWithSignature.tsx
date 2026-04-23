import { BadgeCheck, BriefcaseBusiness, Building2, Mail, Phone, Sparkles } from 'lucide-react';
import type { ComponentType } from 'react';

type MessageContentWithSignatureProps = {
    content: string;
    className?: string;
};

type ParsedSignature = {
    body: string;
    signature: {
        name: string;
        roleName: string | null;
        title: string | null;
        department: string | null;
        phone: string | null;
        email: string | null;
        notes: string[];
    } | null;
};

function extractSignature(content: string): ParsedSignature {
    const normalized = content.replace(/\r\n?/g, '\n').trim();

    if (normalized === '') {
        return { body: '', signature: null };
    }

    const paragraphs = normalized
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);

    if (paragraphs.length < 2) {
        return { body: normalized, signature: null };
    }

    const signatureStart = findSignatureStart(paragraphs);

    if (signatureStart === -1) {
        return { body: normalized, signature: null };
    }

    const roleIndex = resolveRoleIndex(paragraphs, signatureStart);
    const signatureParts = paragraphs.slice(signatureStart);
    const name = signatureParts[0]?.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
    const roleName = roleIndex !== null ? paragraphs[roleIndex] : null;

    if (!name) {
        return { body: normalized, signature: null };
    }

    let title: string | null = null;
    let department: string | null = null;
    let phone: string | null = null;
    let email: string | null = null;
    const notes: string[] = [];

    signatureParts.slice(1).forEach((part) => {
        const cleaned = part.replace(/[^\p{L}\p{N}@+().\s-]/gu, '').trim();
        const digits = cleaned.replace(/\D/g, '');

        if (!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
            email = cleaned;
            return;
        }

        if (!phone && digits.length >= 8) {
            phone = cleaned.replace(/^(Telephone|Tel|Phone)\s*:?\s*/i, '').trim();
            return;
        }

        if (!title) {
            title = part;
            return;
        }

        if (!department) {
            department = part;
            return;
        }

        notes.push(part);
    });

    if (!roleName && !title && !department && !phone && !email) {
        return { body: normalized, signature: null };
    }

    return {
        body: paragraphs.slice(0, roleIndex ?? signatureStart).join('\n\n').trim(),
        signature: {
            name,
            roleName,
            title,
            department,
            phone,
            email,
            notes,
        },
    };
}

function findSignatureStart(paragraphs: string[]): number {
    for (let index = paragraphs.length - 2; index >= 0; index -= 1) {
        const candidate = paragraphs[index];
        const isMarkdownName = /^\*\*[^*\n]+\*\*$/.test(candidate);

        if (!isMarkdownName) {
            continue;
        }

        const trailingParts = paragraphs.slice(index + 1);

        if (
            trailingParts.length > 0 &&
            trailingParts.some((part) => /@|\d{8,}|telephone|tel|service|direction|departement|department/i.test(part))
        ) {
            return index;
        }

        if (trailingParts.length >= 2) {
            return index;
        }
    }

    return -1;
}

function resolveRoleIndex(paragraphs: string[], signatureStart: number): number | null {
    const candidateIndex = signatureStart - 1;

    if (candidateIndex < 0) {
        return null;
    }

    const candidate = paragraphs[candidateIndex]?.trim();

    if (!candidate) {
        return null;
    }

    if (
        candidate.length > 90 ||
        /[*@]/.test(candidate) ||
        /\d{6,}/.test(candidate) ||
        /[.!?]/.test(candidate)
    ) {
        return null;
    }

    return candidateIndex;
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

            {signature && (
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
                                    {(signature.title || signature.department) && (
                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                            {[signature.title, signature.department].filter(Boolean).join(' - ')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 px-5 py-5">
                        <div className="grid gap-3 md:grid-cols-2">
                            {signature.roleName && <ContactPill icon={BadgeCheck} label="Fonction" value={signature.roleName} />}
                            {signature.department && <ContactPill icon={Building2} label="Service" value={signature.department} />}
                            {signature.phone && <ContactPill icon={Phone} label="Telephone" value={signature.phone} />}
                            {signature.title && <ContactPill icon={BriefcaseBusiness} label="Poste" value={signature.title} />}
                            {signature.email && <ContactPill icon={Mail} label="Email" value={signature.email} />}
                        </div>

                        {signature.notes.length > 0 && (
                            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 text-sm text-slate-600 shadow-sm dark:border-slate-700/80 dark:bg-slate-950/40 dark:text-slate-300">
                                <p className="whitespace-pre-wrap">{signature.notes.join('\n\n')}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
