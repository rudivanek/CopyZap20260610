/**
 * Quick — the quality level of a score, in words.
 *
 * "+10 points (+16%)" undersells a change from "below average" to
 * "competent" copy, and the number alone does not say what 71 means. The
 * levels are the scorer's own calibration (absoluteScoring.ts): 0–50 poor,
 * 51–65 below average, 66–75 average professional copy ("competent but
 * unremarkable"), 76–85 strong, 86–92 excellent, 93–100 exceptional. Only the
 * names are friendlier: "Weak" for poor and "Competent" for average.
 */
const LEVELS: { min: number; name: string }[] = [
  { min: 93, name: 'Exceptional' },
  { min: 86, name: 'Excellent' },
  { min: 76, name: 'Strong' },
  { min: 66, name: 'Competent' },
  { min: 51, name: 'Below average' },
  { min: 0, name: 'Weak' },
];

/** The level of a total from 0 to 100: "Competent". */
export function scoreLevel(total: number): string {
  const rounded = Math.round(total);
  return (LEVELS.find(level => rounded >= level.min) ?? LEVELS[LEVELS.length - 1]).name;
}

/** From one total to another: "Below average → Competent", or "Competent (same level)". */
export function levelChange(from: number, to: number): string {
  const before = scoreLevel(from);
  const after = scoreLevel(to);
  return before === after ? `${after} (same level)` : `${before} → ${after}`;
}
