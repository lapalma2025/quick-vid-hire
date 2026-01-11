import { MapFilters } from "@/pages/WorkMap";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Flame } from "lucide-react";

interface WorkMapFiltersProps {
	filters: MapFilters;
	onFilterChange: (key: keyof MapFilters, value: boolean | number) => void;
	compact?: boolean;
}

export function WorkMapFilters({
	filters,
	onFilterChange,
	compact = false,
}: WorkMapFiltersProps) {
	if (compact) {
		return (
			<div className="space-y-4">
				{/* Heatmap Toggle - Compact */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Flame className="h-4 w-4 text-orange-500" />
						<Label htmlFor="heatmap-compact" className="text-sm cursor-pointer">
							Heatmapa
						</Label>
					</div>
					<Switch
						id="heatmap-compact"
						checked={filters.showHeatmap}
						onCheckedChange={(checked) =>
							onFilterChange("showHeatmap", checked)
						}
					/>
				</div>
				
				{/* Legend */}
				<div>
					<Label className="text-xs text-muted-foreground">Legenda</Label>
					<div className="mt-2 flex items-center gap-1">
						<div className="flex-1 h-2 rounded-full bg-gradient-to-r from-blue-400 via-yellow-400 via-orange-500 to-red-600" />
					</div>
					<div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
						<span>Niska</span>
						<span>Wysoka</span>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
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
		</div>
	);
}
