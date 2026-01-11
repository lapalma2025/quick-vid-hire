import { useState, useCallback, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { WorkMapFilters } from "@/components/workmap/WorkMapFilters";
import { WorkMapLeaflet } from "@/components/workmap/WorkMapLeaflet";
import { useVehicleData, JobMarker } from "@/hooks/useVehicleData";
import { CategoryBadges } from "@/components/shared/CategoryBadges";
import { MapPin, Activity } from "lucide-react";

export interface MapFilters {
  showHeatmap: boolean;
  intensity: number;
  timeInterval: number;
}

const WorkMap = () => {
  const [filters, setFilters] = useState<MapFilters>({
    showHeatmap: true,
    intensity: 50,
    timeInterval: 30,
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const { jobs, heatmapPoints, isLoading, lastUpdate } = useVehicleData(filters.timeInterval);

  // Filter jobs by selected categories
  const filteredJobs = useMemo<JobMarker[]>(() => {
    if (selectedCategories.length === 0) return jobs;
    return jobs.filter(job => job.category && selectedCategories.includes(job.category));
  }, [jobs, selectedCategories]);

  const handleCategoryToggle = useCallback((categoryName: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  }, []);

  const handleFilterChange = useCallback((key: keyof MapFilters, value: boolean | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-primary-light/30 to-background">
        {/* Hero Section */}
        <div className="relative overflow-hidden border-b border-border/50">
          <div className="absolute inset-0 bg-gradient-glow opacity-30" />
          <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-gradient-accent shadow-lg shadow-primary/20">
                    <MapPin className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                    Mapa Pracy
                  </h1>
                </div>
                <p className="text-muted-foreground text-lg max-w-xl">
                  Odkryj gdzie jest największy popyt na pracę krótkoterminową w województwie dolnośląskim
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/50 shadow-sm">
                  <Activity className="h-4 w-4 text-primary animate-pulse" />
                  <span className="text-sm font-medium">
                    {isLoading ? "Ładowanie..." : `${jobs.length} ofert`}
                  </span>
                </div>
                {lastUpdate && (
                  <div className="text-sm text-muted-foreground">
                    Aktualizacja: {lastUpdate.toLocaleTimeString("pl-PL")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Panel */}
            <div className="lg:col-span-1 space-y-4">
              <WorkMapFilters 
                filters={filters} 
                onFilterChange={handleFilterChange} 
              />
              
              {/* Category Filter Badges */}
              <div className="bg-background/95 backdrop-blur-sm rounded-xl border border-border/50 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-foreground">Filtruj po kategorii</h3>
                  {selectedCategories.length > 0 && (
                    <button 
                      onClick={() => setSelectedCategories([])}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Wyczyść ({selectedCategories.length})
                    </button>
                  )}
                </div>
                <CategoryBadges 
                  selectedCategories={selectedCategories}
                  onCategoryToggle={handleCategoryToggle}
                />
                {selectedCategories.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Pokazuję {filteredJobs.length} z {jobs.length} ofert
                  </p>
                )}
              </div>
            </div>

            {/* Map - Fixed height */}
            <div className="lg:col-span-3">
              <div className="card-modern overflow-hidden h-[calc(100vh-280px)] min-h-[500px]">
                <WorkMapLeaflet
                  filters={filters}
                  jobs={filteredJobs}
                  heatmapPoints={heatmapPoints}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WorkMap;
