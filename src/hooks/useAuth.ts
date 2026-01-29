import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';

export const useAuth = () => {
  const { user, session, profile, isLoading, setUser, setSession, setProfile, setIsLoading, reset } = useAuthStore();
  const currentUserIdRef = useRef<string | null>(null);

  const ensureProfile = async (userId: string, fallbackName?: string | null) => {
    // Try to create a minimal profile for brand-new users (Dashboard depends on profile).
    // RLS allows INSERT when auth.uid() = user_id.
    const displayName =
      (typeof fallbackName === 'string' && fallbackName.trim() ? fallbackName.trim() : null) ??
      ((user as any)?.user_metadata?.name ? String((user as any).user_metadata.name) : null) ??
      ((session as any)?.user?.user_metadata?.name ? String((session as any).user.user_metadata.name) : null);

    const { data: created, error: createError } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        name: displayName,
        // Keep existing app semantics (default client on fresh accounts)
        role: 'client',
      } as any)
      .select('*')
      .single();

    if (!createError && created) {
      setProfile(created as any);
      return true;
    }

    return false;
  };

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
              fetchProfile(newUserId, (session as any)?.user?.user_metadata?.name ?? null);
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
        fetchProfile(userId, (session as any)?.user?.user_metadata?.name ?? null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, fallbackName?: string | null) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (data && !error) {
      setProfile(data as any);
    } else {
      // If no profile row exists yet (common right after signup), create it.
      if (!data && !error) {
        const created = await ensureProfile(userId, fallbackName);
        if (created) return;
      }

      // Only clear if there was an error fetching for the current user
      if (currentUserIdRef.current === userId) setProfile(null);
    }
  };

  const signOut = async () => {
    currentUserIdRef.current = null;
    await supabase.auth.signOut();
    reset();
  };

  const refreshProfile = () => {
    if (user) {
      fetchProfile(user.id, (user as any)?.user_metadata?.name ?? null);
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