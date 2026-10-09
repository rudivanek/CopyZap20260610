/**
 * Quick — stopping a process.
 *
 * The user can stop any process from its working window. Stopping does two
 * things:
 *
 *  - the screen goes back at once and ignores whatever the process still
 *    returns (QuickPage does that);
 *  - no further step is started. A step that is already with the model cannot
 *    be recalled: it finishes, and is charged, but nothing follows it.
 *
 * Quick's own steps are told through an AbortSignal. The writer is shared with
 * Copy Maker and knows only the tracking session, so it asks here, by session,
 * whether that session was stopped since the writer started. Work that starts
 * after a stop, on the same session, is not affected.
 */

/** Thrown by a step that finds its process stopped. Never shown to the user. */
export class QuickStoppedError extends Error {
  constructor() {
    super('Stopped.');
    this.name = 'QuickStoppedError';
  }
}

/** Throws when the user has stopped the process. Called before a step starts. */
export function throwIfStopped(signal?: AbortSignal): void {
  if (signal?.aborted) throw new QuickStoppedError();
}

// The sessions that were stopped, each with the moment of its last stop. The
// moments come from a counter, not a clock: two events never share one.
const stoppedAt = new Map<string, number>();
let moment = 0;

/** The moment a piece of work starts. Handed back to throwIfSessionStopped. */
export function stopMark(): number {
  moment += 1;
  return moment;
}

/** Records that the session was stopped now. */
export function stopSession(sessionId: string): void {
  moment += 1;
  stoppedAt.set(sessionId, moment);
}

/** Throws when the session was stopped after `mark`. */
export function throwIfSessionStopped(sessionId: string | undefined, mark: number): void {
  if (sessionId && (stoppedAt.get(sessionId) ?? 0) > mark) throw new QuickStoppedError();
}

/** Stops the session when the signal says stop, so the writer hears of it too. */
export function stopSessionWith(signal: AbortSignal | undefined, sessionId: string | undefined): void {
  if (!signal || !sessionId) return;
  if (signal.aborted) {
    stopSession(sessionId);
    return;
  }
  signal.addEventListener('abort', () => stopSession(sessionId), { once: true });
}
