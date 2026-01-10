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
    <div className={cn("flex flex-wrap gap-2", className)}>
      {MAIN_CATEGORIES.map((category) => {
        const isSelected = selectedCategories.includes(category.name);
        const Icon = category.icon;
        
        return (
          <Badge
            key={category.id}
            variant="outline"
            className={cn(
              "cursor-pointer transition-all duration-200 px-3 py-1.5 text-xs font-medium flex items-center gap-1.5",
              isSelected 
                ? `${category.color} border-2 shadow-sm` 
                : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
            )}
            onClick={() => onCategoryToggle(category.name)}
          >
            <Icon className="h-3.5 w-3.5" />
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
