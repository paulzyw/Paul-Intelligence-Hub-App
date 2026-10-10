import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function useTrafficTracking() {
  const location = useLocation();

  useEffect(() => {
    const logTraffic = async () => {
      if (!isSupabaseConfigured) return;
      try {
        const payload = {
          page_path: location.pathname,
          referrer_url: document.referrer,
          is_unlock_event: false // Standard view
        };

        // Call Edge Function safely wrapped in catch
        await supabase.functions.invoke('log-traffic', {
          body: payload,
        }).catch(() => {});
      } catch (err) {
        // Silently catch network-level errors to prevent console spam for end users
      }
    };

    logTraffic();
  }, [location.pathname]);
}

/**
 * Helper to log manual unlock events
 */
export const logUnlockEvent = async (path: string) => {
    if (!isSupabaseConfigured) return;
    try {
        await supabase.functions.invoke('log-traffic', {
          body: {
            page_path: path,
            referrer_url: document.referrer,
            is_unlock_event: true
          },
        }).catch(() => {});
    } catch (err) {
        // Silently ignore
    }
};
