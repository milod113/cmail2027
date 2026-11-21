import { FileSearch } from 'lucide-react';
import { Fragment, type ReactNode } from 'react';

/** Minuscules sans accents, caractère par caractère (même longueur que le texte). */
function fold(value: string): string {
    return Array.from(value)
        .map((char) => {
            const base = char.toLowerCase().normalize('NFD').replace(/\p{Mn}+/gu, '');
            return base.length === 1 ? base : char.toLowerCase();
        })
        .join('');
}

/** Surligne chaque mot recherché (sans tenir compte des accents ni des majuscules). */
export function highlight(text: string, terms: string[]): ReactNode[] {
    const chars = Array.from(text);
    const haystack = fold(text);
    const marks = new Array<boolean>(chars.length).fill(false);

    for (const term of terms) {
        const needle = fold(term.trim());
        if (needle.length === 0) continue;
        let from = 0;
        for (;;) {
            const at = haystack.indexOf(needle, from);
            if (at === -1) break;
            // indexOf compte en unités UTF-16 : on reconvertit en index de caractères
            const start = Array.from(haystack.slice(0, at)).length;
            const length = Array.from(needle).length;
            for (let i = start; i < start + length && i < marks.length; i += 1) marks[i] = true;
            from = at + needle.length;
        }
    }

    const parts: ReactNode[] = [];
    let buffer = '';
    let marked = false;
    const flush = (key: number) => {
        if (buffer === '') return;
        parts.push(
            marked ? (
                <mark key={key} className="rounded px-0.5 font-semibold" style={{ backgroundColor: '#FFF7ED', color: '#FF6B00' }}>
                    {buffer}
                </mark>
            ) : (
                <Fragment key={key}>{buffer}</Fragment>
            ),
        );
        buffer = '';
    };
    chars.forEach((char, index) => {
        if (marks[index] !== marked) {
            flush(index);
            marked = marks[index];
        }
        buffer += char;
    });
    flush(chars.length);

    return parts;
}

/** Badge « Trouvé dans le document scanné / la pièce jointe » + extrait avec le mot surligné. */
export default function OcrSnippet({ snippet, terms, kind = 'scan' }: { snippet: string; terms: string[]; kind?: 'scan' | 'document' | null }) {
    return (
        <div className="mt-3 rounded-xl border px-3 py-2" style={{ borderColor: '#FED7AA', backgroundColor: '#FFFBF5' }}>
            <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold"
                style={{ backgroundColor: '#FFF7ED', color: '#EA580C' }}
            >
                <FileSearch className="h-3.5 w-3.5" />
                {kind === 'document' ? '📎 Trouvé dans la pièce jointe' : '📄 Trouvé dans le document scanné'}
            </span>
            <p className="mt-1.5 text-sm italic leading-relaxed text-slate-600 dark:text-slate-300" dir="auto">
                {highlight(snippet, terms)}
            </p>
        </div>
    );
}
