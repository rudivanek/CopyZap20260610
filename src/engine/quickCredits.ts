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
 * kept parts). Measured on 22 runs of 2026-10-11 and 10-12: 29 to 31 credits
 * up to 150 words, 34 to 36 at about 300, about 60 at 700 to 1,350. Most of a
 * run is the same number of calls whatever the length (3 versions, each
 * scored three times), so short texts all cost about the same.
 * Above 1,500 words there are no measurements yet; the estimate is said to be
 * a lower bound there.
 */
export function estimateRunCredits(words: number): { credits: number; atLeast: boolean } {
  if (words <= 250) return { credits: 30, atLeast: false };
  if (words <= 500) return { credits: 35, atLeast: false };
  if (words <= 1500) return { credits: 60, atLeast: false };
  return { credits: 80, atLeast: true };
}
