import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { StarRating } from "@/components/ui/star-rating";
import { Input } from "@/components/ui/input";
import {
	MapPin,
	Banknote,
	Loader2,
	Users,
	Filter,
	X,
	Sparkles,
	ArrowRight,
} from "lucide-react";
import gsap from "gsap";
import { WojewodztwoSelect } from "@/components/jobs/WojewodztwoSelect";
import { CityAutocomplete } from "@/components/jobs/CityAutocomplete";
import { WOJEWODZTWA } from "@/lib/constants";

const PAGE_SIZE = 10;

interface Worker {
	id: string;
	name: string | null;
	avatar_url: string | null;
	bio: string | null;
	wojewodztwo: string | null;
	miasto: string | null;
	hourly_rate: number | null;
	rating_avg: number;
	rating_count: number;
	categories: { name: string }[];
	available_from: string | null;
	available_to: string | null;
}

interface Category {
	id: string;
	name: string;
}

export default function Workers() {
	const [workers, setWorkers] = useState<Worker[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [totalCount, setTotalCount] = useState(0);
	const [showFilters, setShowFilters] = useState(true);
	const gridRef = useRef<HTMLDivElement>(null);
	const loadMoreRef = useRef<HTMLDivElement>(null);

	const [filters, setFilters] = useState({
		wojewodztwo: "",
		miasto: "",
		category: "",
		minRate: "",
		maxRate: "",
		minRating: "",
	});

	useEffect(() => {
		fetchCategories();
	}, []);

	// Initial fetch with category filtering
	const fetchWorkers = useCallback(async () => {
		setLoading(true);
		setWorkers([]);
		setHasMore(true);

		try {
			// If category filter is active, first get worker IDs that have this category
			let workerIdsWithCategory: string[] | null = null;

			if (filters.category) {
				const { data: categoryData } = await supabase
					.from("categories")
					.select("id")
					.eq("name", filters.category)
					.maybeSingle();

				if (categoryData) {
					const { data: workerCats } = await supabase
						.from("worker_categories")
						.select("worker_id")
						.eq("category_id", categoryData.id);

					workerIdsWithCategory = workerCats?.map((wc) => wc.worker_id) || [];
				} else {
					// Category not found, return empty
					setWorkers([]);
					setTotalCount(0);
					setHasMore(false);
					setLoading(false);
					return;
				}
			}

			let query = supabase
				.from("profiles")
				.select(
					`id, name, avatar_url, bio, wojewodztwo, miasto, hourly_rate, rating_avg, rating_count, available_from, available_to, worker_categories(category:categories(name))`,
					{ count: "exact" }
			)
			.eq("is_available", true)
			.eq("worker_profile_completed", true);
			// COMMENTED OUT - visibility payment requirement
			// .eq("worker_visibility_paid", true);

			// Apply category filter via worker IDs
			if (workerIdsWithCategory !== null) {
				if (workerIdsWithCategory.length === 0) {
					setWorkers([]);
					setTotalCount(0);
					setHasMore(false);
					setLoading(false);
					return;
				}
				query = query.in("id", workerIdsWithCategory);
			}

			if (filters.wojewodztwo)
				query = query.eq("wojewodztwo", filters.wojewodztwo);
			if (filters.miasto) query = query.eq("miasto", filters.miasto);
			if (filters.minRate)
				query = query.gte("hourly_rate", parseFloat(filters.minRate));
			if (filters.maxRate)
				query = query.lte("hourly_rate", parseFloat(filters.maxRate));
			if (filters.minRating)
				query = query.gte("rating_avg", parseFloat(filters.minRating));

			const { data, error, count } = await query
				.order("rating_avg", { ascending: false })
				.range(0, PAGE_SIZE - 1);

			if (data && !error) {
				let workersData = data.map((w: any) => ({
					...w,
					categories:
						w.worker_categories
							?.map((wc: any) => wc.category)
							.filter(Boolean) || [],
				}));

				setWorkers(workersData);
				setTotalCount(count || 0);
				setHasMore(data.length === PAGE_SIZE);
			}
		} catch (err) {
			console.error("Error fetching workers:", err);
		}
		setLoading(false);
	}, [filters]);

	// Load more
	const loadMore = useCallback(async () => {
		if (loadingMore || !hasMore) return;

		setLoadingMore(true);

		try {
			// If category filter is active, first get worker IDs that have this category
			let workerIdsWithCategory: string[] | null = null;

			if (filters.category) {
				const { data: categoryData } = await supabase
					.from("categories")
					.select("id")
					.eq("name", filters.category)
					.maybeSingle();

				if (categoryData) {
					const { data: workerCats } = await supabase
						.from("worker_categories")
						.select("worker_id")
						.eq("category_id", categoryData.id);

					workerIdsWithCategory = workerCats?.map((wc) => wc.worker_id) || [];
				}
			}

			let query = supabase
				.from("profiles")
				.select(
				`id, name, avatar_url, bio, wojewodztwo, miasto, hourly_rate, rating_avg, rating_count, available_from, available_to, worker_categories(category:categories(name))`
			)
			.eq("is_available", true)
			.eq("worker_profile_completed", true);
			// COMMENTED OUT - visibility payment requirement
			// .eq("worker_visibility_paid", true);

			if (workerIdsWithCategory !== null) {
				if (workerIdsWithCategory.length === 0) {
					setHasMore(false);
					setLoadingMore(false);
					return;
				}
				query = query.in("id", workerIdsWithCategory);
			}

			if (filters.wojewodztwo)
				query = query.eq("wojewodztwo", filters.wojewodztwo);
			if (filters.miasto) query = query.eq("miasto", filters.miasto);
			if (filters.minRate)
				query = query.gte("hourly_rate", parseFloat(filters.minRate));
			if (filters.maxRate)
				query = query.lte("hourly_rate", parseFloat(filters.maxRate));
			if (filters.minRating)
				query = query.gte("rating_avg", parseFloat(filters.minRating));

			const { data, error } = await query
				.order("rating_avg", { ascending: false })
				.range(workers.length, workers.length + PAGE_SIZE - 1);

			if (!error && data) {
				let newWorkersData = data.map((w: any) => ({
					...w,
					categories:
						w.worker_categories
							?.map((wc: any) => wc.category)
							.filter(Boolean) || [],
				}));

				setWorkers((prev) => [...prev, ...newWorkersData]);
				setHasMore(data.length === PAGE_SIZE);
			}
		} catch (err) {
			console.error("Error loading more workers:", err);
		}
		setLoadingMore(false);
	}, [workers.length, loadingMore, hasMore, filters]);

	useEffect(() => {
		fetchWorkers();
	}, [filters]);

	// Intersection Observer for infinite scroll
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
					loadMore();
				}
			},
			{ threshold: 0.1 }
		);

		if (loadMoreRef.current) {
			observer.observe(loadMoreRef.current);
		}

		return () => observer.disconnect();
	}, [hasMore, loading, loadingMore, loadMore]);

	useEffect(() => {
		if (gridRef.current && !loading && workers.length > 0) {
			gsap.fromTo(
				gridRef.current.querySelectorAll(".worker-card:not(.animated)"),
				{ opacity: 0, y: 30, scale: 0.95 },
				{
					opacity: 1,
					y: 0,
					scale: 1,
					duration: 0.5,
					stagger: 0.08,
					ease: "power3.out",
					onComplete: function () {
						this.targets().forEach((el: Element) =>
							el.classList.add("animated")
						);
					},
				}
			);
		}
	}, [loading, workers]);

	const fetchCategories = async () => {
		const { data } = await supabase
			.from("categories")
			.select("id, name")
			.order("name");
		if (data) setCategories(data);
	};

	const updateFilter = (key: string, value: string) => {
		setFilters((prev) => {
			const updated = { ...prev, [key]: value };
			if (key === "wojewodztwo") updated.miasto = "";
			return updated;
		});
	};

	const clearFilters = () => {
		setFilters({
			wojewodztwo: "",
			miasto: "",
			category: "",
			minRate: "",
			maxRate: "",
			minRating: "",
		});
	};

	const hasActiveFilters = Object.values(filters).some((v) => v !== "");

	return (
		<Layout>
			{/* Hero Header */}
			<div className="relative overflow-hidden bg-gradient-hero border-b border-border/50">
				<div className="absolute inset-0">
					<div className="absolute top-10 right-10 w-48 sm:w-64 h-48 sm:h-64 bg-primary/10 rounded-full blur-3xl" />
					<div className="absolute bottom-10 left-10 w-36 sm:w-48 h-36 sm:h-48 bg-accent/10 rounded-full blur-3xl" />
				</div>
				<div className="container relative py-10 sm:py-16 md:py-20 px-4 sm:px-6">
					<div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
						<div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center">
							<Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
						</div>
						<div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium">
							{totalCount} wykonawców
						</div>
					</div>
					<h1 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold mb-2 sm:mb-4">
						Znajdź idealnego wykonawcę
					</h1>
					<p className="text-sm sm:text-lg text-muted-foreground max-w-2xl">
						Przeglądaj profile zweryfikowanych wykonawców i wybierz najlepszego
						do swojego zlecenia
					</p>
				</div>
			</div>

			<div className="container py-6 sm:py-10 px-4 sm:px-6">
				{/* Filters Toggle */}
				<div className="flex justify-end mb-4 sm:mb-6">
					<Button
						variant="outline"
						onClick={() => setShowFilters(!showFilters)}
						className="gap-2 h-10 sm:h-12 text-sm sm:text-base"
					>
						<Filter className="h-4 w-4" />
						Filtry
						{hasActiveFilters && (
							<Badge className="bg-primary text-white ml-1">!</Badge>
						)}
					</Button>
				</div>

				{showFilters && (
				<Card className="mb-6 sm:mb-8 card-modern">
						<CardContent className="p-4 sm:p-6">
							<div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
								<div className="space-y-1.5 sm:space-y-2">
									<Label className="font-medium text-xs sm:text-sm">Województwo</Label>
									<WojewodztwoSelect
										value={filters.wojewodztwo}
										onChange={(v) => updateFilter("wojewodztwo", v)}
									/>
								</div>
								<div className="space-y-1.5 sm:space-y-2">
									<Label className="font-medium text-xs sm:text-sm">Miasto</Label>
									<CityAutocomplete
										value={filters.miasto}
										onChange={(miasto, region) => {
											const newFilters = { ...filters, miasto };
											if (region) {
												const normalizedRegion = region.toLowerCase();
												const matchedWojewodztwo = WOJEWODZTWA.find(
													(w) => w.toLowerCase() === normalizedRegion
												);
												if (matchedWojewodztwo) {
													newFilters.wojewodztwo = matchedWojewodztwo;
												}
											}
											setFilters(newFilters);
										}}
										placeholder="Wpisz miasto..."
									/>
								</div>
								<div className="space-y-1.5 sm:space-y-2">
									<Label className="font-medium text-xs sm:text-sm">Kategoria</Label>
									<Select
										value={filters.category || "__all__"}
										onValueChange={(v) =>
											updateFilter("category", v === "__all__" ? "" : v)
										}
									>
										<SelectTrigger className="h-10 sm:h-11 rounded-lg sm:rounded-xl text-sm">
											<SelectValue placeholder="Wszystkie" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="__all__">Wszystkie</SelectItem>
											{categories.map((c) => (
												<SelectItem key={c.id} value={c.name}>
													{c.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-1.5 sm:space-y-2">
									<Label className="font-medium text-xs sm:text-sm">Min. ocena</Label>
									<Select
										value={filters.minRating || "__all__"}
										onValueChange={(v) =>
											updateFilter("minRating", v === "__all__" ? "" : v)
										}
									>
										<SelectTrigger className="h-10 sm:h-11 rounded-lg sm:rounded-xl text-sm">
											<SelectValue placeholder="Dowolna" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="__all__">Dowolna</SelectItem>
											<SelectItem value="3">3+ ⭐</SelectItem>
											<SelectItem value="4">4+ ⭐</SelectItem>
											<SelectItem value="4.5">4.5+ ⭐</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
							{hasActiveFilters && (
								<Button
									variant="ghost"
									size="sm"
									onClick={clearFilters}
									className="mt-3 sm:mt-4 gap-2 text-xs sm:text-sm"
								>
									<X className="h-3 w-3 sm:h-4 sm:w-4" />
									Wyczyść filtry
								</Button>
							)}
						</CardContent>
					</Card>
				)}

				{/* Workers Grid */}
				{loading ? (
					<div className="flex flex-col items-center justify-center py-16 sm:py-24 gap-3 sm:gap-4">
						<div className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center">
							<Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
						</div>
						<p className="text-muted-foreground font-medium text-sm sm:text-base">
							Ładowanie wykonawców...
						</p>
					</div>
				) : workers.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-16 sm:py-24 gap-3 sm:gap-4">
						<div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl sm:rounded-2xl bg-muted flex items-center justify-center">
							<Users className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
						</div>
						<p className="text-base sm:text-lg font-semibold">Brak wyników</p>
						<p className="text-sm sm:text-base text-muted-foreground text-center">
							Nie znaleziono wykonawców. Spróbuj zmienić filtry.
						</p>
					</div>
				) : (
					<>
						<div
							ref={gridRef}
							className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
						>
							{workers.map((worker) => (
								<Link key={worker.id} to={`/worker/${worker.id}`}>
									<Card className="worker-card card-modern h-full group">
										<CardContent className="p-6">
											<div className="flex items-start gap-4 mb-4">
												<Avatar className="h-16 w-16 rounded-xl border-2 border-primary/10 group-hover:border-primary/30 transition-colors">
													<AvatarImage src={worker.avatar_url || ""} />
													<AvatarFallback className="text-xl bg-gradient-to-br from-primary to-primary-glow text-white rounded-xl">
														{worker.name?.charAt(0)?.toUpperCase() || "W"}
													</AvatarFallback>
												</Avatar>
												<div className="flex-1 min-w-0">
													<h3 className="font-display font-bold text-lg truncate group-hover:text-primary transition-colors">
														{worker.name || "Wykonawca"}
													</h3>
													{worker.rating_count > 0 ? (
														<div className="flex items-center gap-1 text-sm">
															<StarRating
																value={worker.rating_avg}
																readonly
																size="sm"
															/>
															<span className="text-muted-foreground">
																({worker.rating_count})
															</span>
														</div>
													) : (
														<span className="text-sm text-muted-foreground">
															Nowy wykonawca
														</span>
													)}
												</div>
												<div className="opacity-0 group-hover:opacity-100 transition-opacity">
													<div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
														<ArrowRight className="h-5 w-5 text-primary" />
													</div>
												</div>
											</div>

											{worker.bio && (
												<p className="text-sm text-muted-foreground mb-4 line-clamp-2">
													{worker.bio}
												</p>
											)}

											<div className="space-y-2">
												{(worker.miasto || worker.wojewodztwo) && (
													<div className="flex items-center gap-2 text-sm text-muted-foreground">
														<MapPin className="h-4 w-4 text-primary/60" />
														{[worker.miasto, worker.wojewodztwo]
															.filter(Boolean)
															.join(", ")}
													</div>
												)}
												{worker.hourly_rate && (
													<div className="flex items-center gap-2 text-sm">
														<Banknote className="h-4 w-4 text-primary" />
														<span className="font-display font-bold text-primary">
															{worker.hourly_rate} zł/h
														</span>
													</div>
												)}
											</div>

											{worker.categories.length > 0 && (
												<div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-border/50">
													{worker.categories.slice(0, 3).map((cat, i) => (
														<Badge
															key={i}
															variant="secondary"
															className="text-xs rounded-lg"
														>
															{cat.name}
														</Badge>
													))}
													{worker.categories.length > 3 && (
														<Badge
															variant="outline"
															className="text-xs rounded-lg"
														>
															+{worker.categories.length - 3}
														</Badge>
													)}
												</div>
											)}
										</CardContent>
									</Card>
								</Link>
							))}
						</div>

						{/* Load more trigger */}
						<div ref={loadMoreRef} className="py-8 flex justify-center">
							{loadingMore && (
								<div className="flex items-center gap-3 text-muted-foreground">
									<Loader2 className="h-5 w-5 animate-spin" />
									<span>Ładowanie kolejnych...</span>
								</div>
							)}
							{!hasMore && workers.length > 0 && (
								<p className="text-muted-foreground text-sm">
									Wyświetlono wszystkich wykonawców ({workers.length})
								</p>
							)}
						</div>
					</>
				)}
			</div>
		</Layout>
	);
}
