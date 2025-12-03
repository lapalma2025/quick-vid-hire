import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { WOJEWODZTWA, MIASTA_BY_WOJEWODZTWO } from '@/lib/constants';
import { StarRating } from '@/components/ui/star-rating';
import { 
  MapPin, 
  Banknote, 
  Search,
  Loader2,
  Users,
  Filter,
  X
} from 'lucide-react';

interface Worker {
  id: string;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  wojewodztwo: string | null;
  miasto: string | null;
  hourly_rate: number | null;
  rating_avg: number;
  rating_count: number;
  categories: { name: string }[];
}

interface Category {
  id: string;
  name: string;
}

export default function Workers() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    wojewodztwo: '',
    miasto: '',
    category: '',
    minRate: '',
    maxRate: '',
    minRating: '',
  });

  const miasta = filters.wojewodztwo ? MIASTA_BY_WOJEWODZTWO[filters.wojewodztwo] || [] : [];

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchWorkers();
  }, [filters]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .order('name');
    if (data) setCategories(data);
  };

  const fetchWorkers = async () => {
    setLoading(true);
    
    let query = supabase
      .from('profiles')
      .select(`
        id,
        name,
        avatar_url,
        bio,
        wojewodztwo,
        miasto,
        hourly_rate,
        rating_avg,
        rating_count,
        worker_categories(category:categories(name))
      `)
      .eq('role', 'worker')
      .eq('is_available', true);

    if (filters.wojewodztwo) {
      query = query.eq('wojewodztwo', filters.wojewodztwo);
    }
    if (filters.miasto) {
      query = query.eq('miasto', filters.miasto);
    }
    if (filters.minRate) {
      query = query.gte('hourly_rate', parseFloat(filters.minRate));
    }
    if (filters.maxRate) {
      query = query.lte('hourly_rate', parseFloat(filters.maxRate));
    }
    if (filters.minRating) {
      query = query.gte('rating_avg', parseFloat(filters.minRating));
    }
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query.order('rating_avg', { ascending: false });

    if (data && !error) {
      let workersData = data.map((w: any) => ({
        ...w,
        categories: w.worker_categories?.map((wc: any) => wc.category) || [],
      }));

      // Filter by category client-side (since it's a relation)
      if (filters.category) {
        workersData = workersData.filter((w: Worker) => 
          w.categories.some(c => c.name === filters.category)
        );
      }

      setWorkers(workersData);
    }
    setLoading(false);
  };

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => {
      const updated = { ...prev, [key]: value };
      if (key === 'wojewodztwo') {
        updated.miasto = '';
      }
      return updated;
    });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      wojewodztwo: '',
      miasto: '',
      category: '',
      minRate: '',
      maxRate: '',
      minRating: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Znajdź wykonawcę</h1>
          <p className="text-muted-foreground">
            Przeglądaj dostępnych wykonawców i znajdź idealną osobę do swojego zlecenia
          </p>
        </div>

        {/* Search & Filter Toggle */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Szukaj po imieniu..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10"
            />
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtry
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1">!</Badge>
            )}
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Województwo</Label>
                  <Select value={filters.wojewodztwo || "__all__"} onValueChange={(v) => updateFilter('wojewodztwo', v === "__all__" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wszystkie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Wszystkie</SelectItem>
                      {WOJEWODZTWA.map((w) => (
                        <SelectItem key={w} value={w}>{w}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Miasto</Label>
                  <Select 
                    value={filters.miasto || "__all__"} 
                    onValueChange={(v) => updateFilter('miasto', v === "__all__" ? "" : v)}
                    disabled={!filters.wojewodztwo}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wszystkie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Wszystkie</SelectItem>
                      {miasta.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Kategoria</Label>
                  <Select value={filters.category || "__all__"} onValueChange={(v) => updateFilter('category', v === "__all__" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wszystkie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Wszystkie</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Min. ocena</Label>
                  <Select value={filters.minRating || "__all__"} onValueChange={(v) => updateFilter('minRating', v === "__all__" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Dowolna" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Dowolna</SelectItem>
                      <SelectItem value="3">3+ ⭐</SelectItem>
                      <SelectItem value="4">4+ ⭐</SelectItem>
                      <SelectItem value="4.5">4.5+ ⭐</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Stawka od (zł/h)</Label>
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minRate}
                    onChange={(e) => updateFilter('minRate', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Stawka do (zł/h)</Label>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxRate}
                    onChange={(e) => updateFilter('maxRate', e.target.value)}
                  />
                </div>
              </div>

              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="mt-4 gap-2"
                >
                  <X className="h-4 w-4" />
                  Wyczyść filtry
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results count */}
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {loading ? 'Ładowanie...' : `${workers.length} dostępnych wykonawców`}
        </div>

        {/* Workers Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : workers.length === 0 ? (
          <Card>
            <CardContent className="p-16 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Brak wyników</h3>
              <p className="text-muted-foreground">
                Nie znaleziono wykonawców spełniających kryteria. Spróbuj zmienić filtry.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {workers.map((worker) => (
              <Link key={worker.id} to={`/worker/${worker.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={worker.avatar_url || ''} />
                        <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                          {worker.name?.charAt(0)?.toUpperCase() || 'W'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">
                          {worker.name || 'Wykonawca'}
                        </h3>
                        {worker.rating_count > 0 ? (
                          <div className="flex items-center gap-1 text-sm">
                            <StarRating value={worker.rating_avg} readonly size="sm" />
                            <span className="text-muted-foreground">({worker.rating_count})</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Nowy wykonawca</span>
                        )}
                      </div>
                    </div>

                    {worker.bio && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {worker.bio}
                      </p>
                    )}

                    <div className="space-y-2">
                      {(worker.miasto || worker.wojewodztwo) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {[worker.miasto, worker.wojewodztwo].filter(Boolean).join(', ')}
                        </div>
                      )}
                      {worker.hourly_rate && (
                        <div className="flex items-center gap-2 text-sm">
                          <Banknote className="h-4 w-4 text-primary" />
                          <span className="font-medium text-primary">{worker.hourly_rate} zł/h</span>
                        </div>
                      )}
                    </div>

                    {worker.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-4">
                        {worker.categories.slice(0, 3).map((cat, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {cat.name}
                          </Badge>
                        ))}
                        {worker.categories.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{worker.categories.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}