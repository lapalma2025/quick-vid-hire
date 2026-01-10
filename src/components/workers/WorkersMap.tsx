import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2 } from 'lucide-react';
import { WROCLAW_DISTRICTS, DOLNOSLASKIE_CITIES } from '@/lib/constants';

interface Worker {
  id: string;
  name: string | null;
  avatar_url: string | null;
  is_available?: boolean;
  hourly_rate: number | null;
  rating_avg: number;
  miasto: string | null;
  wojewodztwo: string | null;
  district?: string | null;
  street?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
}

interface WorkersMapProps {
  workers: Worker[];
  highlightedWorkerId?: string | null;
  onMarkerClick?: (workerId: string) => void;
  onMarkerHover?: (workerId: string | null) => void;
}

interface WorkerCluster {
  key: string;
  miasto: string;
  district?: string;
  lat: number;
  lng: number;
  workers: Worker[];
}

// Województwo dolnośląskie
const DOLNOSLASKIE_CENTER: L.LatLngTuple = [51.0, 16.35];
const DEFAULT_ZOOM = 9;
const PRECISE_SPLIT_ZOOM = 15;

// Get worker coordinates and determine if they have precise location
function getWorkerCoordinates(worker: Worker): { lat: number; lng: number; hasPreciseLocation: boolean } | null {
  const miasto = worker.miasto?.trim() || "";
  const miastoLower = miasto.toLowerCase();
  
  // If worker has stored coordinates from street geocoding, use them
  if (worker.location_lat != null && worker.location_lng != null) {
    return { lat: worker.location_lat, lng: worker.location_lng, hasPreciseLocation: true };
  }
  
  // For Wrocław with district
  if (miastoLower === "wrocław" && worker.district && WROCLAW_DISTRICTS[worker.district]) {
    const coords = WROCLAW_DISTRICTS[worker.district];
    return { lat: coords.lat, lng: coords.lng, hasPreciseLocation: false };
  }
  
  // For Wrocław without district - use Wrocław center
  if (miastoLower === "wrocław") {
    return { lat: 51.1079, lng: 17.0385, hasPreciseLocation: false };
  }
  
  // For cities in dolnośląskie
  const cityKey = DOLNOSLASKIE_CITIES[miasto]
    ? miasto
    : Object.keys(DOLNOSLASKIE_CITIES).find(k => k.toLowerCase() === miastoLower);
  
  if (cityKey) {
    const coords = DOLNOSLASKIE_CITIES[cityKey];
    return { lat: coords.lat, lng: coords.lng, hasPreciseLocation: false };
  }
  
  return null;
}

function createWorkerIcon(isHighlighted: boolean = false) {
  const size = isHighlighted ? 44 : 36;
  
  return L.divIcon({
    className: 'worker-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
    html: `
      <div class="worker-marker-wrapper" style="width: ${size}px; height: ${size}px;">
        <div class="worker-pin" style="
          width: ${size}px; 
          height: ${size}px;
          background: linear-gradient(135deg, hsl(152, 76%, 42%), hsl(152, 76%, 52%));
          border: ${isHighlighted ? '4px' : '3px'} solid white;
          border-radius: 50%;
          box-shadow: ${isHighlighted ? '0 6px 20px rgba(0,0,0,0.4)' : '0 3px 10px rgba(0,0,0,0.25)'};
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="${size * 0.45}" height="${size * 0.45}" viewBox="0 0 24 24" fill="white">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
      </div>
    `,
  });
}

function createClusterIcon(count: number) {
  const size = Math.min(56, 40 + count * 2);
  
  return L.divIcon({
    className: 'worker-cluster-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `
      <div class="worker-cluster-wrapper" style="width: ${size}px; height: ${size}px;">
        <div class="worker-cluster-core" style="
          background: linear-gradient(135deg, hsl(152, 76%, 42%), hsl(152, 76%, 50%));
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 15px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="color: white; font-weight: 700; font-size: ${size * 0.35}px;">${count}</span>
        </div>
      </div>
    `,
  });
}

export default function WorkersMap({ 
  workers, 
  highlightedWorkerId, 
  onMarkerClick,
  onMarkerHover 
}: WorkersMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const clusterMarkersRef = useRef<L.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentZoom, setCurrentZoom] = useState(DEFAULT_ZOOM);

  // Separate workers into precise (with street) and clustered (without)
  const { preciseWorkers, clustersByLocation } = useMemo(() => {
    const shouldShowPrecise = currentZoom >= PRECISE_SPLIT_ZOOM;
    
    const precise: (Worker & { lat: number; lng: number })[] = [];
    const clusters: Record<string, WorkerCluster> = {};
    
    workers.forEach(worker => {
      const coords = getWorkerCoordinates(worker);
      if (!coords) return;
      
      if (coords.hasPreciseLocation && shouldShowPrecise) {
        precise.push({ ...worker, lat: coords.lat, lng: coords.lng });
      } else {
        const miasto = worker.miasto || "Nieznane";
        const miastoLower = miasto.toLowerCase();
        const districtLower = (worker.district ?? "").toLowerCase();
        const key = miastoLower === "wrocław" ? `${miastoLower}::${districtLower}` : miastoLower;
        
        if (!clusters[key]) {
          clusters[key] = {
            key,
            miasto,
            district: worker.district || undefined,
            lat: coords.lat,
            lng: coords.lng,
            workers: [],
          };
        }
        
        clusters[key].workers.push(worker);
        
        // Average position
        const totalLat = clusters[key].workers.reduce((sum, w) => {
          const c = getWorkerCoordinates(w);
          return sum + (c?.lat || 0);
        }, 0);
        const totalLng = clusters[key].workers.reduce((sum, w) => {
          const c = getWorkerCoordinates(w);
          return sum + (c?.lng || 0);
        }, 0);
        clusters[key].lat = totalLat / clusters[key].workers.length;
        clusters[key].lng = totalLng / clusters[key].workers.length;
      }
    });
    
    return { preciseWorkers: precise, clustersByLocation: Object.values(clusters) };
  }, [workers, currentZoom]);

  // Initialize map with dolnośląskie bounds
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Dolnośląskie voivodeship bounds
    const maxBounds = L.latLngBounds(
      [50.15, 14.80], // SW corner
      [51.80, 17.85]  // NE corner
    );

    const map = L.map(mapContainerRef.current, {
      center: DOLNOSLASKIE_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      minZoom: 7,
      maxZoom: 18,
      maxBounds: maxBounds,
      maxBoundsViscosity: 0.8,
      attributionControl: false,
    });

    // CARTO Voyager tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
    }).addTo(map);

    // Mask everything outside Dolnośląskie voivodeship
    const worldBounds: L.LatLngTuple[] = [
      [-90, -180], [-90, 180], [90, 180], [90, -180], [-90, -180]
    ];
    
    // Simplified polygon of Dolnośląskie voivodeship
    const dolnoslaskiePolygon: L.LatLngTuple[] = [
      [51.80, 14.95], [51.80, 15.20], [51.75, 15.45], [51.68, 15.60],
      [51.58, 15.75], [51.45, 15.85], [51.35, 15.90], [51.25, 15.92],
      [51.15, 15.88], [51.05, 15.78], [50.95, 15.65], [50.88, 15.55],
      [50.78, 15.50], [50.68, 15.55], [50.55, 15.65], [50.45, 15.78],
      [50.35, 15.95], [50.28, 16.10], [50.22, 16.30], [50.18, 16.55],
      [50.20, 16.80], [50.25, 17.00], [50.32, 17.15], [50.42, 17.28],
      [50.55, 17.38], [50.68, 17.45], [50.80, 17.50], [50.92, 17.55],
      [51.05, 17.60], [51.18, 17.65], [51.30, 17.68], [51.42, 17.70],
      [51.55, 17.72], [51.65, 17.68], [51.72, 17.55], [51.76, 17.38],
      [51.78, 17.20], [51.79, 17.00], [51.80, 16.75], [51.80, 16.50],
      [51.78, 16.25], [51.75, 16.00], [51.72, 15.75], [51.70, 15.50],
      [51.72, 15.30], [51.78, 15.10], [51.80, 14.95]
    ];

    // Create mask polygon (world with hole for Dolnośląskie)
    const maskPolygon = L.polygon(
      [worldBounds, dolnoslaskiePolygon],
      {
        color: 'transparent',
        fillColor: '#f8fafc',
        fillOpacity: 0.92,
        interactive: false,
      }
    );
    maskPolygon.addTo(map);

    // Add border around Dolnośląskie
    L.polygon(dolnoslaskiePolygon, {
      color: 'hsl(var(--primary))',
      weight: 2,
      fillColor: 'transparent',
      fillOpacity: 0,
      dashArray: '5, 5',
      interactive: false,
    }).addTo(map);

    L.control.attribution({
      position: 'bottomright',
      prefix: false,
    }).addAttribution('© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a href="https://carto.com/attributions">CARTO</a>').addTo(map);

    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    mapRef.current = map;
    setIsLoading(false);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    clusterMarkersRef.current.forEach(m => m.remove());
    clusterMarkersRef.current = [];

    // Add precise worker markers
    preciseWorkers.forEach(worker => {
      const icon = createWorkerIcon(worker.id === highlightedWorkerId);
      const marker = L.marker([worker.lat, worker.lng], { icon, zIndexOffset: 350 });
      
      marker.bindPopup(createWorkerPopup(worker), { minWidth: 220, maxWidth: 280 });
      marker.on('mouseover', () => onMarkerHover?.(worker.id));
      marker.on('mouseout', () => onMarkerHover?.(null));
      marker.on('click', () => onMarkerClick?.(worker.id));
      
      marker.addTo(map);
      markersRef.current.push(marker);
    });

    // Add cluster markers
    clustersByLocation.forEach(cluster => {
      if (cluster.workers.length === 0) return;
      
      if (cluster.workers.length === 1) {
        const worker = cluster.workers[0];
        const icon = createWorkerIcon(worker.id === highlightedWorkerId);
        const marker = L.marker([cluster.lat, cluster.lng], { icon, zIndexOffset: 300 });
        
        marker.bindPopup(createWorkerPopup(worker), { minWidth: 220, maxWidth: 280 });
        marker.on('mouseover', () => onMarkerHover?.(worker.id));
        marker.on('mouseout', () => onMarkerHover?.(null));
        marker.on('click', () => onMarkerClick?.(worker.id));
        
        marker.addTo(map);
        clusterMarkersRef.current.push(marker);
      } else {
        const icon = createClusterIcon(cluster.workers.length);
        const marker = L.marker([cluster.lat, cluster.lng], { icon, zIndexOffset: 400 });
        
        const workerListHtml = cluster.workers.map(w => `
          <a href="/worker/${w.id}" class="cluster-worker-item">
            <div class="cluster-worker-avatar" style="
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: ${w.avatar_url ? `url(${w.avatar_url}) center/cover` : 'linear-gradient(135deg, hsl(152, 76%, 42%), hsl(152, 76%, 52%))'};
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 600;
              font-size: 12px;
            ">${!w.avatar_url ? (w.name?.charAt(0)?.toUpperCase() || 'W') : ''}</div>
            <div class="cluster-worker-info">
              <div class="cluster-worker-name">${w.name || 'Wykonawca'}</div>
              <div class="cluster-worker-meta">
                ${w.rating_avg > 0 ? `<span>★ ${w.rating_avg.toFixed(1)}</span>` : ''}
                ${w.hourly_rate ? `<span>${w.hourly_rate} zł/h</span>` : ''}
              </div>
            </div>
          </a>
        `).join('');
        
        marker.bindPopup(`
          <div class="cluster-popup">
            <div class="cluster-popup-header">
              <strong>${cluster.miasto}${cluster.district ? ` • ${cluster.district}` : ''}</strong>
              <span class="cluster-count">${cluster.workers.length} wykonawców</span>
            </div>
            <div class="cluster-worker-list">
              ${workerListHtml}
            </div>
            <div class="cluster-popup-hint">
              Wykonawcy bez podanego dokładnego adresu
            </div>
          </div>
        `, { minWidth: 280, maxWidth: 340, maxHeight: 400 });
        
        marker.addTo(map);
        clusterMarkersRef.current.push(marker);
      }
    });
  }, [preciseWorkers, clustersByLocation, highlightedWorkerId, onMarkerClick, onMarkerHover]);

  // Update marker style when highlighted worker changes (NO panning)
  useEffect(() => {
    if (!mapRef.current || !highlightedWorkerId) return;

    // Just update icon styles, don't pan
    markersRef.current.forEach((marker, index) => {
      const worker = preciseWorkers[index];
      if (worker) {
        marker.setIcon(createWorkerIcon(worker.id === highlightedWorkerId));
      }
    });
  }, [highlightedWorkerId, preciseWorkers]);

  return (
    <div className="relative h-full w-full">
      {isLoading && (
        <div className="absolute inset-0 z-10 bg-muted flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-muted-foreground font-medium">Ładowanie mapy...</span>
          </div>
        </div>
      )}
      <div 
        ref={mapContainerRef} 
        className="h-full w-full"
        style={{ background: 'hsl(var(--muted))' }}
      />
      
      <div className="absolute top-4 right-4 bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-border z-[1000]">
        <div className="text-sm font-medium">
          {workers.length} wykonawców na mapie
        </div>
      </div>

      {currentZoom < PRECISE_SPLIT_ZOOM && preciseWorkers.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-border z-[1000]">
          <div className="text-xs text-muted-foreground">
            🔍 Przybliż mapę, aby zobaczyć dokładne lokalizacje
          </div>
        </div>
      )}

      <style>{`
        .cluster-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.15);
          padding: 0;
        }
        .cluster-popup .leaflet-popup-content {
          margin: 0;
        }
        .cluster-popup-header {
          padding: 12px 16px;
          border-bottom: 1px solid hsl(var(--border));
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .cluster-popup-header strong {
          font-size: 14px;
        }
        .cluster-count {
          font-size: 12px;
          color: hsl(152, 76%, 42%);
          font-weight: 600;
        }
        .cluster-worker-list {
          max-height: 250px;
          overflow-y: auto;
          padding: 8px;
        }
        .cluster-worker-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          border-radius: 8px;
          text-decoration: none;
          color: inherit;
          transition: background 0.15s;
        }
        .cluster-worker-item:hover {
          background: hsl(var(--muted));
        }
        .cluster-worker-info {
          flex: 1;
          min-width: 0;
        }
        .cluster-worker-name {
          font-weight: 600;
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cluster-worker-meta {
          font-size: 11px;
          color: hsl(var(--muted-foreground));
          display: flex;
          gap: 8px;
        }
        .cluster-popup-hint {
          padding: 8px 16px;
          background: hsl(var(--muted));
          font-size: 11px;
          color: hsl(var(--muted-foreground));
          border-radius: 0 0 12px 12px;
        }
      `}</style>
    </div>
  );
}

function createWorkerPopup(worker: Worker): string {
  return `
    <div style="padding: 8px; min-width: 180px; font-family: system-ui, -apple-system, sans-serif;">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
        <div style="
          width: 40px; 
          height: 40px; 
          border-radius: 10px; 
          background: ${worker.avatar_url ? `url(${worker.avatar_url}) center/cover` : 'linear-gradient(135deg, hsl(152, 76%, 42%), hsl(152, 76%, 52%))'};
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 16px;
        ">${!worker.avatar_url ? (worker.name?.charAt(0)?.toUpperCase() || 'W') : ''}</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${worker.name || 'Wykonawca'}</div>
          ${worker.rating_avg > 0 ? `
            <div style="display: flex; align-items: center; gap: 3px; font-size: 12px; color: #666;">
              <span style="color: hsl(45, 93%, 47%);">★</span>
              <span>${worker.rating_avg.toFixed(1)}</span>
            </div>
          ` : ''}
        </div>
      </div>
      ${worker.miasto ? `
        <div style="font-size: 12px; color: #888; margin-bottom: 10px; display: flex; align-items: center; gap: 4px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          ${worker.miasto}${worker.district ? `, ${worker.district}` : ''}
        </div>
      ` : ''}
      ${worker.hourly_rate ? `
        <div style="font-size: 13px; color: hsl(152, 76%, 42%); font-weight: 600; margin-bottom: 10px;">
          ${worker.hourly_rate} zł/h
        </div>
      ` : ''}
      <a 
        href="/worker/${worker.id}" 
        style="
          display: block;
          width: 100%;
          padding: 8px 12px;
          background: linear-gradient(135deg, hsl(152, 76%, 42%), hsl(152, 76%, 50%));
          color: white;
          text-align: center;
          border-radius: 8px;
          font-weight: 600;
          font-size: 12px;
          text-decoration: none;
        "
      >
        Zobacz profil →
      </a>
    </div>
  `;
}