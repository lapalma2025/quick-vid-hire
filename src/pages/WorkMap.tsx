import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { WorkMapFilters } from "@/components/workmap/WorkMapFilters";
import { WorkMapInsights } from "@/components/workmap/WorkMapInsights";
import { WorkMapLeaflet } from "@/components/workmap/WorkMapLeaflet";
import { useVehicleData } from "@/hooks/useVehicleData";
import { MapPin, Activity, TrendingUp } from "lucide-react";

export interface MapFilters {
  showHeatmap: boolean;
  showVehicles: boolean;
  showHotspots: boolean;
  intensity: number;
  timeInterval: number;
}

export interface Hotspot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  level: number;
  activity: "Bardzo wysoka" | "Wysoka" | "Średnia" | "Niska";
  peakHours: string;
  count: number;
}

const WorkMap = () => {
  const [filters, setFilters] = useState<MapFilters>({
    showHeatmap: true,
    showVehicles: false,
    showHotspots: true,
    intensity: 50,
    timeInterval: 30,
  });

  const { vehicles, jobs, hotspots, heatmapPoints, isLoading, lastUpdate } = useVehicleData(filters.timeInterval);

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
                  Odkryj gdzie jest największy popyt na pracę krótkoterminową we Wrocławiu
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/50 shadow-sm">
                  <Activity className="h-4 w-4 text-primary animate-pulse" />
                  <span className="text-sm font-medium">
                    {isLoading ? "Ładowanie..." : `${vehicles.length} pojazdów`}
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
            <div className="lg:col-span-1">
              <WorkMapFilters 
                filters={filters} 
                onFilterChange={handleFilterChange} 
              />
            </div>

            {/* Map */}
            <div className="lg:col-span-3">
              <div className="card-modern overflow-hidden">
                <WorkMapLeaflet
                  filters={filters}
                  vehicles={vehicles}
                  jobs={jobs}
                  hotspots={hotspots}
                  heatmapPoints={heatmapPoints}
                />
              </div>
            </div>
          </div>

          {/* Insights Section */}
          <WorkMapInsights hotspots={hotspots} />
        </div>
      </div>
    </Layout>
  );
};

export default WorkMap;
