/**
 * Which review notes belong to which version.
 *
 * The comparison step reads every version in one call and returns, per
 * version, the phrases an editor should review ("claims to verify", figurative
 * language, tone). Each note quotes the phrase it is about. With several long
 * versions made from the same page, the model sometimes lists one version's
 * phrases under another: on 2026-10-10 a report showed six notes under
 * "Generated Copy 2" whose phrases stand only in "Generated Copy 3".
 *
 * A note is "kind — advice: the phrase". So this can be checked exactly, in
 * any language and without a model call: a note stays with a version only when
 * its phrase stands in that version's text. Measured on the two reports of
 * that day: all 42 correct notes stay, all 7 misplaced ones go.
 *
 * It only removes notes that are in the wrong place. It cannot add the notes
 * the model left out for that version.
 */

const normalise = (text: string): string =>
  (text || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

/** The phrase a note is about: what follows the first ": ". Empty when the note has no such part. */
export function flagPhrase(flag: string): string {
  const cut = (flag || '').indexOf(': ');
  return cut >= 0 ? flag.slice(cut + 2).trim() : '';
}

/** True when the phrase the note quotes stands in the text. A note without a phrase cannot be checked and counts as owned. */
export function isOwnFlag(flag: string, versionText: string): boolean {
  const phrase = flagPhrase(flag);
  if (!phrase) return true;
  const text = ` ${normalise(versionText)} `;
  // The model may shorten a long phrase with "…": then every piece has to be there.
  const pieces = phrase
    .split(/…|\.{3,}/)
    .map(normalise)
    .filter(piece => piece.length > 0);
  if (pieces.length === 0) return true;
  return pieces.every(piece => text.includes(` ${piece} `));
}

/** The notes whose phrase stands in this version's text, in their order. */
export function keepOwnFlags(flags: string[] | null | undefined, versionText: string): string[] {
  if (!Array.isArray(flags)) return [];
  const clean = flags.filter(flag => typeof flag === 'string' && flag.trim().length > 0);
  if (!versionText || !versionText.trim()) return clean;
  return clean.filter(flag => isOwnFlag(flag, versionText));
}
