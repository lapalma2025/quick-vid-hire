import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchCache } from "@/hooks/useSearchCache";

interface CityAutocompleteProps {
	value: string;
	onChange: (value: string, region?: string) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
}

interface CitySuggestion {
	name: string;
	region: string;
	type: string;
}

const MIN_CHARS = 2;
const DEBOUNCE_MS = 150;

// Dolnośląskie bounding box
const DOLNOSLASKIE_BOUNDS = {
	south: 50.2,
	north: 51.8,
	west: 14.8,
	east: 17.8,
};

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

	return 0;
};

export function CityAutocomplete({
	value,
	onChange,
	placeholder = "Wpisz nazwę miejscowości...",
	disabled,
	className,
}: CityAutocompleteProps) {
	const [inputValue, setInputValue] = useState(value);
	const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);

	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLUListElement>(null);
	const debounceRef = useRef<number | null>(null);
	const abortRef = useRef<AbortController | null>(null);
	const requestIdRef = useRef(0);
	
	const cache = useSearchCache<CitySuggestion[]>(50);

	useEffect(() => {
		setInputValue(value);
	}, [value]);

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

		if (query.length < MIN_CHARS) {
			setSuggestions([]);
			return;
		}

		// Check cache first
		const cacheKey = `city:${normalizePl(query)}`;
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
			// Use Photon API with bounding box for Dolnośląskie
			const photonParams = new URLSearchParams();
			photonParams.set("q", query);
			photonParams.set("limit", "30");
			photonParams.set("lang", "default");
			// Center on Dolnośląskie (Wrocław area)
			photonParams.set("lat", "51.1");
			photonParams.set("lon", "17.0");
			// Search for places (cities, towns, villages)
			photonParams.append("layer", "city");

			const photonUrl = `https://photon.komoot.io/api/?${photonParams.toString()}`;

			// Also use Nominatim with viewbox for better village coverage
			const nominatimParams = new URLSearchParams({
				q: query,
				format: "json",
				addressdetails: "1",
				limit: "30",
				countrycodes: "pl",
				"accept-language": "pl",
				dedupe: "1",
				viewbox: `${DOLNOSLASKIE_BOUNDS.west},${DOLNOSLASKIE_BOUNDS.north},${DOLNOSLASKIE_BOUNDS.east},${DOLNOSLASKIE_BOUNDS.south}`,
				bounded: "1",
			});

			const candidates: CitySuggestion[] = [];
			let hasResults = false;

			// First-response-wins: process whichever API responds first
			const photonPromise = fetch(photonUrl, { signal: controller.signal })
				.then(async (res) => {
					if (!res.ok) return;
					const data = await res.json();
					
					for (const feature of data?.features ?? []) {
						const props = feature?.properties ?? {};
						const coords = feature?.geometry?.coordinates;

						// Check if within Dolnośląskie bounds
						if (coords && coords.length >= 2) {
							const [lng, lat] = coords;
							if (
								lat < DOLNOSLASKIE_BOUNDS.south ||
								lat > DOLNOSLASKIE_BOUNDS.north ||
								lng < DOLNOSLASKIE_BOUNDS.west ||
								lng > DOLNOSLASKIE_BOUNDS.east
							) {
								continue;
							}
						}

						const name = props.name;
						if (!name) continue;

						const state = props.state || "";
						// Only accept dolnośląskie
						if (state && !normalizePl(state).includes("dolnoslaski")) {
							continue;
						}

						const type = props.type || "miejscowość";

						candidates.push({
							name,
							region: "dolnośląskie",
							type,
						});
					}
					
					// Show results immediately if we have any
					if (requestId === requestIdRef.current && candidates.length > 0 && !hasResults) {
						hasResults = true;
						const ranked = rankResults(candidates, query);
						setSuggestions(ranked);
						setIsOpen(ranked.length > 0);
					}
				})
				.catch(() => {});

			const nominatimPromise = fetch(
				`https://nominatim.openstreetmap.org/search?${nominatimParams.toString()}`,
				{
					signal: controller.signal,
					headers: { "User-Agent": "Closey/1.0" },
				}
			)
				.then(async (res) => {
					if (!res.ok) return;
					const data = await res.json();
					
					if (Array.isArray(data)) {
						for (const item of data) {
							const addr = item?.address ?? {};

							// Check if in Dolnośląskie
							const state = addr.state || "";
							if (!normalizePl(state).includes("dolnoslaski")) {
								continue;
							}

							// Get city/town/village name
							const name =
								addr.city ||
								addr.town ||
								addr.village ||
								addr.hamlet ||
								addr.suburb ||
								addr.municipality ||
								item?.name;

							if (!name) continue;

							// Determine type
							let type = "miejscowość";
							if (addr.city) type = "miasto";
							else if (addr.town) type = "miasteczko";
							else if (addr.village) type = "wieś";
							else if (addr.hamlet) type = "przysiółek";

							candidates.push({
								name,
								region: "dolnośląskie",
								type,
							});
						}
					}
					
					// Show results immediately if we have any and nothing shown yet
					if (requestId === requestIdRef.current && candidates.length > 0 && !hasResults) {
						hasResults = true;
						const ranked = rankResults(candidates, query);
						setSuggestions(ranked);
						setIsOpen(ranked.length > 0);
					}
				})
				.catch(() => {});

			// Wait for all to complete, then merge and cache
			await Promise.allSettled([photonPromise, nominatimPromise]);

			if (requestId !== requestIdRef.current) return;

			const ranked = rankResults(candidates, query);
			setSuggestions(ranked);
			setIsOpen(ranked.length > 0 || inputValue.length >= MIN_CHARS);
			
			// Cache results
			cache.set(cacheKey, ranked);
		} catch (error: any) {
			if (error?.name !== "AbortError") {
				console.error("Error fetching city suggestions:", error);
			}
			if (requestId === requestIdRef.current) setSuggestions([]);
		} finally {
			if (requestId === requestIdRef.current) setIsLoading(false);
		}
	};

	const rankResults = (candidates: CitySuggestion[], query: string): CitySuggestion[] => {
		// Deduplicate by normalized name
		const uniqueByName = new Map<string, CitySuggestion>();
		for (const c of candidates) {
			const key = normalizePl(c.name);
			if (!key) continue;
			if (!uniqueByName.has(key)) {
				uniqueByName.set(key, c);
			}
		}

		// Score and sort
		return Array.from(uniqueByName.values())
			.map((c) => ({ c, score: scoreCandidate(query, c.name) }))
			.filter((x) => x.score >= 100)
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

	const handleSelect = (city: CitySuggestion) => {
		setInputValue(city.name);
		onChange(city.name, city.region);
		setIsOpen(false);
		setSuggestions([]);
	};

	const handleBlur = () => {
		setTimeout(() => setIsOpen(false), 150);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!isOpen || suggestions.length === 0) {
			if (e.key === "Enter") {
				e.preventDefault();
				onChange(inputValue);
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
				} else {
					onChange(inputValue);
					setIsOpen(false);
				}
				break;
			case "Escape":
				setIsOpen(false);
				break;
		}
	};

	const getTypeLabel = (type: string) => {
		switch (type) {
			case "city":
			case "miasto":
				return "miasto";
			case "town":
			case "miasteczko":
				return "miasteczko";
			case "village":
			case "wieś":
				return "wieś";
			case "hamlet":
			case "przysiółek":
				return "przysiółek";
			default:
				return "miejscowość";
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
						{suggestions.map((city, index) => (
							<li
								key={`${city.name}-${index}`}
								onMouseDown={(e) => {
									e.preventDefault();
									handleSelect(city);
								}}
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
									<p className="text-xs text-muted-foreground">
										{getTypeLabel(city.type)} • {city.region}
									</p>
								</div>
							</li>
						))}
					</ul>
				) : !isLoading ? (
					<div className="bg-popover border border-border rounded-md shadow-lg p-3 text-sm text-muted-foreground">
						Nie znaleziono miejscowości „{inputValue}" w woj. dolnośląskim
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
					disabled={disabled}
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
