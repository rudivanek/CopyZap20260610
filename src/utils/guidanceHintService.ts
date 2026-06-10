import { GuidanceHint, getHint } from '../config/guidanceHints';

const SHOWN_HINTS_KEY = 'guidance_hints_shown';

export interface GuidanceHintState {
  hintId: string;
  text: string;
  durationMs: number;
}

let currentHintListener: ((state: GuidanceHintState | null) => void) | null = null;

export const subscribeToGuidanceHints = (
  callback: (state: GuidanceHintState | null) => void
) => {
  currentHintListener = callback;
  return () => {
    currentHintListener = null;
  };
};

export const triggerGuidanceHint = (hintId: string): void => {
  const hint = getHint(hintId);

  if (!hint) {
    console.warn(`Guidance hint not found: ${hintId}`);
    return;
  }

  if (!hint.enabled) {
    return;
  }

  if (hint.once && hasBeenShown(hintId)) {
    return;
  }

  if (hint.once) {
    markAsShown(hintId);
  }

  if (currentHintListener) {
    currentHintListener({
      hintId,
      text: hint.text,
      durationMs: hint.durationMs,
    });
  }
};

export const dismissGuidanceHint = (): void => {
  if (currentHintListener) {
    currentHintListener(null);
  }
};

export const hasBeenShown = (hintId: string): boolean => {
  if (typeof window === 'undefined') return false;
  const shown = localStorage.getItem(SHOWN_HINTS_KEY);
  if (!shown) return false;
  const shownSet = JSON.parse(shown) as string[];
  return shownSet.includes(hintId);
};

export const markAsShown = (hintId: string): void => {
  if (typeof window === 'undefined') return;
  const shown = localStorage.getItem(SHOWN_HINTS_KEY);
  const shownSet = shown ? (JSON.parse(shown) as string[]) : [];
  if (!shownSet.includes(hintId)) {
    shownSet.push(hintId);
    localStorage.setItem(SHOWN_HINTS_KEY, JSON.stringify(shownSet));
  }
};

export const resetShownHints = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SHOWN_HINTS_KEY);
};

export const resetSpecificHint = (hintId: string): void => {
  if (typeof window === 'undefined') return;
  const shown = localStorage.getItem(SHOWN_HINTS_KEY);
  if (!shown) return;
  const shownSet = JSON.parse(shown) as string[];
  const filtered = shownSet.filter((id) => id !== hintId);
  if (filtered.length === 0) {
    localStorage.removeItem(SHOWN_HINTS_KEY);
  } else {
    localStorage.setItem(SHOWN_HINTS_KEY, JSON.stringify(filtered));
  }
};
