import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Product IDs from Stripe
const PRODUCTS = {
  basic: "prod_TXiFwfulxswFWk",
  pro: "prod_TXiFgxZoItUmcv",
  boost: "prod_TXiGCF3JEazhuN",
};

// Plan limits
const PLAN_LIMITS = {
  basic: { listings: 10, highlights: 1, is_trusted: false },
  pro: { listings: 30, highlights: 5, is_trusted: true },
  boost: { listings: 100, highlights: 15, is_trusted: true },
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
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
    logStep("Webhook received");
    
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    let event: Stripe.Event;
    
    // Verify webhook signature if webhook secret is set
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        logStep("Webhook signature verification failed", { error: err });
        return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
      }
    } else {
      event = JSON.parse(body);
    }

    logStep("Event type", { type: event.type });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", { sessionId: session.id, mode: session.mode });
        
        if (session.mode === "subscription") {
          // Subscription purchased
          const customerId = session.customer as string;
          const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
          const email = customer.email;
          
          if (email) {
            // Get the subscription
            const subscriptionId = session.subscription as string;
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const productId = subscription.items.data[0].price.product as string;
            
            let plan: string | null = null;
            if (productId === PRODUCTS.basic) plan = "basic";
            else if (productId === PRODUCTS.pro) plan = "pro";
            else if (productId === PRODUCTS.boost) plan = "boost";
            
            const limits = plan ? PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] : null;
            
            // Find user by email
            const { data: authUsers } = await supabaseClient.auth.admin.listUsers();
            const authUser = authUsers?.users?.find(u => u.email === email);
            
            if (authUser && plan && limits) {
              await supabaseClient
                .from("profiles")
                .update({
                  subscription_plan: plan,
                  subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                  stripe_customer_id: customerId,
                  remaining_listings: limits.listings,
                  remaining_highlights: limits.highlights,
                  is_trusted: limits.is_trusted,
                })
                .eq("user_id", authUser.id);
              
              logStep("Subscription activated", { email, plan });
            }
          }
        } else if (session.mode === "payment") {
          // One-time payment
          const metadata = session.metadata || {};
          const paymentType = metadata.type;
          
          if (paymentType === "worker_visibility") {
            // Worker visibility payment
            const profileId = metadata.profile_id;
            if (profileId) {
              await supabaseClient
                .from("profiles")
                .update({ worker_visibility_paid: true })
                .eq("id", profileId);
              logStep("Worker visibility activated", { profileId });
            }
          } else {
            // Job premium features payment
            const addons = metadata.addons ? JSON.parse(metadata.addons) : {};
            const jobId = metadata.job_id;
            
            if (jobId) {
              // Update job with premium features
              const updates: any = {};
              if (addons.highlight) updates.is_highlighted = true;
              if (addons.promote) updates.is_promoted = true;
              if (addons.urgent) updates.urgent = true;
              if (addons.promote_24h) {
                updates.is_promoted = true;
                updates.promotion_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
              }
              
              if (Object.keys(updates).length > 0) {
                await supabaseClient
                  .from("jobs")
                  .update(updates)
                  .eq("id", jobId);
                logStep("Job updated with premium features", { jobId, updates });
              }
            }
          }
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Invoice paid", { invoiceId: invoice.id });
        
        // Renewal - reset limits
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const customerId = subscription.customer as string;
          const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
          const email = customer.email;
          
          const productId = subscription.items.data[0].price.product as string;
          let plan: string | null = null;
          if (productId === PRODUCTS.basic) plan = "basic";
          else if (productId === PRODUCTS.pro) plan = "pro";
          else if (productId === PRODUCTS.boost) plan = "boost";
          
          const limits = plan ? PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] : null;
          
          if (email && plan && limits) {
            const { data: authUsers } = await supabaseClient.auth.admin.listUsers();
            const authUser = authUsers?.users?.find(u => u.email === email);
            
            if (authUser) {
              await supabaseClient
                .from("profiles")
                .update({
                  subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                  remaining_listings: limits.listings,
                  remaining_highlights: limits.highlights,
                })
                .eq("user_id", authUser.id);
              
              logStep("Subscription renewed", { email, plan });
            }
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        const email = customer.email;
        
        if (email) {
          const { data: authUsers } = await supabaseClient.auth.admin.listUsers();
          const authUser = authUsers?.users?.find(u => u.email === email);
          
          if (authUser) {
            await supabaseClient
              .from("profiles")
              .update({
                subscription_plan: null,
                subscription_period_end: null,
                remaining_listings: 0,
                remaining_highlights: 0,
                is_trusted: false,
              })
              .eq("user_id", authUser.id);
            
            logStep("Subscription canceled", { email });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        const email = customer.email;
        
        const productId = subscription.items.data[0].price.product as string;
        let plan: string | null = null;
        if (productId === PRODUCTS.basic) plan = "basic";
        else if (productId === PRODUCTS.pro) plan = "pro";
        else if (productId === PRODUCTS.boost) plan = "boost";
        
        if (email && plan) {
          const { data: authUsers } = await supabaseClient.auth.admin.listUsers();
          const authUser = authUsers?.users?.find(u => u.email === email);
          
          if (authUser) {
            const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];
            await supabaseClient
              .from("profiles")
              .update({
                subscription_plan: plan,
                subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                is_trusted: limits.is_trusted,
              })
              .eq("user_id", authUser.id);
            
            logStep("Subscription updated", { email, plan });
          }
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
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
