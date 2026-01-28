import { useState, useEffect, useRef, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { JobCard } from "@/components/jobs/JobCard";
import {
	JobFilters,
	type JobFilters as Filters,
} from "@/components/jobs/JobFilters";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Sparkles } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

const PAGE_SIZE = 10;

interface Job {
	id: string;
	title: string;
	description: string | null;
	wojewodztwo: string;
	miasto: string;
	is_foreign: boolean | null;
	country: string | null;
	start_time: string | null;
	start_date_tbd: boolean | null;
	duration_hours: number | null;
	budget: number | null;
	budget_type: string | null;
	urgent: boolean;
	status: string;
	created_at: string;
	category: { name: string; icon: string } | null;
	job_images: { image_url: string }[];
	allows_group: boolean | null;
	min_workers: number | null;
	max_workers: number | null;
	is_highlighted: boolean | null;
	is_promoted: boolean | null;
	promotion_expires_at: string | null;
	applicant_limit: number | null;
	job_responses: { count: number }[];
}

interface CategoryWithParent {
	id: string;
	parent_id: string | null;
}

export default function Jobs() {
	const [jobs, setJobs] = useState<Job[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [totalCount, setTotalCount] = useState(0);
	const [allCategories, setAllCategories] = useState<CategoryWithParent[]>([]);
	const [filters, setFilters] = useState<Filters>({
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

	useSEO({
		title: "Zlecenia",
		description: "Przeglądaj dostępne zlecenia w Polsce i za granicą. Znajdź idealne zlecenie dopasowane do Twoich umiejętności. Praca dorywcza, usługi, remonty i wiele więcej.",
		keywords: "zlecenia, praca dorywcza, usługi, fachowcy, remonty, sprzątanie, transport, Polska",
	});

	const loadMoreRef = useRef<HTMLDivElement>(null);

	// Fetch all categories for hierarchy filtering
	useEffect(() => {
		const fetchCategories = async () => {
			const { data } = await supabase
				.from("categories")
				.select("id, parent_id");
			if (data) setAllCategories(data);
		};
		fetchCategories();
	}, []);

	// Get category IDs to filter (includes subcategories if main category selected)
	const getCategoryIdsToFilter = useCallback((categoryId: string): string[] => {
		if (!categoryId) return [];
		
		const selectedCategory = allCategories.find(c => c.id === categoryId);
		if (!selectedCategory) return [categoryId];
		
		// If it's a main category (no parent), include all its subcategories
		if (!selectedCategory.parent_id) {
			const subcategoryIds = allCategories
				.filter(c => c.parent_id === categoryId)
				.map(c => c.id);
			return [categoryId, ...subcategoryIds];
		}
		
		// If it's a subcategory, just return it
		return [categoryId];
	}, [allCategories]);

	// Build query with filters
	const buildQuery = useCallback(() => {
		let query = supabase
			.from("jobs")
			.select(
				`
        id,
        title,
        description,
        wojewodztwo,
        miasto,
        is_foreign,
        country,
        start_time,
        start_date_tbd,
        end_time,
        duration_hours,
        budget,
        budget_type,
        urgent,
        status,
        created_at,
        allows_group,
        min_workers,
        max_workers,
        is_highlighted,
        is_promoted,
        promotion_expires_at,
        applicant_limit,
        category:categories(name, icon),
        job_images(image_url),
        job_responses(count)
      `,
				{ count: "exact" }
			)
			.eq("status", "active");

		if (filters.search) {
			query = query.ilike("title", `%${filters.search}%`);
		}

		if (filters.locationType === "poland") {
			query = query.or("is_foreign.is.null,is_foreign.eq.false");
		} else if (filters.locationType === "foreign") {
			query = query.eq("is_foreign", true);
			if (filters.country) {
				query = query.eq("country", filters.country);
			}
		}

		// Apply wojewodztwo/miasto filters for both "all" and "poland" modes
		if (filters.locationType !== "foreign") {
			if (filters.wojewodztwo) {
				query = query.eq("wojewodztwo", filters.wojewodztwo);
			}
			if (filters.miasto) {
				query = query.ilike("miasto", filters.miasto);
			}
		} else {
			// Foreign location - apply miasto filter if set
			if (filters.miasto) {
				query = query.ilike("miasto", filters.miasto);
			}
		}

		// Category filter with hierarchy support
		if (filters.category_id) {
			const categoryIds = getCategoryIdsToFilter(filters.category_id);
			if (categoryIds.length === 1) {
				query = query.eq("category_id", categoryIds[0]);
			} else if (categoryIds.length > 1) {
				query = query.in("category_id", categoryIds);
			}
		}
		if (filters.urgent) {
			query = query.eq("urgent", true);
		}
		if (filters.groupOnly) {
			query = query.eq("allows_group", true);
		}

		// Filter for "Do ustalenia" (start_date_tbd)
		if (filters.startDateTbd) {
			query = query.eq("start_date_tbd", true);
		}

		// Date filters - start_time (filter jobs starting on or after this date)
		if (filters.startDate && !filters.startDateTbd) {
			const startOfDay = new Date(filters.startDate);
			startOfDay.setHours(0, 0, 0, 0);
			query = query.gte("start_time", startOfDay.toISOString());
		}

		// Date filters - filter jobs starting on or before this date
		if (filters.endDate && !filters.startDateTbd) {
			const endOfDay = new Date(filters.endDate);
			endOfDay.setHours(23, 59, 59, 999);
			query = query.lte("start_time", endOfDay.toISOString());
		}

		switch (filters.sortBy) {
			case "budget_high":
				query = query.order("budget", { ascending: false, nullsFirst: false });
				break;
			case "start_soon":
				query = query.order("start_time", {
					ascending: true,
					nullsFirst: false,
				});
				break;
			default:
				query = query.order("created_at", { ascending: false });
		}

		return query;
	}, [filters, getCategoryIdsToFilter]);

	// Initial fetch
	const fetchJobs = useCallback(async () => {
		setLoading(true);
		setJobs([]);
		setHasMore(true);

		const query = buildQuery();
		const { data, error, count } = await query.range(0, PAGE_SIZE - 1);

		if (!error && data) {
			let jobsData = data as Job[];

			// Client-side filtering for time
			if (filters.availableAt) {
				const filterTime = filters.availableAt;
				jobsData = jobsData.filter((job: Job) => {
					if (!job.start_time) return true; // Jobs without set time always show
					const jobHour = new Date(job.start_time).toTimeString().slice(0, 5);
					return jobHour === filterTime;
				});
			}

			// Sort: highlighted first, then promoted with badge (Promowanie 24h), then rest
			// Note: Podświetlenie (is_promoted without promotion_expires_at) does NOT boost ranking
			jobsData.sort((a, b) => {
				// Highlighted jobs always first (includes promotion boost)
				if (a.is_highlighted && !b.is_highlighted) return -1;
				if (!a.is_highlighted && b.is_highlighted) return 1;

				// Then promoted jobs with badge (Promowanie 24h - has promotion_expires_at)
				const aPromotedWithBadge =
					a.is_promoted &&
					a.promotion_expires_at &&
					new Date(a.promotion_expires_at) > new Date();
				const bPromotedWithBadge =
					b.is_promoted &&
					b.promotion_expires_at &&
					new Date(b.promotion_expires_at) > new Date();
				if (aPromotedWithBadge && !bPromotedWithBadge) return -1;
				if (!aPromotedWithBadge && bPromotedWithBadge) return 1;

				return 0; // Keep original order for non-premium jobs
			});

			setJobs(jobsData);
			setTotalCount(count || 0);
			setHasMore(data.length === PAGE_SIZE);
		}
		setLoading(false);
	}, [buildQuery, filters.availableAt]);

	// Load more
	const loadMore = useCallback(async () => {
		if (loadingMore || !hasMore) return;

		setLoadingMore(true);
		const query = buildQuery();
		const { data, error } = await query.range(
			jobs.length,
			jobs.length + PAGE_SIZE - 1
		);

		if (!error && data) {
			let newJobsData = data as Job[];

			// Client-side filtering for time
			if (filters.availableAt) {
				const filterTime = filters.availableAt;
				newJobsData = newJobsData.filter((job: Job) => {
					if (!job.start_time) return true;
					const jobHour = new Date(job.start_time).toTimeString().slice(0, 5);
					return jobHour === filterTime;
				});
			}

			setJobs((prev) => [...prev, ...newJobsData]);
			setHasMore(data.length === PAGE_SIZE);
		}
		setLoadingMore(false);
	}, [buildQuery, jobs.length, loadingMore, hasMore, filters.availableAt]);

	useEffect(() => {
		fetchJobs();
	}, [fetchJobs]);

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

	// No GSAP animations for job cards - causes flickering on navigation

	// Memoize the filter change handler to prevent unnecessary re-renders
	const handleFiltersChange = useCallback((newFilters: Filters) => {
		setFilters(newFilters);
	}, []);

	return (
		<Layout>
			{/* Hero Header */}
			<div className="relative overflow-hidden bg-gradient-hero border-b border-border/50">
				<div className="absolute inset-0">
					<div className="absolute top-10 left-10 w-48 sm:w-64 h-48 sm:h-64 bg-primary/10 rounded-full blur-3xl" />
					<div className="absolute bottom-10 right-10 w-36 sm:w-48 h-36 sm:h-48 bg-accent/10 rounded-full blur-3xl" />
				</div>
				<div className="container relative py-10 sm:py-16 md:py-20 px-4 sm:px-6">
					<div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
						<div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center">
							<Search className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
						</div>
						<div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium">
							<Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
							{totalCount} zleceń
						</div>
					</div>
					<h1 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold mb-2 sm:mb-4">
						Znajdź idealne zlecenie
					</h1>
					<p className="text-sm sm:text-lg text-muted-foreground max-w-2xl">
						Przeglądaj dostępne zlecenia w Polsce i za granicą
					</p>
				</div>
			</div>

			<div className="container py-6 sm:py-10 px-4 sm:px-6">
				<div className="grid lg:grid-cols-[320px_1fr] xl:grid-cols-[380px_1fr] gap-6 sm:gap-10">
					<aside className="hidden lg:block">
						<div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-primary/40 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-primary/60 pr-2">
							<JobFilters onFiltersChange={handleFiltersChange} />
						</div>
					</aside>

					{/* Mobile filters */}
					<div className="lg:hidden">
						<JobFilters onFiltersChange={handleFiltersChange} />
					</div>

					<div>
						{loading ? (
							<div className="flex flex-col items-center justify-center py-16 sm:py-24 gap-3 sm:gap-4">
								<div className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center">
									<Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
								</div>
								<p className="text-muted-foreground font-medium text-sm sm:text-base">
									Ładowanie zleceń...
								</p>
							</div>
						) : jobs.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-16 sm:py-24 gap-3 sm:gap-4">
								<div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl sm:rounded-2xl bg-muted flex items-center justify-center">
									<Search className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
								</div>
								<div className="text-center">
									<p className="text-base sm:text-lg font-semibold mb-1">Brak zleceń</p>
									<p className="text-sm sm:text-base text-muted-foreground">
										Nie znaleziono zleceń spełniających kryteria
									</p>
								</div>
							</div>
						) : (
							<>
								<div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
									{jobs.map((job) => (
										<JobCard 
											key={job.id}
											job={{
												...job,
												response_count: job.job_responses?.[0]?.count ?? 0
											}} 
										/>
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
									{!hasMore && jobs.length > 0 && (
										<p className="text-muted-foreground text-sm">
											Wyświetlono wszystkie zlecenia ({jobs.length})
										</p>
									)}
								</div>
							</>
						)}
					</div>
				</div>
			</div>
		</Layout>
	);
}
