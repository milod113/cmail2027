import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { useEffect } from 'react';
import { normalizeRichTextContent, richTextToPlainText } from '@/Utils/richText';

type RichTextEditorProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    minHeightClassName?: string;
};

type ToolbarButtonProps = {
    active?: boolean;
    disabled?: boolean;
    label: string;
    onClick: () => void;
};

function ToolbarButton({ active = false, disabled = false, label, onClick }: ToolbarButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                active
                    ? 'border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-500/40 dark:bg-cyan-500/10 dark:text-cyan-300'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900'
            }`}
        >
            {label}
        </button>
    );
}

export default function RichTextEditor({
    value,
    onChange,
    placeholder = 'Ecrivez votre contenu...',
    minHeightClassName = 'min-h-[220px]',
}: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [2, 3],
                },
            }),
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
                alignments: ['left', 'center', 'right', 'justify'],
            }),
        ],
        content: normalizeRichTextContent(value),
        immediatelyRender: false,
        onUpdate: ({ editor: currentEditor }) => {
            onChange(currentEditor.getHTML());
        },
        editorProps: {
            attributes: {
                class: `${minHeightClassName} rounded-b-2xl px-4 py-4 text-sm leading-7 text-slate-900 focus:outline-none dark:text-slate-100`,
            },
        },
    });

    useEffect(() => {
        if (!editor) {
            return;
        }

        const normalizedIncoming = normalizeRichTextContent(value);

        if (editor.getHTML() !== normalizedIncoming) {
            editor.commands.setContent(normalizedIncoming, { emitUpdate: false });
        }
    }, [editor, value]);

    if (!editor) {
        return null;
    }

    const isEmpty = richTextToPlainText(editor.getHTML()) === '';

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
            <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
                <ToolbarButton label="B" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
                <ToolbarButton label="I" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
                <ToolbarButton label="U" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} />
                <ToolbarButton label="P" active={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()} />
                <ToolbarButton label="H2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
                <ToolbarButton label="H3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
                <ToolbarButton label="Liste puces" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
                <ToolbarButton label="1. Liste" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
                <ToolbarButton label="G" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} />
                <ToolbarButton label="C" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} />
                <ToolbarButton label="D" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} />
                <ToolbarButton label="J" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()} />
            </div>

            <div className="relative">
                <EditorContent
                    editor={editor}
                    className="[&_blockquote]:border-l-4 [&_blockquote]:border-cyan-200 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-item [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_strong]:font-bold [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5"
                />
                {isEmpty ? (
                    <div className="pointer-events-none absolute left-4 top-4 text-sm text-slate-400 dark:text-slate-500">
                        {placeholder}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
