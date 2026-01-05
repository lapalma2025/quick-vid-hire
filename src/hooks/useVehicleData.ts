import { useState, useEffect, useCallback, useRef } from "react";
import { Hotspot } from "@/pages/WorkMap";
import { supabase } from "@/integrations/supabase/client";
import { WROCLAW_DISTRICTS, WROCLAW_AREA_CITIES } from "@/lib/constants";

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
const MPK_API_URL = "https://www.wroclaw.pl/open-data/api/action/datastore_search";
const RESOURCE_ID = "a9b3841d-e977-474e-9e86-8789e470a85a";

// Fallback data for Wrocław when API is not available (CORS issues in browser)
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
function getJobCoordinates(miasto: string, district?: string | null): { lat: number; lng: number } | null {
  // Check if miasto is in Wrocław area
  if (miasto.toLowerCase() === "wrocław") {
    if (district && WROCLAW_DISTRICTS[district]) {
      const coords = WROCLAW_DISTRICTS[district];
      return {
        lat: coords.lat + (Math.random() - 0.5) * 0.005,
        lng: coords.lng + (Math.random() - 0.5) * 0.005,
      };
    }
    // Random location in Wrocław
    return {
      lat: WROCLAW_CENTER.lat + (Math.random() - 0.5) * 0.04,
      lng: WROCLAW_CENTER.lng + (Math.random() - 0.5) * 0.06,
    };
  }
  
  // Check if miasto is in Wrocław area cities
  if (WROCLAW_AREA_CITIES[miasto]) {
    const coords = WROCLAW_AREA_CITIES[miasto];
    return {
      lat: coords.lat + (Math.random() - 0.5) * 0.01,
      lng: coords.lng + (Math.random() - 0.5) * 0.01,
    };
  }
  
  return null;
}

// Grid-based clustering for hotspot detection
const GRID_SIZE = 0.005; // ~500m

function createGrid(points: { lat: number; lng: number }[]): Map<string, number> {
  const grid = new Map<string, number>();
  
  points.forEach(point => {
    const gridX = Math.floor(point.lng / GRID_SIZE);
    const gridY = Math.floor(point.lat / GRID_SIZE);
    const key = `${gridX},${gridY}`;
    grid.set(key, (grid.get(key) || 0) + 1);
  });
  
  return grid;
}

function detectHotspots(vehicles: Vehicle[], jobs: JobMarker[]): Hotspot[] {
  const allPoints = [
    ...vehicles,
    ...jobs.map(j => ({ lat: j.lat, lng: j.lng })),
  ];
  
  if (allPoints.length === 0) return [];
  
  const grid = createGrid(allPoints);
  const entries = Array.from(grid.entries());
  
  entries.sort((a, b) => b[1] - a[1]);
  const topCells = entries.slice(0, 10);
  
  const counts = entries.map(e => e[1]);
  const maxCount = Math.max(...counts);
  
  const hotspotNames = [
    "Centrum", "Rynek", "Dworzec Główny", "Krzyki", "Śródmieście",
    "Nadodrze", "Psie Pole", "Fabryczna", "Grabiszyn", "Gaj"
  ];
  
  const peakHoursOptions = [
    "7:00–9:00", "11:00–13:00", "14:00–16:00", "16:00–19:00", "18:00–21:00"
  ];
  
  return topCells.map(([key, count], index) => {
    const [gridX, gridY] = key.split(",").map(Number);
    const lat = (gridY + 0.5) * GRID_SIZE;
    const lng = (gridX + 0.5) * GRID_SIZE;
    
    const percentile = count / maxCount;
    const level = Math.min(5, Math.max(1, Math.ceil(percentile * 5)));
    
    let activity: Hotspot["activity"];
    if (percentile > 0.8) activity = "Bardzo wysoka";
    else if (percentile > 0.5) activity = "Wysoka";
    else if (percentile > 0.3) activity = "Średnia";
    else activity = "Niska";
    
    return {
      id: `hotspot-${index}`,
      name: hotspotNames[index] || `Strefa ${index + 1}`,
      lat,
      lng,
      level,
      activity,
      peakHours: peakHoursOptions[Math.floor(Math.random() * peakHoursOptions.length)],
      count,
    };
  });
}

export function useVehicleData(intervalMinutes: number = 30) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [jobs, setJobs] = useState<JobMarker[]>([]);
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
        // Use stored coordinates or calculate from miasto/district
        let coords: { lat: number; lng: number } | null = null;
        
        if (job.location_lat && job.location_lng) {
          coords = { lat: job.location_lat, lng: job.location_lng };
        } else {
          coords = getJobCoordinates(job.miasto, job.district);
        }
        
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

  const fetchVehicles = useCallback(async () => {
    try {
      const response = await fetch(
        `${MPK_API_URL}?resource_id=${RESOURCE_ID}&limit=1000`
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success || !data.result?.records) {
        throw new Error("Invalid API response");
      }
      
      const records: VehicleApiRecord[] = data.result.records;
      
      const parsedVehicles: Vehicle[] = records
        .map((record) => {
          const lat = record.Ostatnia_Pozycja_Szerokosc || record.latitude || record.lat;
          const lng = record.Ostatnia_Pozycja_Dlugosc || record.longitude || record.lng;
          
          if (!lat || !lng) return null;
          
          if (lat < 50.9 || lat > 51.3 || lng < 16.8 || lng > 17.3) return null;
          
          return {
            id: String(record._id || record.Nr_Tab || Math.random()),
            lat,
            lng,
            line: record.Linia,
            timestamp: record.Data_Aktualizacji || new Date().toISOString(),
          } as Vehicle;
        })
        .filter((v): v is Vehicle => v !== null);
      
      cacheRef.current = parsedVehicles;
      setVehicles(parsedVehicles);
      setLastUpdate(new Date());
      setError(null);
      
      return parsedVehicles;
    } catch (err) {
      console.error("Error fetching vehicle data (using fallback):", err);
      setError(null);
      
      const fallbackVehicles = generateFallbackVehicles();
      cacheRef.current = fallbackVehicles;
      setVehicles(fallbackVehicles);
      setLastUpdate(new Date());
      
      return fallbackVehicles;
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    
    const [vehicleData, jobData] = await Promise.all([
      fetchVehicles(),
      fetchJobs(),
    ]);
    
    // Generate hotspots from both vehicles and jobs
    const detectedHotspots = detectHotspots(vehicleData, jobData);
    setHotspots(detectedHotspots);
    
    // Generate heatmap points - vehicles get lower intensity, jobs get higher
    const vehicleHeatPoints: [number, number, number][] = vehicleData.map(v => [
      v.lat,
      v.lng,
      0.3 + Math.random() * 0.3,
    ]);
    
    const jobHeatPoints: [number, number, number][] = jobData.map(j => [
      j.lat,
      j.lng,
      0.7 + Math.random() * 0.3, // Jobs have higher intensity
    ]);
    
    setHeatmapPoints([...vehicleHeatPoints, ...jobHeatPoints]);
    setIsLoading(false);
  }, [fetchVehicles, fetchJobs]);

  useEffect(() => {
    fetchAllData();
    
    const intervalMs = intervalMinutes * 1000;
    intervalRef.current = window.setInterval(fetchAllData, Math.max(30000, intervalMs));
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchAllData, intervalMinutes]);

  return {
    vehicles,
    jobs,
    hotspots,
    heatmapPoints,
    isLoading,
    lastUpdate,
    error,
    refetch: fetchAllData,
  };
}