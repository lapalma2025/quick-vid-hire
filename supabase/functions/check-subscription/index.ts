import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Product IDs from Stripe
const PRODUCTS = {
  basic: "prod_TXiFwfulxswFWk",
  pro: "prod_TXiFgxZoItUmcv",
  boost: "prod_TXiGCF3JEazhuN",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    // Get user profile
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({
        subscribed: false,
        plan: null,
        subscription_end: null,
        remaining_listings: profile?.remaining_listings || 0,
        remaining_highlights: profile?.remaining_highlights || 0,
        is_trusted: profile?.is_trusted || false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Update stripe_customer_id in profile if not set
    if (!profile?.stripe_customer_id) {
      await supabaseClient
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("user_id", user.id);
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    logStep("Subscriptions fetched", { count: subscriptions.data.length });

    const hasActiveSub = subscriptions.data.length > 0;
    let plan = null;
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      logStep("Processing subscription", { 
        id: subscription.id, 
        current_period_end: subscription.current_period_end,
        status: subscription.status 
      });
      
      // Safely convert timestamp to ISO string
      if (subscription.current_period_end && typeof subscription.current_period_end === 'number') {
        subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      }
      
      const priceData = subscription.items.data[0]?.price;
      const productId = priceData?.product as string;
      logStep("Product ID from subscription", { productId });
      
      // Determine plan from product ID
      if (productId === PRODUCTS.basic) plan = "basic";
      else if (productId === PRODUCTS.pro) plan = "pro";
      else if (productId === PRODUCTS.boost) plan = "boost";
      
      logStep("Active subscription found", { plan, subscriptionEnd, productId });
      
      // Update profile with subscription info if not already set
      if (plan && profile) {
        const planLimits = {
          basic: { listings: 10, highlights: 1, is_trusted: false },
          pro: { listings: 30, highlights: 5, is_trusted: true },
          boost: { listings: 100, highlights: 15, is_trusted: true },
        };
        const limits = planLimits[plan as keyof typeof planLimits];
        
        // Only update if profile doesn't have current subscription data
        if (profile.subscription_plan !== plan) {
          await supabaseClient
            .from("profiles")
            .update({ 
              subscription_plan: plan,
              subscription_period_end: subscriptionEnd,
              remaining_listings: limits.listings,
              remaining_highlights: limits.highlights,
              is_trusted: limits.is_trusted,
            })
            .eq("user_id", user.id);
          logStep("Profile updated with subscription data");
        }
      }
    } else {
      logStep("No active subscription");
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      plan,
      subscription_end: subscriptionEnd,
      remaining_listings: hasActiveSub && plan ? (
        plan === "basic" ? 10 : plan === "pro" ? 30 : 100
      ) : (profile?.remaining_listings || 0),
      remaining_highlights: hasActiveSub && plan ? (
        plan === "basic" ? 1 : plan === "pro" ? 5 : 15
      ) : (profile?.remaining_highlights || 0),
      is_trusted: hasActiveSub && (plan === "pro" || plan === "boost") ? true : (profile?.is_trusted || false),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
