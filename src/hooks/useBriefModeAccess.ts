import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../services/supabaseClient';

interface BriefModeAccess {
  allowed: boolean;
  loading: boolean;
}

export function useBriefModeAccess(userId?: string | null): BriefModeAccess {
  const [allowed, setAllowed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    const client = getSupabaseClient();

    (async () => {
      let uid = userId ?? null;
      if (!uid) {
        const { data: { user } } = await client.auth.getUser();
        uid = user?.id ?? null;
      }
      if (!uid) {
        if (!cancelled) {
          setAllowed(false);
          setLoading(false);
        }
        return;
      }

      const { data, error } = await client.rpc('brief_mode_allowed');
      if (cancelled) return;
      if (error) {
        setAllowed(false);
      } else {
        setAllowed(data === true);
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [userId]);

  return { allowed, loading };
}
