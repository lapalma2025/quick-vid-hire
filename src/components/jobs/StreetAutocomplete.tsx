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
  display_name: string;
}

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
    if (query.length < 2 || !city) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Use Nominatim API - search for streets in the specified city
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          new URLSearchParams({
            q: `${query}, ${city}, Polska`,
            format: "json",
            addressdetails: "1",
            limit: "20",
            countrycodes: "pl",
            "accept-language": "pl",
            dedupe: "1",
          }),
        {
          headers: {
            "User-Agent": "ZlecenieTeraz/1.0",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Extract street names from results
        const streets = data
          .map((item: any) => {
            // Get street name from address details
            const streetName = item.address?.road || item.address?.pedestrian || item.address?.footway;
            
            if (!streetName) return null;

            // Check if the result is in the correct city
            const resultCity = (
              item.address?.city ||
              item.address?.town ||
              item.address?.village ||
              item.address?.municipality ||
              ""
            ).toLowerCase();

            if (!resultCity.includes(city.toLowerCase()) && !city.toLowerCase().includes(resultCity)) {
              return null;
            }

            return {
              name: streetName,
              display_name: item.display_name,
            };
          })
          .filter(
            (item: StreetSuggestion | null): item is StreetSuggestion =>
              item !== null
          )
          // Remove duplicates by street name
          .filter(
            (item: StreetSuggestion, index: number, self: StreetSuggestion[]) =>
              index ===
              self.findIndex(
                (t) => t.name.toLowerCase() === item.name.toLowerCase()
              )
          )
          // Filter to show streets that contain the query (case insensitive)
          .filter((item: StreetSuggestion) =>
            item.name.toLowerCase().includes(query.toLowerCase())
          )
          // Sort: streets starting with query first, then alphabetically
          .sort((a: StreetSuggestion, b: StreetSuggestion) => {
            const aStarts = a.name.toLowerCase().startsWith(query.toLowerCase());
            const bStarts = b.name.toLowerCase().startsWith(query.toLowerCase());
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            return a.name.localeCompare(b.name, "pl");
          })
          .slice(0, 8);

        setSuggestions(streets);
      }
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
    }, 300);
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
          onFocus={() => inputValue.length >= 2 && setIsOpen(true)}
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
        inputValue.length >= 2 &&
        !isLoading &&
        suggestions.length === 0 && (
          <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-lg p-3 text-sm text-muted-foreground">
            Nie znaleziono ulic pasujących do "{inputValue}" w mieście {city}
          </div>
        )}
    </div>
  );
}
