import React, { createContext, useContext, useState, useEffect } from 'react';
import { RevOSState, RevOSProfile, RevOSOrg } from '../types';
import { supabase } from '../../../lib/supabase';

interface RevOSContextType extends RevOSState {
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const RevOSContext = createContext<RevOSContextType | undefined>(undefined);

export function RevOSProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<RevOSState>({
    profile: null,
    org: null,
    isLoading: true,
    error: null,
  });

  const fetchProfile = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        if (authError && authError.message !== 'Auth session missing!') {
          console.warn('Auth check error:', authError);
        }
        setState(prev => ({ ...prev, profile: null, org: null, isLoading: false }));
        return;
      }

      // Fetch Profile
      const { data: profile, error: profileError } = await supabase
        .from('revos_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // If no profile exists yet, create one
      if (!profile) {
        // Use upsert to handle potential race conditions or existing records
        const { data: newProfile, error: createError } = await supabase
          .from('revos_profiles')
          .upsert({ id: user.id, role: 'free_user' }, { onConflict: 'id' })
          .select()
          .single();

        if (createError) {
          // If upsert fails (e.g. unique constraint or RLS), attempt one last fetch
          const { data: retryProfile } = await supabase
            .from('revos_profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (retryProfile) {
            setState({
              profile: retryProfile as RevOSProfile,
              org: null,
              isLoading: false,
              error: null,
            });
            return;
          }
          throw new Error(`Profile creation failed: ${createError.message}`);
        }

        setState({
          profile: newProfile as RevOSProfile,
          org: null,
          isLoading: false,
          error: null,
        });
        return;
      }

      // Fetch Org if associated
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
      console.error('Error in RevOS fetchProfile:', err);
      const errorMessage = err.message === 'Failed to fetch' 
        ? 'Network error: Could not reach Supabase.'
        : err.message;
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setState({
      profile: null,
      org: null,
      isLoading: false,
      error: null,
    });
  };

  useEffect(() => {
    fetchProfile();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        fetchProfile();
      } else if (event === 'SIGNED_OUT') {
        setState({ profile: null, org: null, isLoading: false, error: null });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <RevOSContext.Provider value={{ ...state, refreshProfile: fetchProfile, signOut }}>
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
