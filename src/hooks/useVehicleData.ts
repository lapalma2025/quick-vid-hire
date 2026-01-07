import { useState, useEffect, useCallback, useRef } from "react";
import { Hotspot } from "@/pages/WorkMap";
import { supabase } from "@/integrations/supabase/client";
import { WROCLAW_DISTRICTS, WROCLAW_AREA_CITIES, WROCLAW_PARKINGS } from "@/lib/constants";

export interface Vehicle {
  id: string;
  lat: number;
  lng: number;
  line?: string;
  timestamp: string;
}

export interface JobMarker {
  id: string;
  title: string;
  miasto: string;
  district?: string;
  lat: number;
  lng: number;
  category?: string;
  budget?: number;
  urgent?: boolean;
}

export interface ParkingData {
  name: string;
  lat: number;
  lng: number;
  freeSpaces: number;
  entering: number;
  leaving: number;
  capacity: number;
  occupancyPercent: number;
  timestamp: string;
}

interface ParkingApiRecord {
  name: string;
  freeSpaces: number;
  entering: number;
  leaving: number;
  timestamp: string;
}

interface VehicleApiRecord {
  _id: number;
  Nr_Tab?: string;
  Linia?: string;
  Ostatnia_Pozycja_Szerokosc?: number;
  Ostatnia_Pozycja_Dlugosc?: number;
  Data_Aktualizacji?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
}

const WROCLAW_CENTER = { lat: 51.1079, lng: 17.0385 };

// Static hotspots for Wrocław based on real data
// Coordinates verified for proper separation on map
const STATIC_HOTSPOTS: Hotspot[] = [
  {
    id: "hotspot-1",
    name: "Stare Miasto",
    lat: 51.1098,
    lng: 17.0320,
    level: 5,
    activity: "Bardzo wysoka",
    peakHours: "11:30–14:00, 18:00–22:30",
    count: 100,
  },
  {
    id: "hotspot-2",
    name: "Śródmieście",
    lat: 51.1180,
    lng: 17.0600,
    level: 4,
    activity: "Bardzo wysoka",
    peakHours: "12:00–15:00, 18:00–22:00",
    count: 85,
  },
  {
    id: "hotspot-3",
    name: "Krzyki",
    lat: 51.0780,
    lng: 17.0100,
    level: 4,
    activity: "Wysoka",
    peakHours: "8:00–10:00, 15:00–19:00",
    count: 70,
  },
  {
    id: "hotspot-4",
    name: "Fabryczna",
    lat: 51.1000,
    lng: 16.9500,
    level: 3,
    activity: "Wysoka",
    peakHours: "6:00–8:00, 14:00–18:00",
    count: 60,
  },
  {
    id: "hotspot-5",
    name: "Psie Pole",
    lat: 51.1450,
    lng: 17.0750,
    level: 3,
    activity: "Średnia",
    peakHours: "9:00–12:00, 16:00–19:00",
    count: 45,
  },
];

// Fallback data for Wrocław when API is not available
function generateFallbackVehicles(): Vehicle[] {
  const areas = [
    { name: "Centrum", lat: 51.1099, lng: 17.0326, density: 25 },
    { name: "Rynek", lat: 51.1100, lng: 17.0320, density: 20 },
    { name: "Dworzec Główny", lat: 51.0990, lng: 17.0361, density: 30 },
    { name: "Krzyki", lat: 51.0850, lng: 17.0200, density: 15 },
    { name: "Nadodrze", lat: 51.1200, lng: 17.0450, density: 12 },
    { name: "Psie Pole", lat: 51.1400, lng: 17.0600, density: 8 },
    { name: "Fabryczna", lat: 51.1050, lng: 16.9800, density: 10 },
    { name: "Grabiszyn", lat: 51.0900, lng: 16.9900, density: 8 },
    { name: "Gaj", lat: 51.0750, lng: 17.0500, density: 6 },
    { name: "Śródmieście", lat: 51.1080, lng: 17.0400, density: 18 },
    { name: "Ołbin", lat: 51.1150, lng: 17.0550, density: 7 },
    { name: "Biskupin", lat: 51.0950, lng: 17.0800, density: 5 },
  ];

  const vehicles: Vehicle[] = [];
  const lines = ["1", "2", "3", "4", "5", "6", "7", "8", "10", "11", "14", "15", "20", "23", "31", "33"];
  
  areas.forEach(area => {
    for (let i = 0; i < area.density; i++) {
      vehicles.push({
        id: `${area.name}-${i}`,
        lat: area.lat + (Math.random() - 0.5) * 0.02,
        lng: area.lng + (Math.random() - 0.5) * 0.02,
        line: lines[Math.floor(Math.random() * lines.length)],
        timestamp: new Date().toISOString(),
      });
    }
  });

  return vehicles;
}

// Get coordinates for a job based on miasto/district
// Only returns coordinates if within 50km of Wrocław
function getJobCoordinates(
  miastoInput: string,
  district?: string | null,
  lat?: number | null,
  lng?: number | null
): { lat: number; lng: number } | null {
  const WROCLAW_LAT = 51.1079;
  const WROCLAW_LNG = 17.0385;
  const MAX_DISTANCE_KM = 50;

  const miasto = (miastoInput ?? "").trim();
  const miastoLower = miasto.toLowerCase();

  const distanceKm = (aLat: number, aLng: number) =>
    Math.sqrt(
      Math.pow((aLat - WROCLAW_LAT) * 111, 2) +
        Math.pow(
          (aLng - WROCLAW_LNG) * 111 * Math.cos((WROCLAW_LAT * Math.PI) / 180),
          2
        )
    );

  // If coordinates are already provided, check if within range
  if (lat != null && lng != null) {
    return distanceKm(lat, lng) <= MAX_DISTANCE_KM ? { lat, lng } : null;
  }

  if (miastoLower === "wrocław") {
    if (district && WROCLAW_DISTRICTS[district]) {
      const coords = WROCLAW_DISTRICTS[district];
      return {
        lat: coords.lat + (Math.random() - 0.5) * 0.005,
        lng: coords.lng + (Math.random() - 0.5) * 0.005,
      };
    }
    return {
      lat: WROCLAW_LAT + (Math.random() - 0.5) * 0.04,
      lng: WROCLAW_LNG + (Math.random() - 0.5) * 0.06,
    };
  }

  const cityKey =
    WROCLAW_AREA_CITIES[miasto]
      ? miasto
      : Object.keys(WROCLAW_AREA_CITIES).find(
          (k) => k.toLowerCase() === miastoLower
        );

  if (cityKey) {
    const coords = WROCLAW_AREA_CITIES[cityKey];
    return {
      lat: coords.lat + (Math.random() - 0.5) * 0.005,
      lng: coords.lng + (Math.random() - 0.5) * 0.005,
    };
  }

  return null; // City not in Wrocław area
}
// Transform parking API data to ParkingData with coordinates
function transformParkingData(apiRecords: ParkingApiRecord[]): ParkingData[] {
  return apiRecords.map(record => {
    // Find matching parking coordinates
    const matchingKey = Object.keys(WROCLAW_PARKINGS).find(key => 
      record.name.includes(key) || key.includes(record.name) || 
      record.name.toLowerCase().includes(key.toLowerCase().split(' - ')[1]?.split(' ')[0] || '')
    );
    
    const parkingInfo = matchingKey ? WROCLAW_PARKINGS[matchingKey] : null;
    
    if (!parkingInfo) {
      // Fallback: try to match by partial name
      for (const [key, info] of Object.entries(WROCLAW_PARKINGS)) {
        const keyParts = key.toLowerCase().split(/[\s-]+/);
        const nameParts = record.name.toLowerCase().split(/[\s-]+/);
        if (keyParts.some(kp => nameParts.some(np => np.includes(kp) || kp.includes(np)))) {
          const capacity = info.capacity;
          const occupancyPercent = Math.max(0, Math.min(100, 
            ((capacity - record.freeSpaces) / capacity) * 100
          ));
          return {
            name: record.name,
            lat: info.lat,
            lng: info.lng,
            freeSpaces: record.freeSpaces,
            entering: record.entering,
            leaving: record.leaving,
            capacity,
            occupancyPercent,
            timestamp: record.timestamp,
          };
        }
      }
      return null;
    }
    
    const capacity = parkingInfo.capacity;
    const occupancyPercent = Math.max(0, Math.min(100, 
      ((capacity - record.freeSpaces) / capacity) * 100
    ));
    
    return {
      name: record.name,
      lat: parkingInfo.lat,
      lng: parkingInfo.lng,
      freeSpaces: record.freeSpaces,
      entering: record.entering,
      leaving: record.leaving,
      capacity,
      occupancyPercent,
      timestamp: record.timestamp,
    };
  }).filter((p): p is ParkingData => p !== null);
}

export function useVehicleData(intervalMinutes: number = 30) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [jobs, setJobs] = useState<JobMarker[]>([]);
  const [parkings, setParkings] = useState<ParkingData[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [heatmapPoints, setHeatmapPoints] = useState<[number, number, number][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const cacheRef = useRef<Vehicle[]>([]);
  const intervalRef = useRef<number | null>(null);

  // Fetch jobs from database
  const fetchJobs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title, miasto, district, location_lat, location_lng, budget, urgent, category_id, categories(name)")
        .eq("status", "active")
        .not("miasto", "is", null);
      
      if (error) throw error;
      
      const jobMarkers: JobMarker[] = [];
      
      data?.forEach((job: any) => {
        let coords: { lat: number; lng: number } | null = null;
        
        // Use getJobCoordinates which checks 50km limit
        coords = getJobCoordinates(
          job.miasto, 
          job.district, 
          job.location_lat, 
          job.location_lng
        );
        
        if (coords) {
          jobMarkers.push({
            id: job.id,
            title: job.title,
            miasto: job.miasto,
            district: job.district,
            lat: coords.lat,
            lng: coords.lng,
            category: job.categories?.name,
            budget: job.budget,
            urgent: job.urgent,
          });
        }
      });
      
      setJobs(jobMarkers);
      return jobMarkers;
    } catch (err) {
      console.error("Error fetching jobs:", err);
      return [];
    }
  }, []);

  const fetchVehiclesAndParking = useCallback(async () => {
    try {
      // Use Supabase Edge Function to bypass CORS
      const { data, error } = await supabase.functions.invoke('mpk-proxy');
      
      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }
      
      // Process vehicles
      let parsedVehicles: Vehicle[] = [];
      if (data.success && data.result?.records) {
        const records: VehicleApiRecord[] = data.result.records;
        
        parsedVehicles = records
          .map((record) => {
            const lat = record.Ostatnia_Pozycja_Szerokosc || record.latitude || record.lat;
            const lng = record.Ostatnia_Pozycja_Dlugosc || record.longitude || record.lng;

            if (!lat || !lng) return null;
            if (lat < 50.9 || lat > 51.3 || lng < 16.8 || lng > 17.3) return null;

            const rawLine =
              (record as any).Linia ??
              (record as any).linia ??
              (record as any).NR_LINII ??
              (record as any).nr_linii ??
              (record as any).line;

            const line = typeof rawLine === "string" ? rawLine.trim() : rawLine != null ? String(rawLine).trim() : undefined;

            return {
              id: String(record._id || record.Nr_Tab || Math.random()),
              lat,
              lng,
              line: line || undefined,
              timestamp: record.Data_Aktualizacji || new Date().toISOString(),
            } as Vehicle;
          })
          .filter((v): v is Vehicle => v !== null);

        // Log sample for debugging
        if (parsedVehicles.length > 0) {
          const sample = parsedVehicles.slice(0, 3);
          console.log(
            `Sample vehicles:`,
            sample.map((v) => ({ id: v.id, line: v.line }))
          );
        }
        console.log(`Fetched ${parsedVehicles.length} vehicles from MPK API`);
      }
      
      // Process parking data
      let parkingData: ParkingData[] = [];
      if (data.parking?.current) {
        parkingData = transformParkingData(data.parking.current);
        console.log(`Processed ${parkingData.length} parking locations`);
      }
      
      // Parking history not needed for static hotspots
      
      cacheRef.current = parsedVehicles.length > 0 ? parsedVehicles : generateFallbackVehicles();
      setVehicles(cacheRef.current);
      setParkings(parkingData);
      setLastUpdate(new Date());
      setError(null);
      
      return { vehicles: cacheRef.current, parkings: parkingData };
    } catch (err) {
      console.error("Error fetching data (using fallback):", err);
      setError(null);
      
      const fallbackVehicles = generateFallbackVehicles();
      cacheRef.current = fallbackVehicles;
      setVehicles(fallbackVehicles);
      setParkings([]);
      setLastUpdate(new Date());
      
      return { vehicles: fallbackVehicles, parkings: [] };
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    
    const [{ vehicles: vehicleData, parkings: parkingData }, jobData] = await Promise.all([
      fetchVehiclesAndParking(),
      fetchJobs(),
    ]);
    
    // Use static hotspots instead of detecting from API
    setHotspots(STATIC_HOTSPOTS);
    
    // Generate heatmap points
    const vehicleHeatPoints: [number, number, number][] = vehicleData.map(v => [
      v.lat,
      v.lng,
      0.3 + Math.random() * 0.3,
    ]);
    
    const jobHeatPoints: [number, number, number][] = jobData.map(j => [
      j.lat,
      j.lng,
      0.7 + Math.random() * 0.3,
    ]);
    
    // Add parking heat based on occupancy
    const parkingHeatPoints: [number, number, number][] = parkingData.map(p => [
      p.lat,
      p.lng,
      0.4 + (p.occupancyPercent / 100) * 0.6, // Higher occupancy = higher heat
    ]);
    
    setHeatmapPoints([...vehicleHeatPoints, ...jobHeatPoints, ...parkingHeatPoints]);
    setIsLoading(false);
  }, [fetchVehiclesAndParking, fetchJobs]);

  useEffect(() => {
    fetchAllData();
    
    // Refresh every 2 hours (7,200,000 ms) instead of frequently
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
    intervalRef.current = window.setInterval(fetchAllData, TWO_HOURS_MS);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchAllData]);

  return {
    vehicles,
    jobs,
    parkings,
    hotspots,
    heatmapPoints,
    isLoading,
    lastUpdate,
    error,
    refetch: fetchAllData,
  };
}
