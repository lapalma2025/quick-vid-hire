import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { DOLNOSLASKIE_CITIES } from "@/lib/constants";
import { useSearchCache } from "@/hooks/useSearchCache";

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

const MIN_CHARS = 3;
const DEBOUNCE_MS = 150;

const normalizePl = (input: string) =>
  input
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ł/g, "l")
    .replace(/\s+/g, " ")
    .trim();

const scoreCandidate = (queryRaw: string, candidateRaw: string) => {
  const q = normalizePl(queryRaw);
  const c = normalizePl(candidateRaw);
  if (!q || !c) return 0;

  if (c === q) return 1000;
  if (c.startsWith(q)) return 900;
  if (c.includes(` ${q}`)) return 850;
  if (c.includes(q)) return 800;

  const qTokens = q.split(" ").filter(Boolean);
  const cTokens = c.split(" ").filter(Boolean);

  let tokenScore = 0;
  for (const qt of qTokens) {
    let best = 0;
    for (const ct of cTokens) {
      if (ct.startsWith(qt)) best = Math.max(best, 700 - Math.min(50, ct.length - qt.length));
      else if (ct.includes(qt)) best = Math.max(best, 600);
      else if (qt.includes(ct)) best = Math.max(best, 450);
    }
    tokenScore += best;
  }

  return tokenScore - Math.min(100, c.length);
};

const getCityCoords = (city: string): { lat: number; lng: number } | null => {
  if (!city) return null;
  const direct = (DOLNOSLASKIE_CITIES as any)[city] as { lat: number; lng: number } | undefined;
  if (direct) return direct;

  const cityNorm = normalizePl(city);
  const matchKey = Object.keys(DOLNOSLASKIE_CITIES).find((k) => normalizePl(k) === cityNorm);
  if (!matchKey) return null;
  return (DOLNOSLASKIE_CITIES as any)[matchKey] as { lat: number; lng: number };
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
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  
  const cache = useSearchCache<StreetSuggestion[]>(50);

  const cityNorm = useMemo(() => normalizePl(city || ""), [city]);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Clear suggestions and cache when city changes
  useEffect(() => {
    abortRef.current?.abort();
    setSuggestions([]);
  }, [city]);

  const updateDropdownRect = () => {
    const el = inputRef.current;
    if (!el) return;
    setDropdownRect(el.getBoundingClientRect());
  };

  useEffect(() => {
    if (!isOpen) return;
    updateDropdownRect();

    window.addEventListener("scroll", updateDropdownRect, true);
    window.addEventListener("resize", updateDropdownRect);
    return () => {
      window.removeEventListener("scroll", updateDropdownRect, true);
      window.removeEventListener("resize", updateDropdownRect);
    };
  }, [isOpen, inputValue, suggestions.length]);

  const fetchSuggestions = async (queryRaw: string) => {
    const query = queryRaw.trim().replace(/\s+/g, " ");

    if (query.length < MIN_CHARS || !city) {
      setSuggestions([]);
      return;
    }

    // Check cache first
    const cacheKey = `street:${cityNorm}:${normalizePl(query)}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      setSuggestions(cached);
      setIsOpen(cached.length > 0);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = ++requestIdRef.current;

    setIsLoading(true);

    try {
      const coords = getCityCoords(city);
      const candidates: StreetSuggestion[] = [];
      let hasResults = false;

      // 1) Photon (fast autocomplete) - prioritized
      const photonParams = new URLSearchParams();
      photonParams.set("q", query);
      photonParams.set("limit", "30");
      photonParams.set("lang", "default");
      if (coords) {
        photonParams.set("lat", String(coords.lat));
        photonParams.set("lon", String(coords.lng));
      }
      photonParams.append("layer", "street");

      const photonUrl = `https://photon.komoot.io/api/?${photonParams.toString()}`;

      // Photon first - show results immediately
      const photonPromise = fetch(photonUrl, { signal: controller.signal })
        .then(async (res) => {
          if (!res.ok) return;
          const data = await res.json();
          
          for (const feature of data?.features ?? []) {
            const props = feature?.properties ?? {};
            const name = props.name;
            if (!name) continue;

            const placeCity = props.city || props.town || props.village || props.locality || "";
            const placeCityNorm = normalizePl(placeCity);

            if (placeCityNorm && cityNorm && !placeCityNorm.includes(cityNorm) && !cityNorm.includes(placeCityNorm)) {
              continue;
            }

            candidates.push({
              name,
              fullName: [name, placeCity || city].filter(Boolean).join(", "),
            });
          }
          
          // Show results immediately
          if (requestId === requestIdRef.current && candidates.length > 0 && !hasResults) {
            hasResults = true;
            const ranked = rankResults(candidates, query);
            setSuggestions(ranked);
            setIsOpen(ranked.length > 0);
          }
        })
        .catch(() => {});

      // 2) Nominatim queries (fallback/enrichment)
      const nominatimQ = new URLSearchParams({
        q: `${query}, ${city}, Polska`,
        format: "json",
        addressdetails: "1",
        limit: "20",
        countrycodes: "pl",
        "accept-language": "pl",
        dedupe: "1",
      });

      const nominatimStructured = new URLSearchParams({
        street: query,
        city,
        country: "Polska",
        format: "json",
        addressdetails: "1",
        limit: "20",
        countrycodes: "pl",
        "accept-language": "pl",
      });

      const consumeNominatim = async (res: Response) => {
        const data = await res.json();
        if (!Array.isArray(data)) return;

        for (const item of data) {
          const addr = item?.address ?? {};
          const name =
            addr.road ||
            addr.pedestrian ||
            addr.footway ||
            addr.square ||
            item?.name ||
            null;
          if (!name) continue;

          const resultCity = addr.city || addr.town || addr.village || addr.municipality || "";
          const resultCityNorm = normalizePl(resultCity);

          if (resultCityNorm && cityNorm && !resultCityNorm.includes(cityNorm) && !cityNorm.includes(resultCityNorm)) {
            continue;
          }

          candidates.push({ name, fullName: item.display_name || name });
        }
      };

      const nom1Promise = fetch(`https://nominatim.openstreetmap.org/search?${nominatimQ.toString()}`, {
        signal: controller.signal,
      })
        .then(async (res) => {
          if (res.ok) await consumeNominatim(res);
          
          // Show results if Photon didn't have any
          if (requestId === requestIdRef.current && candidates.length > 0 && !hasResults) {
            hasResults = true;
            const ranked = rankResults(candidates, query);
            setSuggestions(ranked);
            setIsOpen(ranked.length > 0);
          }
        })
        .catch(() => {});

      const nom2Promise = fetch(`https://nominatim.openstreetmap.org/search?${nominatimStructured.toString()}`, {
        signal: controller.signal,
      })
        .then(async (res) => {
          if (res.ok) await consumeNominatim(res);
        })
        .catch(() => {});

      // Wait for all, then merge and cache
      await Promise.allSettled([photonPromise, nom1Promise, nom2Promise]);

      if (requestId !== requestIdRef.current) return;

      const ranked = rankResults(candidates, query);
      setSuggestions(ranked);
      setIsOpen(ranked.length > 0 || inputValue.length >= MIN_CHARS);
      
      // Cache results
      cache.set(cacheKey, ranked);
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        console.error("Error fetching street suggestions:", error);
      }
      if (requestId === requestIdRef.current) setSuggestions([]);
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  };

  const rankResults = (candidates: StreetSuggestion[], query: string): StreetSuggestion[] => {
    const uniqueByName = new Map<string, StreetSuggestion>();
    for (const c of candidates) {
      const key = normalizePl(c.name);
      if (!key) continue;
      if (!uniqueByName.has(key)) uniqueByName.set(key, c);
    }

    return Array.from(uniqueByName.values())
      .map((c) => ({ c, score: scoreCandidate(query, c.name) }))
      .filter((x) => x.score >= 300)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((x) => x.c);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);

    if (newValue === "") {
      onChange("");
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      fetchSuggestions(newValue);
    }, DEBOUNCE_MS);
  };

  const handleSelect = (street: StreetSuggestion) => {
    setInputValue(street.name);
    onChange(street.name);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleBlur = () => {
    setTimeout(() => setIsOpen(false), 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "Enter") e.preventDefault();
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) handleSelect(suggestions[highlightedIndex]);
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  const dropdown =
    isOpen &&
    inputValue.length >= MIN_CHARS &&
    dropdownRect &&
    createPortal(
      <div
        style={{
          position: "fixed",
          top: dropdownRect.bottom + 4,
          left: dropdownRect.left,
          width: dropdownRect.width,
          zIndex: 1000,
        }}
      >
        {suggestions.length > 0 ? (
          <ul
            ref={listRef}
            className="bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto"
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
                <div className="min-w-0">
                  <div className="font-medium truncate">{street.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{street.fullName}</div>
                </div>
              </li>
            ))}
          </ul>
        ) : !isLoading ? (
          <div className="bg-popover border border-border rounded-md shadow-lg p-3 text-sm text-muted-foreground">
            Nie znaleziono dopasowań dla „{inputValue}" w mieście {city}
          </div>
        ) : null}
      </div>,
      document.body
    );

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => inputValue.length >= MIN_CHARS && setIsOpen(true)}
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

      {dropdown}
    </div>
  );
}
