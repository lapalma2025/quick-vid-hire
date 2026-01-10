import { 
  Hammer, 
  Brush, 
  Truck, 
  PartyPopper, 
  UtensilsCrossed,
  Flower2, 
  Car, 
  Wrench, 
  Heart, 
  Package, 
  Laptop, 
  MoreHorizontal,
  GraduationCap,
  Sparkles,
  Scale,
  Cog,
  Palette,
  LucideIcon
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  'Prace fizyczne': Hammer,
  'Sprzątanie': Brush,
  'Przeprowadzki': Truck,
  'Eventy': PartyPopper,
  'Gastronomia': UtensilsCrossed,
  'Ogród': Flower2,
  'Transport': Car,
  'Montaż i naprawy': Wrench,
  'Opieka': Heart,
  'Dostawy': Package,
  'IT i komputery': Laptop,
  'Edukacja i szkolenia': GraduationCap,
  'Uroda i zdrowie': Sparkles,
  'Finanse i prawo': Scale,
  'Motoryzacja': Car,
  'Instalacje': Cog,
  'Sztuka i rzemiosło': Palette,
  'Inne': MoreHorizontal,
};

interface CategoryIconProps {
  name: string;
  className?: string;
}

export const CategoryIcon = ({ name, className }: CategoryIconProps) => {
  const Icon = iconMap[name] || MoreHorizontal;
  return <Icon className={className} />;
};