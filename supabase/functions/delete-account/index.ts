import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[DELETE-ACCOUNT] Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create client with user's auth token to get user info
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("[DELETE-ACCOUNT] No authorization header");
      return new Response(
        JSON.stringify({ error: "Brak autoryzacji" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      console.log("[DELETE-ACCOUNT] User not authenticated:", userError?.message);
      return new Response(
        JSON.stringify({ error: "Nie zalogowany" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[DELETE-ACCOUNT] Deleting account for user:", user.id);

    // Create admin client with service role key for deletion
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's profile ID first
    const { data: profileData } = await adminClient
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    const profileId = profileData?.id;

    if (profileId) {
      console.log("[DELETE-ACCOUNT] Deleting related data for profile:", profileId);

      // Delete user's related data in order (respecting foreign keys)
      // Delete worker gallery
      await adminClient.from("worker_gallery").delete().eq("worker_id", profileId);
      
      // Delete worker categories
      await adminClient.from("worker_categories").delete().eq("worker_id", profileId);
      
      // Delete reviews where user is reviewer or reviewed
      await adminClient.from("reviews").delete().eq("reviewer_id", profileId);
      await adminClient.from("reviews").delete().eq("reviewed_id", profileId);
      
      // Delete chat messages
      await adminClient.from("chat_messages").delete().eq("sender_id", profileId);
      
      // Delete job responses
      await adminClient.from("job_responses").delete().eq("worker_id", profileId);
      
      // Delete job views
      await adminClient.from("job_views").delete().eq("viewer_id", profileId);

      // Get user's jobs and delete related data
      const { data: userJobs } = await adminClient
        .from("jobs")
        .select("id")
        .eq("user_id", profileId);

      if (userJobs && userJobs.length > 0) {
        const jobIds = userJobs.map(j => j.id);
        
        // Delete job images
        await adminClient.from("job_images").delete().in("job_id", jobIds);
        
        // Delete job responses for these jobs
        await adminClient.from("job_responses").delete().in("job_id", jobIds);
        
        // Delete job views for these jobs
        await adminClient.from("job_views").delete().in("job_id", jobIds);
        
        // Delete chat messages for these jobs
        await adminClient.from("chat_messages").delete().in("job_id", jobIds);
        
        // Delete reviews for these jobs
        await adminClient.from("reviews").delete().in("job_id", jobIds);
        
        // Delete the jobs
        await adminClient.from("jobs").delete().in("id", jobIds);
      }

      // Delete payments
      await adminClient.from("payments").delete().eq("user_id", profileId);
      
      // Delete profile
      await adminClient.from("profiles").delete().eq("id", profileId);
    }

    // Delete user from auth.users
    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(user.id);

    if (deleteUserError) {
      console.log("[DELETE-ACCOUNT] Error deleting user:", deleteUserError.message);
      return new Response(
        JSON.stringify({ error: "Błąd podczas usuwania konta: " + deleteUserError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[DELETE-ACCOUNT] Account deleted successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Konto zostało usunięte" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[DELETE-ACCOUNT] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Wystąpił nieoczekiwany błąd" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
