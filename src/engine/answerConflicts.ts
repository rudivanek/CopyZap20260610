/**
 * Brief (2) — a number the user gave in an answer wins over a different number
 * for the same thing that the draft took from the website.
 *
 * Seen 2026-11-04 (project note type-tests-chatgpt-2026-11-04): the website said
 * "más de 15 años", the user answered "más de 20 años", and the email draft said
 * 15. The left-out check found it and the repair pass ran, but the draft still
 * said 15, and the run cost about 16 credits more.
 *
 * A number counts as the same thing when the same word follows it ("20 años",
 * "15 años"). A number in the draft is changed only when:
 * - an answer states a number with that word, and the draft never does;
 * - the draft's number also appears with that word in the website text or in
 *   "What you are selling", so it came from there and not from the writer.
 * Every change is listed, so the result can tell the user what was changed.
 * No model call: it never fails and costs nothing.
 */

const NUMBER_WORD = /(\d[\d.,]*)\s*\+?\s*([\p{L}]+)/gu;

interface NumberFact {
  value: string;
  word: string;
}

function numberFacts(text: string): NumberFact[] {
  const found: NumberFact[] = [];
  for (const match of (text || '').matchAll(NUMBER_WORD)) {
    found.push({ value: match[1], word: match[2].toLowerCase() });
  }
  return found;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface AnswerFix {
  /** What the draft said, e.g. "15 años". */
  from: string;
  /** What the answer says, e.g. "20 años". */
  to: string;
}

/**
 * Puts the answers' numbers into the draft where the draft took a different
 * number for the same thing from another source. `answers` are the user's own
 * answers; `otherSources` are the website text and the pre-filled
 * "What you are selling" text.
 */
export function applyAnswerNumbers(
  draft: string,
  answers: string[],
  otherSources: string[]
): { text: string; fixes: AnswerFix[] } {
  const given = answers.flatMap(numberFacts);
  const fromOthers = new Set(otherSources.flatMap(numberFacts).map(fact => `${fact.value}|${fact.word}`));
  let text = draft;
  const fixes: AnswerFix[] = [];
  for (const fact of given) {
    const inDraft = numberFacts(text).filter(other => other.word === fact.word);
    if (inDraft.length === 0 || inDraft.some(other => other.value === fact.value)) continue;
    for (const wrong of inDraft) {
      if (wrong.value === fact.value || !fromOthers.has(`${wrong.value}|${wrong.word}`)) continue;
      const pattern = new RegExp(`(^|[^\\d.,])${escapeRegExp(wrong.value)}(\\s*\\+?\\s*)(${escapeRegExp(wrong.word)})(?![\\p{L}])`, 'giu');
      const next = text.replace(pattern, (_all, before: string, gap: string, word: string) => `${before}${fact.value}${gap}${word}`);
      if (next !== text) {
        text = next;
        if (!fixes.some(fix => fix.from === `${wrong.value} ${wrong.word}`)) {
          fixes.push({ from: `${wrong.value} ${wrong.word}`, to: `${fact.value} ${fact.word}` });
        }
      }
    }
  }
  return { text, fixes };
}

/** The note shown with the result for each change. */
export function answerFixNote(fix: AnswerFix): string {
  return `Your website says "${fix.from}"; your answer says "${fix.to}". The copy uses your answer.`;
}
