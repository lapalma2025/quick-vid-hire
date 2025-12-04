import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { SubscriptionPlan } from "@/lib/stripe";

interface SubscriptionState {
  subscribed: boolean;
  plan: SubscriptionPlan;
  subscriptionEnd: string | null;
  remainingListings: number;
  remainingHighlights: number;
  isTrusted: boolean;
  loading: boolean;
}

export function useSubscription() {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    plan: null,
    subscriptionEnd: null,
    remainingListings: 0,
    remainingHighlights: 0,
    isTrusted: false,
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) {
        console.error("Check subscription error:", error);
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      setState({
        subscribed: data?.subscribed || false,
        plan: data?.plan || null,
        subscriptionEnd: data?.subscription_end || null,
        remainingListings: data?.remaining_listings || 0,
        remainingHighlights: data?.remaining_highlights || 0,
        isTrusted: data?.is_trusted || false,
        loading: false,
      });
    } catch (err) {
      console.error("Check subscription error:", err);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Auto-refresh every minute
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, checkSubscription]);

  const openCheckout = async (plan: "basic" | "pro" | "boost") => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { type: "subscription", plan },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      throw err;
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("Customer portal error:", err);
      throw err;
    }
  };

  return {
    ...state,
    checkSubscription,
    openCheckout,
    openCustomerPortal,
  };
}
