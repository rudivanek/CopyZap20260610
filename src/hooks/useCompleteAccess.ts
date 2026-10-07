import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { getCompleteAccess, resetCompleteAccess } from '../services/powerUser';

/**
 * Whether the signed-in user may use the Complete interface (power users and
 * admins). Null while it is being worked out.
 */
export function useCompleteAccess(): boolean | null {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    const check = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const access = await getCompleteAccess(data.user ? { id: data.user.id, email: data.user.email ?? '' } : null);
        if (isMounted) setAllowed(access);
      } catch {
        // Could not tell: leave things as they were before the flag existed.
        if (isMounted) setAllowed(true);
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        resetCompleteAccess();
        check();
      }
    });

    check();
    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return allowed;
}
