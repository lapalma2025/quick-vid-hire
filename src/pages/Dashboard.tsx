import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useViewModeStore } from '@/store/viewModeStore';
import { 
  Plus, 
  Briefcase, 
  MessageSquare, 
  Star,
  Clock,
  CheckCircle2,
  Archive,
  Loader2,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { JOB_STATUSES } from '@/lib/constants';

interface Job {
  id: string;
  title: string;
  status: keyof typeof JOB_STATUSES;
  created_at: string;
  responses_count?: number;
}

interface Response {
  id: string;
  status: string;
  created_at: string;
  job: {
    id: string;
    title: string;
    miasto: string;
    budget: number | null;
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, isAuthenticated, isLoading } = useAuth();
  const { viewMode } = useViewModeStore();
  const isClientView = viewMode === 'client';
  const isWorkerView = viewMode === 'worker';
  const [jobs, setJobs] = useState<Job[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [filterResponses, setFilterResponses] = useState<'all' | 'with_responses'>('all');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    if (profile) {
      if (isClientView) {
        fetchClientJobs();
      } else if (isWorkerView) {
        fetchWorkerResponses();
      }
    }
  }, [profile, isClientView, isWorkerView]);

  const fetchClientJobs = async () => {
    if (!profile) return;
    
    const { data } = await supabase
      .from('jobs')
      .select(`
        id,
        title,
        status,
        created_at,
        job_responses(id)
      `)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    if (data) {
      setJobs(data.map(j => ({
        ...j,
        responses_count: j.job_responses?.length || 0,
      })) as any);
    }
    setLoading(false);
  };

  const fetchWorkerResponses = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from('job_responses')
      .select(`
        id,
        status,
        created_at,
        job:jobs(id, title, miasto, budget)
      `)
      .eq('worker_id', profile.id)
      .order('created_at', { ascending: false });

    if (data) {
      setResponses(data as any);
    }
    setLoading(false);
  };

  const sortedAndFilteredJobs = useMemo(() => {
    let filtered = [...jobs];
    
    if (filterResponses === 'with_responses') {
      filtered = filtered.filter(j => (j.responses_count || 0) > 0);
    }
    
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    return filtered;
  }, [jobs, sortOrder, filterResponses]);

  if (isLoading || loading) {
    return (
      <Layout>
        <div className="container py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const activeJobs = sortedAndFilteredJobs.filter(j => j.status === 'active');
  const inProgressJobs = sortedAndFilteredJobs.filter(j => j.status === 'in_progress');
  const doneJobs = sortedAndFilteredJobs.filter(j => j.status === 'done' || j.status === 'archived' || j.status === 'closed');

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">
              Cześć, {profile?.name || 'Użytkowniku'}!
            </h1>
            <p className="text-muted-foreground">
              {isClientView ? 'Panel zleceniodawcy' : 'Panel wykonawcy'}
            </p>
          </div>
          {isClientView && (
            <Button asChild className="gap-2">
              <Link to="/jobs/new">
                <Plus className="h-4 w-4" />
                Dodaj zlecenie
              </Link>
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {isClientView ? (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Briefcase className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{activeJobs.length}</p>
                      <p className="text-sm text-muted-foreground">Aktywne</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-secondary/10">
                      <Clock className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{inProgressJobs.length}</p>
                      <p className="text-sm text-muted-foreground">W realizacji</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-success/10">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{doneJobs.length}</p>
                      <p className="text-sm text-muted-foreground">Zakończone</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-warning/10">
                      <MessageSquare className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {jobs.reduce((sum, j) => sum + (j.responses_count || 0), 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">Ofert</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{responses.length}</p>
                      <p className="text-sm text-muted-foreground">Wysłanych ofert</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-success/10">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {responses.filter(r => r.status === 'accepted').length}
                      </p>
                      <p className="text-sm text-muted-foreground">Zaakceptowane</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-warning/10">
                      <Star className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{profile?.rating_avg?.toFixed(1) || '0.0'}</p>
                      <p className="text-sm text-muted-foreground">Średnia ocena</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-accent/10">
                      <Archive className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{profile?.rating_count || 0}</p>
                      <p className="text-sm text-muted-foreground">Opinii</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Client: Jobs list */}
        {isClientView && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Moje zlecenia</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'newest' | 'oldest')}>
                  <SelectTrigger className="w-[140px] h-9">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Od najnowszych</SelectItem>
                    <SelectItem value="oldest">Od najstarszych</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterResponses} onValueChange={(v) => setFilterResponses(v as 'all' | 'with_responses')}>
                  <SelectTrigger className="w-[160px] h-9">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie</SelectItem>
                    <SelectItem value="with_responses">Ze zgłoszeniami</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="active">
                <TabsList>
                  <TabsTrigger value="active">Aktywne ({activeJobs.length})</TabsTrigger>
                  <TabsTrigger value="progress">W realizacji ({inProgressJobs.length})</TabsTrigger>
                  <TabsTrigger value="done">Zakończone ({doneJobs.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="active" className="space-y-4 mt-4">
                  {activeJobs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Brak aktywnych zleceń</p>
                  ) : (
                    activeJobs.map((job) => (
                      <Link key={job.id} to={`/jobs/${job.id}`} className="block">
                        <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                          <div>
                            <p className="font-medium">{job.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(job.created_at), 'dd MMM yyyy', { locale: pl })}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            {job.responses_count! > 0 && (
                              <Badge variant="secondary">{job.responses_count} ofert</Badge>
                            )}
                            <Badge>{JOB_STATUSES[job.status].label}</Badge>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="progress" className="space-y-4 mt-4">
                  {inProgressJobs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Brak zleceń w realizacji</p>
                  ) : (
                    inProgressJobs.map((job) => (
                      <Link key={job.id} to={`/jobs/${job.id}`} className="block">
                        <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                          <div>
                            <p className="font-medium">{job.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(job.created_at), 'dd MMM yyyy', { locale: pl })}
                            </p>
                          </div>
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/jobs/${job.id}/chat`}>Czat</Link>
                          </Button>
                        </div>
                      </Link>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="done" className="space-y-4 mt-4">
                  {doneJobs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Brak zakończonych zleceń</p>
                  ) : (
                    doneJobs.map((job) => (
                      <Link key={job.id} to={`/jobs/${job.id}`} className="block">
                        <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                          <div>
                            <p className="font-medium">{job.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(job.created_at), 'dd MMM yyyy', { locale: pl })}
                            </p>
                          </div>
                          <Badge variant="outline">{JOB_STATUSES[job.status].label}</Badge>
                        </div>
                      </Link>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Worker: Responses list */}
        {isWorkerView && (
          <Card>
            <CardHeader>
              <CardTitle>Moje oferty</CardTitle>
            </CardHeader>
            <CardContent>
              {responses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Nie wysłałeś jeszcze żadnych ofert</p>
                  <Button asChild>
                    <Link to="/jobs">Przeglądaj zlecenia</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {responses.map((response) => (
                    <Link key={response.id} to={`/jobs/${response.job.id}`} className="block">
                      <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div>
                          <p className="font-medium">{response.job.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {response.job.miasto} • {response.job.budget ? `${response.job.budget} zł` : 'Do ustalenia'}
                          </p>
                        </div>
                        <Badge variant={response.status === 'accepted' ? 'default' : 'secondary'}>
                          {response.status === 'accepted' ? 'Zaakceptowana' : 
                           response.status === 'rejected' ? 'Odrzucona' : 'Oczekuje'}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}