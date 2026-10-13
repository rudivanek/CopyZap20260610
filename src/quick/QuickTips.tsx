import React, { useEffect } from 'react';

/**
 * Quick — shows the tip of a control (its data-tip attribute; texts in tips.ts).
 *
 * The tip appears when the mouse rests on the control for a moment, or at once
 * when the control is reached with the Tab key. It goes away when the pointer
 * leaves, on a click, on Escape, while typing, and when the page scrolls. A
 * tap on a phone shows nothing: there the screen and Help must say it all.
 *
 * One tip box serves the whole page, so a control only needs the attribute:
 * nothing is wrapped and no layout changes. While the tip of a control that
 * has the keyboard focus is shown, the control points to it with
 * aria-describedby, so a screen reader reads it too.
 *
 * Mounted once, in QuickPage.
 */

const TIP_ID = 'quick-tip';
/** How long the mouse rests on a control before its tip appears. */
const HOVER_DELAY_MS = 500;
/** Room between the tip and the control, and between the tip and the window edge. */
const GAP = 8;

const BOX =
  'fixed z-[60] max-w-[280px] px-3 py-2 text-sm leading-snug font-normal text-left normal-case break-words ' +
  'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 shadow-lg pointer-events-none';

const QuickTips: React.FC = () => {
  useEffect(() => {
    const box = document.createElement('div');
    box.id = TIP_ID;
    box.setAttribute('role', 'tooltip');
    box.className = BOX;
    box.hidden = true;
    document.body.appendChild(box);

    let timer = 0;
    let owner: HTMLElement | null = null;
    let described: HTMLElement | null = null;

    const tipOf = (target: EventTarget | null): HTMLElement | null =>
      target instanceof Element ? (target.closest('[data-tip]') as HTMLElement | null) : null;

    const unlink = () => {
      if (!described) return;
      const rest = (described.getAttribute('aria-describedby') || '')
        .split(/\s+/)
        .filter(id => id && id !== TIP_ID);
      if (rest.length > 0) described.setAttribute('aria-describedby', rest.join(' '));
      else described.removeAttribute('aria-describedby');
      described = null;
    };

    const hide = () => {
      window.clearTimeout(timer);
      box.hidden = true;
      owner = null;
      unlink();
    };

    const show = (element: HTMLElement, focused: HTMLElement | null) => {
      const text = element.getAttribute('data-tip');
      if (!text) return;
      owner = element;
      box.textContent = text;
      box.hidden = false;
      // Above the control, starting at its left edge; below it when there is no room above.
      const rect = element.getBoundingClientRect();
      const width = box.offsetWidth;
      const height = box.offsetHeight;
      const left = Math.max(GAP, Math.min(rect.left, window.innerWidth - width - GAP));
      const top = rect.top - height - GAP >= GAP ? rect.top - height - GAP : rect.bottom + GAP;
      box.style.left = `${Math.round(left)}px`;
      box.style.top = `${Math.round(top)}px`;
      if (focused) {
        unlink();
        described = focused;
        const ids = (focused.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
        focused.setAttribute('aria-describedby', [...ids, TIP_ID].join(' '));
      }
    };

    const onPointerOver = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      const element = tipOf(event.target);
      if (!element || element === owner) return;
      hide();
      owner = element;
      timer = window.setTimeout(() => {
        if (owner === element && element.isConnected) show(element, null);
      }, HOVER_DELAY_MS);
    };

    const onPointerOut = (event: PointerEvent) => {
      if (!owner || described) return;
      const next = event.relatedTarget;
      if (next instanceof Node && owner.contains(next)) return;
      hide();
    };

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      const element = tipOf(target);
      if (!element || !(target instanceof HTMLElement)) return;
      // Only when the focus came from the keyboard; a click already shows what it does.
      let byKeyboard = false;
      try {
        byKeyboard = target.matches(':focus-visible');
      } catch {
        byKeyboard = false;
      }
      if (!byKeyboard) return;
      hide();
      show(element, target);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (box.hidden) return;
      // Escape closes the tip; typing closes it so it does not cover what is written.
      if (event.key === 'Escape' || event.key.length === 1 || event.key === 'Backspace') hide();
    };

    document.addEventListener('pointerover', onPointerOver);
    document.addEventListener('pointerout', onPointerOut);
    document.addEventListener('pointerdown', hide);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', hide);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    return () => {
      hide();
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('pointerout', onPointerOut);
      document.removeEventListener('pointerdown', hide);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', hide);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
      box.remove();
    };
  }, []);

  return null;
};

export default QuickTips;
