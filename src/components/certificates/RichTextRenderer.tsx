import React from 'react';

interface RichTextRendererProps {
  text?: string;
  isBold?: boolean;
  isItalic?: boolean;
  fontSize?: number | string;
  fontFamily?: string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4';
}

/**
 * Safely parses inline rich formatting:
 * - <b>bold</b> or <strong>bold</strong> or **bold**
 * - <i>italic</i> or <em>italic</em> or *italic*
 * - Combination of bold and italic
 * Returns clean React elements without danger of script injection.
 */
function parseRichInline(text: string): React.ReactNode[] {
  if (!text) return [];

  // Tokenize bold and italic tags: <b>, </b>, <strong>, </strong>, <i>, </i>, <em>, </em>, **, *
  // Regex that matches markdown or html tags
  const regex = /(<b>[\s\S]*?<\/b>|<strong>[\s\S]*?<\/strong>|\*\*[\s\S]*?\*\*|<i>[\s\S]*?<\/i>|<em>[\s\S]*?<\/em>|\*[\s\S]*?\*)/g;

  const parts = text.split(regex);
  const elements: React.ReactNode[] = [];

  parts.forEach((part, index) => {
    if (!part) return;

    // Check if it's bold (HTML or Markdown)
    if (
      (part.startsWith('<b>') && part.endsWith('</b>')) ||
      (part.startsWith('<strong>') && part.endsWith('</strong>'))
    ) {
      const inner = part.replace(/^<b(>|lock>)|<strong(>|lock>)/, '').replace(/<\/b>|<\/strong>$/, '');
      elements.push(
        <strong key={index} className="font-bold">
          {parseRichInline(inner)}
        </strong>
      );
    } else if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const inner = part.slice(2, -2);
      elements.push(
        <strong key={index} className="font-bold">
          {parseRichInline(inner)}
        </strong>
      );
    }
    // Check if it's italic (HTML or Markdown)
    else if (
      (part.startsWith('<i>') && part.endsWith('</i>')) ||
      (part.startsWith('<em>') && part.endsWith('</em>'))
    ) {
      const inner = part.replace(/^<i(>|lock>)|<em(>|lock>)/, '').replace(/<\/i>|<\/em>$/, '');
      elements.push(
        <em key={index} className="italic">
          {parseRichInline(inner)}
        </em>
      );
    } else if (part.startsWith('*') && part.endsWith('*') && part.length >= 2 && !part.startsWith('**')) {
      const inner = part.slice(1, -1);
      elements.push(
        <em key={index} className="italic">
          {parseRichInline(inner)}
        </em>
      );
    } else {
      elements.push(part);
    }
  });

  return elements;
}

export const RichTextRenderer: React.FC<RichTextRendererProps> = ({
  text = '',
  isBold,
  isItalic,
  fontSize,
  fontFamily,
  color,
  className = '',
  style = {},
  as: Component = 'span'
}) => {
  const mergedStyle: React.CSSProperties = {
    ...style,
    ...(fontSize !== undefined
      ? { fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize }
      : {}),
    ...(fontFamily ? { fontFamily } : {}),
    ...(color ? { color } : {}),
    ...(isBold ? { fontWeight: 'bold' } : {}),
    ...(isItalic ? { fontStyle: 'italic' } : {})
  };

  const parsedNodes = parseRichInline(text);

  return (
    <Component className={className} style={mergedStyle}>
      {parsedNodes}
    </Component>
  );
};
