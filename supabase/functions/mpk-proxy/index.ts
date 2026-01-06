import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MPK_API_URL = "https://www.wroclaw.pl/open-data/api/action/datastore_search";
const RESOURCE_ID = "a9b3841d-e977-474e-9e86-8789e470a85a";

// Parking data endpoints
const PARKING_CURRENT_URL = "https://www.wroclaw.pl/open-data/datastore/dump/61aa2014-31d5-4d62-b296-2002391430e2";
const PARKING_HISTORY_URL = "https://www.wroclaw.pl/open-data/datastore/dump/714dbecb-f0d3-4aac-bcfb-b27f1b0e88ea";

interface ParkingRecord {
  name: string;
  freeSpaces: number;
  entering: number;
  leaving: number;
  timestamp: string;
}

// Parse CSV data to JSON
function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  // Parse header - handle potential BOM and quotes
  const headerLine = lines[0].replace(/^\uFEFF/, '');
  const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  const records: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Simple CSV parsing (handles basic cases)
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });
    records.push(record);
  }
  
  return records;
}

// Transform parking CSV records to standardized format
function transformParkingRecords(records: Record<string, string>[]): ParkingRecord[] {
  return records.map(record => ({
    name: record['Nazwa'] || record['nazwa'] || '',
    freeSpaces: parseInt(record['Liczba_Wolnych_Miejsc'] || record['liczba_wolnych_miejsc'] || '0', 10),
    entering: parseInt(record['Liczba_Poj_Wjezdzajacych'] || record['liczba_poj_wjezdzajacych'] || '0', 10),
    leaving: parseInt(record['Liczba_Poj_Wyjezdzajacych'] || record['liczba_poj_wyjezdzajacych'] || '0', 10),
    timestamp: record['Czas_Rejestracji'] || record['czas_rejestracji'] || new Date().toISOString(),
  })).filter(p => p.name);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching MPK and parking data...');
    
    // Fetch all data in parallel
    const [mpkResponse, parkingCurrentResponse, parkingHistoryResponse] = await Promise.all([
      fetch(`${MPK_API_URL}?resource_id=${RESOURCE_ID}&limit=1000`, {
        headers: { 'Accept': 'application/json' },
      }),
      fetch(PARKING_CURRENT_URL, {
        headers: { 'Accept': 'text/csv' },
      }),
      fetch(PARKING_HISTORY_URL, {
        headers: { 'Accept': 'text/csv' },
      }),
    ]);

    // Process MPK data
    let mpkData = { result: { records: [] } };
    if (mpkResponse.ok) {
      mpkData = await mpkResponse.json();
      console.log(`Fetched ${mpkData.result?.records?.length || 0} MPK vehicle records`);
    } else {
      console.error(`MPK API error: ${mpkResponse.status}`);
    }

    // Process current parking data
    let parkingCurrent: ParkingRecord[] = [];
    if (parkingCurrentResponse.ok) {
      const csvText = await parkingCurrentResponse.text();
      const rawRecords = parseCSV(csvText);
      parkingCurrent = transformParkingRecords(rawRecords);
      console.log(`Fetched ${parkingCurrent.length} current parking records`);
    } else {
      console.error(`Parking current API error: ${parkingCurrentResponse.status}`);
    }

    // Process parking history data (48h)
    let parkingHistory: ParkingRecord[] = [];
    if (parkingHistoryResponse.ok) {
      const csvText = await parkingHistoryResponse.text();
      const rawRecords = parseCSV(csvText);
      parkingHistory = transformParkingRecords(rawRecords);
      console.log(`Fetched ${parkingHistory.length} parking history records`);
    } else {
      console.error(`Parking history API error: ${parkingHistoryResponse.status}`);
    }

    const responseData = {
      success: true,
      result: mpkData.result,
      parking: {
        current: parkingCurrent,
        history: parkingHistory,
      },
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(responseData), {
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
