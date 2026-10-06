export interface GateResult {
  valid: boolean;
  words: number;
  flags: string[];
}
export function structuralGate(text: string, targetWords?: number): GateResult {
  const flags: string[] = [];
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  // Word count — space-based; skip for non-space-delimited scripts (e.g. CJK).
  const spaceCount = (clean.match(/ /g) || []).length;
  const looksSpaceDelimited = clean.length === 0 || spaceCount >= clean.length / 25;
  const words = clean ? clean.split(' ').filter(Boolean).length : 0;
  if (targetWords && looksSpaceDelimited && words > 0 && words < targetWords * 0.4) {
    flags.push(`too_short:${words}<${Math.round(targetWords * 0.4)}`);
  }
  // Repeated passage — prefix-independent. Scan a normalized window across the
  // text; if any window recurs at least one window-length from its first
  // sighting, a passage is duplicated. Catches repeated paragraphs even when a
  // heading or lead-in is glued in front of them (which defeats a naive prefix check).
  //
  // The window is 150 characters (about 25 words): a paragraph, not a sentence.
  // It was 50, which also flagged copy that repeats one selling claim or one
  // call-to-action line on purpose ("the only authorised partner in Mexico",
  // said twice) and so marked sound versions as incomplete.
  const norm = clean.toLowerCase().replace(/[^a-z0-9áéíóúñü ]/gi, '');
  const W = 150;
  const firstAt = new Map<string, number>();
  let repeated = false;
  for (let i = 0; i + W <= norm.length; i += 1) {
    const shingle = norm.slice(i, i + W);
    if (!shingle.trim()) continue;
    const prev = firstAt.get(shingle);
    if (prev !== undefined) {
      if (i - prev >= W) { repeated = true; break; }
    } else {
      firstAt.set(shingle, i);
    }
  }
  if (repeated) flags.push('repeated_passage');
  return { valid: flags.length === 0, words, flags };
}
