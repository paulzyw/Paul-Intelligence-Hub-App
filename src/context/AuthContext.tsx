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
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return data;
  };

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          const profileData = await fetchProfile(session.user.id);
          if (mounted) setProfile(profileData);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        setLoading(true);
        const profileData = await fetchProfile(session.user.id);
        if (mounted) {
          setProfile(profileData);
          setLoading(false);
        }
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
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
