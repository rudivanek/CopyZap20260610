/**
 * Structural validity gate — language-independent.
 *
 * Decides whether a piece of copy is STRUCTURALLY COMPLETE enough to be ranked,
 * separate from how GOOD it is. A variant that fails the gate (truncated, or with
 * a duplicated passage) is marked "incomplete" and excluded from ranking rather
 * than scored — this is what stops a broken variant (e.g. a compile that repeats
 * its intro three times) from placing in the results.
 *
 * Signals, both deterministic and language-agnostic:
 *  - repeated_passage: the same sentence opening appears more than once
 *  - too_short: word count is under 40% of target (genuine truncation, not just concise)
 * Word counting is skipped for non-space-delimited scripts (e.g. CJK) to avoid
 * false flags there.
 */
export interface GateResult {
  valid: boolean;
  words: number;
  flags: string[];
}
export function structuralGate(text: string, targetWords?: number): GateResult {
  const flags: string[] = [];
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  // Word count — space-based; skip when text is not space-delimited (e.g. CJK).
  const spaceCount = (clean.match(/ /g) || []).length;
  const looksSpaceDelimited = clean.length === 0 || spaceCount >= clean.length / 25;
  const words = clean ? clean.split(' ').filter(Boolean).length : 0;
  if (targetWords && looksSpaceDelimited && words > 0 && words < targetWords * 0.4) {
    flags.push(`too_short:${words}<${Math.round(targetWords * 0.4)}`);
  }
  // Repeated passage — any sentence whose first 60 characters appear more than once.
  const sentences = clean
    .split(/(?<=[.!?。！？])\s+/)
    .map(s => s.trim().toLowerCase())
    .filter(s => s.length >= 40);
  const seen = new Set<string>();
  let repeated = false;
  for (const s of sentences) {
    const key = s.slice(0, 60);
    if (seen.has(key)) { repeated = true; break; }
    seen.add(key);
  }
  if (repeated) flags.push('repeated_passage');
  return { valid: flags.length === 0, words, flags };
}
