/**
 * Quick — names a version adds: places, people, companies, brands.
 *
 * On 2026-10-20 an outside test (GrokBot) found "Jefferson County" in a
 * plumber's best version; the original lists towns but never names the
 * county. The source check (sourceClaims.ts) missed it, and the same county
 * turned up in plumber versions of many earlier runs. A name is easy to find
 * without a model: a word written with a capital in the middle of a sentence,
 * that the original does not have in any form.
 *
 *   findNewNames(version, allowed) -> the names in the version that the
 *                                     original and the user's facts do not have
 *
 * Headings and title-case lines are skipped (every word there has a capital),
 * as is the first word of each sentence. A version whose sentences are full
 * of capitals (German, which writes every noun with one) is not checked.
 *
 * Plain text handling: no model call, no cost.
 */

/** Most names reported for one version. */
const MAX_NAMES = 8;
/** Above this share of capitalised words inside sentences, a text is not checked (German). */
const MAX_CAPITAL_SHARE = 0.25;
/** Small words that may join the parts of a name: "Bank of America", "Ciudad de México". */
const JOINERS = new Set(['of', 'the', 'de', 'del', 'la', 'las', 'los', 'el', 'du', 'des', 'le', 'di', 'da', 'do', 'van', 'von']);

const WORD = /[\p{L}\p{N}][\p{L}\p{N}'’.-]*/gu;
const isCapitalised = (word: string) => /^\p{Lu}/u.test(word) && !/^I(?:['’][a-z]+)?$/.test(word);
/** Lowercase, without accents or a possessive: "México" and "Mexico", "Google's" and "google" match. */
const lower = (word: string) =>
  word
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/['’]s$/, '')
    .replace(/[.'’-]+$/, '');

/** The words of a text, lowercase, for "is this word in the original?". */
function vocabulary(text: string): Set<string> {
  const words = new Set<string>();
  for (const match of (text || '').matchAll(WORD)) {
    const word = lower(match[0]);
    words.add(word);
    for (const piece of word.split(/[-.'’]/)) if (piece) words.add(piece);
  }
  return words;
}

/** Lines that are headings or written in title case: every word there may have a capital. */
function isHeadingLine(line: string): boolean {
  const text = line.trim();
  if (/^#{1,6}\s/.test(text)) return true;
  const bare = text.replace(/^[-*+>]\s+/, '').replace(/[*_`[\]()]/g, '');
  const words = (bare.match(WORD) ?? []).filter(word => /\p{L}/u.test(word) && word.length > 3);
  if (words.length === 0) return true;
  const capitals = words.filter(isCapitalised).length;
  return words.length <= 12 && capitals / words.length >= 0.6 && !/[.!?]$/.test(bare);
}

/** Text that is not prose: links, addresses, markers. */
function withoutNoise(line: string): string {
  return line
    .replace(/\[\[[^\]]*\]\]/g, ' ')
    .replace(/\]\([^)]*\)/g, '] ')
    .replace(/(?:https?:\/\/|www\.)\S+|\S+@\S+\.\S+/g, ' ')
    .replace(/[*_`]/g, '');
}

interface Sentence {
  words: { text: string; start: number }[];
}

/** The sentences of a line, each with its words. A sentence starts after . ! ? : ; — and at the start of a line, list item or quote. */
function sentencesOf(line: string): Sentence[] {
  const sentences: Sentence[] = [];
  let current: Sentence = { words: [] };
  let last = 0;
  for (const match of line.matchAll(WORD)) {
    const start = match.index ?? 0;
    const between = line.slice(last, start);
    if (current.words.length > 0 && /[.!?:;—–(«"“]|\s-\s/.test(between)) {
      sentences.push(current);
      current = { words: [] };
    }
    current.words.push({ text: match[0].replace(/[.]+$/, ''), start });
    last = start + match[0].length;
    if (/[.!?]$/.test(match[0]) && !/^\p{Lu}\.?$/u.test(match[0])) {
      sentences.push(current);
      current = { words: [] };
    }
  }
  if (current.words.length > 0) sentences.push(current);
  return sentences;
}

/** Fewer words than this inside sentences: too few to judge the share of capitals. */
const MIN_WORDS_FOR_SHARE = 40;

/** The share of words inside sentences (not the first) that start with a capital; 0 for a short text. */
function capitalShare(text: string): number {
  let inside = 0;
  let capitals = 0;
  for (const line of (text || '').split('\n')) {
    if (isHeadingLine(line)) continue;
    for (const sentence of sentencesOf(withoutNoise(line))) {
      for (const word of sentence.words.slice(1)) {
        if (!/\p{L}/u.test(word.text)) continue;
        inside += 1;
        if (isCapitalised(word.text)) capitals += 1;
      }
    }
  }
  return inside < MIN_WORDS_FOR_SHARE ? 0 : capitals / inside;
}

/**
 * The names in `text` that `allowed` (the original and the user's facts) does
 * not have, as written in `text`: "Jefferson County". A name counts as known
 * when every word of it with a capital appears somewhere in `allowed`, in any
 * case ("Hoover", "hoover"). Never throws.
 */
export function findNewNames(text: string, allowed: string): string[] {
  try {
    if (!text.trim() || !allowed.trim()) return [];
    // The version is written prose; the original may be a page full of names, so only the version is measured.
    if (capitalShare(text) > MAX_CAPITAL_SHARE) return [];
    const known = vocabulary(allowed);
    const names: string[] = [];
    const seen = new Set<string>();

    for (const rawLine of text.split('\n')) {
      if (isHeadingLine(rawLine)) continue;
      const line = withoutNoise(rawLine);
      for (const sentence of sentencesOf(line)) {
        const words = sentence.words;
        for (let i = 1; i < words.length; i += 1) {
          if (!isCapitalised(words[i].text)) continue;
          // A run of capitalised words, with small joining words between them.
          let end = i;
          while (
            end + 1 < words.length &&
            (isCapitalised(words[end + 1].text) ||
              (JOINERS.has(words[end + 1].text.toLowerCase()) && end + 2 < words.length && isCapitalised(words[end + 2].text)))
          ) {
            end += JOINERS.has(words[end + 1].text.toLowerCase()) ? 2 : 1;
          }
          const run = words.slice(i, end + 1);
          i = end;
          const capitals = run.filter(word => isCapitalised(word.text));
          // A word is known when the original has it, or has every part of it ("Italian-inspired").
          const isNew = capitals.some(word => {
            const key = lower(word.text);
            if (key.length < 2 || !/\p{L}/u.test(key) || known.has(key)) return false;
            const pieces = key.split(/[-.'’]/).filter(Boolean);
            return !(pieces.length > 1 && pieces.every(piece => known.has(piece) || piece.length <= 2));
          });
          if (!isNew) continue;
          const name = line.slice(run[0].start, run[run.length - 1].start + run[run.length - 1].text.length).trim();
          const key = name.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          names.push(name);
          if (names.length >= MAX_NAMES) return names;
        }
      }
    }
    return names;
  } catch {
    return [];
  }
}
