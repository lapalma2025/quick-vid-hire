import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { MapFilters, Hotspot } from "@/pages/WorkMap";
import { Vehicle } from "@/hooks/useVehicleData";
import { Loader2 } from "lucide-react";

// Extend Leaflet types for heat layer
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
  hotspots: Hotspot[];
  heatmapPoints: [number, number, number][];
}

const WROCLAW_CENTER: L.LatLngTuple = [51.1079, 17.0385];
const DEFAULT_ZOOM = 13;

// Custom SVG markers
function createHotspotIcon(level: number) {
  const size = 40 + level * 4;
  const color = level >= 4 ? "#ef4444" : level >= 3 ? "#f97316" : level >= 2 ? "#eab308" : "#22c55e";
  
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
        <div class="hotspot-level">${level}</div>
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

export function WorkMapLeaflet({ 
  filters, 
  vehicles, 
  hotspots, 
  heatmapPoints 
}: WorkMapLeafletProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<L.Layer | null>(null);
  const vehicleMarkersRef = useRef<L.Marker[]>([]);
  const hotspotMarkersRef = useRef<L.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: WROCLAW_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
    });

    // Modern tile layer
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

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

    // Remove existing heat layer
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

    // Clear existing vehicle markers
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
            ${vehicle.line ? `<br>Linia: ${vehicle.line}` : ""}
          </div>
        `);
        
        marker.addTo(mapRef.current!);
        vehicleMarkersRef.current.push(marker);
      });
    }
  }, [filters.showVehicles, vehicles, isLoaded]);

  // Update hotspot markers
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    // Clear existing hotspot markers
    hotspotMarkersRef.current.forEach(marker => marker.remove());
    hotspotMarkersRef.current = [];

    if (filters.showHotspots) {
      hotspots.forEach(hotspot => {
        const icon = createHotspotIcon(hotspot.level);
        const marker = L.marker([hotspot.lat, hotspot.lng], { 
          icon,
          zIndexOffset: 200,
        });
        
        marker.bindPopup(`
          <div class="hotspot-popup">
            <div class="hotspot-popup-header">
              <strong>${hotspot.name}</strong>
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
    <div className="relative">
      <div 
        ref={mapContainerRef} 
        className="w-full h-[500px] md:h-[600px] rounded-xl overflow-hidden"
      />
      
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm rounded-xl">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Ładowanie mapy...</span>
          </div>
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
        
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
        }
        
        .leaflet-popup-content {
          margin: 0;
        }
        
        .hotspot-popup {
          padding: 12px 16px;
          min-width: 180px;
        }
        
        .hotspot-popup-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .hotspot-popup-header strong {
          font-size: 14px;
          color: #1f2937;
        }
        
        .hotspot-popup-content {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .hotspot-popup-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }
        
        .hotspot-popup-row .label {
          color: #6b7280;
        }
        
        .hotspot-popup-row .value {
          font-weight: 500;
          color: #1f2937;
        }
        
        .hotspot-popup-row .value.bardzo-wysoka { color: #ef4444; }
        .hotspot-popup-row .value.wysoka { color: #f97316; }
        .hotspot-popup-row .value.średnia { color: #eab308; }
        .hotspot-popup-row .value.niska { color: #3b82f6; }
        
        .vehicle-popup {
          padding: 8px 12px;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
