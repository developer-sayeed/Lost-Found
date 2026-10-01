import React, { useRef } from 'react';
import {
  Bold,
  Italic,
  Minus,
  Plus,
  Sparkles,
  Type
} from 'lucide-react';
import { RichTextRenderer } from './RichTextRenderer';

interface RichTextControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isBold?: boolean;
  onBoldToggle?: (bold: boolean) => void;
  isItalic?: boolean;
  onItalicToggle?: (italic: boolean) => void;
  fontSize?: number;
  onFontSizeChange?: (size: number) => void;
  minFontSize?: number;
  maxFontSize?: number;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  helperText?: string;
  quickTags?: Array<{ label: string; tag: string }>;
  id?: string;
}

export const RichTextControl: React.FC<RichTextControlProps> = ({
  label,
  value,
  onChange,
  isBold = false,
  onBoldToggle,
  isItalic = false,
  onItalicToggle,
  fontSize,
  onFontSizeChange,
  minFontSize = 10,
  maxFontSize = 56,
  multiline = false,
  rows = 3,
  placeholder = '',
  helperText,
  quickTags = [],
  id
}) => {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const handleWrapSelection = (tag: 'b' | 'i') => {
    const el = inputRef.current;
    if (!el) return;

    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;

    if (start === end) {
      // No text selected: toggle whole field flag if available, else insert tags
      if (tag === 'b' && onBoldToggle) {
        onBoldToggle(!isBold);
      } else if (tag === 'i' && onItalicToggle) {
        onItalicToggle(!isItalic);
      } else {
        const textBefore = value.substring(0, start);
        const textAfter = value.substring(end);
        const newText = `${textBefore}<${tag}>sample</${tag}>${textAfter}`;
        onChange(newText);
      }
      return;
    }

    const selectedText = value.substring(start, end);
    const textBefore = value.substring(0, start);
    const textAfter = value.substring(end);

    // If already wrapped in this tag, unwrap it
    const openTag = `<${tag}>`;
    const closeTag = `</${tag}>`;
    let newText = '';

    if (selectedText.startsWith(openTag) && selectedText.endsWith(closeTag)) {
      newText = `${textBefore}${selectedText.slice(openTag.length, -closeTag.length)}${textAfter}`;
    } else {
      newText = `${textBefore}<${tag}>${selectedText}</${tag}>${textAfter}`;
    }

    onChange(newText);
    setTimeout(() => {
      if (el) {
        el.focus();
        el.setSelectionRange(start, start + newText.length - textBefore.length - textAfter.length);
      }
    }, 50);
  };

  const handleInsertTag = (tag: string) => {
    const el = inputRef.current;
    if (!el) {
      onChange(value + tag);
      return;
    }
    const start = el.selectionStart || value.length;
    const end = el.selectionEnd || value.length;
    const newText = value.substring(0, start) + tag + value.substring(end);
    onChange(newText);
    setTimeout(() => {
      if (el) {
        el.focus();
        el.setSelectionRange(start + tag.length, start + tag.length);
      }
    }, 50);
  };

  return (
    <div className="space-y-1.5" id={id ? `${id}-container` : undefined}>
      {/* Label and Toolbar Row */}
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <span>{label}</span>
          {(isBold || isItalic || (fontSize && fontSize > 0)) && (
            <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
              Styled
            </span>
          )}
        </label>

        {/* Rich Text Toolbar Controls */}
        <div className="flex items-center gap-1 bg-slate-100/90 p-0.5 rounded-lg border border-slate-200 text-xs">
          {/* Bold Button */}
          <button
            type="button"
            onClick={() => {
              if (onBoldToggle) {
                onBoldToggle(!isBold);
              } else {
                handleWrapSelection('b');
              }
            }}
            title={isBold ? 'Remove Bold' : 'Make Bold (<b>)'}
            className={`p-1.5 rounded transition-all cursor-pointer ${
              isBold
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          {/* Italic Button */}
          <button
            type="button"
            onClick={() => {
              if (onItalicToggle) {
                onItalicToggle(!isItalic);
              } else {
                handleWrapSelection('i');
              }
            }}
            title={isItalic ? 'Remove Italic' : 'Make Italic (<i>)'}
            className={`p-1.5 rounded transition-all cursor-pointer ${
              isItalic
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          {/* Font Size Stepper */}
          {fontSize !== undefined && onFontSizeChange && (
            <div className="flex items-center space-x-1 pl-1 border-l border-slate-200">
              <Type className="w-3 h-3 text-slate-400" />
              <button
                type="button"
                onClick={() => onFontSizeChange(Math.max(minFontSize, fontSize - 1))}
                disabled={fontSize <= minFontSize}
                className="p-1 rounded text-slate-600 hover:bg-slate-200/70 disabled:opacity-30 cursor-pointer"
                title="Decrease Font Size"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-[11px] font-mono font-semibold text-slate-700 min-w-[28px] text-center">
                {fontSize}px
              </span>
              <button
                type="button"
                onClick={() => onFontSizeChange(Math.min(maxFontSize, fontSize + 1))}
                disabled={fontSize >= maxFontSize}
                className="p-1 rounded text-slate-600 hover:bg-slate-200/70 disabled:opacity-30 cursor-pointer"
                title="Increase Font Size"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Input or Textarea */}
      <div className="relative">
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            placeholder={placeholder}
            className={`w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900 ${
              isBold ? 'font-bold' : 'font-normal'
            } ${isItalic ? 'italic' : 'not-italic'}`}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900 ${
              isBold ? 'font-bold' : 'font-normal'
            } ${isItalic ? 'italic' : 'not-italic'}`}
          />
        )}
      </div>

      {/* Quick Insert Placeholders & Helper Info */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
        {quickTags.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-slate-400 font-medium">Quick tags:</span>
            {quickTags.map((tag) => (
              <button
                key={tag.label}
                type="button"
                onClick={() => handleInsertTag(tag.tag)}
                className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-600 border border-slate-200 font-mono transition-colors cursor-pointer"
                title={`Insert ${tag.tag}`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        ) : helperText ? (
          <span className="text-slate-500">{helperText}</span>
        ) : (
          <span className="text-slate-400">
            Tip: Highlight text and click <b>B</b> or <i>I</i> to style specific words.
          </span>
        )}

        {/* Live formatted mini preview */}
        {value && (
          <div className="text-[10px] text-slate-500 truncate max-w-[220px]">
            Preview: <RichTextRenderer text={value} isBold={isBold} isItalic={isItalic} className="text-slate-800" />
          </div>
        )}
      </div>
    </div>
  );
};
