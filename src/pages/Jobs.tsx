import { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { JobCard } from '@/components/jobs/JobCard';
import { JobFilters, type JobFilters as Filters } from '@/components/jobs/JobFilters';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface Job {
  id: string;
  title: string;
  description: string | null;
  wojewodztwo: string;
  miasto: string;
  start_time: string | null;
  duration_hours: number | null;
  budget: number | null;
  budget_type: string | null;
  urgent: boolean;
  status: string;
  created_at: string;
  category: { name: string; icon: string } | null;
  job_images: { image_url: string }[];
}

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    wojewodztwo: '',
    miasto: '',
    category_id: '',
    urgent: false,
    sortBy: 'newest',
  });

  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );
    }
  }, []);

  useEffect(() => {
    if (gridRef.current && !loading && jobs.length > 0) {
      gsap.fromTo(
        gridRef.current.querySelectorAll('.job-card'),
        { opacity: 0, y: 30, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power3.out',
        }
      );
    }
  }, [loading, jobs]);

  const fetchJobs = async () => {
    setLoading(true);
    
    let query = supabase
      .from('jobs')
      .select(`
        id,
        title,
        description,
        wojewodztwo,
        miasto,
        start_time,
        duration_hours,
        budget,
        budget_type,
        urgent,
        status,
        created_at,
        category:categories(name, icon),
        job_images(image_url)
      `)
      .eq('status', 'active');

    if (filters.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }
    if (filters.wojewodztwo) {
      query = query.eq('wojewodztwo', filters.wojewodztwo);
    }
    if (filters.miasto) {
      query = query.eq('miasto', filters.miasto);
    }
    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }
    if (filters.urgent) {
      query = query.eq('urgent', true);
    }

    switch (filters.sortBy) {
      case 'budget_high':
        query = query.order('budget', { ascending: false, nullsFirst: false });
        break;
      case 'start_soon':
        query = query.order('start_time', { ascending: true, nullsFirst: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query.limit(50);
    
    if (!error && data) {
      setJobs(data as any);
    }
    setLoading(false);
  };

  return (
    <Layout>
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-hero border-b border-border/50">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />
        </div>
        <div ref={headerRef} className="container relative py-16 md:py-20">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              {jobs.length} zleceń
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Znajdź idealne zlecenie</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Przeglądaj dostępne zlecenia w swojej okolicy i zacznij zarabiać już dziś
          </p>
        </div>
      </div>

      <div className="container py-10">
        <div className="grid lg:grid-cols-[300px_1fr] gap-10">
          <aside className="space-y-4">
            <div className="sticky top-28">
              <JobFilters onFiltersChange={setFilters} />
            </div>
          </aside>

          <div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                <p className="text-muted-foreground font-medium">Ładowanie zleceń...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center">
                  <Search className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold mb-1">Brak zleceń</p>
                  <p className="text-muted-foreground">Nie znaleziono zleceń spełniających kryteria</p>
                </div>
              </div>
            ) : (
              <div ref={gridRef} className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {jobs.map((job) => (
                  <div key={job.id} className="job-card">
                    <JobCard job={job} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}