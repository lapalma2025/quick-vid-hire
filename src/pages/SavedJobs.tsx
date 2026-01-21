import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link, Navigate } from "react-router-dom";
import { Loader2, Bookmark, MapPin, Calendar, Banknote, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { toast } from "sonner";
import { CategoryIcon } from "@/components/jobs/CategoryIcon";

interface SavedJob {
  id: string;
  created_at: string;
  job: {
    id: string;
    title: string;
    miasto: string;
    wojewodztwo: string;
    status: string;
    budget: number | null;
    start_time: string | null;
    category: { name: string } | null;
  } | null;
}

export default function SavedJobs() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchSavedJobs = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("saved_jobs")
        .select(`
          id,
          created_at,
          job:jobs(
            id,
            title,
            miasto,
            wojewodztwo,
            status,
            budget,
            start_time,
            category:categories(name)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setSavedJobs(data as SavedJob[]);
      }
      setIsLoading(false);
    };

    fetchSavedJobs();
  }, [user]);

  const handleRemove = async (savedJobId: string) => {
    const { error } = await supabase
      .from("saved_jobs")
      .delete()
      .eq("id", savedJobId);

    if (!error) {
      setSavedJobs((prev) => prev.filter((sj) => sj.id !== savedJobId));
      toast.success("Usunięto z zapisanych");
    } else {
      toast.error("Nie udało się usunąć");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            Aktywne
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
            W trakcie
          </Badge>
        );
      case "done":
        return (
          <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20">
            Zakończone
          </Badge>
        );
      case "closed":
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
            Zamknięte
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">{status}</Badge>
        );
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container py-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-hero border-b border-border/50">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-48 sm:w-64 h-48 sm:h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-36 sm:w-48 h-36 sm:h-48 bg-accent/10 rounded-full blur-3xl" />
        </div>
        <div className="container relative py-10 sm:py-16 px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Bookmark className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-bold mb-2">
            Zapisane oferty
          </h1>
          <p className="text-muted-foreground">
            Przeglądaj oferty, które zapisałeś do późniejszego przejrzenia
          </p>
        </div>
      </div>

      <div className="container py-8 px-4 sm:px-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Ładowanie zapisanych ofert...</p>
          </div>
        ) : savedJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center">
              <Bookmark className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold mb-1">Brak zapisanych ofert</p>
              <p className="text-muted-foreground mb-4">
                Zapisz oferty klikając ikonę zakładki na liście zleceń
              </p>
              <Button asChild>
                <Link to="/jobs">Przeglądaj oferty</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {savedJobs.map((savedJob) => {
              const job = savedJob.job;
              if (!job) return null;

              return (
                <Card
                  key={savedJob.id}
                  className="group overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                  <div className="p-4 space-y-4">
                    {/* Header with status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-border/50 flex items-center justify-center flex-shrink-0">
                          <CategoryIcon
                            name={job.category?.name || "Inne"}
                            className="h-5 w-5 text-primary"
                          />
                        </div>
                        {getStatusBadge(job.status)}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemove(savedJob.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {job.title}
                    </h3>

                    {/* Meta */}
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">
                          {job.miasto}, {job.wojewodztwo}
                        </span>
                      </div>
                      {job.start_time && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(job.start_time), "dd MMM yyyy", {
                              locale: pl,
                            })}
                          </span>
                        </div>
                      )}
                      {job.budget && (
                        <div className="flex items-center gap-2">
                          <Banknote className="h-4 w-4 text-emerald-600" />
                          <span className="font-semibold text-emerald-600">
                            {job.budget} zł
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <span className="text-xs text-muted-foreground">
                        Zapisano{" "}
                        {format(new Date(savedJob.created_at), "dd.MM.yyyy", {
                          locale: pl,
                        })}
                      </span>
                      <Button asChild size="sm" variant="outline" className="gap-1.5">
                        <Link to={`/jobs/${job.id}`}>
                          Zobacz
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
