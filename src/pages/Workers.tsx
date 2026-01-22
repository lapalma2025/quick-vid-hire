import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, Filter, X, Map, List, ChevronDown } from "lucide-react";
import gsap from "gsap";
import { WojewodztwoSelect } from "@/components/jobs/WojewodztwoSelect";
import { CityAutocomplete } from "@/components/jobs/CityAutocomplete";
import { WOJEWODZTWA } from "@/lib/constants";
import WorkersMap from "@/components/workers/WorkersMap";
import { WorkerListItem } from "@/components/workers/WorkerListItem";
import { useSEO } from "@/hooks/useSEO";
import { CategoryBadges } from "@/components/shared/CategoryBadges";

const PAGE_SIZE = 50;

interface Worker {
  id: string;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  wojewodztwo: string | null;
  miasto: string | null;
  district: string | null;
  street: string | null;
  location_lat: number | null;
  location_lng: number | null;
  hourly_rate: number | null;
  rating_avg: number;
  rating_count: number;
  categories: { name: string; parentName?: string }[];
  available_from: string | null;
  available_to: string | null;
  completed_jobs_count: number;
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
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("map");
  const [highlightedWorkerId, setHighlightedWorkerId] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState({
    wojewodztwo: "",
    miasto: "",
    category: "",
    minRate: "",
    maxRate: "",
    minRating: "",
  });

  useSEO({
    title: "Wykonawcy",
    description:
      "Znajdź sprawdzonych wykonawców w swojej okolicy. Przeglądaj profile, opinie i stawki. Fachowcy, pomocnicy, specjaliści od remontów i usług.",
    keywords: "wykonawcy, fachowcy, specjaliści, usługi, remonty, sprzątanie, transport, Polska",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    setWorkers([]);
    setHasMore(true);

    try {
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
          `id, name, avatar_url, bio, wojewodztwo, miasto, district, street, location_lat, location_lng, hourly_rate, rating_avg, rating_count, available_from, available_to, completed_jobs_count, worker_categories(category:categories(name, parent_id, parent:parent_id(name)))`,
          { count: "exact" },
        )
        .eq("is_available", true)
        .eq("worker_profile_completed", true);

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

      if (filters.wojewodztwo) query = query.eq("wojewodztwo", filters.wojewodztwo);
      if (filters.miasto) query = query.eq("miasto", filters.miasto);
      if (filters.minRate) query = query.gte("hourly_rate", parseFloat(filters.minRate));
      if (filters.maxRate) query = query.lte("hourly_rate", parseFloat(filters.maxRate));
      if (filters.minRating) query = query.gte("rating_avg", parseFloat(filters.minRating));

      const { data, error, count } = await query.order("rating_avg", { ascending: false }).range(0, PAGE_SIZE - 1);

      if (data && !error) {
        const workersData = data.map((w: any) => ({
          ...w,
          categories: w.worker_categories?.map((wc: any) => {
            const cat = wc.category;
            if (!cat) return null;
            return {
              name: cat.name,
              parentName: cat.parent?.name || cat.name, // Use parent name for filtering, or self if no parent
            };
          }).filter(Boolean) || [],
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

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);

    try {
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
          `id, name, avatar_url, bio, wojewodztwo, miasto, district, street, location_lat, location_lng, hourly_rate, rating_avg, rating_count, available_from, available_to, completed_jobs_count, worker_categories(category:categories(name, parent_id, parent:parent_id(name)))`,
        )
        .eq("is_available", true)
        .eq("worker_profile_completed", true);

      if (workerIdsWithCategory !== null) {
        if (workerIdsWithCategory.length === 0) {
          setHasMore(false);
          setLoadingMore(false);
          return;
        }
        query = query.in("id", workerIdsWithCategory);
      }

      if (filters.wojewodztwo) query = query.eq("wojewodztwo", filters.wojewodztwo);
      if (filters.miasto) query = query.eq("miasto", filters.miasto);
      if (filters.minRate) query = query.gte("hourly_rate", parseFloat(filters.minRate));
      if (filters.maxRate) query = query.lte("hourly_rate", parseFloat(filters.maxRate));
      if (filters.minRating) query = query.gte("rating_avg", parseFloat(filters.minRating));

      const { data, error } = await query
        .order("rating_avg", { ascending: false })
        .range(workers.length, workers.length + PAGE_SIZE - 1);

      if (!error && data) {
        const newWorkersData = data.map((w: any) => ({
          ...w,
          categories: w.worker_categories?.map((wc: any) => {
            const cat = wc.category;
            if (!cat) return null;
            return {
              name: cat.name,
              parentName: cat.parent?.name || cat.name,
            };
          }).filter(Boolean) || [],
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

  useEffect(() => {
    if (listRef.current && !loading && workers.length > 0) {
      gsap.fromTo(
        listRef.current.querySelectorAll(".worker-item:not(.animated)"),
        { opacity: 0, x: -20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.3,
          stagger: 0.05,
          ease: "power2.out",
          onComplete: function () {
            this.targets().forEach((el: Element) => el.classList.add("animated"));
          },
        },
      );
    }
  }, [loading, workers]);

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("id, name").order("name");
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

  const handleWorkerHover = (workerId: string | null) => {
    setHighlightedWorkerId(workerId);
  };

  const handleCategoryToggle = useCallback((categoryName: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryName) ? prev.filter((c) => c !== categoryName) : [...prev, categoryName],
    );
  }, []);

  const filteredWorkersForMap = useMemo(() => {
    if (selectedCategories.length === 0) return workers;
    return workers.filter((worker) => 
      worker.categories.some((cat) => 
        selectedCategories.includes(cat.name) || 
        (cat.parentName && selectedCategories.includes(cat.parentName))
      )
    );
  }, [workers, selectedCategories]);

  const isMapView = viewMode === "map";

  // MAP VIEW - unified design with WorkMap
  if (isMapView) {
    return (
      <Layout showBreadcrumbs={false} showFooter={false}>
        <div className="h-[calc(100vh-80px)] flex overflow-hidden bg-background">
          {/* Left Panel */}
          <div className="w-[540px] flex-shrink-0 border-r border-border/50 flex flex-col bg-card/50">
            {/* Header */}
            <div className="p-5 border-b border-border/50 bg-background/80 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Wykonawcy</h1>
                    <p className="text-sm text-muted-foreground">
                      {loading ? "Ładowanie..." : `${filteredWorkersForMap.length} wykonawców w dolnośląskim`}
                    </p>
                  </div>
                </div>

                {/* View Toggle */}
                <div className="flex bg-muted rounded-lg p-1">
                  <Button variant="default" onClick={() => setViewMode("map")} size="sm" className="gap-2 h-8">
                    <Map className="h-4 w-4" />
                    Mapa
                  </Button>
                  <Button variant="ghost" onClick={() => setViewMode("list")} size="sm" className="gap-2 h-8">
                    <List className="h-4 w-4" />
                    Lista
                  </Button>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Collapsible Filters */}
              <div className="border-b border-border/50">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full px-5 py-3 flex items-center justify-between text-sm font-medium hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>Filtry</span>
                    {hasActiveFilters && (
                      <Badge className="bg-primary text-primary-foreground h-5 w-5 p-0 flex items-center justify-center text-xs">
                        !
                      </Badge>
                    )}
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`}
                  />
                </button>
                {showFilters && (
                  <div className="px-5 pb-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Województwo</Label>
                        <WojewodztwoSelect value={filters.wojewodztwo} onChange={(v) => updateFilter("wojewodztwo", v)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Miasto</Label>
                        <CityAutocomplete
                          value={filters.miasto}
                          onChange={(miasto, region) => {
                            const newFilters = { ...filters, miasto };
                            if (region) {
                              const normalizedRegion = region.toLowerCase();
                              const matchedWojewodztwo = WOJEWODZTWA.find((w) => w.toLowerCase() === normalizedRegion);
                              if (matchedWojewodztwo) {
                                newFilters.wojewodztwo = matchedWojewodztwo;
                              }
                            }
                            setFilters(newFilters);
                          }}
                          placeholder="Wpisz miasto..."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Kategoria</Label>
                        <Select
                          value={filters.category || "__all__"}
                          onValueChange={(v) => updateFilter("category", v === "__all__" ? "" : v)}
                        >
                          <SelectTrigger className="h-9">
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
                      <div className="space-y-1.5">
                        <Label className="text-xs">Min. ocena</Label>
                        <Select
                          value={filters.minRating || "__all__"}
                          onValueChange={(v) => updateFilter("minRating", v === "__all__" ? "" : v)}
                        >
                          <SelectTrigger className="h-9">
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
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2 text-xs">
                        <X className="h-3 w-3" />
                        Wyczyść filtry
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Category Badges */}
              <div className="p-5 border-b border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">Specjalizacje</h3>
                  {selectedCategories.length > 0 && (
                    <button
                      onClick={() => setSelectedCategories([])}
                      className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                    >
                      Wyczyść ({selectedCategories.length})
                    </button>
                  )}
                </div>
                <CategoryBadges selectedCategories={selectedCategories} onCategoryToggle={handleCategoryToggle} />
              </div>

              {/* Worker List */}
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-muted-foreground text-sm">Ładowanie...</span>
                  </div>
                </div>
              ) : filteredWorkersForMap.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                    <Users className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground font-medium">Brak wykonawców</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Zmień filtry, aby zobaczyć więcej</p>
                  {selectedCategories.length > 0 && (
                    <Button variant="link" className="mt-2" onClick={() => setSelectedCategories([])}>
                      Wyczyść filtry kategorii
                    </Button>
                  )}
                </div>
              ) : (
                <div ref={listRef} className="p-4 space-y-3">
                  {filteredWorkersForMap.map((worker) => (
                    <div key={worker.id} className="worker-item">
                      <WorkerListItem
                        worker={worker}
                        isHighlighted={highlightedWorkerId === worker.id}
                        onHover={handleWorkerHover}
                      />
                    </div>
                  ))}

                  {hasMore && selectedCategories.length === 0 && (
                    <div ref={loadMoreRef} className="py-4 text-center">
                      <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                        {loadingMore ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Ładowanie...
                          </>
                        ) : (
                          "Załaduj więcej"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="flex-1 relative min-w-0">
            <WorkersMap
              workers={filteredWorkersForMap.map((w) => ({
                ...w,
                is_available: true,
              }))}
              highlightedWorkerId={highlightedWorkerId}
              onMarkerHover={handleWorkerHover}
            />
          </div>
        </div>
      </Layout>
    );
  }

  // LIST VIEW
  return (
    <Layout showBreadcrumbs={false} showFooter={false}>
      <div className="h-[calc(100vh-80px)] flex flex-col overflow-hidden bg-background">
        {/* Header */}
        <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
          <div className="container py-4 px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">Wykonawcy</h1>
                  <p className="text-sm text-muted-foreground">{totalCount} dostępnych wykonawców</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* View Toggle */}
                <div className="flex bg-muted rounded-lg p-1">
                  <Button variant="ghost" onClick={() => setViewMode("map")} size="sm" className="gap-2 h-8">
                    <Map className="h-4 w-4" />
                    <span className="hidden sm:inline">Mapa</span>
                  </Button>
                  <Button variant="default" onClick={() => setViewMode("list")} size="sm" className="gap-2 h-8">
                    <List className="h-4 w-4" />
                    <span className="hidden sm:inline">Lista</span>
                  </Button>
                </div>

                <Button variant="outline" onClick={() => setShowFilters(!showFilters)} size="sm" className="gap-2 h-8">
                  <Filter className="h-4 w-4" />
                  Filtry
                  {hasActiveFilters && (
                    <Badge className="bg-primary text-white h-5 w-5 p-0 flex items-center justify-center text-xs">!</Badge>
                  )}
                </Button>
              </div>
            </div>

            {/* Filters */}
            {showFilters && (
              <Card className="mt-4">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Województwo</Label>
                      <WojewodztwoSelect value={filters.wojewodztwo} onChange={(v) => updateFilter("wojewodztwo", v)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Miasto</Label>
                      <CityAutocomplete
                        value={filters.miasto}
                        onChange={(miasto, region) => {
                          const newFilters = { ...filters, miasto };
                          if (region) {
                            const normalizedRegion = region.toLowerCase();
                            const matchedWojewodztwo = WOJEWODZTWA.find((w) => w.toLowerCase() === normalizedRegion);
                            if (matchedWojewodztwo) {
                              newFilters.wojewodztwo = matchedWojewodztwo;
                            }
                          }
                          setFilters(newFilters);
                        }}
                        placeholder="Wpisz miasto..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Kategoria</Label>
                      <Select
                        value={filters.category || "__all__"}
                        onValueChange={(v) => updateFilter("category", v === "__all__" ? "" : v)}
                      >
                        <SelectTrigger className="h-9">
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
                    <div className="space-y-1.5">
                      <Label className="text-xs">Min. ocena</Label>
                      <Select
                        value={filters.minRating || "__all__"}
                        onValueChange={(v) => updateFilter("minRating", v === "__all__" ? "" : v)}
                      >
                        <SelectTrigger className="h-9">
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
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-3 gap-2 text-xs">
                      <X className="h-3 w-3" />
                      Wyczyść filtry
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="container py-6 px-4 sm:px-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Ładowanie wykonawców...</p>
              </div>
            ) : workers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Users className="h-16 w-16 text-muted-foreground" />
                <p className="text-muted-foreground">Brak wykonawców spełniających kryteria</p>
              </div>
            ) : (
              <div ref={listRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {workers.map((worker) => (
                  <div key={worker.id} className="worker-item">
                    <WorkerListItem worker={worker} />
                  </div>
                ))}
              </div>
            )}

            {hasMore && !loading && (
              <div className="py-8 text-center">
                <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Ładowanie...
                    </>
                  ) : (
                    "Załaduj więcej"
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
