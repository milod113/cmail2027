import { normalizeRichTextContent } from '@/Utils/richText';

type RichTextContentProps = {
    html: string;
    compact?: boolean;
    collapsed?: boolean;
};

export default function RichTextContent({ html, compact = false, collapsed = false }: RichTextContentProps) {
    return (
        <div
            className={`relative ${
                compact ? 'text-sm leading-7' : 'text-base leading-8'
            } text-slate-700 dark:text-slate-300 ${
                collapsed ? 'max-h-36 overflow-hidden' : ''
            } [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-cyan-200 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_li]:my-1 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-4 [&_strong]:font-bold [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6`}
            dangerouslySetInnerHTML={{ __html: normalizeRichTextContent(html) }}
        />
    );
}
