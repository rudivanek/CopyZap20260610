/**
 * Quick — the answers the user gives on the check screen to "Make it stronger"
 * (see engine/missingFacts.ts), and the facts made from them for the writer.
 *
 * One answer field per question, in the user's own words, and one field for
 * anything else that is true. An empty field adds nothing.
 */
import { cleanUserFacts, MissingFactQuestion } from '../engine/missingFacts';

/** The key of the "anything else" field. The questions use their index ("0", "1", "2"). */
export const OTHER_FACT_KEY = 'other';

/** What the user wrote, per question index and under OTHER_FACT_KEY. */
export type FactAnswers = Record<string, string>;

/** The facts for the writer: every answer in the order of the questions, then "anything else". */
export function factsFromAnswers(questions: MissingFactQuestion[], answers: FactAnswers): string[] {
  return cleanUserFacts([...questions.map((_, index) => answers[String(index)] ?? ''), answers[OTHER_FACT_KEY] ?? '']);
}

/** Answers that still hold the example's blank (___): they are not used, and the screen says so. */
export function unfinishedAnswers(questions: MissingFactQuestion[], answers: FactAnswers): number {
  const keys = [...questions.map((_, index) => String(index)), OTHER_FACT_KEY];
  return keys.filter(key => /_{2,}/.test(answers[key] ?? '')).length;
}
