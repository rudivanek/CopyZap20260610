/**
 * Whether a user has already closed the "How it works" explanation, kept per
 * user in this browser.
 */

const STORAGE_PREFIX = 'cz_intro_seen:';

/** True when this user has closed the explanation before, in this browser. */
export function hasSeenIntro(userId: string): boolean {
  try {
    return localStorage.getItem(STORAGE_PREFIX + userId) === '1';
  } catch {
    // Storage not available: do not show it on every visit.
    return true;
  }
}

export function markIntroSeen(userId: string): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + userId, '1');
  } catch {
    // Nothing to do: it will simply show again next time.
  }
}
