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
  Code,
  Cog,
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
  // Added missing categories from database
  { id: "ba172dc7-3932-44e8-ae0f-c125b1b25e9e", name: "Edukacja i szkolenia", displayName: "Edukacja", icon: GraduationCap, color: "bg-sky-500/10 text-sky-600 border-sky-200 hover:bg-sky-500/20" },
  { id: "4b6dada1-94fb-4511-bc77-9b09bf143791", name: "Finanse i prawo", displayName: "Finanse", icon: Scale, color: "bg-zinc-500/10 text-zinc-600 border-zinc-200 hover:bg-zinc-500/20" },
  { id: "7b2c6c9e-8f38-4c96-a99e-ee50bdda2051", name: "Motoryzacja", displayName: "Motoryzacja", icon: Cog, color: "bg-stone-500/10 text-stone-600 border-stone-200 hover:bg-stone-500/20" },
  { id: "5f0ff7f0-4987-4e43-bd46-70fa8a1e53aa", name: "Programowanie", displayName: "Programowanie", icon: Code, color: "bg-teal-500/10 text-teal-600 border-teal-200 hover:bg-teal-500/20" },
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
        
        return (
          <Badge
            key={category.id}
            variant="outline"
            className={cn(
              "cursor-pointer transition-all duration-200 px-2.5 py-1 text-xs font-medium flex items-center gap-1.5 whitespace-nowrap",
              isSelected 
                ? `${category.color} border-2 shadow-sm` 
                : "bg-background text-muted-foreground border-border hover:bg-muted/80 hover:border-muted-foreground/30"
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

// Helper to get category color classes for badge styling - now returns neutral colors only
export function getCategoryColorClasses(_categoryName: string, variant: 'full' | 'subtle' = 'subtle', _parentCategoryName?: string): string {
  if (variant === 'full') {
    return "bg-muted text-muted-foreground border-border hover:bg-muted/80";
  }
  
  // Subtle variant - neutral styling
  return "bg-muted/50 text-muted-foreground border-border/60 dark:bg-muted/30 dark:text-muted-foreground dark:border-border/40";
}

// Helper to find matching main category for a subcategory
export function findMainCategoryForSubcategory(categoryName: string): typeof MAIN_CATEGORIES[0] | undefined {
  // First try exact match
  let category = MAIN_CATEGORIES.find(c => c.name === categoryName);
  if (category) return category;
  
  // Try partial matching
  return MAIN_CATEGORIES.find(c => {
    const mainWords = c.name.toLowerCase().split(/\s+/);
    const catWords = categoryName.toLowerCase().split(/\s+/);
    return mainWords[0] === catWords[0] || 
           categoryName.toLowerCase().includes(c.name.toLowerCase()) ||
           c.name.toLowerCase().includes(categoryName.toLowerCase());
  });
}
