import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface CitySuggestion {
  display_name: string;
  name: string;
  region: string;
}

export function CityAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Wpisz nazwę miejscowości...",
  disabled,
  className
}: CityAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Use Nominatim API - search for places in Poland
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` + 
        new URLSearchParams({
          q: `${query}, Polska`,
          format: 'json',
          addressdetails: '1',
          limit: '10',
          countrycodes: 'pl',
          'accept-language': 'pl'
        }),
        {
          headers: {
            'User-Agent': 'ZlecenieTeraz/1.0'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        
        // Extract city/town names from results
        const cities = data
          .map((item: any) => {
            // Get city name from address details
            const cityName = item.address?.city || 
                           item.address?.town || 
                           item.address?.village ||
                           item.address?.municipality ||
                           (item.type === 'city' || item.type === 'town' || item.type === 'village' ? item.name : null);
            
            if (!cityName) return null;
            
            const wojewodztwo = item.address?.state?.replace('województwo ', '') || '';
            
            return {
              display_name: item.display_name,
              name: cityName,
              region: wojewodztwo
            };
          })
          .filter((item: CitySuggestion | null): item is CitySuggestion => item !== null)
          // Remove duplicates by city name
          .filter((item: CitySuggestion, index: number, self: CitySuggestion[]) => 
            index === self.findIndex(t => t.name.toLowerCase() === item.name.toLowerCase())
          )
          // Sort by relevance (exact match first, then starts with, then contains)
          .sort((a: CitySuggestion, b: CitySuggestion) => {
            const queryLower = query.toLowerCase();
            const aLower = a.name.toLowerCase();
            const bLower = b.name.toLowerCase();
            
            if (aLower === queryLower) return -1;
            if (bLower === queryLower) return 1;
            if (aLower.startsWith(queryLower) && !bLower.startsWith(queryLower)) return -1;
            if (bLower.startsWith(queryLower) && !aLower.startsWith(queryLower)) return 1;
            return 0;
          })
          .slice(0, 8);
          
        setSuggestions(cities);
      }
    } catch (error) {
      console.error('Error fetching city suggestions:', error);
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

    // Debounce API calls
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  const handleSelect = (city: CitySuggestion) => {
    setInputValue(city.name);
    onChange(city.name);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleBlur = () => {
    // Delay to allow click on suggestion
    setTimeout(() => {
      setIsOpen(false);
      if (inputValue !== value) {
        onChange(inputValue);
      }
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        onChange(inputValue);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(suggestions[highlightedIndex]);
        } else {
          onChange(inputValue);
          setIsOpen(false);
        }
        break;
      case 'Escape':
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
          onFocus={() => inputValue.length >= 2 && setIsOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-8"
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
          {suggestions.map((city, index) => (
            <li
              key={`${city.name}-${index}`}
              onClick={() => handleSelect(city)}
              className={cn(
                "px-3 py-2 cursor-pointer flex items-center gap-2 text-sm",
                highlightedIndex === index 
                  ? "bg-accent text-accent-foreground" 
                  : "hover:bg-muted"
              )}
            >
              <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium">{city.name}</p>
                {city.region && (
                  <p className="text-xs text-muted-foreground">{city.region}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      
      {isOpen && inputValue.length >= 2 && !isLoading && suggestions.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-lg p-3 text-sm text-muted-foreground">
          Nie znaleziono. Wpisana wartość zostanie użyta: <strong>{inputValue}</strong>
        </div>
      )}
    </div>
  );
}
