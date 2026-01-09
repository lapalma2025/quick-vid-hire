import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { MapFilters, Hotspot } from "@/pages/WorkMap";
import { Vehicle, JobMarker } from "@/hooks/useVehicleData";
import { Loader2 } from "lucide-react";

declare module "leaflet" {
  function heatLayer(
    latlngs: [number, number, number][],
    options?: {
      radius?: number;
      blur?: number;
      maxZoom?: number;
      max?: number;
      minOpacity?: number;
      gradient?: Record<number, string>;
    }
  ): L.Layer;
}

interface WorkMapLeafletProps {
  filters: MapFilters;
  vehicles: Vehicle[];
  jobs: JobMarker[];
  hotspots: Hotspot[];
  heatmapPoints: [number, number, number][];
}

const WROCLAW_CENTER: L.LatLngTuple = [51.1079, 17.0385];
const DEFAULT_ZOOM = 13;

// Custom SVG markers
function createHotspotIcon(level: number, rank: number) {
  const size = 40 + level * 4;
  const color = "#f97316"; // All hotspots are orange
  
  return L.divIcon({
    className: "hotspot-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `
      <div class="hotspot-marker-wrapper" style="width: ${size}px; height: ${size}px;">
        <div class="hotspot-pulse" style="background: ${color}; animation-delay: 0s;"></div>
        <div class="hotspot-pulse" style="background: ${color}; animation-delay: 0.5s;"></div>
        <div class="hotspot-core" style="background: linear-gradient(135deg, ${color}, ${color}dd); width: ${size * 0.6}px; height: ${size * 0.6}px;">
          <svg viewBox="0 0 24 24" fill="white" width="${size * 0.35}" height="${size * 0.35}">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        <div class="hotspot-level">${rank}</div>
      </div>
    `,
  });
}

function createVehicleIcon() {
  return L.divIcon({
    className: "vehicle-marker",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    html: `
      <div class="vehicle-marker-wrapper">
        <svg viewBox="0 0 24 24" fill="hsl(210, 80%, 50%)" width="20" height="20">
          <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
        </svg>
      </div>
    `,
  });
}

function createJobIcon(urgent: boolean = false) {
  const color = urgent ? "#ef4444" : "#8b5cf6";
  const size = urgent ? 36 : 32;
  
  return L.divIcon({
    className: "job-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
    html: `
      <div class="job-marker-wrapper" style="width: ${size}px; height: ${size}px;">
        ${urgent ? '<div class="job-pulse" style="background: #ef4444;"></div>' : ''}
        <div class="job-pin" style="background: ${color};">
          <svg viewBox="0 0 24 24" fill="white" width="${size * 0.5}" height="${size * 0.5}">
            <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
          </svg>
        </div>
      </div>
    `,
  });
}

export function WorkMapLeaflet({ 
  filters, 
  vehicles,
  jobs,
  hotspots, 
  heatmapPoints 
}: WorkMapLeafletProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<L.Layer | null>(null);
  const vehicleMarkersRef = useRef<L.Marker[]>([]);
  const hotspotMarkersRef = useRef<L.Marker[]>([]);
  const jobMarkersRef = useRef<L.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize map with 50km bounds around Wrocław
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // 50km bounds around Wrocław (approximately 0.45 degrees lat/lng)
    const BOUNDS_PADDING = 0.45;
    const maxBounds = L.latLngBounds(
      [WROCLAW_CENTER[0] - BOUNDS_PADDING, WROCLAW_CENTER[1] - BOUNDS_PADDING * 1.5], // SW
      [WROCLAW_CENTER[0] + BOUNDS_PADDING, WROCLAW_CENTER[1] + BOUNDS_PADDING * 1.5]  // NE
    );

    const map = L.map(mapContainerRef.current, {
      center: WROCLAW_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      minZoom: 9,
      maxZoom: 18,
      maxBounds: maxBounds,
      maxBoundsViscosity: 0.8,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 18,
    }).addTo(map);

    // Add minimal attribution (required by OSM and CARTO licenses)
    L.control.attribution({
      position: 'bottomright',
      prefix: false,
    }).addAttribution('© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/attributions">CARTO</a>').addTo(map);

    mapRef.current = map;
    setIsLoaded(true);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update heatmap layer
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    if (heatLayerRef.current) {
      mapRef.current.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (filters.showHeatmap && heatmapPoints.length > 0) {
      const radius = 15 + (filters.intensity / 100) * 25;
      
      const heatLayer = L.heatLayer(heatmapPoints, {
        radius,
        blur: 20,
        maxZoom: 17,
        max: 1.0,
        minOpacity: 0.3,
        gradient: {
          0.2: "#3b82f6",
          0.4: "#22d3ee",
          0.6: "#fbbf24",
          0.8: "#f97316",
          1.0: "#ef4444",
        },
      });

      heatLayer.addTo(mapRef.current);
      heatLayerRef.current = heatLayer;
    }
  }, [filters.showHeatmap, filters.intensity, heatmapPoints, isLoaded]);

  // Update vehicle markers
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    vehicleMarkersRef.current.forEach(marker => marker.remove());
    vehicleMarkersRef.current = [];

    if (filters.showVehicles) {
      const vehicleIcon = createVehicleIcon();
      
      vehicles.forEach(vehicle => {
        const marker = L.marker([vehicle.lat, vehicle.lng], { 
          icon: vehicleIcon,
          zIndexOffset: 100,
        });
        
        marker.bindPopup(`
          <div class="vehicle-popup">
            <strong>Pojazd MPK</strong>
            <br>Linia: <strong>${vehicle.line || 'Brak danych'}</strong>
          </div>
        `);
        
        marker.addTo(mapRef.current!);
        vehicleMarkersRef.current.push(marker);
      });
    }
  }, [filters.showVehicles, vehicles, isLoaded]);

  // Update job markers
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    jobMarkersRef.current.forEach(marker => marker.remove());
    jobMarkersRef.current = [];

    jobs.forEach(job => {
      const icon = createJobIcon(job.urgent);
      const marker = L.marker([job.lat, job.lng], { 
        icon,
        zIndexOffset: 300,
      });
      
      marker.bindPopup(`
        <div class="job-popup">
          <div class="job-popup-header">
            <span class="job-title">${job.title}</span>
            ${job.urgent ? '<span class="job-urgent-badge">PILNE</span>' : ''}
          </div>
          <div class="job-popup-content">
            <div class="job-popup-row">
              <span class="label">Lokalizacja:</span>
              <span class="value">${job.miasto}${job.district ? `, ${job.district}` : ''}</span>
            </div>
            ${job.category ? `
              <div class="job-popup-row">
                <span class="label">Kategoria:</span>
                <span class="value">${job.category}</span>
              </div>
            ` : ''}
            ${job.budget ? `
              <div class="job-popup-row">
                <span class="label">Budżet:</span>
                <span class="value">${job.budget} zł</span>
              </div>
            ` : ''}
          </div>
          <a href="/jobs/${job.id}" class="job-popup-link">Zobacz szczegóły →</a>
        </div>
      `, { minWidth: 220, maxWidth: 280 });
      
      marker.addTo(mapRef.current!);
      jobMarkersRef.current.push(marker);
    });
  }, [jobs, isLoaded]);

  // Update hotspot markers
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    hotspotMarkersRef.current.forEach(marker => marker.remove());
    hotspotMarkersRef.current = [];

    if (filters.showHotspots) {
      hotspots.forEach((hotspot, index) => {
        const rank = index + 1;
        const icon = createHotspotIcon(hotspot.level, rank);
        const marker = L.marker([hotspot.lat, hotspot.lng], { 
          icon,
          zIndexOffset: 200,
        });
        
        marker.bindPopup(`
          <div class="hotspot-popup">
            <div class="hotspot-popup-header">
              <strong>${rank}. ${hotspot.name}</strong>
              <span class="hotspot-level-badge">${"🔥".repeat(hotspot.level)}</span>
            </div>
            <div class="hotspot-popup-content">
              <div class="hotspot-popup-row">
                <span class="label">Aktywność:</span>
                <span class="value ${hotspot.activity.toLowerCase().replace(" ", "-")}">${hotspot.activity}</span>
              </div>
              <div class="hotspot-popup-row">
                <span class="label">Peak hours:</span>
                <span class="value">${hotspot.peakHours}</span>
              </div>
              <div class="hotspot-popup-row">
                <span class="label">Punkty:</span>
                <span class="value">${hotspot.count}</span>
              </div>
            </div>
          </div>
        `);
        
        marker.addTo(mapRef.current!);
        hotspotMarkersRef.current.push(marker);
      });
    }
  }, [filters.showHotspots, hotspots, isLoaded]);

  return (
    <div className="relative z-0">
      <div 
        ref={mapContainerRef} 
        className="w-full h-[500px] md:h-[600px] rounded-xl overflow-hidden z-0"
      />
      
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm rounded-xl">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Ładowanie mapy...</span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-border/50 text-xs">
        <div className="font-medium mb-2">Legenda</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-violet-500"></div>
            <span>Oferty pracy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span>Pilne oferty</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span>Pojazdy MPK</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-yellow-500 to-red-500"></div>
            <span>Hotspoty</span>
          </div>
        </div>
      </div>

      {/* Job count badge - positioned to avoid zoom controls */}
      {jobs.length > 0 && (
        <div className="absolute top-4 right-4 bg-violet-500 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg z-20">
          {jobs.length} {jobs.length === 1 ? 'oferta' : jobs.length < 5 ? 'oferty' : 'ofert'} na mapie
        </div>
      )}

      {/* Custom styles for markers */}
      <style>{`
        .hotspot-marker-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .hotspot-pulse {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          opacity: 0;
          animation: pulse 2s ease-out infinite;
        }
        
        @keyframes pulse {
          0% {
            transform: scale(0.5);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        
        .hotspot-core {
          position: relative;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          transition: transform 0.2s ease;
          z-index: 2;
        }
        
        .hotspot-marker:hover .hotspot-core {
          transform: scale(1.1);
        }
        
        .hotspot-level {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: bold;
          color: #1f2937;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          z-index: 3;
        }
        
        .vehicle-marker-wrapper {
          width: 24px;
          height: 24px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          transition: transform 0.2s ease;
        }
        
        .vehicle-marker:hover .vehicle-marker-wrapper {
          transform: scale(1.2);
        }
        
        .job-marker-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .job-pulse {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          height: 100%;
          border-radius: 50%;
          opacity: 0;
          animation: pulse 2s ease-out infinite;
        }
        
        .job-pin {
          width: 100%;
          height: 100%;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          transition: transform 0.2s ease;
        }
        
        .job-pin svg {
          transform: rotate(45deg);
        }
        
        .job-marker:hover .job-pin {
          transform: rotate(-45deg) scale(1.1);
        }
        
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
        }
        
        .leaflet-popup-content {
          margin: 0;
        }
        
        .hotspot-popup, .job-popup {
          padding: 12px 16px;
          min-width: 200px;
        }
        
        .hotspot-popup-header, .job-popup-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
          padding-right: 20px;
        }
        
        .hotspot-popup-header strong, .job-popup-header strong,
        .job-popup-header .job-title {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          flex: 1;
          word-break: break-word;
          line-height: 1.3;
        }
        
        .job-urgent-badge {
          background: #ef4444;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
          flex-shrink: 0;
          white-space: nowrap;
        }
        
        .leaflet-popup-close-button {
          top: 8px !important;
          right: 8px !important;
          width: 20px !important;
          height: 20px !important;
          font-size: 18px !important;
          line-height: 18px !important;
          color: #6b7280 !important;
        }
        
        .leaflet-popup-close-button:hover {
          color: #1f2937 !important;
        }
        
        .hotspot-popup-content, .job-popup-content {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .hotspot-popup-row, .job-popup-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }
        
        .hotspot-popup-row .label, .job-popup-row .label {
          color: #6b7280;
        }
        
        .hotspot-popup-row .value, .job-popup-row .value {
          font-weight: 500;
          color: #1f2937;
        }
        
        .hotspot-popup-row .value.bardzo-wysoka { color: #ef4444; }
        .hotspot-popup-row .value.wysoka { color: #f97316; }
        .hotspot-popup-row .value.średnia { color: #eab308; }
        .hotspot-popup-row .value.niska { color: #3b82f6; }
        
        .job-popup-link {
          display: block;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #e5e7eb;
          color: #8b5cf6;
          font-size: 12px;
          font-weight: 500;
          text-decoration: none;
          transition: color 0.2s;
        }
        
        .job-popup-link:hover {
          color: #7c3aed;
        }
        
        .vehicle-popup {
          padding: 12px 16px;
          padding-right: 28px;
          font-size: 13px;
          min-width: 120px;
        }
        
        .vehicle-popup strong {
          display: block;
          margin-bottom: 4px;
          color: #1f2937;
        }
        
        /* Fix z-index for Leaflet controls */
        .leaflet-pane { z-index: 1 !important; }
        .leaflet-top, .leaflet-bottom { z-index: 10 !important; }
        .leaflet-control { z-index: 10 !important; }
        
        /* Hide Leaflet branding and Ukraine flag */
        .leaflet-control-attribution a[href*="leaflet"],
        .leaflet-control-attribution img,
        .leaflet-control-attribution svg {
          display: none !important;
        }
      `}</style>
    </div>
  );
}