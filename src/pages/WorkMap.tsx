import { useState, useCallback, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { WorkMapFilters } from "@/components/workmap/WorkMapFilters";
import { WorkMapLeaflet } from "@/components/workmap/WorkMapLeaflet";
import { WorkMapJobList } from "@/components/workmap/WorkMapJobList";
import { useVehicleData, JobMarker } from "@/hooks/useVehicleData";
import { CategoryBadges } from "@/components/shared/CategoryBadges";

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
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { jobs, heatmapPoints, isLoading } = useVehicleData(filters.timeInterval);

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
      <div className="h-[calc(100vh-64px)] flex overflow-hidden bg-background">
        {/* Left Panel - Filters & Job List */}
        <div className="w-[460px] flex-shrink-0 border-r border-border/50 flex flex-col bg-card/50">
          {/* Header */}
          <div className="p-5 border-b border-border/50 bg-background/80 backdrop-blur-sm">
            <h1 className="text-2xl font-bold text-foreground">Mapa Pracy</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isLoading ? "Ładowanie..." : `${filteredJobs.length} ofert w dolnośląskim`}
            </p>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Collapsible Filters */}
            <div className="border-b border-border/50">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="w-full px-5 py-3 flex items-center justify-between text-sm font-medium hover:bg-secondary/50 transition-colors"
              >
                <span>Filtry mapy</span>
                <span className={`transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {filtersOpen && (
                <div className="px-5 pb-4">
                  <WorkMapFilters 
                    filters={filters} 
                    onFilterChange={handleFilterChange}
                    compact
                  />
                </div>
              )}
            </div>

            {/* Category Filters */}
            <div className="p-5 border-b border-border/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Kategorie</h3>
                {selectedCategories.length > 0 && (
                  <button 
                    onClick={() => setSelectedCategories([])}
                    className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    Wyczyść ({selectedCategories.length})
                  </button>
                )}
              </div>
              <CategoryBadges 
                selectedCategories={selectedCategories}
                onCategoryToggle={handleCategoryToggle}
              />
            </div>

            {/* Job List */}
            <WorkMapJobList jobs={filteredJobs} isLoading={isLoading} />
          </div>
        </div>

        {/* Map - Takes remaining space */}
        <div className="flex-1 relative min-w-0">
          <WorkMapLeaflet
            filters={filters}
            jobs={filteredJobs}
            heatmapPoints={heatmapPoints}
          />
        </div>
      </div>
    </Layout>
  );
};

export default WorkMap;
