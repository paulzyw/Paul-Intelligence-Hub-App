import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
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

  const activeProfilePromiseRef = useRef<Promise<UserProfile | null> | null>(null);
  const lastHandledUserIdRef = useRef<string | null>(null);

  const getCachedProfile = (userId: string): UserProfile | null => {
    try {
      const raw = sessionStorage.getItem(`revos_profile_${userId}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const setCachedProfile = (userId: string, prof: UserProfile | null) => {
    try {
      if (prof) {
        sessionStorage.setItem(`revos_profile_${userId}`, JSON.stringify(prof));
      } else {
        sessionStorage.removeItem(`revos_profile_${userId}`);
      }
    } catch {}
  };

  const fetchProfile = async (userId: string, email?: string): Promise<UserProfile | null> => {
    if (activeProfilePromiseRef.current) {
      return activeProfilePromiseRef.current;
    }

    const fetchPromise = (async () => {
      try {
        // First try standard profiles
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        
        if (profile) {
          const result: UserProfile = {
            id: profile.id,
            email: profile.email || email || '',
            role: profile.role as UserRole,
            created_at: profile.created_at
          };
          setCachedProfile(userId, result);
          return result;
        }

        // If not found, try revos_profiles
        const { data: revosProfile, error: revosError } = await supabase
          .from('revos_profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (revosProfile) {
          const result: UserProfile = {
            id: revosProfile.id,
            email: email || '',
            role: revosProfile.role as UserRole,
            created_at: revosProfile.created_at
          };
          setCachedProfile(userId, result);
          return result;
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

        const autoProvisioned: UserProfile = {
          id: userId,
          email: email || '',
          role: roleToSet,
          created_at: new Date().toISOString()
        };
        setCachedProfile(userId, autoProvisioned);
        return autoProvisioned;
      } catch (err) {
        console.error('Profile fetch unexpected error:', err);
        const SUPER_ADMIN_EMAILS = [
          'paul.zy.wang@gmail.com',
          'paul.zy.wang@hotmail.com',
          'super.admin@revos.io',
          'paul@revos.io'
        ];
        const isSuperAdminEmail = email ? SUPER_ADMIN_EMAILS.includes(email.toLowerCase()) : false;
        const fallbackProfile: UserProfile = {
          id: userId,
          email: email || '',
          role: isSuperAdminEmail ? 'super_admin' : 'free_user',
          created_at: new Date().toISOString()
        };
        return fallbackProfile;
      } finally {
        activeProfilePromiseRef.current = null;
      }
    })();

    activeProfilePromiseRef.current = fetchPromise;
    return fetchPromise;
  };

  useEffect(() => {
    let mounted = true;

    async function handleAuth(session: any, isInitial: boolean = false) {
      if (!mounted) return;
      
      if (session?.user) {
        const userId = session.user.id;
        setUser(session.user);

        // Immediate cache hydration for instantaneous usability on refresh
        const cached = getCachedProfile(userId);
        if (cached) {
          setProfile(cached);
          if (mounted) setLoading(false);
        }

        // Avoid duplicate concurrent fetch for identical user
        if (lastHandledUserIdRef.current === userId && cached) {
          return;
        }
        lastHandledUserIdRef.current = userId;

        try {
          if (!cached) {
            setLoading(true);
          }
          const profileData = await fetchProfile(userId, session.user.email);
          if (mounted) {
            setProfile(profileData);
          }
        } catch (error) {
          console.error('Auth state change profile fetch error:', error);
          if (mounted && !cached) setProfile(null);
        } finally {
          if (mounted) setLoading(false);
        }
      } else {
        lastHandledUserIdRef.current = null;
        if (mounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    }

    // Initial session check
    if (!isSupabaseConfigured) {
      console.warn("Supabase is not configured, skipping auth initialization.");
      if (mounted) setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn('Supabase session initialization error, clearing stale session cookies:', error.message);
        try {
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
        handleAuth(session, true);
      }
    }).catch((err) => {
      console.error('Unexpected getSession error:', err);
      handleAuth(null);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // If INITIAL_SESSION fires and we already have the session handled, skip duplicate
      if (event === 'INITIAL_SESSION' && lastHandledUserIdRef.current && lastHandledUserIdRef.current === session?.user?.id) {
        return;
      }
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
