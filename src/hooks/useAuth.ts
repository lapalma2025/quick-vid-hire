import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';

export const useAuth = () => {
  const { user, session, profile, isLoading, setUser, setSession, setProfile, setIsLoading, reset } = useAuthStore();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetch
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (data && !error) {
      setProfile(data as any);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    reset();
  };

  const refreshProfile = () => {
    if (user) {
      fetchProfile(user.id);
    }
  };

  return {
    user,
    session,
    profile,
    isLoading,
    signOut,
    refreshProfile,
    isAuthenticated: !!session,
    isClient: profile?.role === 'client',
    isWorker: profile?.role === 'worker',
    isAdmin: profile?.role === 'admin',
  };
};