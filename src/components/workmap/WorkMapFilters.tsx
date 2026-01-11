import { MapFilters } from "@/pages/WorkMap";

interface WorkMapFiltersProps {
  filters: MapFilters;
  onFilterChange: (key: keyof MapFilters, value: boolean | number) => void;
  compact?: boolean;
}

// Filtry heatmapy usunięte - komponent zostawiony dla przyszłych rozszerzeń
export function WorkMapFilters({
  filters,
  onFilterChange,
  compact = false,
}: WorkMapFiltersProps) {
  // Placeholder - brak filtrów po usunięciu heatmapy
  return null;
}
