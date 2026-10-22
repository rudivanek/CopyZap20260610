/**
 * Quick — the original's score, read on the check screen before the run.
 *
 * Shown above "Make it stronger" ("Your copy scores 72 / 100 now"), so the user
 * sees where the copy stands before deciding whether to answer the questions.
 * Measured on 2026-10-22 (project note score-based-questions-test-2026-10-22):
 * true answers to the questions raised the best version by about 7 points on
 * average, and the questions are often skipped.
 *
 * The run uses this reading for the original when the copy is unchanged
 * (see originalScore in runQuickPipeline.ts), so the user sees the same number
 * on the check screen and in the result. One reading, the same scorer and
 * scoring context as the run. About 1–2 credits.
 *
 * It never throws: on any failure there is no score and the screen shows none.
 */
import { GoalKey, User } from '../types';
import { AbsoluteScoreBreakdown, generateAbsoluteScore, isCompleteScore } from '../services/api/absoluteScoring';
import { TextKindChoice } from '../services/api/textKinds';
import { buildQuickScoringContext } from './buildQuickFormState';

export interface OriginalScore {
  /** The exact text that was scored: the copy the run will get, trimmed. */
  text: string;
  score: AbsoluteScoreBreakdown;
}

export async function scoreOriginal(
  copy: string,
  goalKey: GoalKey,
  goalLabel: string | undefined,
  kind: TextKindChoice | null | undefined,
  user: User,
  sessionId?: string
): Promise<OriginalScore | null> {
  const text = (copy || '').trim();
  if (!text) return null;
  try {
    const context = buildQuickScoringContext(goalKey, kind, goalLabel);
    const score = await generateAbsoluteScore(text, user, sessionId, context.goalKey, context.goalLabel, kind);
    return isCompleteScore(score) ? { text, score } : null;
  } catch {
    return null;
  }
}
