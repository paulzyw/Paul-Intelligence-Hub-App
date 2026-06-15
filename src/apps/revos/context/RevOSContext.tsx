import React, { createContext, useContext, useState, useEffect } from 'react';
import { RevOSState, RevOSProfile, RevOSOrg, GTMOSStrategy } from '../types';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';

interface RevOSContextType extends RevOSState {
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  currentStrategy: GTMOSStrategy | null;
}

const RevOSContext = createContext<RevOSContextType | undefined>(undefined);

export function RevOSProvider({ children }: { children: React.ReactNode }) {
  const { user, profile: authProfile, loading: authLoading } = useAuth();
  const [state, setState] = useState<RevOSState>({
    profile: null,
    org: null,
    isLoading: true,
    error: null,
  });
  const [currentStrategy, setCurrentStrategy] = useState<GTMOSStrategy | null>(null);

  const fetchOrgDetails = async (profile: any) => {
    if (!profile) {
      setState({ profile: null, org: null, isLoading: false, error: null });
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      let org = null;
      if (profile.org_id) {
        const { data: orgData } = await supabase
          .from('revos_orgs')
          .select('*')
          .eq('id', profile.org_id)
          .single();
        org = orgData;
      }
      
      let strategy = null;
      if (profile.org_id) {
        const { data: strategyData } = await supabase
          .from('gtmos_strategies') // Assuming a table named gtmos_strategies
          .select('*')
          .eq('org_id', profile.org_id)
          .maybeSingle(); // Maybe handle multiple if the app supports it
        strategy = strategyData;
      }

      setState({
        profile: profile as RevOSProfile,
        org: org as RevOSOrg,
        isLoading: false,
        error: null,
      });
      setCurrentStrategy(strategy);
    } catch (err: any) {
      console.error('Error fetching RevOS org details:', err);
      setState({
        profile: profile as RevOSProfile,
        org: null,
        isLoading: false,
        error: null,
      });
    }
  };

  useEffect(() => {
    if (authLoading) {
      setState(prev => ({ ...prev, isLoading: true }));
      return;
    }

    if (!user) {
      setState({ profile: null, org: null, isLoading: false, error: null });
    } else if (authProfile) {
      fetchOrgDetails(authProfile);
    } else {
      // User is logged in but profile could not be found
      setState({ profile: null, org: null, isLoading: false, error: 'Authorization profile not found. Please contact support.' });
    }
  }, [authProfile, user, authLoading]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('RevOS Context SignOut API failure, performing offline cleanup:', err);
    } finally {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('sb-') || key.includes('supabase.auth.token'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      } catch (e) {
        console.error('Failed to clear stale storage keys on workspace signout:', e);
      }
    }
  };

  return (
    <RevOSContext.Provider value={{ ...state, refreshProfile: () => fetchOrgDetails(authProfile), signOut, currentStrategy }}>
      {children}
    </RevOSContext.Provider>
  );
}

export function useRevOS() {
  const context = useContext(RevOSContext);
  if (context === undefined) {
    throw new Error('useRevOS must be used within a RevOSProvider');
  }
  return context;
}
