import React from 'react';

/**
 * One choice out of a few, shown with a square marker.
 *
 * Used where Quick offered a row of large buttons: the goal on the start form
 * and "Improve / Keep as is / Leave out" for each part of a page. It is a real
 * radio button under the square, so the arrow keys move between the choices of
 * one group and a screen reader announces "1 of 5".
 *
 * The marker is drawn by the box itself: its background is clipped to the area
 * inside its padding, so a checked box shows a filled square inside the frame.
 *
 * A checked marker is orange, one step darker than the orange of the main
 * button (primary-600, not 500): on white, primary-500 has a contrast of 2.8
 * to 1, too little for a mark this small; primary-600 has 3.5 to 1.
 */
interface SquareRadioProps {
  /** The same for all choices of one group. */
  name: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
  className?: string;
  /** Shown when the pointer rests on the choice or it is reached with the Tab key (see QuickTips.tsx). */
  tip?: string;
}

const MARKER =
  'w-[18px] h-[18px] shrink-0 border-2 p-[3px] bg-clip-content ' +
  'border-gray-500 dark:border-gray-400 ' +
  'peer-checked:border-primary-600 peer-checked:bg-primary-600 ' +
  'dark:peer-checked:border-primary-400 dark:peer-checked:bg-primary-400 ' +
  'peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2 ' +
  'dark:peer-focus-visible:ring-offset-gray-900';

const SquareRadio: React.FC<SquareRadioProps> = ({ name, checked, onChange, children, className, tip }) => (
  <label data-tip={tip} className={'flex items-center gap-2.5 min-h-[44px] cursor-pointer ' + (className ?? '')}>
    <input type="radio" name={name} checked={checked} onChange={onChange} className="peer sr-only" />
    <span aria-hidden="true" className={MARKER} />
    {children}
  </label>
);

export default SquareRadio;
