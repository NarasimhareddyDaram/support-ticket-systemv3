import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/supabase';

type AuthContextValue = {
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, role')
      .eq('id', user.id)
      .maybeSingle();
    if (error) {
      console.error('profile fetch failed', error);
      return;
    }
    if (data) {
      setProfile({
        id: (data as { id: string }).id,
        display_name: (data as { display_name: string }).display_name,
        role: (data as { role: Profile['role'] }).role,
        email: user.email ?? '',
      });
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!session) {
        setLoading(false);
        return;
      }
      await refreshProfile();
      if (mounted) setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (!session) {
          setProfile(null);
        } else {
          await refreshProfile();
        }
        if (mounted) setLoading(false);
      })();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [refreshProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
