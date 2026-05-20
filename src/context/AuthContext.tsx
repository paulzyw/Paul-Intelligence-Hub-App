import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: any;
  profile: UserProfile | null;
  loading: boolean;
  hasRole: (roles: UserRole[]) => boolean;
  isSuperAdmin: () => boolean;
  isRevOSAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      // First try standard profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (profile) return profile;

      // If not found, try revos_profiles
      const { data: revosProfile, error: revosError } = await supabase
        .from('revos_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (revosProfile) {
        return {
          id: revosProfile.id,
          role: revosProfile.role as UserRole,
          full_name: revosProfile.full_name || null,
          avatar_url: revosProfile.avatar_url || null,
          created_at: revosProfile.created_at
        };
      }

      return null;
    } catch (err) {
      console.error('Profile fetch unexpected error:', err);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    async function handleAuth(session: any) {
      if (!mounted) return;
      
      if (session?.user) {
        setUser(session.user);
        try {
          setLoading(true);
          const profileData = await fetchProfile(session.user.id);
          if (mounted) {
            setProfile(profileData);
          }
        } catch (error) {
          console.error('Auth state change profile fetch error:', error);
          if (mounted) setProfile(null);
        } finally {
          if (mounted) setLoading(false);
        }
      } else {
        if (mounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    }

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuth(session);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuth(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const hasRole = (roles: UserRole[]) => {
    return profile !== null && roles.includes(profile.role);
  };

  const isSuperAdmin = () => profile?.role === 'super_admin';
  const isRevOSAdmin = () => profile?.role === 'revos_admin' || profile?.role === 'super_admin';

  return (
    <AuthContext.Provider value={{ user, profile, loading, hasRole, isSuperAdmin, isRevOSAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
