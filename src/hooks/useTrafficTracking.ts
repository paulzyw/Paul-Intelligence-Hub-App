import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function useTrafficTracking() {
  const location = useLocation();

  useEffect(() => {
    const logTraffic = async () => {
      try {
        // Prepare payload
        const payload = {
          page_path: location.pathname,
          referrer_url: document.referrer,
          is_unlock_event: false // Standard view
        };

        // Call Edge Function
        const { error } = await supabase.functions.invoke('log-traffic', {
          body: payload,
        });

        if (error) {
          // If the error is about the function not being found or unreachable, log a helpful warning
          if (error.message?.includes('Failed to send a request') || error.status === 404) {
            console.warn('Traffic Intelligence: Edge Function "log-traffic" not reachable. Please ensure it is deployed to your Supabase project.');
          } else {
            console.error('Traffic logging error:', error);
          }
        }
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
    try {
        const { error } = await supabase.functions.invoke('log-traffic', {
          body: {
            page_path: path,
            referrer_url: document.referrer,
            is_unlock_event: true
          },
        });
        if (error) throw error;
    } catch (err) {
        console.warn('Unlock log failed: Edge Function might not be deployed.');
    }
};
