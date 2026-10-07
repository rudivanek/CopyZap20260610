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
 * Other findings (a version cut short) are untouched.
 */
import type { GateResult } from '../utils/structuralGate';
import { ORIGINAL_VERSION_ID } from './pickWinner';

const REPEATED = 'repeated_passage';

export function effectiveGates(
  gateByVersion: Record<string, GateResult> | null | undefined
): Record<string, GateResult> {
  const gates = gateByVersion ?? {};
  const original = gates[ORIGINAL_VERSION_ID];
  if (!original || !original.flags.includes(REPEATED)) return gates;

  const result: Record<string, GateResult> = {};
  for (const [id, gate] of Object.entries(gates)) {
    const flags = gate.flags.filter(flag => flag !== REPEATED);
    result[id] = { ...gate, flags, valid: flags.length === 0 };
  }
  return result;
}
