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
function getJobCoordinates(miasto: string, district?: string | null): { lat: number; lng: number } | null {
  if (miasto.toLowerCase() === "wrocław") {
    if (district && WROCLAW_DISTRICTS[district]) {
      const coords = WROCLAW_DISTRICTS[district];
      return {
        lat: coords.lat + (Math.random() - 0.5) * 0.005,
        lng: coords.lng + (Math.random() - 0.5) * 0.005,
      };
    }
    return {
      lat: WROCLAW_CENTER.lat + (Math.random() - 0.5) * 0.04,
      lng: WROCLAW_CENTER.lng + (Math.random() - 0.5) * 0.06,
    };
  }
  
  if (WROCLAW_AREA_CITIES[miasto]) {
    const coords = WROCLAW_AREA_CITIES[miasto];
    return {
      lat: coords.lat + (Math.random() - 0.5) * 0.01,
      lng: coords.lng + (Math.random() - 0.5) * 0.01,
    };
  }
  
  return null;
}

// Calculate distance between two points in meters (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find nearby parkings within radius (in meters)
function findNearbyParkings(lat: number, lng: number, parkings: ParkingData[], radiusMeters: number = 2000): ParkingData[] {
  return parkings.filter(p => calculateDistance(lat, lng, p.lat, p.lng) < radiusMeters);
}

// Calculate peak hours from parking history data
function calculatePeakHours(
  parkingHistory: ParkingApiRecord[],
  nearbyParkingNames: string[],
  vehicleCount: number
): string {
  // Group history by hour
  const hourlyActivity = new Map<number, { entries: number; exits: number; count: number }>();
  
  // Initialize all hours
  for (let h = 0; h < 24; h++) {
    hourlyActivity.set(h, { entries: 0, exits: 0, count: 0 });
  }
  
  // Filter for nearby parkings and aggregate by hour
  const relevantHistory = parkingHistory.filter(entry => 
    nearbyParkingNames.some(name => entry.name.includes(name) || name.includes(entry.name))
  );
  
  relevantHistory.forEach(entry => {
    try {
      const date = new Date(entry.timestamp);
      const hour = date.getHours();
      const current = hourlyActivity.get(hour);
      if (current) {
        hourlyActivity.set(hour, {
          entries: current.entries + entry.entering,
          exits: current.exits + entry.leaving,
          count: current.count + 1,
        });
      }
    } catch {
      // Skip invalid timestamps
    }
  });
  
  // Calculate activity score per hour (average entries + exits)
  const hourlyScores: { hour: number; score: number }[] = [];
  
  hourlyActivity.forEach((data, hour) => {
    const avgActivity = data.count > 0 
      ? (data.entries + data.exits) / data.count 
      : 0;
    hourlyScores.push({ hour, score: avgActivity });
  });
  
  // Sort by score descending
  hourlyScores.sort((a, b) => b.score - a.score);
  
  // Get top 4 hours and group into time windows
  const topHours = hourlyScores.slice(0, 4).map(h => h.hour).sort((a, b) => a - b);
  
  if (topHours.length === 0) {
    // Fallback: use typical peak hours based on vehicle count
    if (vehicleCount > 100) {
      return "7:00–9:00, 16:00–18:00";
    } else if (vehicleCount > 50) {
      return "8:00–10:00, 17:00–19:00";
    }
    return "12:00–14:00";
  }
  
  // Group consecutive hours into windows
  const windows: string[] = [];
  let windowStart = topHours[0];
  let windowEnd = topHours[0];
  
  for (let i = 1; i < topHours.length; i++) {
    if (topHours[i] - windowEnd <= 2) {
      windowEnd = topHours[i];
    } else {
      windows.push(`${windowStart}:00–${windowEnd + 1}:00`);
      windowStart = topHours[i];
      windowEnd = topHours[i];
    }
  }
  windows.push(`${windowStart}:00–${windowEnd + 1}:00`);
  
  return windows.slice(0, 2).join(", ");
}

// Get district name for coordinates
function getDistrictName(lat: number, lng: number): string {
  let closestDistrict = "Wrocław";
  let minDistance = Infinity;
  
  Object.entries(WROCLAW_DISTRICTS).forEach(([name, coords]) => {
    const distance = calculateDistance(lat, lng, coords.lat, coords.lng);
    if (distance < minDistance) {
      minDistance = distance;
      closestDistrict = name;
    }
  });
  
  return closestDistrict;
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

function detectHotspots(
  vehicles: Vehicle[], 
  jobs: JobMarker[],
  parkings: ParkingData[],
  parkingHistory: ParkingApiRecord[]
): Hotspot[] {
  // Combine vehicle points with parking activity (high occupancy = more activity)
  const allPoints = [
    ...vehicles,
    ...jobs.map(j => ({ lat: j.lat, lng: j.lng })),
    // Add parking locations weighted by occupancy
    ...parkings.flatMap(p => {
      const weight = Math.ceil(p.occupancyPercent / 20); // 1-5 points based on occupancy
      return Array(weight).fill({ lat: p.lat, lng: p.lng });
    }),
  ];
  
  if (allPoints.length === 0) return [];
  
  const grid = createGrid(allPoints);
  const entries = Array.from(grid.entries());
  
  entries.sort((a, b) => b[1] - a[1]);
  const topCells = entries.slice(0, 10);
  
  const counts = entries.map(e => e[1]);
  const maxCount = Math.max(...counts);
  
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
    
    // Find nearby parkings for this hotspot
    const nearbyParkings = findNearbyParkings(lat, lng, parkings);
    const nearbyParkingNames = nearbyParkings.map(p => p.name);
    
    // Calculate real peak hours based on parking data
    const peakHours = calculatePeakHours(parkingHistory, nearbyParkingNames, vehicles.length);
    
    // Get real district name
    const name = getDistrictName(lat, lng);
    
    return {
      id: `hotspot-${index}`,
      name,
      lat,
      lng,
      level,
      activity,
      peakHours,
      count,
    };
  });
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
  const parkingHistoryRef = useRef<ParkingApiRecord[]>([]);
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
            
            return {
              id: String(record._id || record.Nr_Tab || Math.random()),
              lat,
              lng,
              line: record.Linia,
              timestamp: record.Data_Aktualizacji || new Date().toISOString(),
            } as Vehicle;
          })
          .filter((v): v is Vehicle => v !== null);
        
        console.log(`Fetched ${parsedVehicles.length} vehicles from MPK API`);
      }
      
      // Process parking data
      let parkingData: ParkingData[] = [];
      if (data.parking?.current) {
        parkingData = transformParkingData(data.parking.current);
        console.log(`Processed ${parkingData.length} parking locations`);
      }
      
      // Store parking history
      if (data.parking?.history) {
        parkingHistoryRef.current = data.parking.history;
        console.log(`Stored ${data.parking.history.length} parking history records`);
      }
      
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
    
    // Generate hotspots from vehicles, jobs, and parking data
    const detectedHotspots = detectHotspots(
      vehicleData, 
      jobData, 
      parkingData, 
      parkingHistoryRef.current
    );
    setHotspots(detectedHotspots);
    
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
    parkings,
    hotspots,
    heatmapPoints,
    isLoading,
    lastUpdate,
    error,
    refetch: fetchAllData,
  };
}
