import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
	DOLNOSLASKIE_CITIES,
	WROCLAW_PARKINGS,
	isInDolnoslaskie,
} from "@/lib/constants";

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
	parentCategory?: string; // main category name for filtering
	budget?: number;
	urgent?: boolean;
	hasPreciseLocation: boolean; // true if street/address was geocoded (coords from DB)
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
		{ name: "Rynek", lat: 51.11, lng: 17.032, density: 20 },
		{ name: "Dworzec Główny", lat: 51.099, lng: 17.0361, density: 30 },
		{ name: "Krzyki", lat: 51.085, lng: 17.02, density: 15 },
		{ name: "Nadodrze", lat: 51.12, lng: 17.045, density: 12 },
		{ name: "Psie Pole", lat: 51.14, lng: 17.06, density: 8 },
		{ name: "Fabryczna", lat: 51.105, lng: 16.98, density: 10 },
		{ name: "Grabiszyn", lat: 51.09, lng: 16.99, density: 8 },
		{ name: "Gaj", lat: 51.075, lng: 17.05, density: 6 },
		{ name: "Śródmieście", lat: 51.108, lng: 17.04, density: 18 },
		{ name: "Ołbin", lat: 51.115, lng: 17.055, density: 7 },
		{ name: "Biskupin", lat: 51.095, lng: 17.08, density: 5 },
	];

	const vehicles: Vehicle[] = [];
	const lines = [
		"1",
		"2",
		"3",
		"4",
		"5",
		"6",
		"7",
		"8",
		"10",
		"11",
		"14",
		"15",
		"20",
		"23",
		"31",
		"33",
	];

	areas.forEach((area) => {
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

// Get coordinates for a job based on miasto
// Only returns coordinates if within Dolnośląskie region
// Returns hasPreciseLocation: true if coords came from database (street geocoding)
// IMPORTANT: Jobs without precise coordinates (from street geocoding) are NOT shown on the map
function getJobCoordinates(
  miastoInput: string,
  district?: string | null,
  lat?: number | null,
  lng?: number | null
): { lat: number; lng: number; hasPreciseLocation: boolean } | null {
  const WROCLAW_LAT = 51.1079;
  const WROCLAW_LNG = 17.0385;
  const EPS = 1e-5;
  const approxEqual = (a: number, b: number) => Math.abs(a - b) <= EPS;

  const miasto = (miastoInput ?? "").trim();
  const miastoLower = miasto.toLowerCase();

  // Jobs MUST have coordinates from street geocoding to be shown on the map
  // No fallback to city center or district - street is required
  if (lat == null || lng == null) {
    return null;
  }

  // Check if within Dolnośląskie
  if (!isInDolnoslaskie(lat, lng)) {
    return null;
  }

  // Wrocław: if coords match the city center exactly, treat as NOT precise
  if (miastoLower === "wrocław") {
    if (approxEqual(lat, WROCLAW_LAT) && approxEqual(lng, WROCLAW_LNG)) {
      return { lat, lng, hasPreciseLocation: false };
    }
  }

  // Check if coords match a known city center exactly - treat as NOT precise
  const cityKey = DOLNOSLASKIE_CITIES[miasto]
    ? miasto
    : Object.keys(DOLNOSLASKIE_CITIES).find((k) => k.toLowerCase() === miastoLower);
  if (cityKey) {
    const c = DOLNOSLASKIE_CITIES[cityKey];
    if (approxEqual(lat, c.lat) && approxEqual(lng, c.lng)) {
      return { lat, lng, hasPreciseLocation: false };
    }
  }

  return { lat, lng, hasPreciseLocation: true };
}
// Transform parking API data to ParkingData with coordinates
function transformParkingData(apiRecords: ParkingApiRecord[]): ParkingData[] {
	return apiRecords
		.map((record) => {
			// Find matching parking coordinates
			const matchingKey = Object.keys(WROCLAW_PARKINGS).find(
				(key) =>
					record.name.includes(key) ||
					key.includes(record.name) ||
					record.name
						.toLowerCase()
						.includes(key.toLowerCase().split(" - ")[1]?.split(" ")[0] || "")
			);

			const parkingInfo = matchingKey ? WROCLAW_PARKINGS[matchingKey] : null;

			if (!parkingInfo) {
				// Fallback: try to match by partial name
				for (const [key, info] of Object.entries(WROCLAW_PARKINGS)) {
					const keyParts = key.toLowerCase().split(/[\s-]+/);
					const nameParts = record.name.toLowerCase().split(/[\s-]+/);
					if (
						keyParts.some((kp) =>
							nameParts.some((np) => np.includes(kp) || kp.includes(np))
						)
					) {
						const capacity = info.capacity;
						const occupancyPercent = Math.max(
							0,
							Math.min(100, ((capacity - record.freeSpaces) / capacity) * 100)
						);
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
			const occupancyPercent = Math.max(
				0,
				Math.min(100, ((capacity - record.freeSpaces) / capacity) * 100)
			);

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
		})
		.filter((p): p is ParkingData => p !== null);
}

export function useVehicleData(intervalMinutes: number = 30) {
	const [vehicles, setVehicles] = useState<Vehicle[]>([]);
	const [jobs, setJobs] = useState<JobMarker[]>([]);
	const [parkings, setParkings] = useState<ParkingData[]>([]);
	const [heatmapPoints, setHeatmapPoints] = useState<
		[number, number, number][]
	>([]);
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
			.select(
				"id, title, miasto, district, location_lat, location_lng, budget, urgent, category_id, categories(name, parent_id, parent:parent_id(name))"
			)
			.eq("status", "active")
				.not("miasto", "is", null);

			if (error) throw error;

			const jobMarkers: JobMarker[] = [];

			data?.forEach((job: any) => {
				// Use getJobCoordinates which checks 50km limit and determines precision
				const coords = getJobCoordinates(
					job.miasto,
					job.district,
					job.location_lat,
					job.location_lng
				);

				if (coords) {
					// Determine parent category name for filtering
					const categoryName = job.categories?.name;
					const parentCategoryName = job.categories?.parent?.name || categoryName;
					
					jobMarkers.push({
						id: job.id,
						title: job.title,
						miasto: job.miasto,
						district: job.district,
						lat: coords.lat,
						lng: coords.lng,
						category: categoryName,
						parentCategory: parentCategoryName,
						budget: job.budget,
						urgent: job.urgent,
						hasPreciseLocation: coords.hasPreciseLocation,
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
			const { data, error } = await supabase.functions.invoke("mpk-proxy");

			if (error) {
				throw new Error(`Edge function error: ${error.message}`);
			}

			// Process vehicles
			let parsedVehicles: Vehicle[] = [];
			if (data.success && data.result?.records) {
				const records: VehicleApiRecord[] = data.result.records;

				parsedVehicles = records
					.map((record) => {
						const lat =
							record.Ostatnia_Pozycja_Szerokosc ||
							record.latitude ||
							record.lat;
						const lng =
							record.Ostatnia_Pozycja_Dlugosc || record.longitude || record.lng;

						if (!lat || !lng) return null;
						if (lat < 50.9 || lat > 51.3 || lng < 16.8 || lng > 17.3)
							return null;

						const rawLine =
							(record as any).Nazwa_Linii ??
							(record as any).nazwa_linii ??
							(record as any).Linia ??
							(record as any).linia ??
							(record as any).NR_LINII ??
							(record as any).nr_linii ??
							(record as any).line;

						const line =
							typeof rawLine === "string"
								? rawLine.trim()
								: rawLine != null
								? String(rawLine).trim()
								: undefined;

						// Some records from the city API have empty line fields ("Nazwa_Linii": "") or "None" as string.
						// If we can't determine the line number, skip the vehicle to avoid showing "Brak danych".
						if (!line || line.toLowerCase() === "none") return null;

						return {
							id: String(record._id || record.Nr_Tab || Math.random()),
							lat,
							lng,
							line,
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

			cacheRef.current =
				parsedVehicles.length > 0 ? parsedVehicles : generateFallbackVehicles();
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

	// Fast initial load - just jobs
	const fetchJobsOnly = useCallback(async () => {
		setIsLoading(true);
		const jobData = await fetchJobs();
		
		// Generate heatmap from jobs only initially
		const jobHeatPoints: [number, number, number][] = jobData.map((j) => [
			j.lat,
			j.lng,
			0.7 + Math.random() * 0.3,
		]);
		
		setHeatmapPoints(jobHeatPoints);
		setIsLoading(false);
		setLastUpdate(new Date());
		
		return jobData;
	}, [fetchJobs]);

	// Background load - vehicles and parking (slower, optional)
	const fetchBackgroundData = useCallback(async () => {
		try {
			const { vehicles: vehicleData, parkings: parkingData } = await fetchVehiclesAndParking();
			
			// Update heatmap with additional data
			setHeatmapPoints(prev => {
				const vehicleHeatPoints: [number, number, number][] = vehicleData.map(
					(v) => [v.lat, v.lng, 0.3 + Math.random() * 0.3]
				);
				
				const parkingHeatPoints: [number, number, number][] = parkingData.map(
					(p) => [
						p.lat,
						p.lng,
						0.4 + (p.occupancyPercent / 100) * 0.6,
					]
				);
				
				return [...prev, ...vehicleHeatPoints, ...parkingHeatPoints];
			});
		} catch (err) {
			// Background data is optional, don't show error
			console.log("Background data fetch skipped:", err);
		}
	}, [fetchVehiclesAndParking]);

	useEffect(() => {
		// Fast initial load
		fetchJobsOnly().then(() => {
			// Load background data after initial render
			setTimeout(() => {
				fetchBackgroundData();
			}, 1000);
		});

		// Refresh jobs every 30 minutes
		const THIRTY_MIN_MS = 30 * 60 * 1000;
		intervalRef.current = window.setInterval(fetchJobsOnly, THIRTY_MIN_MS);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [fetchJobsOnly, fetchBackgroundData]);

	return {
		vehicles,
		jobs,
		parkings,
		heatmapPoints,
		isLoading,
		lastUpdate,
		error,
		refetch: fetchJobsOnly,
	};
}
