/**
 * Quick — the user checks the claims of the best version.
 *
 * The source check (sourceClaims.ts) lists the facts about the business that a
 * version states and the original does not. The cleanup takes most of them
 * out before scoring; what is left is shown under the best version as a
 * checklist, one line per claim, with three choices:
 *
 * - "It's true": the claim stays. Nothing in the text changes.
 * - "Remove it": the claim is taken out (one small call, inventedDetails.ts,
 *   delete-only). When that call changes nothing, the sentence goes.
 * - "Edit it": the user rewrites the sentence the claim stands in. Their
 *   words go in as they are; an empty sentence is taken out.
 *
 * The decisions are kept with the result (output_data.quick.claimReview) and
 * the text the user sees, copies and exports is the best version with them
 * applied. Each decision that changes the text is stored as one replacement
 * ("from" → "to"), so it can be undone on its own: the text is rebuilt from
 * the best version by applying the others again.
 *
 * The score stays the one of the best version as written, except that a
 * claim the user confirmed, removed or edited away no longer costs points
 * (confirmedScore, since 2026-10-22: before, the points came back only after
 * "Re-score"). "Re-score" scores the changed text (three readings, the middle
 * one, as the run does, and the key facts it leaves out) and keeps that score
 * with the decisions.
 */
import { User } from '../types';
import { contentToText } from '../services/api/contentText';
import { generateAbsoluteScore, isCompleteScore } from '../services/api/absoluteScoring';
import type { AbsoluteScoreBreakdown } from '../services/api/absoluteScoring';
import { buildQuickScoringContext, quickTextKindOf } from './buildQuickFormState';
import { removeInventedDetails } from './inventedDetails';
import { findLeftOutFacts, leftOutPenalty, listKeyFacts } from './keyFacts';
import { cleanUserFacts } from './missingFacts';
import { claimsPenalty } from './sourceClaims';
import { ORIGINAL_VERSION_ID } from './pickWinner';
import type { QuickRunResult } from './runQuickPipeline';
import { throwIfStopped } from './quickStop';

export type ClaimAction = 'kept' | 'removed' | 'edited';

export interface ClaimDecision {
  /** The claim as the check named it. */
  claim: string;
  action: ClaimAction;
  /** For "removed" and "edited": the text replaced, exactly as it stood. */
  from?: string;
  /** For "removed" and "edited": what replaced it. */
  to?: string;
}

export interface ClaimReview {
  /** The version the decisions belong to. When another version becomes the best, they no longer show. */
  versionId: string;
  decisions: ClaimDecision[];
  /** The score of the changed text, after "Re-score". */
  score?: AbsoluteScoreBreakdown;
  /** The text that score is for. A later decision makes the score out of date. */
  scoredText?: string;
}

/**
 * What one "Re-score" costs: three scoring readings and one key-facts check.
 * It grows with the length of the copy: 5 and 9 credits were measured on
 * 2026-10-20 (GrokBot) against the "about 7" shown before, so a range is shown.
 */
export const RESCORE_CREDITS_RANGE = '5 to 10';
/** About how long one "Re-score" takes, in seconds. */
export const RESCORE_SECONDS_ESTIMATE = 30;
/** Readings of the scorer for one "Re-score"; the middle one counts, as in the run. */
const RESCORE_READINGS = 3;

const CLAIM_NOTE = /^\s*unverified claim\b/i;

function occurrences(text: string, part: string): number {
  if (!part) return 0;
  let count = 0;
  let at = text.indexOf(part);
  while (at >= 0) {
    count += 1;
    at = text.indexOf(part, at + part.length);
  }
  return count;
}

/** The decisions for this version, or none. */
export function reviewFor(result: QuickRunResult, versionId: string): ClaimReview | null {
  const review = result.claimReview;
  return review && review.versionId === versionId ? review : null;
}

/**
 * The best version's text with the decisions applied, in order. A replacement
 * whose text is gone is skipped. The text is tidied before and after each
 * one, the same way it is when a decision is made (editDecision,
 * removeDecision), so each replacement finds the text it was made on.
 */
export function applyDecisions(base: string, decisions: ClaimDecision[]): string {
  let text = tidy(base);
  for (const decision of decisions) {
    if (decision.action === 'kept' || !decision.from) continue;
    if (occurrences(text, decision.from) !== 1) continue;
    text = tidy(text.replace(decision.from, () => decision.to ?? ''));
  }
  return text;
}

/** A cut can leave a double space, a space before a full stop, or an empty line behind. */
function tidy(text: string): string {
  return text
    .replace(/(\S)[ \t]{2,}(?=\S)/g, '$1 ')
    .replace(/ +([.,;:!?])/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** The text of a version as it shows: its own, with the user's decisions applied. */
export function reviewedText(result: QuickRunResult, versionId: string): string | null {
  const version = result.versions.find(item => item.id === versionId);
  if (!version) return null;
  const base = contentToText(version.content);
  const review = reviewFor(result, versionId);
  return review ? applyDecisions(base, review.decisions) : base;
}

/** The claims the check found in a version, without one that is part of another. */
export function claimsOf(result: QuickRunResult, versionId: string): string[] {
  const row = result.scores?.comparisonResult.rows.find(item => item.versionId === versionId);
  const claims = (row?.verificationFlags ?? [])
    .filter(note => note && CLAIM_NOTE.test(note))
    .map(note => {
      const cut = note.indexOf(': ');
      return (cut >= 0 ? note.slice(cut + 2) : note).trim();
    })
    .filter(Boolean);
  const unique = Array.from(new Set(claims));
  const lower = unique.map(claim => claim.toLowerCase());
  return unique.filter((_, index) =>
    !lower.some((other, at) => at !== index && other.length > lower[index].length && other.includes(lower[index]))
  );
}

/** Where a claim stands in a text: exactly, else ignoring case. Null when it is not there. */
export function findClaim(text: string, claim: string): { start: number; end: number } | null {
  let at = text.indexOf(claim);
  if (at < 0) at = text.toLowerCase().indexOf(claim.toLowerCase());
  return at < 0 ? null : { start: at, end: at + claim.length };
}

/** The sentence (or line) a claim stands in. Null when the claim is not in the text. */
export function sentenceAround(text: string, claim: string): { start: number; end: number; sentence: string } | null {
  const found = findClaim(text, claim);
  if (!found) return null;
  let start = found.start;
  while (start > 0) {
    const before = text[start - 1];
    if (before === '\n') break;
    if (/\s/.test(before) && start > 1 && /[.!?]/.test(text[start - 2])) break;
    start -= 1;
  }
  // Markdown in front of the line (a heading, a list mark) is not part of the sentence.
  const lead = /^(#{1,6}\s+|[-*+]\s+|\d+\.\s+|>\s*)/.exec(text.slice(start, found.start));
  if (lead) start += lead[0].length;
  let end = found.end;
  while (end < text.length) {
    const char = text[end];
    if (char === '\n') break;
    end += 1;
    if (/[.!?]/.test(char) && (end >= text.length || /\s/.test(text[end]))) break;
  }
  return { start, end, sentence: text.slice(start, end) };
}

/**
 * The part of `before` that `after` changed, as a replacement that can be
 * applied again: widened word by word until it stands only once in `before`.
 */
export function replacementBetween(before: string, after: string): { from: string; to: string } | null {
  if (before === after) return null;
  let prefix = 0;
  const limit = Math.min(before.length, after.length);
  while (prefix < limit && before[prefix] === after[prefix]) prefix += 1;
  let suffix = 0;
  while (
    suffix < limit - prefix &&
    before[before.length - 1 - suffix] === after[after.length - 1 - suffix]
  ) {
    suffix += 1;
  }
  let start = prefix;
  let endBefore = before.length - suffix;
  let endAfter = after.length - suffix;
  // Whole words, so a replacement does not begin or end inside one.
  while (start > 0 && /\S/.test(before[start - 1])) start -= 1;
  while (endBefore < before.length && /\S/.test(before[endBefore])) {
    endBefore += 1;
    endAfter += 1;
  }
  for (let round = 0; round < 40; round += 1) {
    const from = before.slice(start, endBefore);
    if (from.trim() && occurrences(before, from) === 1) return { from, to: after.slice(start, endAfter) };
    if (start === 0 && endBefore === before.length) break;
    // One more word on each side.
    if (start > 0) {
      start -= 1;
      while (start > 0 && /\s/.test(before[start - 1])) start -= 1;
      while (start > 0 && /\S/.test(before[start - 1])) start -= 1;
    }
    if (endBefore < before.length) {
      const was = endBefore;
      while (endBefore < before.length && /\s/.test(before[endBefore])) endBefore += 1;
      while (endBefore < before.length && /\S/.test(before[endBefore])) endBefore += 1;
      endAfter += endBefore - was;
    }
  }
  return null;
}

/** The decisions with one more, replacing an earlier one for the same claim. */
export function withDecision(review: ClaimReview | null, versionId: string, decision: ClaimDecision): ClaimReview {
  const decisions = (review?.decisions ?? []).filter(item => item.claim !== decision.claim);
  return { ...(review ?? {}), versionId, decisions: [...decisions, decision] };
}

/** The decisions without the one for this claim (Undo). */
export function withoutDecision(review: ClaimReview, claim: string): ClaimReview {
  return { ...review, decisions: review.decisions.filter(item => item.claim !== claim) };
}

/** "Edit it": the sentence the claim stands in becomes the user's words. Null when nothing changes. */
export function editDecision(shownText: string, claim: string, sentence: string): ClaimDecision | null {
  const text = tidy(shownText);
  const place = sentenceAround(text, claim);
  if (!place) return null;
  const words = sentence.replace(/\s+/g, ' ').trim();
  const changed = tidy(`${text.slice(0, place.start)}${words}${text.slice(place.end)}`);
  const replacement = replacementBetween(text, changed);
  if (!replacement) return null;
  return { claim, action: words ? 'edited' : 'removed', ...replacement };
}

/**
 * "Remove it": the claim taken out with the smallest edit (one small call),
 * else the sentence it stands in. Null when the claim is not in the text.
 */
export async function removeDecision(
  result: QuickRunResult,
  shownText: string,
  claim: string,
  user: User
): Promise<ClaimDecision | null> {
  const text = tidy(shownText);
  if (!findClaim(text, claim)) return null;
  const allowed = [result.formState.originalCopy || '', ...cleanUserFacts(result.formState.quickUserFacts)]
    .filter(Boolean)
    .join('\n\n');
  const cleaned = await removeInventedDetails(text, allowed, user, result.formState.sessionId, [claim], {
    onlyClaims: true,
  });
  let changed = cleaned.removed.includes(claim) ? cleaned.text : '';
  if (!changed) {
    const place = sentenceAround(text, claim);
    if (!place) return null;
    changed = tidy(`${text.slice(0, place.start)}${text.slice(place.end)}`);
  }
  const replacement = replacementBetween(text, tidy(changed));
  return replacement ? { claim, action: 'removed', ...replacement } : null;
}

/** The claims still in the text that the user has not confirmed: they still cost points (see sourceClaims.ts). */
export function openClaimCount(result: QuickRunResult, versionId: string, decisions: ClaimDecision[], text: string): number {
  const lower = text.toLowerCase();
  return claimsOf(result, versionId).filter(
    claim =>
      lower.includes(claim.toLowerCase()) &&
      !decisions.some(decision => decision.claim === claim && decision.action === 'kept')
  ).length;
}

/**
 * True when the score is out of date: the text changed since the run (or
 * since the last "Re-score"), or claims that cost points were confirmed since.
 */
export function scoreIsStale(result: QuickRunResult, versionId: string): boolean {
  const review = reviewFor(result, versionId);
  if (!review) return false;
  const version = result.versions.find(item => item.id === versionId);
  if (!version) return false;
  const text = applyDecisions(contentToText(version.content), review.decisions);
  const current =
    review.score && review.scoredText === text ? review.score : result.scores?.absoluteByVersion[versionId];
  // Claims confirmed since the score no longer cost points without a "Re-score" (confirmedScore),
  // so they do not make the score out of date; a changed text does.
  if (current && review.score && review.scoredText === text) return false;
  return text !== tidy(contentToText(version.content));
}

/**
 * The run's score of a version, with the claims the user confirmed ("It's
 * true"), removed or edited away no longer costing points: the reader checked
 * them, so CopyZap no longer holds them against the version. The four parts are
 * the run's (the text is not read again; that is "Re-score"). Null when no
 * claim that cost points was settled.
 */
export function confirmedScore(result: QuickRunResult, versionId: string): AbsoluteScoreBreakdown | null {
  const review = reviewFor(result, versionId);
  const base = result.scores?.absoluteByVersion[versionId];
  if (!review || !base || !base.claims_open || base.claims_penalty === undefined) return null;
  const text = reviewedText(result, versionId);
  if (text === null) return null;
  const open = openClaimCount(result, versionId, review.decisions, text);
  if (open >= base.claims_open) return null;
  const penalty = claimsPenalty(open);
  return {
    ...base,
    total: Math.min(100, base.total + base.claims_penalty - penalty),
    claims_open: open,
    claims_penalty: penalty,
  };
}

/**
 * What the user said is true about the best version's claims, for the check
 * with another AI: a claim they kept ("It's true") as the check named it, and
 * for a claim they edited, the line of the text that holds their words. Without
 * it the other AI reports the user's own facts as invented (seen 2026-10-22:
 * all three AIs flagged "20 claves", which the user had written themselves).
 */
export function confirmedClaims(result: QuickRunResult): string[] {
  const winnerId = result.scores?.winnerId;
  if (!winnerId) return [];
  const review = reviewFor(result, winnerId);
  if (!review) return [];
  const lines = (reviewedText(result, winnerId) ?? '').split(String.fromCharCode(10)).map(line => line.trim());
  const found: string[] = [];
  for (const decision of review.decisions) {
    if (decision.action === 'kept') {
      found.push(decision.claim.trim());
      continue;
    }
    if (decision.action !== 'edited' || !decision.to) continue;
    const words = decision.to
      .split(String.fromCharCode(10))
      .map(line => line.trim())
      .filter(Boolean);
    const last = words[words.length - 1];
    const line = last ? lines.find(item => item.includes(last)) : undefined;
    if (line) found.push(line);
  }
  return Array.from(new Set(found.filter(Boolean)));
}

/** The score after "Re-score", when it is for the text as it is now. */
export function reviewScore(result: QuickRunResult, versionId: string): AbsoluteScoreBreakdown | null {
  const review = reviewFor(result, versionId);
  const text = reviewedText(result, versionId);
  return review?.score && text !== null && review.scoredText === text ? review.score : null;
}

/**
 * "Re-score": the changed text scored the way the run scores a version. Throws
 * when no reading comes back.
 */
export async function scoreReviewedText(
  result: QuickRunResult,
  versionId: string,
  user: User,
  signal?: AbortSignal
): Promise<ClaimReview> {
  const review = reviewFor(result, versionId);
  const text = reviewedText(result, versionId);
  if (!review || text === null) throw new Error('There is nothing to score again.');
  if (versionId === ORIGINAL_VERSION_ID) throw new Error('Your original is not scored again.');
  throwIfStopped(signal);

  const { formState } = result;
  const kind = quickTextKindOf(formState);
  const context = buildQuickScoringContext(result.goalKey, kind, formState.quickGoalLabel);
  const userFacts = cleanUserFacts(formState.quickUserFacts);

  const leftOut = (async () => {
    const facts = await listKeyFacts(formState.originalCopy || '', userFacts, user, formState.sessionId);
    if (!facts || facts.length === 0) return null;
    return findLeftOutFacts(facts, text, user, formState.sessionId, formState.originalCopy || '');
  })().catch(() => null);

  const readings = (
    await Promise.all(
      Array.from({ length: RESCORE_READINGS }, async () => {
        try {
          return await generateAbsoluteScore(text, user, formState.sessionId, context.goalKey, context.goalLabel, kind);
        } catch {
          return null;
        }
      })
    )
  )
    .filter(isCompleteScore)
    .sort((a, b) => a.total - b.total);
  throwIfStopped(signal);
  if (readings.length === 0) throw new Error('The changed text could not be scored. Try again.');
  let score = readings[Math.floor((readings.length - 1) / 2)];

  const left = await leftOut;
  if (left && left.length > 0) {
    const penalty = leftOutPenalty(left.length);
    score = { ...score, total: Math.max(1, score.total - penalty), left_out: left, left_out_penalty: penalty };
  }
  // Claims the user has not confirmed still cost points, as in the run; the ones confirmed no longer do.
  const open = openClaimCount(result, versionId, review.decisions, text);
  if (open > 0) {
    const penalty = claimsPenalty(open);
    score = { ...score, total: Math.max(1, score.total - penalty), claims_open: open, claims_penalty: penalty };
  } else {
    score = { ...score, claims_open: 0, claims_penalty: 0 };
  }
  return { ...review, score, scoredText: text };
}

/**
 * The result as the screen and the report show it: the best version's text
 * with the decisions applied, and its "not in your original" notes without
 * the claims that are gone ("(you confirmed it)" after the ones kept). With
 * `withScore`, the score after "Re-score" stands for the best version.
 */
export function resultWithReview(result: QuickRunResult, withScore = false): QuickRunResult {
  const winnerId = result.scores?.winnerId;
  if (!winnerId || !result.scores) return result;
  const review = reviewFor(result, winnerId);
  const version = result.versions.find(item => item.id === winnerId);
  if (!review || !version) return result;

  const changed = review.decisions.some(decision => decision.action !== 'kept');
  const text = changed ? applyDecisions(contentToText(version.content), review.decisions) : contentToText(version.content);
  const lower = text.toLowerCase();
  const kept = new Set(
    review.decisions.filter(decision => decision.action === 'kept').map(decision => decision.claim.toLowerCase())
  );
  const versions = changed
    ? result.versions.map(item => (item.id === winnerId ? { ...item, content: text } : item))
    : result.versions;
  const scores = result.scores;
  const rows = scores.comparisonResult.rows.map(row =>
    row.versionId !== winnerId
      ? row
      : {
          ...row,
          verificationFlags: (row.verificationFlags ?? []).flatMap(note => {
            if (!note || !CLAIM_NOTE.test(note)) return [note];
            const cut = note.indexOf(': ');
            const claim = (cut >= 0 ? note.slice(cut + 2) : note).trim().toLowerCase();
            if (!lower.includes(claim)) return [];
            return kept.has(claim) ? [`${note} (you confirmed it)`] : [note];
          }),
        }
  );
  // After "Re-score" (with withScore) its score; otherwise the run's, without the points for settled claims.
  const score = (withScore ? reviewScore(result, winnerId) : null) ?? confirmedScore(result, winnerId);
  const scoredRows = score ? rows.map(row => (row.versionId === winnerId ? { ...row, absoluteTotal: score.total } : row)) : rows;
  return {
    ...result,
    versions,
    scores: {
      ...scores,
      comparisonResult: { ...scores.comparisonResult, rows: scoredRows },
      absoluteByVersion: score ? { ...scores.absoluteByVersion, [winnerId]: score } : scores.absoluteByVersion,
    },
  };
}
