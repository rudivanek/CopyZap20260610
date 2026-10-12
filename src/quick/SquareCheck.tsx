import React from 'react';

/**
 * A square tick box: one of several things that can be chosen together.
 *
 * It looks like SquareRadio (one choice out of a few) on purpose, with one
 * difference that tells the two apart: a chosen SquareRadio shows a filled
 * square, a chosen SquareCheck is filled and shows a tick. It is a real
 * checkbox under the square, so the space bar ticks it and a screen reader
 * says "checked" or "not checked".
 *
 * The orange is the same as SquareRadio's (primary-600; see the note there).
 */
interface SquareCheckProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  /** Shown when the pointer rests on the tick box or it is reached with the Tab key (see QuickTips.tsx). */
  tip?: string;
}

const FRAME =
  'w-[18px] h-[18px] shrink-0 border-2 flex items-center justify-center ' +
  'peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2 ' +
  'dark:peer-focus-visible:ring-offset-gray-900 ';
const OFF = 'border-gray-500 dark:border-gray-400';
const ON = 'border-primary-600 bg-primary-600 dark:border-primary-400 dark:bg-primary-400';

const SquareCheck: React.FC<SquareCheckProps> = ({ checked, onChange, disabled, children, className, tip }) => (
  <label
    data-tip={tip}
    className={
      'flex items-center gap-2.5 min-h-[44px] ' +
      (disabled ? 'opacity-50 cursor-not-allowed ' : 'cursor-pointer ') +
      (className ?? '')
    }
  >
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={event => onChange(event.target.checked)}
      className="peer sr-only"
    />
    <span aria-hidden="true" className={FRAME + (checked ? ON : OFF)}>
      {checked && (
        <svg viewBox="0 0 12 12" className="w-3 h-3 text-white dark:text-gray-900" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M2 6.4 4.8 9 10 3.2" strokeLinecap="square" />
        </svg>
      )}
    </span>
    {children}
  </label>
);

export default SquareCheck;
