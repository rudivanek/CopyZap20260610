/**
 * Quick — how the structural check is read.
 *
 * The structural check (utils/structuralGate) looks at one text at a time and
 * flags a repeated paragraph. Quick sets a flagged version aside: it cannot be
 * the best version. That is right when the engine produced the repetition. It
 * is wrong when the original already has it, for example a page whose slider
 * keeps a second copy of its testimonials: every version inherits the repeated
 * block, because testimonials are put back word for word, and then every
 * version is set aside and the check says nothing at all.
 *
 * So: a repetition the original has itself is not held against a version.
 *
 * The check also flags a version that is much shorter than the original
 * ("too_short"), which catches a first version that was cut off. It is wrong
 * for a version the user asked for: a change ("Shorter") or the user's own
 * edit is short on purpose. Such a version is made from another version and
 * carries that version's id (sourceId); its length is not held against it.
 */
import type { GateResult } from '../utils/structuralGate';
import { ORIGINAL_VERSION_ID } from './pickWinner';

const REPEATED = 'repeated_passage';
const TOO_SHORT = 'too_short';

export function effectiveGates(
  gateByVersion: Record<string, GateResult> | null | undefined,
  /** The versions of the result. Needed to know which ones the user asked for; without them only the repetition rule applies. */
  versions?: { id: string; sourceId?: string }[]
): Record<string, GateResult> {
  const gates = gateByVersion ?? {};
  const originalRepeats = !!gates[ORIGINAL_VERSION_ID]?.flags.includes(REPEATED);
  const askedFor = new Set((versions ?? []).filter(version => version.sourceId).map(version => version.id));
  if (!originalRepeats && askedFor.size === 0) return gates;

  const result: Record<string, GateResult> = {};
  for (const [id, gate] of Object.entries(gates)) {
    const flags = gate.flags.filter(
      flag => !(originalRepeats && flag === REPEATED) && !(askedFor.has(id) && flag.startsWith(TOO_SHORT))
    );
    result[id] = { ...gate, flags, valid: flags.length === 0 };
  }
  return result;
}
