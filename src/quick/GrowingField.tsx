import React, { useLayoutEffect, useRef } from 'react';

/**
 * A one-line text field that grows with its text.
 *
 * Used for "Selling" and "For" on the check screen, where a single line cut
 * longer answers off ("servicios de conceptualizac…"). It starts at the height
 * of one line, grows to show the whole text up to MAX_LINES lines, and scrolls
 * inside after that. The text is one fact, so Enter adds no line break and a
 * pasted line break becomes a space.
 */
interface GrowingFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Shown on hover and keyboard focus (see QuickTips.tsx). */
  tip?: string;
  /** Most characters the field takes. */
  maxLength?: number;
  /** Called on Enter (the chat sends the answer with it). */
  onEnter?: () => void;
  disabled?: boolean;
}

/** Lines shown before the field scrolls inside. */
const MAX_LINES = 4;
/** One line of text, in pixels: the field's line-height (leading-6). */
const LINE_PX = 24;
/** Top and bottom padding plus border, in pixels (9 + 9 + 1 + 1), so one line is 44 pixels high like the other fields. */
const EDGE_PX = 20;

const GrowingField: React.FC<GrowingFieldProps> = ({ id, value, onChange, placeholder, className, tip, maxLength, onEnter, disabled }) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Fit the height to the text after every change, and when the width changes.
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const fit = () => {
      element.style.height = 'auto';
      const max = MAX_LINES * LINE_PX + EDGE_PX;
      const wanted = element.scrollHeight + (element.offsetHeight - element.clientHeight);
      element.style.height = `${Math.min(wanted, max)}px`;
      element.style.overflowY = wanted > max ? 'auto' : 'hidden';
    };
    fit();
    if (typeof ResizeObserver === 'undefined') return;
    let width = element.clientWidth;
    const observer = new ResizeObserver(() => {
      if (element.clientWidth !== width) {
        width = element.clientWidth;
        fit();
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [value]);

  return (
    <textarea
      ref={ref}
      id={id}
      rows={1}
      value={value}
      onChange={event => onChange(event.target.value.replace(/\s*[\r\n]+\s*/g, ' '))}
      onKeyDown={event => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        onEnter?.();
      }}
      data-tip={tip}
      placeholder={placeholder}
      maxLength={maxLength}
      disabled={disabled}
      className={'block resize-none py-[9px] leading-6 break-words ' + (className ?? '')}
    />
  );
};

export default GrowingField;
