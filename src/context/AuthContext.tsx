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

  const fetchProfile = async (userId: string, email?: string) => {
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

      // If no profile is found, automatically provision standard and revos profile rows
      const SUPER_ADMIN_EMAILS = [
        'paul.zy.wang@gmail.com',
        'paul.zy.wang@hotmail.com',
        'super.admin@revos.io',
        'paul@revos.io'
      ];

      const isSuperAdminEmail = email ? SUPER_ADMIN_EMAILS.includes(email.toLowerCase()) : false;
      const roleToSet: UserRole = isSuperAdminEmail ? 'super_admin' : 'free_user';

      console.log(`Auto-provisioning user profile for ${email || userId} with role: ${roleToSet}`);

      try {
        await supabase.from('profiles').insert([
          {
            id: userId,
            email: email || '',
            role: roleToSet,
            created_at: new Date().toISOString()
          }
        ]);
      } catch (err: any) {
        console.warn('Skip profiles write:', err.message || err);
      }

      try {
        await supabase.from('revos_profiles').insert([
          {
            id: userId,
            role: roleToSet,
            is_active: true,
            api_usage_quota: isSuperAdminEmail ? 5000 : 100,
            created_at: new Date().toISOString()
          }
        ]);
      } catch (err: any) {
        console.warn('Skip revos_profiles write:', err.message || err);
      }

      return {
        id: userId,
        email: email || '',
        role: roleToSet,
        created_at: new Date().toISOString()
      };
    } catch (err) {
      console.error('Profile fetch unexpected error:', err);
      const SUPER_ADMIN_EMAILS = [
        'paul.zy.wang@gmail.com',
        'paul.zy.wang@hotmail.com',
        'super.admin@revos.io',
        'paul@revos.io'
      ];
      const isSuperAdminEmail = email ? SUPER_ADMIN_EMAILS.includes(email.toLowerCase()) : false;
      return {
        id: userId,
        email: email || '',
        role: isSuperAdminEmail ? 'super_admin' : 'free_user',
        created_at: new Date().toISOString()
      };
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
          const profileData = await fetchProfile(session.user.id, session.user.email);
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
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn('Supabase session initialization error, clearing stale session cookies:', error.message);
        try {
          // Clear any supabase-related keys in localStorage
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('sb-') || key.includes('supabase.auth.token'))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(k => localStorage.removeItem(k));
        } catch (err) {
          console.error('Failed to clear stale storage keys:', err);
        }
        handleAuth(null);
      } else {
        handleAuth(session);
      }
    }).catch((err) => {
      console.error('Unexpected getSession error:', err);
      handleAuth(null);
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
