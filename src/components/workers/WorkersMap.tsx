import { useEffect, useRef, useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';

interface Worker {
  id: string;
  name: string | null;
  avatar_url: string | null;
  is_available?: boolean;
  hourly_rate: number | null;
  rating_avg: number;
  miasto: string | null;
  wojewodztwo: string | null;
}

interface WorkersMapProps {
  workers: Worker[];
  highlightedWorkerId?: string | null;
  onMarkerClick?: (workerId: string) => void;
  onMarkerHover?: (workerId: string | null) => void;
}

// City coordinates for Poland (approximate)
const CITY_COORDINATES: Record<string, [number, number]> = {
  'Warszawa': [52.2297, 21.0122],
  'Kraków': [50.0647, 19.9450],
  'Łódź': [51.7592, 19.4560],
  'Wrocław': [51.1079, 17.0385],
  'Poznań': [52.4064, 16.9252],
  'Gdańsk': [54.3520, 18.6466],
  'Szczecin': [53.4285, 14.5528],
  'Bydgoszcz': [53.1235, 18.0084],
  'Lublin': [51.2465, 22.5684],
  'Katowice': [50.2649, 19.0238],
  'Białystok': [53.1325, 23.1688],
  'Gdynia': [54.5189, 18.5305],
  'Częstochowa': [50.8118, 19.1203],
  'Radom': [51.4027, 21.1471],
  'Sosnowiec': [50.2863, 19.1042],
  'Toruń': [53.0138, 18.5984],
  'Kielce': [50.8661, 20.6286],
  'Rzeszów': [50.0413, 21.9990],
  'Gliwice': [50.2945, 18.6714],
  'Zabrze': [50.3249, 18.7857],
  'Olsztyn': [53.7784, 20.4942],
  'Bielsko-Biała': [49.8224, 19.0584],
  'Bytom': [50.3485, 18.9157],
  'Zielona Góra': [51.9356, 15.5062],
  'Rybnik': [50.1022, 18.5463],
  'Ruda Śląska': [50.2558, 18.8556],
  'Opole': [50.6751, 17.9213],
  'Tychy': [50.1369, 18.9644],
  'Gorzów Wielkopolski': [52.7368, 15.2288],
  'Elbląg': [54.1522, 19.4044],
  'Płock': [52.5463, 19.7064],
  'Dąbrowa Górnicza': [50.3337, 19.1808],
  'Wałbrzych': [50.7714, 16.2845],
  'Włocławek': [52.6483, 19.0677],
  'Tarnów': [50.0121, 20.9858],
  'Chorzów': [50.2971, 18.9546],
  'Kalisz': [51.7611, 18.0853],
  'Koszalin': [54.1943, 16.1715],
  'Legnica': [51.2100, 16.1619],
  'Grudziądz': [53.4837, 18.7536],
  'Słupsk': [54.4641, 17.0285],
};

const WOJEWODZTWO_CENTERS: Record<string, [number, number]> = {
  'Dolnośląskie': [51.1079, 17.0385],
  'Kujawsko-pomorskie': [53.0138, 18.0084],
  'Lubelskie': [51.2465, 22.5684],
  'Lubuskie': [52.0864, 15.4600],
  'Łódzkie': [51.7592, 19.4560],
  'Małopolskie': [50.0647, 19.9450],
  'Mazowieckie': [52.2297, 21.0122],
  'Opolskie': [50.6751, 17.9213],
  'Podkarpackie': [50.0413, 21.9990],
  'Podlaskie': [53.1325, 23.1688],
  'Pomorskie': [54.3520, 18.6466],
  'Śląskie': [50.2649, 19.0238],
  'Świętokrzyskie': [50.8661, 20.6286],
  'Warmińsko-mazurskie': [53.7784, 20.4942],
  'Wielkopolskie': [52.4064, 16.9252],
  'Zachodniopomorskie': [53.4285, 14.5528],
};

function getWorkerCoordinates(worker: Worker): [number, number] | null {
  if (worker.miasto) {
    const cityCoords = CITY_COORDINATES[worker.miasto];
    if (cityCoords) {
      const offset = () => (Math.random() - 0.5) * 0.02;
      return [cityCoords[0] + offset(), cityCoords[1] + offset()];
    }
  }
  
  if (worker.wojewodztwo) {
    const wojCoords = WOJEWODZTWO_CENTERS[worker.wojewodztwo];
    if (wojCoords) {
      const offset = () => (Math.random() - 0.5) * 0.1;
      return [wojCoords[0] + offset(), wojCoords[1] + offset()];
    }
  }
  
  return null;
}

export default function WorkersMap({ 
  workers, 
  highlightedWorkerId, 
  onMarkerClick,
  onMarkerHover 
}: WorkersMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const leafletRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  // Stabilize worker coordinates with a ref to avoid recalculation on every render
  const workerCoordsRef = useRef<Map<string, [number, number]>>(new Map());
  
  // Only recalculate coords when worker IDs change
  const workerIds = useMemo(() => workers.map(w => w.id).sort().join(','), [workers]);
  
  useEffect(() => {
    const coords = new Map<string, [number, number]>();
    workers.forEach(worker => {
      // Reuse existing coords if available to prevent marker jumping
      const existing = workerCoordsRef.current.get(worker.id);
      if (existing) {
        coords.set(worker.id, existing);
      } else {
        const coord = getWorkerCoordinates(worker);
        if (coord) coords.set(worker.id, coord);
      }
    });
    workerCoordsRef.current = coords;
  }, [workerIds, workers]);

  // Initialize map only once
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      try {
        const L = await import('leaflet');
        await import('leaflet/dist/leaflet.css');

        if (!isMounted || !mapRef.current) return;

        leafletRef.current = L;

        // Fix default marker icons
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // Wrocław center and bounds (same as WorkMapLeaflet)
        const WROCLAW_CENTER: [number, number] = [51.1079, 17.0385];
        const BOUNDS_PADDING = 0.45;
        const maxBounds = L.latLngBounds(
          [WROCLAW_CENTER[0] - BOUNDS_PADDING, WROCLAW_CENTER[1] - BOUNDS_PADDING * 1.5],
          [WROCLAW_CENTER[0] + BOUNDS_PADDING, WROCLAW_CENTER[1] + BOUNDS_PADDING * 1.5]
        );

        const map = L.map(mapRef.current, {
          preferCanvas: true,
          center: WROCLAW_CENTER,
          zoom: 12,
          minZoom: 9,
          maxZoom: 18,
          maxBounds: maxBounds,
          maxBoundsViscosity: 0.8,
          attributionControl: false,
        });
        
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 18,
          updateWhenIdle: true,
          updateWhenZooming: false,
        }).addTo(map);

        // Add minimal attribution (required by OSM and CARTO licenses)
        L.control.attribution({
          position: 'bottomright',
          prefix: false,
        }).addAttribution('© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a href="https://carto.com/attributions">CARTO</a>').addTo(map);

        setIsLoading(false);
        setMapReady(true);
      } catch (error) {
        console.error('Failed to load map:', error);
        setIsLoading(false);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markersRef.current.clear();
    };
  }, []);

  // Create icon helper
  const createIcon = useRef((L: any, isHighlighted: boolean) => L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="worker-marker" style="
        width: ${isHighlighted ? '48px' : '36px'};
        height: ${isHighlighted ? '48px' : '36px'};
        border-radius: 50%;
        background: linear-gradient(135deg, hsl(152, 76%, 42%), hsl(152, 76%, 52%));
        border: ${isHighlighted ? '4px' : '3px'} solid white;
        box-shadow: ${isHighlighted ? '0 6px 20px rgba(0,0,0,0.4)' : '0 3px 10px rgba(0,0,0,0.25)'};
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      ">
        <svg width="${isHighlighted ? '20' : '16'}" height="${isHighlighted ? '20' : '16'}" viewBox="0 0 24 24" fill="white">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
    `,
    iconSize: [isHighlighted ? 48 : 36, isHighlighted ? 48 : 36],
    iconAnchor: [isHighlighted ? 24 : 18, isHighlighted ? 48 : 36],
    popupAnchor: [0, isHighlighted ? -48 : -36],
  })).current;

  // Update markers when workers change (separate from map init)
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !leafletRef.current) return;

    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    const currentWorkerIds = new Set(workers.map(w => w.id));

    // Remove markers for workers no longer present
    markersRef.current.forEach((marker, workerId) => {
      if (!currentWorkerIds.has(workerId)) {
        map.removeLayer(marker);
        markersRef.current.delete(workerId);
      }
    });

    // Add or update markers
    workers.forEach(worker => {
      const coords = workerCoordsRef.current.get(worker.id);
      if (!coords) return;

      // Skip if marker already exists
      if (markersRef.current.has(worker.id)) return;

      const marker = L.marker(coords, { 
        icon: createIcon(L, worker.id === highlightedWorkerId),
      }).addTo(map);

      markersRef.current.set(worker.id, marker);

      // Create popup
      const popupContent = `
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
              ${worker.miasto}
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

      marker.bindPopup(popupContent, {
        maxWidth: 240,
        className: 'worker-popup'
      });

      marker.on('mouseover', () => onMarkerHover?.(worker.id));
      marker.on('mouseout', () => onMarkerHover?.(null));
      marker.on('click', () => onMarkerClick?.(worker.id));
    });
  }, [mapReady, workers, highlightedWorkerId, onMarkerClick, onMarkerHover, createIcon]);

  // Update marker styles when highlighted worker changes
  useEffect(() => {
    if (!mapReady || !leafletRef.current) return;

    const L = leafletRef.current;

    markersRef.current.forEach((marker, workerId) => {
      const isHighlighted = workerId === highlightedWorkerId;
      marker.setIcon(createIcon(L, isHighlighted));

      if (isHighlighted && mapInstanceRef.current) {
        const coords = workerCoordsRef.current.get(workerId);
        if (coords) {
          mapInstanceRef.current.panTo(coords, { animate: true, duration: 0.3 });
        }
      }
    });
  }, [highlightedWorkerId, createIcon]);

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
        ref={mapRef} 
        className="h-full w-full"
        style={{ background: 'hsl(var(--muted))' }}
      />
      
      <div className="absolute top-4 right-4 bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-border z-[1000]">
        <div className="text-sm font-medium">
          {workerCoordsRef.current.size} wykonawców na mapie
        </div>
      </div>

      <style>{`
        .worker-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.15);
          padding: 0;
        }
        .worker-popup .leaflet-popup-content {
          margin: 0;
        }
        .worker-popup .leaflet-popup-tip {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}
