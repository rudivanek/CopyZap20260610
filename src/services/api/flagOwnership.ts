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

const TONE_NOTE = /^\s*tone intensity\b/i;

/**
 * Tone notes on words the version took over from the original. "Review the tone
 * of 'valiente'" is noise when "valiente" was already the user's own word: the
 * version did not add it. Only tone notes go: a claim to verify still needs
 * checking, whoever wrote it first. Without an original text nothing is removed.
 */
export function dropInheritedToneFlags(flags: string[], originalText: string | null | undefined): string[] {
  if (!originalText || !originalText.trim()) return flags;
  return flags.filter(flag => !(TONE_NOTE.test(flag) && flagPhrase(flag) && isOwnFlag(flag, originalText)));
}

const CLAIM_NOTE = /^\s*unverified claim\b/i;

/** Lower case, no accents, numbers without thousands separators ("$8,000" -> "8000"). */
const plainWords = (text: string): string[] =>
  (text || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/(\d)[.,](?=\d{3}\b)/g, '$1')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

const isNumber = (word: string) => /^\d+$/.test(word);

/**
 * A word cut to its first five letters, so a reworded fact still matches its
 * claim: "incrementar" and "incrementado", "conversiones" and "conversión".
 * Numbers and short words stay as they are.
 */
const stem = (word: string) => (isNumber(word) || word.length <= 5 ? word : word.slice(0, 5));

/**
 * True when a claim quotes a fact the user added. Every number in the claim
 * must be one of the fact's numbers, and either most of the fact's words are
 * in the claim, or (for a claim with a number) at least two longer words of
 * the fact are, for a claim that quotes part of a long fact.
 * Words are compared by their stem (see stem above).
 * "Los proyectos arrancan desde $8,000" quotes "Desde $8000"; "una garantía
 * ilimitada de 30 días" quotes "Garantía ilimitada por 30 días! Después …";
 * "incrementado conversiones en más del 50%" quotes "Hemos logrado incrementar
 * conversiones en más de 50%!"; "más de 100 clientes" does not quote "Más de
 * 100 proyectos de branding completados".
 */
export function quotesUserFact(phrase: string, fact: string): boolean {
  const claim = plainWords(phrase).map(stem);
  const factWords = plainWords(fact).map(stem);
  if (claim.length === 0 || factWords.length === 0) return false;
  const factNumbers = new Set(factWords.filter(isNumber));
  const claimNumbers = claim.filter(isNumber);
  if (!claimNumbers.every(number => factNumbers.has(number))) return false;
  const inClaim = new Set(claim);
  const found = factWords.filter(word => inClaim.has(word)).length;
  if (found / factWords.length >= 0.6) return true;
  if (claimNumbers.length === 0) return false;
  const longShared = new Set(factWords.filter(word => word.length >= 4 && !isNumber(word) && inClaim.has(word)));
  return longShared.size >= 2;
}

/**
 * Claims to verify that quote a fact the user added on Quick's check screen.
 * The scorer cannot know where a fact came from and lists them as "source
 * unknown"; the user is the source, so they are not listed. Seen 2026-10-13 on
 * the branding page: 13 such notes. Tone notes and other claims stay.
 */
export function dropUserFactClaims(flags: string[] | null | undefined, userFacts: string[] | null | undefined): string[] {
  const list = Array.isArray(flags) ? flags : [];
  const facts = (userFacts ?? []).filter(fact => typeof fact === 'string' && fact.trim());
  if (facts.length === 0) return list;
  return list.filter(flag => {
    if (!CLAIM_NOTE.test(flag)) return true;
    const phrase = flagPhrase(flag);
    return !phrase || !facts.some(fact => quotesUserFact(phrase, fact));
  });
}
