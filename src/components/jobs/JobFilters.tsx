import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import {
	Search,
	X,
	SlidersHorizontal,
	MapPin,
	Globe,
	Users,
} from "lucide-react";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { WojewodztwoSelect } from "./WojewodztwoSelect";
import { CityAutocomplete } from "./CityAutocomplete";
import { CountrySelect } from "./CountrySelect";
import { ForeignCitySelect } from "./ForeignCitySelect";
import { DateTimePicker } from "../ui/date-time-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";
import { WOJEWODZTWA } from "@/lib/constants";

interface Category {
	id: string;
	name: string;
}

interface JobFiltersProps {
	onFiltersChange: (filters: JobFilters) => void;
}

export interface JobFilters {
	search: string;
	locationType: "all" | "poland" | "foreign";
	wojewodztwo: string;
	miasto: string;
	country: string;
	category_id: string;
	urgent: boolean;
	groupOnly: boolean;
	availableAt: string;
	sortBy: "newest" | "budget_high" | "start_soon";
}

export const JobFilters = ({ onFiltersChange }: JobFiltersProps) => {
	const [categories, setCategories] = useState<Category[]>([]);
	const [filters, setFilters] = useState<JobFilters>({
		search: "",
		locationType: "all",
		wojewodztwo: "",
		miasto: "",
		country: "",
		category_id: "",
		urgent: false,
		groupOnly: false,
		availableAt: "",
		sortBy: "newest",
	});
	const [mobileOpen, setMobileOpen] = useState(false);

	useEffect(() => {
		const fetchCategories = async () => {
			const { data } = await supabase
				.from("categories")
				.select("id, name")
				.order("name");
			if (data) setCategories(data);
		};
		fetchCategories();
	}, []);

	const updateFilter = (key: keyof JobFilters, value: any) => {
		const newFilters = { ...filters, [key]: value };
		if (key === "wojewodztwo") {
			newFilters.miasto = "";
		}
		if (key === "country") {
			newFilters.miasto = "";
		}
		if (key === "locationType") {
			newFilters.wojewodztwo = "";
			newFilters.miasto = "";
			newFilters.country = "";
		}
		setFilters(newFilters);
		onFiltersChange(newFilters);
	};

	const clearFilters = () => {
		const cleared: JobFilters = {
			search: "",
			locationType: "all",
			wojewodztwo: "",
			miasto: "",
			country: "",
			category_id: "",
			urgent: false,
			groupOnly: false,
			availableAt: "",
			sortBy: "newest",
		};
		setFilters(cleared);
		onFiltersChange(cleared);
	};

	const hasActiveFilters =
		filters.locationType !== "all" ||
		filters.wojewodztwo ||
		filters.miasto ||
		filters.country ||
		filters.category_id ||
		filters.urgent ||
		filters.groupOnly ||
		filters.availableAt;

	const LocationTypeSelector = () => (
		<div className="grid grid-cols-3 gap-2">
			{[
				{ value: "all", label: "Wszystko", icon: null },
				{ value: "poland", label: "Polska", icon: MapPin },
				{ value: "foreign", label: "Zagranica", icon: Globe },
			].map((item) => (
				<button
					key={item.value}
					type="button"
					onClick={() => updateFilter("locationType", item.value)}
					className={cn(
						"flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
						filters.locationType === item.value
							? "bg-primary text-primary-foreground shadow-lg"
							: "bg-muted/50 text-muted-foreground hover:bg-muted"
					)}
				>
					{item.icon && <item.icon className="h-4 w-4 flex-shrink-0" />}
					<span>{item.label}</span>
				</button>
			))}
		</div>
	);

	const FilterContent = () => (
		<div className="space-y-5">
			{/* Location type */}
			<div className="space-y-2">
				<Label className="font-medium">Lokalizacja</Label>
				<LocationTypeSelector />
			</div>

			{/* All/Poland location search */}
			{(filters.locationType === "all" || filters.locationType === "poland") && (
				<div className="space-y-4 animate-fade-in">
					<div className="space-y-2">
						<Label className="font-medium">Województwo</Label>
						<WojewodztwoSelect
							value={filters.wojewodztwo}
							onChange={(v) => updateFilter("wojewodztwo", v)}
						/>
					</div>

					<div className="space-y-2">
						<Label className="font-medium">Miasto</Label>
						<CityAutocomplete
							value={filters.miasto}
							onChange={(miasto, region) => {
								// Update both miasto and wojewodztwo in one go
								const normalizedRegion = region?.toLowerCase();
								const matchedWojewodztwo = normalizedRegion
									? WOJEWODZTWA.find((w) => w.toLowerCase() === normalizedRegion)
									: undefined;
								
								const newFilters = {
									...filters,
									miasto,
									...(matchedWojewodztwo && { wojewodztwo: matchedWojewodztwo }),
								};
								setFilters(newFilters);
								onFiltersChange(newFilters);
							}}
							placeholder="Wpisz miasto..."
						/>
					</div>
				</div>
			)}

			{/* Note: Polish filters are now merged with "all" above */}

			{/* Foreign filters */}
			{filters.locationType === "foreign" && (
				<div className="space-y-4 animate-fade-in">
					<div className="space-y-2">
						<Label className="font-medium">Kraj</Label>
						<CountrySelect
							value={filters.country}
							onChange={(v) => updateFilter("country", v)}
						/>
					</div>

					<div className="space-y-2">
						<Label className="font-medium">Miasto</Label>
						<ForeignCitySelect
							country={filters.country}
							value={filters.miasto}
							onChange={(v) => updateFilter("miasto", v)}
							disabled={!filters.country}
						/>
					</div>
				</div>
			)}

			<div className="space-y-2">
				<Label className="font-medium">Kategoria</Label>
				<Select
					value={filters.category_id || "__all__"}
					onValueChange={(v) =>
						updateFilter("category_id", v === "__all__" ? "" : v)
					}
				>
					<SelectTrigger className="h-11 rounded-xl">
						<SelectValue placeholder="Wszystkie kategorie" />
					</SelectTrigger>
					<SelectContent className="bg-popover border border-border shadow-xl rounded-xl">
						<SelectItem value="__all__">Wszystkie kategorie</SelectItem>
						{categories.map((c) => (
							<SelectItem key={c.id} value={c.id}>
								{c.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="flex items-center justify-between py-2">
				<Label className="font-medium">Tylko pilne</Label>
				<Switch
					checked={filters.urgent}
					onCheckedChange={(v) => updateFilter("urgent", v)}
				/>
			</div>

			<div className="flex items-center justify-between py-2">
				<div className="flex items-center gap-2">
					<Users className="h-4 w-4 text-purple-500" />
					<Label className="font-medium">Tylko grupowe</Label>
				</div>
				<Switch
					checked={filters.groupOnly}
					onCheckedChange={(v) => updateFilter("groupOnly", v)}
				/>
			</div>

			<div className="space-y-2">
				<Label className="font-medium">Godzina rozpoczęcia</Label>
				<TimePicker
					value={filters.availableAt}
					onChange={(v) => updateFilter("availableAt", v)}
					placeholder="Wybierz godzinę"
				/>
				<p className="text-xs text-muted-foreground">
					Lub bez ustalonego terminu
				</p>
			</div>

			<div className="space-y-2">
				<Label className="font-medium">Sortuj</Label>
				<Select
					value={filters.sortBy}
					onValueChange={(v) => updateFilter("sortBy", v as any)}
				>
					<SelectTrigger className="h-11 rounded-xl">
						<SelectValue />
					</SelectTrigger>
					<SelectContent className="bg-popover border border-border shadow-xl rounded-xl">
						<SelectItem value="newest">Najnowsze</SelectItem>
						<SelectItem value="budget_high">Najwyższy budżet</SelectItem>
						<SelectItem value="start_soon">Najbliższy termin</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{hasActiveFilters && (
				<Button
					variant="outline"
					className="w-full rounded-xl"
					onClick={clearFilters}
				>
					<X className="h-4 w-4 mr-2" />
					Wyczyść filtry
				</Button>
			)}
		</div>
	);

	return (
		<div className="space-y-4">
			{/* Search bar */}
			<div className="relative">
				<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
				<Input
					placeholder="Szukaj zleceń..."
					value={filters.search}
					onChange={(e) => updateFilter("search", e.target.value)}
					className="pl-12 h-12 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0"
				/>
			</div>

			{/* Mobile filters */}
			<div className="md:hidden">
				<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
					<SheetTrigger asChild>
						<Button variant="outline" className="w-full gap-2 h-11 rounded-xl">
							<SlidersHorizontal className="h-4 w-4" />
							Filtry
							{hasActiveFilters && (
								<Badge className="ml-1 bg-primary text-primary-foreground">
									!
								</Badge>
							)}
						</Button>
					</SheetTrigger>
					<SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
						<SheetHeader>
							<SheetTitle className="font-display">Filtry</SheetTitle>
						</SheetHeader>
						<div className="mt-6 overflow-y-auto">
							<FilterContent />
						</div>
					</SheetContent>
				</Sheet>
			</div>

			{/* Desktop filters */}
			<div className="hidden md:block bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
				<h3 className="font-display font-bold text-lg mb-5">Filtry</h3>
				<FilterContent />
			</div>
		</div>
	);
};
