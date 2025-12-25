import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { StarRating } from '@/components/ui/star-rating';
import { MapPin, Loader2, Banknote } from 'lucide-react';

interface Worker {
  id: string;
  name: string | null;
  avatar_url: string | null;
  is_available: boolean;
  hourly_rate: number | null;
  rating_avg: number;
  miasto: string | null;
  wojewodztwo: string | null;
}

interface WorkersMapProps {
  workers: Worker[];
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

export default function WorkersMap({ workers }: WorkersMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      try {
        const L = await import('leaflet');
        await import('leaflet/dist/leaflet.css');

        if (!isMounted || !mapRef.current) return;

        // Fix default marker icons
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        const map = L.map(mapRef.current).setView([52.0693, 19.4803], 6);
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        // Create custom icons
        const createIcon = (isAvailable: boolean) => L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              width: 40px;
              height: 40px;
              border-radius: 50%;
              background: ${isAvailable ? 'linear-gradient(135deg, hsl(152, 76%, 42%), hsl(152, 76%, 52%))' : 'linear-gradient(135deg, hsl(220, 10%, 50%), hsl(220, 10%, 60%))'};
              border: 3px solid white;
              box-shadow: 0 4px 14px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              transition: transform 0.2s ease;
            ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          popupAnchor: [0, -40],
        });

        // Add markers for workers
        workers.forEach(worker => {
          const coords = getWorkerCoordinates(worker);
          if (!coords) return;

          const marker = L.marker(coords, { icon: createIcon(worker.is_available) }).addTo(map);
          
          const popupContent = `
            <div style="min-width: 220px; font-family: system-ui, -apple-system, sans-serif;">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                <div style="
                  width: 48px; 
                  height: 48px; 
                  border-radius: 12px; 
                  background: ${worker.avatar_url ? `url(${worker.avatar_url}) center/cover` : 'linear-gradient(135deg, hsl(152, 76%, 42%), hsl(152, 76%, 52%))'};
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-weight: 600;
                  font-size: 18px;
                  border: 2px solid hsl(152, 76%, 42%, 0.2);
                ">${!worker.avatar_url ? (worker.name?.charAt(0)?.toUpperCase() || 'W') : ''}</div>
                <div style="flex: 1;">
                  <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${worker.name || 'Wykonawca'}</div>
                  <div style="
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 500;
                    background: ${worker.is_available ? 'hsl(152, 76%, 42%)' : 'hsl(220, 10%, 70%)'};
                    color: white;
                  ">${worker.is_available ? 'Dostępny' : 'Niedostępny'}</div>
                </div>
              </div>
              
              <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; font-size: 13px; color: hsl(220, 10%, 40%);">
                ${worker.rating_avg > 0 ? `
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <span style="color: hsl(45, 93%, 47%);">★</span>
                    <span style="font-weight: 500;">${worker.rating_avg.toFixed(1)}</span>
                  </div>
                ` : ''}
                ${worker.miasto ? `
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    ${worker.miasto}
                  </div>
                ` : ''}
                ${worker.hourly_rate ? `
                  <div style="display: flex; align-items: center; gap: 4px; color: hsl(152, 76%, 42%); font-weight: 600;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                      <line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                    ${worker.hourly_rate} zł/h
                  </div>
                ` : ''}
              </div>
              
              <a 
                href="/worker/${worker.id}" 
                style="
                  display: block;
                  width: 100%;
                  padding: 10px 16px;
                  background: linear-gradient(135deg, hsl(152, 76%, 42%), hsl(152, 76%, 50%));
                  color: white;
                  text-align: center;
                  border-radius: 10px;
                  font-weight: 600;
                  font-size: 13px;
                  text-decoration: none;
                  transition: opacity 0.2s;
                "
                onmouseover="this.style.opacity='0.9'"
                onmouseout="this.style.opacity='1'"
              >
                Zobacz profil
              </a>
            </div>
          `;

          marker.bindPopup(popupContent, {
            maxWidth: 280,
            className: 'modern-popup'
          });
        });

        setIsLoading(false);
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
    };
  }, [workers]);

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 z-10 rounded-2xl bg-muted flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-muted-foreground font-medium">Ładowanie mapy...</span>
          </div>
        </div>
      )}
      <div 
        ref={mapRef} 
        className="h-[500px] rounded-2xl overflow-hidden border border-border shadow-lg"
        style={{ background: 'hsl(var(--muted))' }}
      />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-border z-[1000]">
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-primary shadow-sm" />
            <span>Dostępny</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-muted-foreground/50 shadow-sm" />
            <span>Niedostępny</span>
          </div>
        </div>
      </div>

      {/* Map overlay info */}
      <div className="absolute top-4 right-4 bg-background/95 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg border border-border z-[1000]">
        <div className="text-sm font-medium">
          {workers.filter(w => getWorkerCoordinates(w)).length} wykonawców na mapie
        </div>
      </div>

      <style>{`
        .modern-popup .leaflet-popup-content-wrapper {
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          padding: 0;
        }
        .modern-popup .leaflet-popup-content {
          margin: 16px;
        }
        .modern-popup .leaflet-popup-tip {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}
