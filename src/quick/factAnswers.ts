/**
 * Quick — the answers the user gives on the check screen to "Make it stronger"
 * (see engine/missingFacts.ts), and the facts made from them for the writer.
 *
 * Per question the user can tick any of the suggestions and write their own
 * words. A suggestion can hold blanks (FACT_BLANK) for a number, a date or a
 * name; it becomes a fact only when it is ticked and every blank is filled in.
 */
import { cleanUserFacts, FACT_BLANK, MissingFactQuestion } from '../engine/missingFacts';

export interface FactAnswer {
  /** Indexes of the ticked suggestions. */
  ticked: number[];
  /** Per suggestion: what the user typed into its blanks, in order. */
  blanks: Record<number, string[]>;
  /** The user's own words for this question. */
  own: string;
}

/** Per question, by its index. */
export type FactAnswers = Record<number, FactAnswer>;

export const EMPTY_FACT_ANSWER: FactAnswer = { ticked: [], blanks: {}, own: '' };

/** The text of a suggestion around its blanks: "Más de ", " marcas" for "Más de ___ marcas". */
export function suggestionPieces(suggestion: string): string[] {
  return suggestion.split(FACT_BLANK);
}

/** The suggestion with its blanks filled in. Null while a blank is still empty. */
export function filledSuggestion(suggestion: string, values: string[] | undefined): string | null {
  const pieces = suggestionPieces(suggestion);
  let text = pieces[0];
  for (let index = 1; index < pieces.length; index++) {
    const value = (values?.[index - 1] ?? '').trim();
    if (!value) return null;
    text += value + pieces[index];
  }
  return text.replace(/\s+/g, ' ').trim();
}

/** The facts for the writer: every ticked suggestion with its blanks filled, and every own-words line. */
export function factsFromAnswers(questions: MissingFactQuestion[], answers: FactAnswers): string[] {
  const facts: string[] = [];
  questions.forEach((question, index) => {
    const answer = answers[index];
    if (!answer) return;
    for (const pick of answer.ticked) {
      const suggestion = question.suggestions[pick];
      if (suggestion == null) continue;
      const filled = filledSuggestion(suggestion, answer.blanks[pick]);
      if (filled) facts.push(filled);
    }
    if (answer.own.trim()) facts.push(answer.own);
  });
  return cleanUserFacts(facts);
}

/** Ticked suggestions with a blank still empty: they are not used, and the screen says so. */
export function unfinishedPicks(questions: MissingFactQuestion[], answers: FactAnswers): number {
  let count = 0;
  questions.forEach((question, index) => {
    const answer = answers[index];
    if (!answer) return;
    for (const pick of answer.ticked) {
      const suggestion = question.suggestions[pick];
      if (suggestion != null && filledSuggestion(suggestion, answer.blanks[pick]) === null) count += 1;
    }
  });
  return count;
}
