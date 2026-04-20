<?php

namespace App\Support;

use DOMDocument;
use DOMElement;
use DOMNode;
use DOMText;

class RichTextSanitizer
{
    /**
     * @var array<string, bool>
     */
    private const ALLOWED_TAGS = [
        'p' => true,
        'br' => true,
        'strong' => true,
        'b' => true,
        'em' => true,
        'i' => true,
        'u' => true,
        'ul' => true,
        'ol' => true,
        'li' => true,
        'h2' => true,
        'h3' => true,
        'h4' => true,
        'blockquote' => true,
        'div' => true,
        'span' => true,
    ];

    /**
     * @var array<string, bool>
     */
    private const ALLOWED_STYLE_TAGS = [
        'p' => true,
        'div' => true,
        'h2' => true,
        'h3' => true,
        'h4' => true,
        'blockquote' => true,
    ];

    public static function sanitize(?string $html): string
    {
        $html = trim((string) $html);

        if ($html === '') {
            return '';
        }

        if (! self::looksLikeHtml($html)) {
            return self::plainTextToHtml($html);
        }

        $internalErrors = libxml_use_internal_errors(true);

        $document = new DOMDocument('1.0', 'UTF-8');
        $document->loadHTML('<?xml encoding="UTF-8">'.$html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);

        foreach (iterator_to_array($document->childNodes) as $childNode) {
            self::sanitizeNode($childNode);
        }

        $sanitized = trim((string) $document->saveHTML());

        libxml_clear_errors();
        libxml_use_internal_errors($internalErrors);

        return $sanitized;
    }

    public static function plainText(?string $html): string
    {
        $html = trim((string) $html);

        if ($html === '') {
            return '';
        }

        return trim(preg_replace('/\s+/u', ' ', html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8')) ?? '');
    }

    private static function sanitizeNode(DOMNode $node): void
    {
        if ($node instanceof DOMText) {
            return;
        }

        if (! $node instanceof DOMElement) {
            if ($node->parentNode) {
                $node->parentNode->removeChild($node);
            }

            return;
        }

        $tagName = strtolower($node->tagName);

        if (in_array($tagName, ['script', 'style', 'iframe', 'object', 'embed'], true)) {
            if ($node->parentNode) {
                $node->parentNode->removeChild($node);
            }

            return;
        }

        if (! isset(self::ALLOWED_TAGS[$tagName])) {
            self::unwrapNode($node);

            return;
        }

        $originalStyle = $node->getAttribute('style');

        foreach (iterator_to_array($node->attributes ?? []) as $attribute) {
            $node->removeAttribute($attribute->nodeName);
        }

        if (isset(self::ALLOWED_STYLE_TAGS[$tagName])) {
            $textAlign = self::extractTextAlign($originalStyle);

            if ($textAlign !== null) {
                $node->setAttribute('style', "text-align: {$textAlign};");
            }
        }

        foreach (iterator_to_array($node->childNodes) as $childNode) {
            self::sanitizeNode($childNode);
        }
    }

    private static function unwrapNode(DOMElement $node): void
    {
        $parent = $node->parentNode;

        if (! $parent) {
            return;
        }

        while ($node->firstChild) {
            $parent->insertBefore($node->firstChild, $node);
        }

        $parent->removeChild($node);
    }

    private static function extractTextAlign(?string $style): ?string
    {
        $style = trim((string) $style);

        if ($style === '') {
            return null;
        }

        if (! preg_match('/text-align\s*:\s*(left|center|right|justify)/i', $style, $matches)) {
            return null;
        }

        return strtolower((string) ($matches[1] ?? ''));
    }

    private static function plainTextToHtml(string $text): string
    {
        $paragraphs = preg_split("/\R{2,}/u", trim($text)) ?: [];

        $html = collect($paragraphs)
            ->map(function (string $paragraph): string {
                $escaped = nl2br(e(trim($paragraph)));

                return $escaped === '' ? '' : "<p>{$escaped}</p>";
            })
            ->filter()
            ->implode('');

        return $html !== '' ? $html : '<p></p>';
    }

    private static function looksLikeHtml(string $value): bool
    {
        return preg_match('/<\s*[a-z][^>]*>/i', $value) === 1;
    }
}
