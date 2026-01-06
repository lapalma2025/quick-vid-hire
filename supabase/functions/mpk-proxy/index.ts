import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MPK_API_URL = "https://www.wroclaw.pl/open-data/api/action/datastore_search";
const RESOURCE_ID = "a9b3841d-e977-474e-9e86-8789e470a85a";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching MPK vehicle data...');
    
    const response = await fetch(
      `${MPK_API_URL}?resource_id=${RESOURCE_ID}&limit=1000`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`MPK API error: ${response.status} ${response.statusText}`);
      throw new Error(`MPK API error: ${response.status}`);
    }

    const data = await response.json();
    
    console.log(`Fetched ${data.result?.records?.length || 0} vehicle records`);

    return new Response(JSON.stringify(data), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=30',
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in mpk-proxy function:', errorMessage);
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
