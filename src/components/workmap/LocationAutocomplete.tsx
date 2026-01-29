import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Street {
  id: number;
  name: string;
  type?: string;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string, coords?: { lat: number; lng: number }) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

const GEOPORTAL_BASE = "https://geoportal.wroclaw.pl/rest/rest";
const AUTH_HEADER = "Basic " + btoa("dostep@publiczny:publiczny");

export function LocationAutocomplete({
  value,
  onChange,
  label = "Ulica",
  placeholder = "Wpisz nazwę ulicy...",
  className,
}: LocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<Street[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStreets = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${GEOPORTAL_BASE}/streets/byphrase/0/15/${encodeURIComponent(query)}.json`,
        {
          headers: {
            Authorization: AUTH_HEADER,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Handle different response formats
      let streets: Street[] = [];
      if (Array.isArray(data)) {
        streets = data.map((item: any, index: number) => ({
          id: item.id || index,
          name: item.name || item.streetName || item.nazwa || String(item),
          type: item.type || item.streetType,
        }));
      } else if (data.streets) {
        streets = data.streets;
      }

      setSuggestions(streets.slice(0, 10));
      setIsOpen(streets.length > 0);
    } catch (err) {
      console.error("Error fetching streets:", err);
      setError("Nie udało się pobrać listy ulic");
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchStreets(inputValue);
    }, 150);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [inputValue, fetchStreets]);

  // Sync external value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setHighlightedIndex(-1);
    onChange(newValue);
  };

  const handleSelect = (street: Street) => {
    setInputValue(street.name);
    onChange(street.name);
    setIsOpen(false);
    setSuggestions([]);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  const handleClear = () => {
    setInputValue("");
    onChange("");
    setSuggestions([]);
    inputRef.current?.focus();
  };

  // Highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <span key={i} className="font-semibold text-primary">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className={cn("relative", className)}>
      {label && (
        <Label className="mb-2 block font-medium">{label}</Label>
      )}
      
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>
        
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={placeholder}
          className="pl-10 pr-10 input-focus"
          autoComplete="off"
        />
        
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-xl shadow-lg overflow-hidden"
        >
          {suggestions.map((street, index) => (
            <li
              key={street.id}
              onClick={() => handleSelect(street)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
                highlightedIndex === index
                  ? "bg-primary/10 text-foreground"
                  : "hover:bg-secondary/50"
              )}
            >
              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {highlightMatch(street.name, inputValue)}
                </div>
                {street.type && (
                  <div className="text-xs text-muted-foreground">
                    {street.type}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Error message */}
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}

      {/* No results */}
      {isOpen && !isLoading && inputValue.length >= 2 && suggestions.length === 0 && !error && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-xl shadow-lg p-4 text-center text-muted-foreground text-sm">
          Nie znaleziono ulic pasujących do "{inputValue}"
        </div>
      )}
    </div>
  );
}
