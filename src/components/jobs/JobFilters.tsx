import { useState, useEffect, memo } from "react";
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
	Users,
	Calendar,
} from "lucide-react";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { CategorySelect } from "./CategorySelect";
import { TimePicker } from "@/components/ui/time-picker";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

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
	startDate: string;
	endDate: string;
	startDateTbd: boolean; // Filter for "Do ustalenia" jobs
	sortBy: "newest" | "budget_high" | "start_soon";
}

export const JobFilters = memo(function JobFilters({ onFiltersChange }: JobFiltersProps) {
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
		startDate: "",
		endDate: "",
		startDateTbd: false,
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
			startDate: "",
			endDate: "",
			startDateTbd: false,
			sortBy: "newest",
		};
		setFilters(cleared);
		onFiltersChange(cleared);
	};

	const hasActiveFilters =
		filters.category_id ||
		filters.urgent ||
		filters.groupOnly ||
		filters.startDate ||
		filters.endDate ||
		filters.startDateTbd;

	const FilterContent = () => (
		<div className="space-y-5">
			<div className="space-y-2">
				<Label className="font-medium">Kategoria</Label>
				<CategorySelect
					value={filters.category_id}
					onChange={(v) => updateFilter("category_id", v)}
					placeholder="Wszystkie kategorie"
				/>
				{filters.category_id && (
					<Button
						variant="ghost"
						size="sm"
						className="text-xs h-6 px-2"
						onClick={() => updateFilter("category_id", "")}
					>
						<X className="h-3 w-3 mr-1" />
						Wyczyść kategorię
					</Button>
				)}
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

			{/* Date filters */}
			<div className="space-y-4 p-4 rounded-xl border bg-muted/30">
				<div className="flex items-center gap-2">
					<Calendar className="h-4 w-4 text-primary" />
					<Label className="font-medium">Filtruj po dacie rozpoczęcia</Label>
				</div>

				{/* "Do ustalenia" filter */}
				<div className="flex items-center justify-between py-2 border-b border-border/50">
					<Label className="font-medium text-orange-600 dark:text-orange-400">Tylko "Do ustalenia"</Label>
					<Switch
						checked={filters.startDateTbd}
						onCheckedChange={(v) => {
							updateFilter("startDateTbd", v);
							// Clear date filters when selecting "Do ustalenia"
							if (v) {
								updateFilter("startDate", "");
								updateFilter("endDate", "");
							}
						}}
					/>
				</div>

				{!filters.startDateTbd && (
					<>
						<div className="space-y-2">
							<Label className="text-sm text-muted-foreground">Od daty</Label>
							<div className="flex gap-2">
								<Popover>
									<PopoverTrigger asChild>
										<Button variant="outline" className="flex-1 h-10 rounded-xl justify-start text-left font-normal">
											{filters.startDate ? (
												format(new Date(filters.startDate), "dd.MM.yyyy")
											) : (
												<span className="text-muted-foreground">Wybierz datę</span>
											)}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="start">
										<CalendarComponent
											mode="single"
											selected={filters.startDate ? new Date(filters.startDate) : undefined}
											onSelect={(date) => updateFilter("startDate", date ? date.toISOString() : "")}
											className="pointer-events-auto"
										/>
									</PopoverContent>
								</Popover>
								{filters.startDate && (
									<Button
										variant="ghost"
										size="icon"
										className="h-10 w-10 shrink-0 rounded-xl"
										onClick={() => updateFilter("startDate", "")}
									>
										<X className="h-4 w-4" />
									</Button>
								)}
							</div>
						</div>

						<div className="space-y-2">
							<Label className="text-sm text-muted-foreground">Do daty</Label>
							<div className="flex gap-2">
								<Popover>
									<PopoverTrigger asChild>
										<Button variant="outline" className="flex-1 h-10 rounded-xl justify-start text-left font-normal">
											{filters.endDate ? (
												format(new Date(filters.endDate), "dd.MM.yyyy")
											) : (
												<span className="text-muted-foreground">Wybierz datę</span>
											)}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="start">
										<CalendarComponent
											mode="single"
											selected={filters.endDate ? new Date(filters.endDate) : undefined}
											onSelect={(date) => updateFilter("endDate", date ? date.toISOString() : "")}
											className="pointer-events-auto"
										/>
									</PopoverContent>
								</Popover>
								{filters.endDate && (
									<Button
										variant="ghost"
										size="icon"
										className="h-10 w-10 shrink-0 rounded-xl"
										onClick={() => updateFilter("endDate", "")}
									>
										<X className="h-4 w-4" />
									</Button>
								)}
							</div>
						</div>
					</>
				)}
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
					<SheetContent side="bottom" className="h-[85vh] rounded-t-3xl flex flex-col">
						<SheetHeader className="flex-shrink-0">
							<SheetTitle className="font-display">Filtry</SheetTitle>
						</SheetHeader>
						<div className="flex-1 mt-6 overflow-y-auto pb-4 -mx-6 px-6">
							<FilterContent />
						</div>
						{/* Search button for mobile */}
						<div className="flex-shrink-0 pt-4 border-t border-border/50 -mx-6 px-6 pb-2">
							<Button 
								className="w-full h-12 rounded-xl gap-2"
								onClick={() => setMobileOpen(false)}
							>
								<Search className="h-4 w-4" />
								Wyszukaj
							</Button>
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
});
