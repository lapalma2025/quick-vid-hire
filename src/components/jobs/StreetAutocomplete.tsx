import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreetAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  city: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface StreetSuggestion {
  name: string;
  fullName: string;
}

// Polish city coordinates for better Photon API results
const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  "wrocław": { lat: 51.1079, lon: 17.0385 },
  "kłodzko": { lat: 50.4346, lon: 16.6619 },
  "wałbrzych": { lat: 50.7714, lon: 16.2843 },
  "legnica": { lat: 51.2070, lon: 16.1619 },
  "jelenia góra": { lat: 50.9044, lon: 15.7197 },
  "świdnica": { lat: 50.8428, lon: 16.4880 },
  "lubin": { lat: 51.4010, lon: 16.2015 },
  "głogów": { lat: 51.6632, lon: 16.0846 },
  "oleśnica": { lat: 51.2098, lon: 17.3827 },
  "oława": { lat: 50.9471, lon: 17.2898 },
  "bolesławiec": { lat: 51.2640, lon: 15.5696 },
  "dzierżoniów": { lat: 50.7283, lon: 16.6509 },
  "bielawa": { lat: 50.6897, lon: 16.6224 },
  "zgorzelec": { lat: 51.1524, lon: 15.0083 },
  "jawor": { lat: 51.0519, lon: 16.1946 },
  "ząbkowice śląskie": { lat: 50.5879, lon: 16.8136 },
  "strzelin": { lat: 50.7819, lon: 17.0662 },
  "trzebnica": { lat: 51.3099, lon: 17.0623 },
  "środa śląska": { lat: 51.1648, lon: 16.5932 },
  "sobótka": { lat: 50.9329, lon: 16.7433 },
  "strzegom": { lat: 50.9604, lon: 16.3489 },
  "kamienna góra": { lat: 50.7806, lon: 16.0316 },
  "kudowa-zdrój": { lat: 50.4432, lon: 16.2432 },
  "polanica-zdrój": { lat: 50.4076, lon: 16.5124 },
  "nowa ruda": { lat: 50.5831, lon: 16.4969 },
  "bystrzyca kłodzka": { lat: 50.2979, lon: 16.6502 },
  "lądek-zdrój": { lat: 50.3440, lon: 16.8779 },
  "bardo": { lat: 50.5108, lon: 16.7402 },
  "siechnice": { lat: 51.0311, lon: 17.1475 },
  "kobierzyce": { lat: 51.0158, lon: 16.9294 },
  "kąty wrocławskie": { lat: 51.0324, lon: 16.7654 },
  "brzeg dolny": { lat: 51.2711, lon: 16.7127 },
  "oborniki śląskie": { lat: 51.3043, lon: 16.9160 },
  "żmigród": { lat: 51.4732, lon: 16.9135 },
  "milicz": { lat: 51.5371, lon: 17.2877 },
  "syców": { lat: 51.3073, lon: 17.7182 },
  "twardogóra": { lat: 51.3621, lon: 17.4538 },
  "bierutów": { lat: 51.1333, lon: 17.7411 },
  "namysłów": { lat: 51.0772, lon: 17.7222 },
  "kluczbork": { lat: 50.9734, lon: 18.2177 },
  "dobroszyce": { lat: 51.2673, lon: 17.3181 },
  "długołęka": { lat: 51.1869, lon: 17.2004 },
  "czernica": { lat: 51.0532, lon: 17.2527 },
  "święta katarzyna": { lat: 51.0602, lon: 17.1503 },
  "żórawina": { lat: 50.9982, lon: 17.0507 },
  "jordanów śląski": { lat: 50.8826, lon: 16.8637 },
  "mietków": { lat: 50.9508, lon: 16.6328 },
};

export function StreetAutocomplete({
  value,
  onChange,
  city,
  placeholder = "Wpisz nazwę ulicy...",
  disabled,
  className,
}: StreetAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<StreetSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Clear suggestions when city changes
  useEffect(() => {
    setSuggestions([]);
  }, [city]);

  const fetchSuggestions = async (query: string) => {
    if (query.length < 3 || !city) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const allStreets: StreetSuggestion[] = [];
      
      // Get city coordinates for better results
      const cityLower = city.toLowerCase();
      const coords = CITY_COORDS[cityLower] || { lat: 51.1079, lon: 17.0385 }; // Default to Wrocław
      
      // Use Photon API (Komoot) - better for autocomplete
      // Search with location bias towards the city
      const photonResponse = await fetch(
        `https://photon.komoot.io/api/?` +
          new URLSearchParams({
            q: `${query} ${city}`,
            lat: coords.lat.toString(),
            lon: coords.lon.toString(),
            limit: "20",
            lang: "pl",
            osm_tag: "highway",
          })
      );

      if (photonResponse.ok) {
        const data = await photonResponse.json();
        
        if (data.features) {
          data.features.forEach((feature: any) => {
            const props = feature.properties;
            const streetName = props.name || props.street;
            
            if (!streetName) return;
            
            // Check if it's in the right city
            const featureCity = (props.city || props.town || props.village || "").toLowerCase();
            const matchesCity = featureCity.includes(cityLower) || 
                               cityLower.includes(featureCity) ||
                               featureCity === "" ||
                               props.state?.toLowerCase().includes("dolnośląskie");
            
            if (!matchesCity) return;
            
            // Check if the street name contains the query (partial match)
            const streetLower = streetName.toLowerCase();
            const queryLower = query.toLowerCase();
            
            // Match if any word in the street name starts with or contains the query
            const words = streetLower.split(/\s+/);
            const queryWords = queryLower.split(/\s+/);
            
            const matches = queryWords.every(qw => 
              words.some(w => w.includes(qw) || qw.includes(w))
            ) || streetLower.includes(queryLower);
            
            if (matches) {
              allStreets.push({
                name: streetName,
                fullName: `${streetName}, ${props.city || props.town || props.village || city}`,
              });
            }
          });
        }
      }

      // Also try Nominatim with multiple search variations for better coverage
      const searchVariations = [
        `ulica ${query}, ${city}`,
        `${query}, ${city}`,
        `plac ${query}, ${city}`,
        `aleja ${query}, ${city}`,
      ];

      for (const searchQuery of searchVariations) {
        try {
          const nominatimResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?` +
              new URLSearchParams({
                q: searchQuery,
                format: "json",
                addressdetails: "1",
                limit: "10",
                countrycodes: "pl",
                "accept-language": "pl",
              }),
            {
              headers: {
                "User-Agent": "ZlecenieTeraz/1.0",
              },
            }
          );

          if (nominatimResponse.ok) {
            const data = await nominatimResponse.json();

            data.forEach((item: any) => {
              const streetName = item.address?.road || 
                                item.address?.pedestrian || 
                                item.address?.footway ||
                                item.address?.square ||
                                item.address?.neighbourhood;
              
              if (!streetName) return;

              const resultCity = (
                item.address?.city ||
                item.address?.town ||
                item.address?.village ||
                item.address?.municipality ||
                ""
              ).toLowerCase();

              const matchesCity = resultCity.includes(cityLower) || 
                                 cityLower.includes(resultCity) ||
                                 resultCity === "";

              if (!matchesCity) return;

              // Check partial match
              const streetLower = streetName.toLowerCase();
              const queryLower = query.toLowerCase();
              
              if (streetLower.includes(queryLower) || 
                  queryLower.split(/\s+/).some(w => streetLower.includes(w))) {
                allStreets.push({
                  name: streetName,
                  fullName: item.display_name,
                });
              }
            });
          }
        } catch (e) {
          // Ignore individual query errors
        }
      }

      // Remove duplicates and sort by relevance
      const queryLower = query.toLowerCase();
      const uniqueStreets = allStreets
        .filter(
          (item, index, self) =>
            index === self.findIndex((t) => t.name.toLowerCase() === item.name.toLowerCase())
        )
        .sort((a, b) => {
          const aLower = a.name.toLowerCase();
          const bLower = b.name.toLowerCase();
          
          // Exact match first
          if (aLower === queryLower && bLower !== queryLower) return -1;
          if (bLower === queryLower && aLower !== queryLower) return 1;
          
          // Starts with query
          const aStarts = aLower.startsWith(queryLower);
          const bStarts = bLower.startsWith(queryLower);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          
          // Contains query word
          const aContainsWord = aLower.split(/\s+/).some(w => w.startsWith(queryLower));
          const bContainsWord = bLower.split(/\s+/).some(w => w.startsWith(queryLower));
          if (aContainsWord && !bContainsWord) return -1;
          if (!aContainsWord && bContainsWord) return 1;
          
          // Alphabetical
          return a.name.localeCompare(b.name, "pl");
        })
        .slice(0, 10);

      setSuggestions(uniqueStreets);
    } catch (error) {
      console.error("Error fetching street suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);

    // Clear filter if input is empty
    if (newValue === "") {
      onChange("");
    }

    // Debounce API calls for suggestions
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 250);
  };

  const handleSelect = (street: StreetSuggestion) => {
    setInputValue(street.name);
    onChange(street.name);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleBlur = () => {
    // Delay to allow click on suggestion
    setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => inputValue.length >= 3 && setIsOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || !city}
          className="h-11 rounded-xl pr-8"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <MapPin className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {suggestions.map((street, index) => (
            <li
              key={`${street.name}-${index}`}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(street);
              }}
              className={cn(
                "px-3 py-2 cursor-pointer flex items-center gap-2 text-sm",
                highlightedIndex === index
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted"
              )}
            >
              <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="font-medium">{street.name}</span>
            </li>
          ))}
        </ul>
      )}

      {isOpen &&
        inputValue.length >= 3 &&
        !isLoading &&
        suggestions.length === 0 && (
          <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-lg p-3 text-sm text-muted-foreground">
            Nie znaleziono ulic pasujących do "{inputValue}" w mieście {city}
          </div>
        )}
    </div>
  );
}
