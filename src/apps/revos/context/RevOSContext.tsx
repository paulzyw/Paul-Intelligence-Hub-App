import React, { createContext, useContext, useState, useEffect } from 'react';
import { RevOSState, RevOSProfile, RevOSOrg } from '../types';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';

interface RevOSContextType extends RevOSState {
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const RevOSContext = createContext<RevOSContextType | undefined>(undefined);

export function RevOSProvider({ children }: { children: React.ReactNode }) {
  const { user, profile: authProfile } = useAuth();
  const [state, setState] = useState<RevOSState>({
    profile: null,
    org: null,
    isLoading: true,
    error: null,
  });

  const fetchOrgDetails = async (profile: any) => {
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

      setState({
        profile: profile as RevOSProfile,
        org: org as RevOSOrg,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      console.error('Error fetching RevOS org details:', err);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    if (authProfile) {
      // We have the profile from AuthContext (which already checked both tables)
      // Check if it's a RevOS profile or a standard one
      // In our setup, even standard profiles are mapped to RevOSProfile shape in AuthContext
      fetchOrgDetails(authProfile);
    } else {
      // If no authProfile but we have a user, it might still be loading or not found
      if (!user) {
        setState({ profile: null, org: null, isLoading: false, error: null });
      } else {
        // Still waiting for AuthContext profile fetch
        setState(prev => ({ ...prev, isLoading: true }));
      }
    }
  }, [authProfile, user]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <RevOSContext.Provider value={{ ...state, refreshProfile: () => fetchOrgDetails(authProfile), signOut }}>
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
