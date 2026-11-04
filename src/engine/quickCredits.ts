/**
 * Quick — credits per result.
 *
 * Every AI call and page fetch of a run is recorded with the run's session id,
 * and a change, an edit or "Score again" on a result uses the same session.
 * So the credits of a result are the sum for its session: the run and
 * everything done to it afterwards.
 *
 * The sum is made in the database (get_my_session_credits), which only ever
 * returns the signed-in user's own usage.
 */
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

/** Credits used per session id. Sessions without usage are missing. Throws on a failed read. */
export async function getSessionCredits(sessionIds: string[]): Promise<Record<string, number>> {
  const ids = Array.from(new Set(sessionIds.filter(Boolean)));
  if (ids.length === 0) return {};
  const { data, error } = await supabase.rpc('get_my_session_credits', { p_session_ids: ids });
  if (error) throw new Error(error.message || 'Credits could not be read.');
  const out: Record<string, number> = {};
  for (const row of (data as { session_id: string; credits: number }[] | null) ?? []) {
    if (row?.session_id) out[row.session_id] = Number(row.credits) || 0;
  }
  return out;
}

export interface SessionUsage {
  briefCredits: number;
  runCredits: number;
  /** Null unless the signed-in user is an admin. */
  briefUsd: number | null;
  runUsd: number | null;
}

/** Credits per session id, split into the brief part and the run part. Sessions without usage are missing. Throws on a failed read. */
export async function getSessionUsage(sessionIds: string[]): Promise<Record<string, SessionUsage>> {
  const ids = Array.from(new Set(sessionIds.filter(Boolean)));
  if (ids.length === 0) return {};
  const { data, error } = await supabase.rpc('get_my_session_usage', { p_session_ids: ids });
  if (error) throw new Error(error.message || 'Credits could not be read.');
  const out: Record<string, SessionUsage> = {};
  for (const row of (data as { session_id: string; brief_credits: number; run_credits: number; brief_usd: number | null; run_usd: number | null }[] | null) ?? []) {
    if (!row?.session_id) continue;
    out[row.session_id] = {
      briefCredits: Number(row.brief_credits) || 0,
      runCredits: Number(row.run_credits) || 0,
      briefUsd: row.brief_usd == null ? null : Number(row.brief_usd),
      runUsd: row.run_usd == null ? null : Number(row.run_usd),
    };
  }
  return out;
}

/** Admin only: the same split for another user's sessions. Throws on a failed read or when not an admin. */
export async function adminGetSessionUsage(userId: string, sessionIds: string[]): Promise<Record<string, SessionUsage>> {
  const ids = Array.from(new Set(sessionIds.filter(Boolean)));
  if (ids.length === 0) return {};
  const { data, error } = await supabase.rpc('admin_get_session_usage', { p_user_id: userId, p_session_ids: ids });
  if (error) throw new Error(error.message || 'Credits could not be read.');
  const out: Record<string, SessionUsage> = {};
  for (const row of (data as { session_id: string; brief_credits: number; run_credits: number; brief_usd: number | null; run_usd: number | null }[] | null) ?? []) {
    if (!row?.session_id) continue;
    out[row.session_id] = {
      briefCredits: Number(row.brief_credits) || 0,
      runCredits: Number(row.run_credits) || 0,
      briefUsd: row.brief_usd == null ? null : Number(row.brief_usd),
      runUsd: row.run_usd == null ? null : Number(row.run_usd),
    };
  }
  return out;
}

/** "$0.036" under ten cents, "$0.51" from ten cents up. */
export function formatUsd(value: number): string {
  return value < 0.1 ? '$' + value.toFixed(3) : '$' + value.toFixed(2);
}

/**
 * The credits of one session, read again whenever `tick` changes. Null while
 * unknown or when the read fails: the screen then shows nothing rather than 0.
 */
export function useSessionCredits(sessionId: string | null | undefined, tick: number): number | null {
  const [credits, setCredits] = useState<number | null>(null);
  useEffect(() => {
    if (!sessionId) {
      setCredits(null);
      return;
    }
    let live = true;
    getSessionCredits([sessionId])
      .then(map => {
        if (live) setCredits(map[sessionId] ?? null);
      })
      .catch(() => {
        if (live) setCredits(null);
      });
    return () => {
      live = false;
    };
  }, [sessionId, tick]);
  return credits;
}

/**
 * About how many credits a run uses, from the words it works on (rewritten and
 * kept parts). First measured on 22 runs of 2026-10-11 and 10-12 (29 to 60
 * credits). Measured again on the runs of 2026-10-19 to 10-22, after the claim
 * check, the left-out check and the check-screen questions were added: 40 to 59
 * credits up to 300 words, 87 to 129 at 680 to 940, 96 to 153 at 1,100 to
 * 1,950, 88 to 180 at 2,250 to 2,750. The two passes after a run add about 15
 * to 30 credits each when they run (factRepairPass.ts when the best version
 * left out key facts, ctaPass.ts when its call to action is weak). The
 * estimate allows for one of them. Above 2,000 words it is said to be a lower
 * bound.
 */
/**
 * About how long a run takes, from the words it works on, as words for the
 * screen ("2 to 4 minutes"). Measured on the runs of 2026-10-18 and 10-19,
 * with the claim check: 80 to 125 seconds up to 400 words, 140 to 200 at 550
 * to 950, 165 to 260 at 1,000 to 1,800, 165 to 300 at 2,250 to 2,850, and 6
 * minutes at 3,400. Since 2026-10-22 the passes after a run add about a
 * minute when they run (Tidewell 203 seconds, Bella Cucina 215 seconds with
 * both), more on long pages. Rounded up, so the run is seldom longer than it says.
 */
export function estimateRunTime(words: number): string {
  if (words <= 400) return '2 to 4 minutes';
  if (words <= 1000) return '3 to 5 minutes';
  if (words <= 2000) return '3 to 6 minutes';
  if (words <= 3000) return '4 to 7 minutes';
  return '6 minutes or more';
}

/** From this many words on, the screens also ask to keep the tab open: the run happens in this tab. */
export const KEEP_TAB_OPEN_FROM_WORDS = 1000;

export function estimateRunCredits(words: number, versions = 3): { credits: number; atLeast: boolean } {
  const three =
    words <= 250 ? 55 : words <= 500 ? 70 : words <= 1000 ? 120 : words <= 2000 ? 160 : 180;
  // One version: writing, checks and scoring of the other two are not done
  // (measured 2026-11-04 on 153 runs: about 45% of a three-version run).
  const credits = versions === 1 ? Math.max(20, Math.round((three * 0.45) / 5) * 5) : three;
  return { credits, atLeast: words > 2000 };
}
