import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Price IDs from Stripe
const PRICES = {
  single_listing: "price_1SacowI8P5nzkvLrXkJt3DCq", // 5 zł
  basic: "price_1SacpCI8P5nzkvLrTOQnHxex", // 49 zł/month
  pro: "price_1SacpOI8P5nzkvLrveQT9pio", // 99 zł/month
  boost: "price_1SacpaI8P5nzkvLrOS7stDy1", // 199 zł/month
  highlight: "price_1SacpqI8P5nzkvLrym5K4ylE", // 9 zł
  promote: "price_1Sacq1I8P5nzkvLrV5v42W4Y", // 5 zł
  urgent: "price_1SacqII8P5nzkvLrsO4RuHnC", // 4 zł
  promote_24h: "price_1SacqUI8P5nzkvLr3NCwa0pc", // 3 zł
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { email: user.email });

    const { type, plan, jobId, addons } = await req.json();
    logStep("Request data", { type, plan, jobId, addons });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://xdjyejuddhopsjhltdri.lovableproject.com";
    let session;

    if (type === "subscription") {
      // Subscription checkout
      const priceId = PRICES[plan as keyof typeof PRICES] || PRICES.basic;
      
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "subscription",
        payment_method_collection: "always",
        success_url: `${origin}/subscription?success=true`,
        cancel_url: `${origin}/subscription?canceled=true`,
        metadata: { user_id: user.id, plan },
      });
    } else if (type === "single_listing") {
      // Single listing payment
      const lineItems: any[] = [{ price: PRICES.single_listing, quantity: 1 }];
      
      // Add any premium addons
      if (addons?.highlight) lineItems.push({ price: PRICES.highlight, quantity: 1 });
      if (addons?.promote) lineItems.push({ price: PRICES.promote, quantity: 1 });
      if (addons?.urgent) lineItems.push({ price: PRICES.urgent, quantity: 1 });
      if (addons?.promote_24h) lineItems.push({ price: PRICES.promote_24h, quantity: 1 });
      
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: lineItems,
        mode: "payment",
        success_url: `${origin}/jobs/new?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/jobs/new?canceled=true`,
        metadata: { 
          user_id: user.id, 
          job_id: jobId || "",
          addons: JSON.stringify(addons || {})
        },
      });
    } else if (type === "addons_only") {
      // Only premium addons (for users with subscription)
      const lineItems: any[] = [];
      if (addons?.highlight) lineItems.push({ price: PRICES.highlight, quantity: 1 });
      if (addons?.promote) lineItems.push({ price: PRICES.promote, quantity: 1 });
      if (addons?.urgent) lineItems.push({ price: PRICES.urgent, quantity: 1 });
      if (addons?.promote_24h) lineItems.push({ price: PRICES.promote_24h, quantity: 1 });
      
      if (lineItems.length === 0) {
        throw new Error("No addons selected");
      }
      
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: lineItems,
        mode: "payment",
        success_url: `${origin}/jobs/new?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/jobs/new?canceled=true`,
        metadata: { 
          user_id: user.id, 
          job_id: jobId || "",
          addons: JSON.stringify(addons || {})
        },
      });
    } else {
      throw new Error("Invalid checkout type");
    }

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
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
