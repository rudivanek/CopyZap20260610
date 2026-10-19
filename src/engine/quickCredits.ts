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
 * scored three times), so short texts all cost about the same. Since
 * 2026-10-14 a version is scored again only when it is close to another
 * (see scoreQuickVersions), so a run can use fewer; not yet re-measured.
 * Above 1,500 words there are no measurements yet; the estimate is said to be
 * a lower bound there.
 */
/**
 * About how long a run takes, from the words it works on, as words for the
 * screen ("about 2 minutes"). Measured on the runs of 2026-10-18 and 10-19,
 * with the claim check: 80 to 125 seconds up to 400 words, 140 to 200 at 550
 * to 950, 165 to 260 at 1,000 to 1,800, 165 to 300 at 2,250 to 2,850, and 6
 * minutes at 3,400. Rounded up, so the run is seldom longer than it says.
 */
export function estimateRunTime(words: number): string {
  if (words <= 400) return 'about 2 minutes';
  if (words <= 1000) return '2 to 3 minutes';
  if (words <= 2000) return '3 to 4 minutes';
  if (words <= 3000) return '4 to 5 minutes';
  return '5 minutes or more';
}

/** From this many words on, the screens also ask to keep the tab open: the run happens in this tab. */
export const KEEP_TAB_OPEN_FROM_WORDS = 1000;

export function estimateRunCredits(words: number): { credits: number; atLeast: boolean } {
  if (words <= 250) return { credits: 30, atLeast: false };
  if (words <= 500) return { credits: 35, atLeast: false };
  if (words <= 1500) return { credits: 60, atLeast: false };
  return { credits: 80, atLeast: true };
}
