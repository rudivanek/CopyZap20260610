import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../services/supabaseClient';

interface CreditsBalance {
  creditsAllowed: number;
  creditsRemaining: number;
  isLoading: boolean;
}

export function useCreditsBalance(userId: string | undefined): CreditsBalance {
  const [creditsAllowed, setCreditsAllowed] = useState<number>(0);
  const [creditsRemaining, setCreditsRemaining] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCreditsBalance = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const supabase = getSupabaseClient();

      // Use RPC function for efficient server-side aggregation
      const { data, error } = await supabase.rpc('get_user_credits_balance', {
        user_id_param: userId
      });

      if (error) {
        console.error('Error fetching credits balance:', error);
        setIsLoading(false);
        return;
      }

      if (data) {
        setCreditsAllowed(data.credits_allowed || 0);
        setCreditsRemaining(data.credits_remaining || 0);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error in fetchCreditsBalance:', error);
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    // Fetch on mount
    fetchCreditsBalance();

    // Refresh on window focus (better than polling every 30s)
    const handleFocus = () => {
      fetchCreditsBalance();
    };
    window.addEventListener('focus', handleFocus);

    // Optional: Keep a longer interval as fallback (5 minutes instead of 30 seconds)
    const interval = setInterval(fetchCreditsBalance, 5 * 60 * 1000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [userId, fetchCreditsBalance]);

  return {
    creditsAllowed,
    creditsRemaining,
    isLoading,
  };
}
