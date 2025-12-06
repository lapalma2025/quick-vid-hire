import { useState, useEffect, useRef, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { JobCard } from "@/components/jobs/JobCard";
import {
	JobFilters,
	type JobFilters as Filters,
} from "@/components/jobs/JobFilters";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Sparkles } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

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
}

export default function Jobs() {
	const [jobs, setJobs] = useState<Job[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [totalCount, setTotalCount] = useState(0);
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
		sortBy: "newest",
	});

	const headerRef = useRef<HTMLDivElement>(null);
	const gridRef = useRef<HTMLDivElement>(null);
	const loadMoreRef = useRef<HTMLDivElement>(null);

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
        category:categories(name, icon),
        job_images(image_url)
      `,
				{ count: "exact" }
			)
			.eq("status", "active");

		if (filters.search) {
			query = query.ilike("title", `%${filters.search}%`);
		}

		if (filters.locationType === "poland") {
			query = query.or("is_foreign.is.null,is_foreign.eq.false");
			if (filters.wojewodztwo) {
				query = query.eq("wojewodztwo", filters.wojewodztwo);
			}
			if (filters.miasto) {
				query = query.eq("miasto", filters.miasto);
			}
		} else if (filters.locationType === "foreign") {
			query = query.eq("is_foreign", true);
			if (filters.country) {
				query = query.eq("country", filters.country);
			}
			if (filters.miasto) {
				query = query.eq("miasto", filters.miasto);
			}
		}

		if (filters.category_id) {
			query = query.eq("category_id", filters.category_id);
		}
		if (filters.urgent) {
			query = query.eq("urgent", true);
		}
		if (filters.groupOnly) {
			query = query.eq("allows_group", true);
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
	}, [filters]);

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

			// Sort: highlighted first, then promoted (active), then rest
			jobsData.sort((a, b) => {
				// Highlighted jobs always first
				if (a.is_highlighted && !b.is_highlighted) return -1;
				if (!a.is_highlighted && b.is_highlighted) return 1;

				// Then promoted jobs (check if promotion is still active)
				const aPromoted =
					a.is_promoted &&
					(!a.promotion_expires_at ||
						new Date(a.promotion_expires_at) > new Date());
				const bPromoted =
					b.is_promoted &&
					(!b.promotion_expires_at ||
						new Date(b.promotion_expires_at) > new Date());
				if (aPromoted && !bPromoted) return -1;
				if (!aPromoted && bPromoted) return 1;

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

	useEffect(() => {
		if (headerRef.current) {
			gsap.fromTo(
				headerRef.current,
				{ opacity: 0, y: 30 },
				{ opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
			);
		}
	}, []);

	useEffect(() => {
		if (gridRef.current && !loading && jobs.length > 0) {
			gsap.fromTo(
				gridRef.current.querySelectorAll(".job-card:not(.animated)"),
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
	}, [loading, jobs]);

	return (
		<Layout>
			{/* Hero Header */}
			<div className="relative overflow-hidden bg-gradient-hero border-b border-border/50">
				<div className="absolute inset-0">
					<div className="absolute top-10 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
					<div className="absolute bottom-10 right-10 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />
				</div>
				<div ref={headerRef} className="container relative py-16 md:py-20">
					<div className="flex items-center gap-3 mb-4">
						<div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
							<Search className="h-6 w-6 text-primary" />
						</div>
						<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
							<Sparkles className="h-3.5 w-3.5" />
							{totalCount} zleceń
						</div>
					</div>
					<h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
						Znajdź idealne zlecenie
					</h1>
					<p className="text-lg text-muted-foreground max-w-2xl">
						Przeglądaj dostępne zlecenia w Polsce i za granicą
					</p>
				</div>
			</div>

			<div className="container py-10">
				<div className="grid lg:grid-cols-[300px_1fr] gap-10">
					<aside className="hidden lg:block">
						<div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-primary/40 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-primary/60 pr-2">
							<JobFilters onFiltersChange={setFilters} />
						</div>
					</aside>

					{/* Mobile filters */}
					<div className="lg:hidden">
						<JobFilters onFiltersChange={setFilters} />
					</div>

					<div>
						{loading ? (
							<div className="flex flex-col items-center justify-center py-24 gap-4">
								<div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
									<Loader2 className="h-8 w-8 animate-spin text-primary" />
								</div>
								<p className="text-muted-foreground font-medium">
									Ładowanie zleceń...
								</p>
							</div>
						) : jobs.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-24 gap-4">
								<div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center">
									<Search className="h-10 w-10 text-muted-foreground" />
								</div>
								<div className="text-center">
									<p className="text-lg font-semibold mb-1">Brak zleceń</p>
									<p className="text-muted-foreground">
										Nie znaleziono zleceń spełniających kryteria
									</p>
								</div>
							</div>
						) : (
							<>
								<div
									ref={gridRef}
									className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6"
								>
									{jobs.map((job) => (
										<div key={job.id} className="job-card">
											<JobCard job={job} />
										</div>
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
