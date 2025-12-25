import { useEffect, useState, useCallback, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navigation, Clock, MapPin, User, Loader2 } from 'lucide-react';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface OrderTrackingMapProps {
  clientLat: number;
  clientLng: number;
  providerLat: number;
  providerLng: number;
  providerName?: string;
  etaSeconds?: number | null;
  status: 'accepted' | 'en_route' | 'arrived' | 'done';
}

// Create custom icons
const createClientIcon = () => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, hsl(40, 95%, 55%), hsl(40, 95%, 65%));
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

const createProviderIcon = (isMoving: boolean) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: linear-gradient(135deg, hsl(152, 76%, 42%), hsl(165, 80%, 45%));
        border: 4px solid white;
        box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h1"/>
          <circle cx="7" cy="17" r="2"/>
          <path d="M9 17h6"/>
          <circle cx="17" cy="17" r="2"/>
        </svg>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48],
  });
};

// Fetch route from OSRM
async function fetchRoute(from: [number, number], to: [number, number]): Promise<{ route: [number, number][], duration: number } | null> {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`
    );
    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes[0]) {
      const coords = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
      const duration = data.routes[0].duration;
      return { route: coords, duration };
    }
    return null;
  } catch (error) {
    console.error('Error fetching route:', error);
    return null;
  }
}

function formatETA(seconds: number): string {
  if (seconds < 60) return 'Mniej niż minutę';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours}h ${remainingMins}min`;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  accepted: { label: 'Zaakceptowano', color: 'bg-blue-500' },
  en_route: { label: 'W drodze', color: 'bg-primary' },
  arrived: { label: 'Na miejscu', color: 'bg-accent' },
  done: { label: 'Zakończono', color: 'bg-muted' },
};

// Inner map component
function OrderTrackingMapInner({
  clientLat,
  clientLng,
  providerLat,
  providerLng,
  providerName,
  etaSeconds,
  status,
}: OrderTrackingMapProps) {
  const { MapContainer, TileLayer, Marker, Popup, Polyline } = require('react-leaflet');
  const [route, setRoute] = useState<[number, number][]>([]);
  const [calculatedEta, setCalculatedEta] = useState<number | null>(null);
  const lastRouteUpdate = useRef<number>(0);

  const clientPos: [number, number] = [clientLat, clientLng];
  const providerPos: [number, number] = [providerLat, providerLng];

  const updateRoute = useCallback(async () => {
    const now = Date.now();
    if (now - lastRouteUpdate.current < 15000) return;
    lastRouteUpdate.current = now;

    const result = await fetchRoute(providerPos, clientPos);
    if (result) {
      setRoute(result.route);
      setCalculatedEta(result.duration);
    }
  }, [providerLat, providerLng, clientLat, clientLng]);

  useEffect(() => {
    updateRoute();
    const interval = setInterval(updateRoute, 30000);
    return () => clearInterval(interval);
  }, [updateRoute]);

  const displayEta = etaSeconds || calculatedEta;
  const statusInfo = STATUS_LABELS[status] || STATUS_LABELS.accepted;

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-xl ${statusInfo.color} flex items-center justify-center`}>
                <Navigation className="h-6 w-6 text-white" />
              </div>
              <div>
                <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                {providerName && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <User className="h-3 w-3 inline mr-1" />
                    {providerName}
                  </p>
                )}
              </div>
            </div>
            
            {displayEta && status === 'en_route' && (
              <div className="flex items-center gap-2 bg-background px-4 py-2 rounded-xl">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Szacowany czas</p>
                  <p className="font-bold text-lg">{formatETA(displayEta)}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <div className="relative rounded-2xl overflow-hidden border border-border shadow-lg">
        <MapContainer
          center={[(clientLat + providerLat) / 2, (clientLng + providerLng) / 2]}
          zoom={13}
          style={{ height: '400px', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {route.length > 0 && (
            <Polyline 
              positions={route} 
              color="hsl(152, 76%, 42%)"
              weight={5}
              opacity={0.8}
            />
          )}
          
          <Marker position={clientPos} icon={createClientIcon()}>
            <Popup>
              <div className="p-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-accent" />
                  <span className="font-medium">Twoja lokalizacja</span>
                </div>
              </div>
            </Popup>
          </Marker>
          
          <Marker position={providerPos} icon={createProviderIcon(status === 'en_route')}>
            <Popup>
              <div className="p-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="font-medium">{providerName || 'Wykonawca'}</span>
                </div>
                <Badge className={`mt-2 ${statusInfo.color}`}>{statusInfo.label}</Badge>
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {status === 'en_route' && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-primary text-white px-3 py-1.5 rounded-full text-sm font-medium z-[1000]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            LIVE
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrderTrackingMap(props: OrderTrackingMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="h-[400px] rounded-2xl bg-muted flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-muted-foreground">Ładowanie mapy...</span>
        </div>
      </div>
    );
  }

  return <OrderTrackingMapInner {...props} />;
}
