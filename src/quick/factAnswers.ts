/**
 * Quick — the answers the user gives on the check screen to "Make it stronger"
 * (see engine/missingFacts.ts), and the facts made from them for the writer.
 *
 * One answer field per question, in the user's own words. An empty field adds
 * nothing.
 */
import { cleanUserFacts, MissingFactQuestion } from '../engine/missingFacts';

/** Per question, by its index: what the user wrote. */
export type FactAnswers = Record<number, string>;

/** The facts for the writer: every answer the user wrote, in the order of the questions. */
export function factsFromAnswers(questions: MissingFactQuestion[], answers: FactAnswers): string[] {
  return cleanUserFacts(questions.map((_, index) => answers[index] ?? ''));
}

/** Answers that still hold the example's blank (___): they are not used, and the screen says so. */
export function unfinishedAnswers(questions: MissingFactQuestion[], answers: FactAnswers): number {
  return questions.filter((_, index) => /_{2,}/.test(answers[index] ?? '')).length;
}
