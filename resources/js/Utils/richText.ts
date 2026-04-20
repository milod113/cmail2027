export function plainTextToHtml(text: string): string {
    const trimmed = text.trim();

    if (trimmed === '') {
        return '';
    }

    return trimmed
        .split(/\n{2,}/)
        .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
        .join('');
}

export function normalizeRichTextContent(content: string): string {
    if (looksLikeHtml(content)) {
        return content;
    }

    return plainTextToHtml(content);
}

export function richTextToPlainText(content: string): string {
    return normalizeRichTextContent(content)
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|h2|h3|h4|blockquote|li)>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]{2,}/g, ' ')
        .trim();
}

function looksLikeHtml(value: string): boolean {
    return /<\s*[a-z][^>]*>/i.test(value);
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
