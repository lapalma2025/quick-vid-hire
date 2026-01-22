import { useState, useCallback, useMemo, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
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
  const [filters] = useState<MapFilters>({
    showHeatmap: false,
    intensity: 50,
    timeInterval: 30,
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [clusterSelection, setClusterSelection] = useState<JobMarker[] | null>(null);

  const { jobs, heatmapPoints, isLoading } = useVehicleData(filters.timeInterval);

  // Filter jobs by selected categories (matches both category name and parent category name)
  const filteredJobs = useMemo<JobMarker[]>(() => {
    if (selectedCategories.length === 0) return jobs;
    return jobs.filter((job) => {
      // Match if the category name OR the parent category name is in the selected list
      return (job.category && selectedCategories.includes(job.category)) ||
             (job.parentCategory && selectedCategories.includes(job.parentCategory));
    });
  }, [jobs, selectedCategories]);

  // Clear cluster selection when filters/categories change
  useEffect(() => {
    setClusterSelection(null);
  }, [jobs, selectedCategories]);

  const listJobs = clusterSelection ?? filteredJobs;

  const handleCategoryToggle = useCallback((categoryName: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryName) ? prev.filter((c) => c !== categoryName) : [...prev, categoryName],
    );
  }, []);

  return (
    <Layout showBreadcrumbs={false} showFooter={false}>
      <div className="h-[calc(100vh-80px)] flex overflow-hidden bg-background">
        {/* Left Panel - Filters & Job List */}
        <div className="w-[620px] flex-shrink-0 border-r border-border/50 flex flex-col bg-card/50">
          {/* Header */}
          <div className="p-5 border-b border-border/50 bg-background/80 backdrop-blur-sm">
            <h1 className="text-2xl font-bold text-foreground">Mapa Pracy</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isLoading
                ? "Ładowanie..."
                : clusterSelection
                  ? `${clusterSelection.length} ofert z wybranego klastra (łącznie ${filteredJobs.length})`
                  : `${filteredJobs.length} ofert w dolnośląskim`}
            </p>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
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
              <CategoryBadges selectedCategories={selectedCategories} onCategoryToggle={handleCategoryToggle} />
            </div>

            {/* Cluster selection hint */}
            {clusterSelection && (
              <div className="px-5 py-3 border-b border-border/50 bg-secondary/30">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Wybrane oferty</p>
                    <p className="text-xs text-muted-foreground">Kliknij ofertę, aby przejść do szczegółów</p>
                  </div>
                  <button
                    onClick={() => setClusterSelection(null)}
                    className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Pokaż wszystkie
                  </button>
                </div>
              </div>
            )}

            {/* Job List */}
            <WorkMapJobList jobs={listJobs} isLoading={isLoading} />
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative min-w-0">
          <WorkMapLeaflet
            filters={filters}
            jobs={filteredJobs}
            heatmapPoints={heatmapPoints}
            onClusterSelect={(clusterJobs) => setClusterSelection(clusterJobs)}
          />
        </div>
      </div>
    </Layout>
  );
};

export default WorkMap;

