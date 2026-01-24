import { 
  Hammer, 
  Truck, 
  PartyPopper, 
  Utensils,
  Flower2, 
  Car, 
  Wrench, 
  Heart, 
  Package, 
  Laptop, 
  MoreHorizontal,
  GraduationCap,
  Brush,
  Scale,
  Cog,
  Palette,
  Scissors,
  Code,
  Plug,
  LucideIcon
} from 'lucide-react';

// Main categories with their icons - synced with MAIN_CATEGORIES in CategoryBadges.tsx
export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  'Prace fizyczne': Hammer,
  'Sprzątanie': Brush,
  'Przeprowadzki': Truck,
  'Transport': Car,
  'Dostawy': Package,
  'Montaż i naprawy': Wrench,
  'Ogród': Flower2,
  'Opieka': Heart,
  'Gastronomia': Utensils,
  'Eventy': PartyPopper,
  'IT i komputery': Laptop,
  'Instalacje': Plug,
  'Uroda i zdrowie': Scissors,
  'Sztuka i rzemiosło': Palette,
  'Edukacja i szkolenia': GraduationCap,
  'Finanse i prawo': Scale,
  'Motoryzacja': Cog,
  'Programowanie': Code,
  'Inne': MoreHorizontal,
};

// Get icon for a category, checking parent category if it's a subcategory
export function getCategoryIcon(categoryName: string, parentCategoryName?: string): LucideIcon {
  // First try exact match
  if (CATEGORY_ICON_MAP[categoryName]) {
    return CATEGORY_ICON_MAP[categoryName];
  }
  
  // If parent category is provided, use its icon
  if (parentCategoryName && CATEGORY_ICON_MAP[parentCategoryName]) {
    return CATEGORY_ICON_MAP[parentCategoryName];
  }
  
  // Default to MoreHorizontal
  return MoreHorizontal;
}

interface CategoryIconProps {
  name: string;
  parentName?: string;
  className?: string;
}

export const CategoryIcon = ({ name, parentName, className }: CategoryIconProps) => {
  const Icon = getCategoryIcon(name, parentName);
  return <Icon className={className} />;
};