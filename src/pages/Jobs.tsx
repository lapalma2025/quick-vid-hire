import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { JobCard } from '@/components/jobs/JobCard';
import { JobFilters, type JobFilters as Filters } from '@/components/jobs/JobFilters';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

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

  useEffect(() => {
    fetchJobs();
  }, [filters]);

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
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Zlecenia</h1>
          <p className="text-muted-foreground">Znajdź zlecenie w swojej okolicy</p>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          <aside className="space-y-4">
            <JobFilters onFiltersChange={setFilters} />
          </aside>

          <div>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">Brak zleceń spełniających kryteria</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}