import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, BarChart3, Eye, MessageSquare, Clock, TrendingUp, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JobStats {
  id: string;
  title: string;
  views: number;
  responses: number;
}

interface HourlyStats {
  hour: number;
  views: number;
}

export default function Statistics() {
  const { isAuthenticated, profile } = useAuth();
  const navigate = useNavigate();
  const { subscribed, plan, loading: subLoading } = useSubscription();
  
  const [stats, setStats] = useState<{
    totalViews: number;
    totalResponses: number;
    bestHour: number | null;
    topJobs: JobStats[];
    hourlyData: HourlyStats[];
  }>({
    totalViews: 0,
    totalResponses: 0,
    bestHour: null,
    topJobs: [],
    hourlyData: [],
  });
  const [loading, setLoading] = useState(true);

  const hasAccess = subscribed && (plan === "pro" || plan === "boost");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    
    if (hasAccess && profile) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, hasAccess, profile]);

  const fetchStats = async () => {
    if (!profile) return;

    try {
      // Get user's jobs
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, title")
        .eq("user_id", profile.id);

      if (!jobs || jobs.length === 0) {
        setLoading(false);
        return;
      }

      const jobIds = jobs.map(j => j.id);

      // Get views
      const { data: views } = await supabase
        .from("job_views")
        .select("job_id, viewed_at")
        .in("job_id", jobIds);

      // Get responses
      const { data: responses } = await supabase
        .from("job_responses")
        .select("job_id")
        .in("job_id", jobIds);

      // Calculate stats
      const viewsByJob = new Map<string, number>();
      const responsesByJob = new Map<string, number>();
      const hourlyViews = new Array(24).fill(0);

      views?.forEach(v => {
        viewsByJob.set(v.job_id, (viewsByJob.get(v.job_id) || 0) + 1);
        const hour = new Date(v.viewed_at).getHours();
        hourlyViews[hour]++;
      });

      responses?.forEach(r => {
        responsesByJob.set(r.job_id, (responsesByJob.get(r.job_id) || 0) + 1);
      });

      // Find best hour
      let bestHour = 0;
      let maxViews = 0;
      hourlyViews.forEach((count, hour) => {
        if (count > maxViews) {
          maxViews = count;
          bestHour = hour;
        }
      });

      // Top jobs by engagement
      const topJobs = jobs
        .map(j => ({
          id: j.id,
          title: j.title,
          views: viewsByJob.get(j.id) || 0,
          responses: responsesByJob.get(j.id) || 0,
        }))
        .sort((a, b) => (b.views + b.responses * 5) - (a.views + a.responses * 5))
        .slice(0, 5);

      setStats({
        totalViews: views?.length || 0,
        totalResponses: responses?.length || 0,
        bestHour: maxViews > 0 ? bestHour : null,
        topJobs,
        hourlyData: hourlyViews.map((views, hour) => ({ hour, views })),
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (subLoading || loading) {
    return (
      <Layout>
        <div className="container py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!hasAccess) {
    return (
      <Layout>
        <div className="container py-12 max-w-2xl">
          <Card className="text-center">
            <CardContent className="py-12">
              <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              <h1 className="text-2xl font-bold mb-4">Statystyki dostępne w planie Pro i Boost</h1>
              <p className="text-muted-foreground mb-6">
                Uzyskaj dostęp do szczegółowych statystyk swoich ogłoszeń, najlepszych godzin publikacji
                i analizy zaangażowania.
              </p>
              <Button onClick={() => navigate("/subscription")}>
                Zobacz plany subskrypcji
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12 max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Statystyki</h1>
            <p className="text-muted-foreground">Analiza Twoich ogłoszeń</p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Wyświetlenia</p>
                  <p className="text-3xl font-bold">{stats.totalViews}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Odpowiedzi</p>
                  <p className="text-3xl font-bold">{stats.totalResponses}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Najlepsza godzina</p>
                  <p className="text-3xl font-bold">
                    {stats.bestHour !== null ? `${stats.bestHour}:00` : "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top jobs */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Najlepsze ogłoszenia
            </CardTitle>
            <CardDescription>Ranking wg zaangażowania</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topJobs.length > 0 ? (
              <div className="space-y-3">
                {stats.topJobs.map((job, i) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground w-6">
                        #{i + 1}
                      </span>
                      <span className="font-medium">{job.title}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {job.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {job.responses}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Brak danych do wyświetlenia
              </p>
            )}
          </CardContent>
        </Card>

        {/* Hourly distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Wyświetlenia wg godzin</CardTitle>
            <CardDescription>Kiedy Twoje ogłoszenia są najczęściej przeglądane</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-32">
              {stats.hourlyData.map((d) => {
                const maxViews = Math.max(...stats.hourlyData.map(h => h.views), 1);
                const height = (d.views / maxViews) * 100;
                return (
                  <div
                    key={d.hour}
                    className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors rounded-t relative group"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {d.hour}:00 - {d.views}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>0:00</span>
              <span>6:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>24:00</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
