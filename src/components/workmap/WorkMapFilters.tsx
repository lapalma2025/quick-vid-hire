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
import { Flame, Bus, MapPin, Gauge, Clock, Settings2 } from "lucide-react";

interface WorkMapFiltersProps {
	filters: MapFilters;
	onFilterChange: (key: keyof MapFilters, value: boolean | number) => void;
}

export function WorkMapFilters({
	filters,
	onFilterChange,
}: WorkMapFiltersProps) {
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
							onCheckedChange={(checked) =>
								onFilterChange("showHeatmap", checked)
							}
						/>
					</div>

					{/* Vehicles Toggle */}
					<div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
								<Bus className="h-4 w-4 text-white" />
							</div>
							<div>
								<Label
									htmlFor="vehicles"
									className="font-medium cursor-pointer"
								>
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
							onCheckedChange={(checked) =>
								onFilterChange("showVehicles", checked)
							}
						/>
					</div>

					{/* Hotspots Toggle */}
					<div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-lg bg-gradient-accent">
								<MapPin className="h-4 w-4 text-white" />
							</div>
							<div>
								<Label
									htmlFor="hotspots"
									className="font-medium cursor-pointer"
								>
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
							onCheckedChange={(checked) =>
								onFilterChange("showHotspots", checked)
							}
						/>
					</div>
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
