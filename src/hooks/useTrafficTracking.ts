import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { cookieConsentService } from '../services/cookieConsentService';
import { useCookieConsent } from '../context/CookieConsentContext';

export function useTrafficTracking() {
  const location = useLocation();
  const { hasConsent } = useCookieConsent();

  useEffect(() => {
    // Enforcement: Only log traffic if visitor has affirmatively granted Analytics consent
    if (!hasConsent('analytics')) {
      return;
    }

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
  }, [location.pathname, hasConsent]);
}

/**
 * Helper to log manual unlock events - enforces Analytics consent
 */
export const logUnlockEvent = async (path: string) => {
  if (!cookieConsentService.hasConsent('analytics')) {
    return;
  }
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
