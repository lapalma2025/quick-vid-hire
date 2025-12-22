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