import { MapFilters } from "@/pages/WorkMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Flame, 
  Bus, 
  MapPin, 
  Gauge, 
  Clock,
  Settings2
} from "lucide-react";

interface WorkMapFiltersProps {
  filters: MapFilters;
  onFilterChange: (key: keyof MapFilters, value: boolean | number) => void;
}

export function WorkMapFilters({ filters, onFilterChange }: WorkMapFiltersProps) {
  return (
    <Card className="card-modern sticky top-24">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings2 className="h-5 w-5 text-primary" />
          Filtry mapy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggle Switches */}
        <div className="space-y-4">
          {/* Heatmap Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
                <Flame className="h-4 w-4 text-white" />
              </div>
              <div>
                <Label htmlFor="heatmap" className="font-medium cursor-pointer">
                  Heatmapa
                </Label>
                <p className="text-xs text-muted-foreground">
                  Mapa ciepła aktywności
                </p>
              </div>
            </div>
            <Switch
              id="heatmap"
              checked={filters.showHeatmap}
              onCheckedChange={(checked) => onFilterChange("showHeatmap", checked)}
            />
          </div>

          {/* Vehicles Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                <Bus className="h-4 w-4 text-white" />
              </div>
              <div>
                <Label htmlFor="vehicles" className="font-medium cursor-pointer">
                  Pojazdy MPK
                </Label>
                <p className="text-xs text-muted-foreground">
                  Live pozycje pojazdów
                </p>
              </div>
            </div>
            <Switch
              id="vehicles"
              checked={filters.showVehicles}
              onCheckedChange={(checked) => onFilterChange("showVehicles", checked)}
            />
          </div>

          {/* Hotspots Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-accent">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <div>
                <Label htmlFor="hotspots" className="font-medium cursor-pointer">
                  Hotspoty
                </Label>
                <p className="text-xs text-muted-foreground">
                  Strefy wysokiej aktywności
                </p>
              </div>
            </div>
            <Switch
              id="hotspots"
              checked={filters.showHotspots}
              onCheckedChange={(checked) => onFilterChange("showHotspots", checked)}
            />
          </div>
        </div>

        {/* Intensity Slider */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <Label className="font-medium">Intensywność</Label>
            </div>
            <span className="text-sm font-medium text-primary">
              {filters.intensity}%
            </span>
          </div>
          <Slider
            value={[filters.intensity]}
            onValueChange={([value]) => onFilterChange("intensity", value)}
            min={10}
            max={100}
            step={5}
            className="cursor-pointer"
          />
          <p className="text-xs text-muted-foreground">
            Wpływa na promień heatmapy i próg wykrywania hotspotów
          </p>
        </div>

        {/* Time Interval Select */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Label className="font-medium">Interwał odświeżania</Label>
          </div>
          <Select
            value={String(filters.timeInterval)}
            onValueChange={(value) => onFilterChange("timeInterval", Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 sekund</SelectItem>
              <SelectItem value="30">30 sekund</SelectItem>
              <SelectItem value="60">1 minuta</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Jak często pobierać nowe dane z API
          </p>
        </div>

        {/* Legend */}
        <div className="pt-4 border-t border-border/50">
          <Label className="font-medium text-sm">Legenda heatmapy</Label>
          <div className="mt-3 flex items-center gap-1">
            <div className="flex-1 h-3 rounded-full bg-gradient-to-r from-blue-400 via-yellow-400 via-orange-500 to-red-600" />
          </div>
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>Niska</span>
            <span>Średnia</span>
            <span>Wysoka</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
