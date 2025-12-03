import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { WOJEWODZTWA, MIASTA_BY_WOJEWODZTWO } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface Category {
  id: string;
  name: string;
}

interface JobFiltersProps {
  onFiltersChange: (filters: JobFilters) => void;
}

export interface JobFilters {
  search: string;
  wojewodztwo: string;
  miasto: string;
  category_id: string;
  urgent: boolean;
  sortBy: 'newest' | 'budget_high' | 'start_soon';
}

export const JobFilters = ({ onFiltersChange }: JobFiltersProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<JobFilters>({
    search: '',
    wojewodztwo: '',
    miasto: '',
    category_id: '',
    urgent: false,
    sortBy: 'newest',
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('id, name').order('name');
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  const updateFilter = (key: keyof JobFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    if (key === 'wojewodztwo') {
      newFilters.miasto = '';
    }
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const cleared: JobFilters = {
      search: '',
      wojewodztwo: '',
      miasto: '',
      category_id: '',
      urgent: false,
      sortBy: 'newest',
    };
    setFilters(cleared);
    onFiltersChange(cleared);
  };

  const miasta = filters.wojewodztwo ? MIASTA_BY_WOJEWODZTWO[filters.wojewodztwo] || [] : [];
  const hasActiveFilters = filters.wojewodztwo || filters.miasto || filters.category_id || filters.urgent;

  const FilterContent = () => (
    <div className="space-y-4">
      <div>
        <Label>Województwo</Label>
        <Select value={filters.wojewodztwo} onValueChange={(v) => updateFilter('wojewodztwo', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Wybierz województwo" />
          </SelectTrigger>
          <SelectContent>
            {WOJEWODZTWA.map((w) => (
              <SelectItem key={w} value={w}>{w}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Miasto</Label>
        <Select 
          value={filters.miasto} 
          onValueChange={(v) => updateFilter('miasto', v)}
          disabled={!filters.wojewodztwo}
        >
          <SelectTrigger>
            <SelectValue placeholder="Wybierz miasto" />
          </SelectTrigger>
          <SelectContent>
            {miasta.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Kategoria</Label>
        <Select value={filters.category_id} onValueChange={(v) => updateFilter('category_id', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Wszystkie kategorie" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label>Tylko pilne</Label>
        <Switch 
          checked={filters.urgent} 
          onCheckedChange={(v) => updateFilter('urgent', v)} 
        />
      </div>

      <div>
        <Label>Sortuj</Label>
        <Select value={filters.sortBy} onValueChange={(v) => updateFilter('sortBy', v as any)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Najnowsze</SelectItem>
            <SelectItem value="budget_high">Najwyższy budżet</SelectItem>
            <SelectItem value="start_soon">Najbliższy termin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button variant="outline" className="w-full" onClick={clearFilters}>
          <X className="h-4 w-4 mr-2" />
          Wyczyść filtry
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Szukaj zleceń..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Mobile filters */}
      <div className="md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filtry
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1">!</Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>Filtry</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop filters */}
      <div className="hidden md:block">
        <FilterContent />
      </div>
    </div>
  );
};

// Need to import Badge
import { Badge } from '@/components/ui/badge';