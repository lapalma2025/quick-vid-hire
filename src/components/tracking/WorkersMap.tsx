import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { StarRating } from '@/components/ui/star-rating';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

// Fix for default marker icons in Leaflet with React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Worker {
  id: string;
  name: string | null;
  avatar_url: string | null;
  is_available: boolean;
  hourly_rate: number | null;
  rating_avg: number;
  miasto: string | null;
  wojewodztwo: string | null;
  lat?: number;
  lng?: number;
}

interface WorkersMapProps {
  workers: Worker[];
  onOrderWorker?: (workerId: string) => void;
  showOrderButton?: boolean;
}

// Create custom icons
const createWorkerIcon = (isAvailable: boolean) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: ${isAvailable ? 'linear-gradient(135deg, hsl(152, 76%, 42%), hsl(152, 76%, 52%))' : 'hsl(220, 10%, 70%)'};
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

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
  // If worker has explicit coordinates
  if (worker.lat && worker.lng) {
    return [worker.lat, worker.lng];
  }
  
  // Try to get coordinates from city
  if (worker.miasto) {
    const cityCoords = CITY_COORDINATES[worker.miasto];
    if (cityCoords) {
      // Add small random offset so markers don't overlap
      const offset = () => (Math.random() - 0.5) * 0.02;
      return [cityCoords[0] + offset(), cityCoords[1] + offset()];
    }
  }
  
  // Fallback to województwo center
  if (worker.wojewodztwo) {
    const wojCoords = WOJEWODZTWO_CENTERS[worker.wojewodztwo];
    if (wojCoords) {
      const offset = () => (Math.random() - 0.5) * 0.1;
      return [wojCoords[0] + offset(), wojCoords[1] + offset()];
    }
  }
  
  return null;
}

export default function WorkersMap({ workers, onOrderWorker, showOrderButton = true }: WorkersMapProps) {
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  // Poland center
  const defaultCenter: [number, number] = [52.0693, 19.4803];

  // Filter workers with valid coordinates
  const workersWithCoords = workers
    .map(worker => ({
      ...worker,
      coordinates: getWorkerCoordinates(worker)
    }))
    .filter(w => w.coordinates !== null);

  useEffect(() => {
    // Small delay to ensure proper mounting
    const timer = setTimeout(() => setMapReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!mapReady) {
    return (
      <div className="h-[400px] md:h-[500px] rounded-2xl bg-muted flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-muted-foreground">Ładowanie mapy...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-border shadow-lg">
      <MapContainer
        center={defaultCenter}
        zoom={6}
        style={{ height: '500px', width: '100%' }}
        ref={mapRef}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {workersWithCoords.map((worker) => (
          <Marker
            key={worker.id}
            position={worker.coordinates!}
            icon={createWorkerIcon(worker.is_available)}
          >
            <Popup className="worker-popup">
              <div className="p-2 min-w-[200px]">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarImage src={worker.avatar_url || ''} />
                    <AvatarFallback className="bg-primary text-white">
                      {worker.name?.charAt(0)?.toUpperCase() || 'W'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-sm">{worker.name || 'Wykonawca'}</h4>
                    <Badge 
                      variant={worker.is_available ? 'default' : 'secondary'}
                      className={`text-xs ${worker.is_available ? 'bg-primary' : ''}`}
                    >
                      {worker.is_available ? 'Dostępny' : 'Niedostępny'}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-1 mb-3">
                  {worker.rating_avg > 0 && (
                    <div className="flex items-center gap-1">
                      <StarRating value={worker.rating_avg} readonly size="sm" />
                    </div>
                  )}
                  {worker.miasto && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {worker.miasto}
                    </div>
                  )}
                  {worker.hourly_rate && (
                    <div className="text-xs text-muted-foreground">
                      {worker.hourly_rate} zł/h
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild className="flex-1">
                    <Link to={`/worker/${worker.id}`}>Profil</Link>
                  </Button>
                  {showOrderButton && worker.is_available && onOrderWorker && (
                    <Button 
                      size="sm" 
                      className="flex-1 bg-primary hover:bg-primary/90"
                      onClick={() => onOrderWorker(worker.id)}
                    >
                      Zamów
                    </Button>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-border z-[1000]">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>Dostępny</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-muted-foreground/50" />
            <span>Niedostępny</span>
          </div>
        </div>
      </div>
    </div>
  );
}
