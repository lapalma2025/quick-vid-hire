import { useState, useEffect, useRef, useCallback } from "react";
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
import {
  Loader2,
  Users,
  Filter,
  X,
  Map,
  List,
} from "lucide-react";
import gsap from "gsap";
import { WojewodztwoSelect } from "@/components/jobs/WojewodztwoSelect";
import { CityAutocomplete } from "@/components/jobs/CityAutocomplete";
import { WOJEWODZTWA } from "@/lib/constants";
import WorkersMap from "@/components/workers/WorkersMap";
import { WorkerListItem } from "@/components/workers/WorkerListItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSEO } from "@/hooks/useSEO";

const PAGE_SIZE = 50;

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
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [highlightedWorkerId, setHighlightedWorkerId] = useState<string | null>(null);
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
    description: "Znajdź sprawdzonych wykonawców w swojej okolicy. Przeglądaj profile, opinie i stawki. Fachowcy, pomocnicy, specjaliści od remontów i usług.",
    keywords: "wykonawcy, fachowcy, specjaliści, usługi, remonty, sprzątanie, transport, Polska",
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
          `id, name, avatar_url, bio, wojewodztwo, miasto, hourly_rate, rating_avg, rating_count, available_from, available_to, worker_categories(category:categories(name))`,
          { count: "exact" }
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

  const handleWorkerHover = (workerId: string | null) => {
    setHighlightedWorkerId(workerId);
  };

  return (
    <Layout>
      {/* Header */}
      <div className="border-b border-border bg-background">
        <div className="container py-4 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Wykonawcy</h1>
                <p className="text-sm text-muted-foreground">
                  {totalCount} dostępnych wykonawców
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('map')}
                  size="sm"
                  className="gap-2 h-8"
                >
                  <Map className="h-4 w-4" />
                  <span className="hidden sm:inline">Mapa</span>
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('list')}
                  size="sm"
                  className="gap-2 h-8"
                >
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Lista</span>
                </Button>
              </div>
              
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                size="sm"
                className="gap-2 h-8"
              >
                <Filter className="h-4 w-4" />
                Filtry
                {hasActiveFilters && (
                  <Badge className="bg-primary text-white h-5 w-5 p-0 flex items-center justify-center text-xs">
                    !
                  </Badge>
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
                    <WojewodztwoSelect
                      value={filters.wojewodztwo}
                      onChange={(v) => updateFilter("wojewodztwo", v)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Miasto</Label>
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
                  <div className="space-y-1.5">
                    <Label className="text-xs">Kategoria</Label>
                    <Select
                      value={filters.category || "__all__"}
                      onValueChange={(v) =>
                        updateFilter("category", v === "__all__" ? "" : v)
                      }
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
                      onValueChange={(v) =>
                        updateFilter("minRating", v === "__all__" ? "" : v)
                      }
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="mt-3 gap-2 text-xs"
                  >
                    <X className="h-3 w-3" />
                    Wyczyść filtry
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'map' ? (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)]">
          {/* Left: Worker List */}
          <div className="w-full lg:w-[400px] xl:w-[450px] border-r border-border bg-background overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-border bg-muted/30">
              <p className="text-sm font-medium">
                {workers.length} wykonawców
              </p>
            </div>
            
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-muted-foreground text-sm">Ładowanie...</span>
                </div>
              </div>
            ) : workers.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Brak wykonawców</p>
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div ref={listRef} className="p-3 space-y-2">
                  {workers.map((worker) => (
                    <div key={worker.id} className="worker-item">
                      <WorkerListItem
                        worker={worker}
                        isHighlighted={highlightedWorkerId === worker.id}
                        onHover={handleWorkerHover}
                      />
                    </div>
                  ))}
                  
                  {hasMore && (
                    <div ref={loadMoreRef} className="py-4 text-center">
                      <Button 
                        variant="outline" 
                        onClick={loadMore}
                        disabled={loadingMore}
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Ładowanie...
                          </>
                        ) : (
                          'Załaduj więcej'
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
          
          {/* Right: Map */}
          <div className="flex-1 h-[400px] lg:h-full">
            <WorkersMap
              workers={workers.map(w => ({
                ...w,
                is_available: true,
              }))}
              highlightedWorkerId={highlightedWorkerId}
              onMarkerHover={handleWorkerHover}
            />
          </div>
        </div>
      ) : (
        /* List View Only */
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
              <Button 
                variant="outline" 
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Ładowanie...
                  </>
                ) : (
                  'Załaduj więcej'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
