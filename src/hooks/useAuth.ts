import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';

export const useAuth = () => {
  const { user, session, profile, isLoading, setUser, setSession, setProfile, setIsLoading, reset } = useAuthStore();
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const newUserId = session?.user?.id ?? null;
        const previousUserId = currentUserIdRef.current;

        setSession(session);
        setUser(session?.user ?? null);

        // Only clear profile if user actually changed (different user or signed out)
        if (newUserId !== previousUserId) {
          currentUserIdRef.current = newUserId;
          
          if (newUserId) {
            // Defer profile fetch to avoid deadlock
            setTimeout(() => {
              fetchProfile(newUserId);
            }, 0);
          } else {
            // User signed out - clear profile
            setProfile(null);
          }
        }

        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const userId = session?.user?.id ?? null;
      
      setSession(session);
      setUser(session?.user ?? null);
      currentUserIdRef.current = userId;

      if (userId) {
        fetchProfile(userId);
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
    } else {
      // Only clear if there was an error fetching for the current user
      if (currentUserIdRef.current === userId) {
        setProfile(null);
      }
    }
  };

  const signOut = async () => {
    currentUserIdRef.current = null;
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