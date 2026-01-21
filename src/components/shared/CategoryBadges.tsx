import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Package, 
  GraduationCap, 
  PartyPopper, 
  Scale, 
  Utensils, 
  MoreHorizontal, 
  Plug, 
  Laptop, 
  Wrench, 
  Car, 
  Flower2, 
  Heart, 
  Hammer, 
  Truck, 
  Sparkles, 
  Palette, 
  Scissors,
  LucideIcon
} from "lucide-react";

// Main categories with their display names and icons
export const MAIN_CATEGORIES: {
  id: string;
  name: string;
  displayName: string;
  icon: LucideIcon;
  color: string;
}[] = [
  { id: "107f04ac-de00-4f8f-ad89-f26be80a2338", name: "Prace fizyczne", displayName: "Fizyczne", icon: Hammer, color: "bg-orange-500/10 text-orange-600 border-orange-200 hover:bg-orange-500/20" },
  { id: "377f1e19-4315-49d7-ab3a-bff65102982f", name: "Sprzątanie", displayName: "Sprzątanie", icon: Sparkles, color: "bg-cyan-500/10 text-cyan-600 border-cyan-200 hover:bg-cyan-500/20" },
  { id: "3e063821-02c9-44ed-9d2c-1190b5c6aaa9", name: "Przeprowadzki", displayName: "Przeprowadzki", icon: Truck, color: "bg-blue-500/10 text-blue-600 border-blue-200 hover:bg-blue-500/20" },
  { id: "d57bbefa-8b54-41e6-8729-f2e31afffd27", name: "Transport", displayName: "Transport", icon: Car, color: "bg-indigo-500/10 text-indigo-600 border-indigo-200 hover:bg-indigo-500/20" },
  { id: "dd438b7a-377a-46ac-805e-b7b8942b6d67", name: "Dostawy", displayName: "Dostawy", icon: Package, color: "bg-amber-500/10 text-amber-600 border-amber-200 hover:bg-amber-500/20" },
  { id: "333fd27b-2cdb-4529-a248-341ede708447", name: "Montaż i naprawy", displayName: "Naprawy", icon: Wrench, color: "bg-slate-500/10 text-slate-600 border-slate-200 hover:bg-slate-500/20" },
  { id: "f6b7a12c-c005-42e1-8ace-2010cd42ce03", name: "Ogród", displayName: "Ogród", icon: Flower2, color: "bg-green-500/10 text-green-600 border-green-200 hover:bg-green-500/20" },
  { id: "7f173072-1f0b-4076-82f6-fd4e65bd6d8c", name: "Opieka", displayName: "Opieka", icon: Heart, color: "bg-pink-500/10 text-pink-600 border-pink-200 hover:bg-pink-500/20" },
  { id: "80c2ab97-60d0-49cd-b6b1-4a8d7a9a4616", name: "Gastronomia", displayName: "Gastronomia", icon: Utensils, color: "bg-red-500/10 text-red-600 border-red-200 hover:bg-red-500/20" },
  { id: "9cdcd17b-cbcc-4d6f-830b-735727d323a9", name: "Eventy", displayName: "Eventy", icon: PartyPopper, color: "bg-purple-500/10 text-purple-600 border-purple-200 hover:bg-purple-500/20" },
  { id: "6d0e9532-ca4e-4dc6-a104-d3a9e080da8e", name: "IT i komputery", displayName: "IT", icon: Laptop, color: "bg-emerald-500/10 text-emerald-600 border-emerald-200 hover:bg-emerald-500/20" },
  { id: "2383bf25-3821-41ff-85b5-7c49d00fa5b6", name: "Instalacje", displayName: "Instalacje", icon: Plug, color: "bg-yellow-500/10 text-yellow-600 border-yellow-200 hover:bg-yellow-500/20" },
  { id: "46f28ed4-790d-435f-9fa5-636c22d70126", name: "Uroda i zdrowie", displayName: "Uroda", icon: Scissors, color: "bg-rose-500/10 text-rose-600 border-rose-200 hover:bg-rose-500/20" },
  { id: "2ed44ce3-8f3a-4c68-9bee-d01458c0d69b", name: "Sztuka i rzemiosło", displayName: "Rzemiosło", icon: Palette, color: "bg-violet-500/10 text-violet-600 border-violet-200 hover:bg-violet-500/20" },
  { id: "50ed805a-5705-46d9-8467-be94f43b7590", name: "Inne", displayName: "Inne", icon: MoreHorizontal, color: "bg-gray-500/10 text-gray-600 border-gray-200 hover:bg-gray-500/20" },
];

interface CategoryBadgesProps {
  selectedCategories: string[];
  onCategoryToggle: (categoryName: string) => void;
  className?: string;
}

export function CategoryBadges({ 
  selectedCategories, 
  onCategoryToggle,
  className 
}: CategoryBadgesProps) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {MAIN_CATEGORIES.map((category) => {
        const isSelected = selectedCategories.includes(category.name);
        const Icon = category.icon;
        
        // Extract base color for subtle unselected state
        const colorMatch = category.color.match(/(orange|cyan|blue|indigo|amber|slate|green|pink|red|purple|emerald|yellow|rose|violet|gray)/);
        const baseColor = colorMatch ? colorMatch[1] : 'gray';
        
        // Subtle color classes for unselected state
        const subtleColorClasses: Record<string, string> = {
          orange: "text-orange-600 border-orange-200/70 hover:bg-orange-50 hover:border-orange-300 dark:text-orange-400 dark:border-orange-800/50 dark:hover:bg-orange-950/30",
          cyan: "text-cyan-600 border-cyan-200/70 hover:bg-cyan-50 hover:border-cyan-300 dark:text-cyan-400 dark:border-cyan-800/50 dark:hover:bg-cyan-950/30",
          blue: "text-blue-600 border-blue-200/70 hover:bg-blue-50 hover:border-blue-300 dark:text-blue-400 dark:border-blue-800/50 dark:hover:bg-blue-950/30",
          indigo: "text-indigo-600 border-indigo-200/70 hover:bg-indigo-50 hover:border-indigo-300 dark:text-indigo-400 dark:border-indigo-800/50 dark:hover:bg-indigo-950/30",
          amber: "text-amber-600 border-amber-200/70 hover:bg-amber-50 hover:border-amber-300 dark:text-amber-400 dark:border-amber-800/50 dark:hover:bg-amber-950/30",
          slate: "text-slate-600 border-slate-200/70 hover:bg-slate-50 hover:border-slate-300 dark:text-slate-400 dark:border-slate-700/50 dark:hover:bg-slate-800/30",
          green: "text-green-600 border-green-200/70 hover:bg-green-50 hover:border-green-300 dark:text-green-400 dark:border-green-800/50 dark:hover:bg-green-950/30",
          pink: "text-pink-600 border-pink-200/70 hover:bg-pink-50 hover:border-pink-300 dark:text-pink-400 dark:border-pink-800/50 dark:hover:bg-pink-950/30",
          red: "text-red-600 border-red-200/70 hover:bg-red-50 hover:border-red-300 dark:text-red-400 dark:border-red-800/50 dark:hover:bg-red-950/30",
          purple: "text-purple-600 border-purple-200/70 hover:bg-purple-50 hover:border-purple-300 dark:text-purple-400 dark:border-purple-800/50 dark:hover:bg-purple-950/30",
          emerald: "text-emerald-600 border-emerald-200/70 hover:bg-emerald-50 hover:border-emerald-300 dark:text-emerald-400 dark:border-emerald-800/50 dark:hover:bg-emerald-950/30",
          yellow: "text-yellow-600 border-yellow-200/70 hover:bg-yellow-50 hover:border-yellow-300 dark:text-yellow-400 dark:border-yellow-800/50 dark:hover:bg-yellow-950/30",
          rose: "text-rose-600 border-rose-200/70 hover:bg-rose-50 hover:border-rose-300 dark:text-rose-400 dark:border-rose-800/50 dark:hover:bg-rose-950/30",
          violet: "text-violet-600 border-violet-200/70 hover:bg-violet-50 hover:border-violet-300 dark:text-violet-400 dark:border-violet-800/50 dark:hover:bg-violet-950/30",
          gray: "text-gray-600 border-gray-200/70 hover:bg-gray-50 hover:border-gray-300 dark:text-gray-400 dark:border-gray-700/50 dark:hover:bg-gray-800/30",
        };
        
        return (
          <Badge
            key={category.id}
            variant="outline"
            className={cn(
              "cursor-pointer transition-all duration-200 px-2.5 py-1 text-xs font-medium flex items-center gap-1.5 whitespace-nowrap bg-background",
              isSelected 
                ? `${category.color} border-2 shadow-sm` 
                : subtleColorClasses[baseColor] || subtleColorClasses.gray
            )}
            onClick={() => onCategoryToggle(category.name)}
          >
            <Icon className="h-3 w-3" />
            {category.displayName}
          </Badge>
        );
      })}
    </div>
  );
}

// Helper to get category ID by name
export function getCategoryIdByName(name: string): string | undefined {
  return MAIN_CATEGORIES.find(c => c.name === name)?.id;
}

// Helper to get category by name
export function getCategoryByName(name: string) {
  return MAIN_CATEGORIES.find(c => c.name === name);
}

// Helper to get category color classes for badge styling
export function getCategoryColorClasses(categoryName: string, variant: 'full' | 'subtle' = 'subtle'): string {
  const category = MAIN_CATEGORIES.find(c => c.name === categoryName);
  if (!category) {
    return variant === 'full' 
      ? "bg-gray-500/10 text-gray-600 border-gray-200" 
      : "bg-muted text-muted-foreground border-border";
  }
  
  // Extract base color from the category color string
  const colorMatch = category.color.match(/(orange|cyan|blue|indigo|amber|slate|green|pink|red|purple|emerald|yellow|rose|violet|gray)/);
  const baseColor = colorMatch ? colorMatch[1] : 'gray';
  
  if (variant === 'full') {
    return category.color;
  }
  
  // Subtle variant - less saturated, more muted
  const subtleColors: Record<string, string> = {
    orange: "bg-orange-50 text-orange-700 border-orange-200/60 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800/40",
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-200/60 dark:bg-cyan-950/30 dark:text-cyan-400 dark:border-cyan-800/40",
    blue: "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/40",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200/60 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800/40",
    amber: "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/40",
    slate: "bg-slate-50 text-slate-700 border-slate-200/60 dark:bg-slate-800/30 dark:text-slate-400 dark:border-slate-700/40",
    green: "bg-green-50 text-green-700 border-green-200/60 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/40",
    pink: "bg-pink-50 text-pink-700 border-pink-200/60 dark:bg-pink-950/30 dark:text-pink-400 dark:border-pink-800/40",
    red: "bg-red-50 text-red-700 border-red-200/60 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/40",
    purple: "bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800/40",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200/60 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800/40",
    rose: "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800/40",
    violet: "bg-violet-50 text-violet-700 border-violet-200/60 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800/40",
    gray: "bg-gray-50 text-gray-700 border-gray-200/60 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700/40",
  };
  
  return subtleColors[baseColor] || subtleColors.gray;
}
