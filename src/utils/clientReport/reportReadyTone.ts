/**
 * A short, soft two-note chime for when a client report finishes generating.
 *
 * Synthesised with the Web Audio API rather than shipping an audio asset: no
 * file to bundle, no network fetch, and nothing to go missing from /public.
 *
 * Deliberately quiet and short (~0.35s). This fires on a report the operator
 * asked for, so it should read as "done" — not as an alert.
 */
export function playReportReadyTone(): void {
  try {
    const Ctor: typeof AudioContext | undefined =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return;

    const ctx = new Ctor();
    // Export is a user gesture, so the context should already be running; on
    // the browsers that still start it suspended, this resolves it.
    if (ctx.state === 'suspended') void ctx.resume();

    const now = ctx.currentTime;
    // A perfect fifth, G5 → D6. Rising reads as completion; a falling
    // interval reads as an error, which is not what happened.
    const notes: Array<[number, number]> = [
      [784.0, 0.0],
      [1174.7, 0.12],
    ];

    for (const [freq, offset] of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      // Sine only: no harmonics, so it stays soft in a quiet office.
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + offset;
      // Short fade in and out — a hard start/stop on a sine produces an
      // audible click.
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.09, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.25);
    }

    // Release the hardware once the tone has finished. Browsers cap the number
    // of live AudioContexts, and exports happen many times per session.
    window.setTimeout(() => { void ctx.close().catch(() => {}); }, 800);
  } catch {
    // Audio is a nicety. It must never be able to break an export.
  }
}