/**
 * pickWinner — the single rule for "which version wins".
 *
 * Rule: the highest Absolute quality score among versions that are
 *   (a) not the original baseline, and
 *   (b) not flagged incomplete by the structural gate.
 *
 * Fallbacks, in order:
 *   1. every candidate is incomplete  -> highest Absolute among all candidates
 *   2. no Absolute scores at all      -> the engine's own isWinner row
 *   3. no isWinner row either         -> highest finalScore
 *
 * This file has no dependencies on purpose, so screens, exports and reports can
 * all import it. Ties keep the first row in the list.
 */

export const ORIGINAL_VERSION_ID = '__original__';
export const ORIGINAL_OPTION_LABEL = 'Original Copy';

export interface WinnerCandidateRow {
  versionId: string;
  optionLabel?: string;
  isWinner?: boolean;
  finalScore?: number;
  absoluteTotal?: number;
  incomplete?: boolean;
}

export function isBaselineRow(row: WinnerCandidateRow): boolean {
  return row.versionId === ORIGINAL_VERSION_ID || row.optionLabel === ORIGINAL_OPTION_LABEL;
}

function highestAbsolute<T extends WinnerCandidateRow>(rows: T[]): T | null {
  let best: T | null = null;
  let bestScore = -Infinity;
  for (const row of rows) {
    if (typeof row.absoluteTotal !== 'number') continue;
    if (row.absoluteTotal > bestScore) {
      best = row;
      bestScore = row.absoluteTotal;
    }
  }
  return best;
}

export function pickWinner<T extends WinnerCandidateRow>(rows: T[] | null | undefined): T | null {
  if (!rows || rows.length === 0) return null;

  const candidates = rows.filter(row => !isBaselineRow(row));
  if (candidates.length === 0) return null;

  const complete = candidates.filter(row => !row.incomplete);

  const byAbsolute = highestAbsolute(complete) ?? highestAbsolute(candidates);
  if (byAbsolute) return byAbsolute;

  const pool = complete.length > 0 ? complete : candidates;
  const flagged = pool.find(row => row.isWinner === true);
  if (flagged) return flagged;

  let best = pool[0];
  for (const row of pool) {
    if ((row.finalScore ?? -Infinity) > (best.finalScore ?? -Infinity)) best = row;
  }
  return best;
}
