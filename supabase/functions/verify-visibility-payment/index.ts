import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-VISIBILITY] ${step}${detailsStr}`);
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
    
    // Get auth user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const { data: userData } = await anonClient.auth.getUser(token);
    const user = userData.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated");
    }
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find recent checkout sessions for this user with worker_visibility type
    const sessions = await stripe.checkout.sessions.list({
      limit: 10,
      expand: ['data.line_items'],
    });
    
    logStep("Found sessions", { count: sessions.data.length });

    // Find a completed session for worker visibility for this user
    let visibilitySession: Stripe.Checkout.Session | undefined;
    
    for (const session of sessions.data) {
      const isComplete = session.payment_status === 'paid' && session.status === 'complete';
      const isWorkerVisibility = session.metadata?.type === 'worker_visibility';
      const isThisUser = session.metadata?.user_id === user.id;
      
      logStep("Checking session", { 
        sessionId: session.id, 
        isComplete, 
        isWorkerVisibility, 
        isThisUser,
        metadata: session.metadata 
      });
      
      if (isComplete && isWorkerVisibility && isThisUser) {
        visibilitySession = session;
        break;
      }
    }

    if (!visibilitySession) {
      logStep("No completed visibility payment found");
      return new Response(JSON.stringify({ 
        success: false, 
        error: "No completed visibility payment found" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const profileId = visibilitySession.metadata?.profile_id;
    logStep("Found visibility payment", { sessionId: visibilitySession.id, profileId });

    if (profileId) {
      // Update profile to mark visibility as paid
      const { error: updateError } = await supabaseClient
        .from("profiles")
        .update({ worker_visibility_paid: true })
        .eq("id", profileId);
      
      if (updateError) {
        logStep("Error updating profile", { error: updateError });
        throw updateError;
      }
      
      logStep("Profile updated successfully", { profileId });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      profileId 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
