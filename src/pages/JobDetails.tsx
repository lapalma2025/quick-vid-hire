import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { StarRating } from '@/components/ui/star-rating';
import { 
  MapPin, 
  Clock, 
  Calendar, 
  Banknote, 
  Star, 
  MessageSquare,
  Loader2,
  ArrowLeft,
  Send,
  Play,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { CategoryIcon } from '@/components/jobs/CategoryIcon';

interface JobDetails {
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
  user_id: string;
  selected_worker_id: string | null;
  category: { name: string; icon: string } | null;
  job_images: { image_url: string }[];
  profile: {
    id: string;
    name: string | null;
    avatar_url: string | null;
    rating_avg: number;
    rating_count: number;
  } | null;
}

interface Response {
  id: string;
  message: string | null;
  offer_price: number | null;
  proposed_time: string | null;
  status: string;
  created_at: string;
  worker: {
    id: string;
    name: string | null;
    avatar_url: string | null;
    rating_avg: number;
    rating_count: number;
    bio: string | null;
  };
}

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, isAuthenticated, isWorker, isClient } = useAuth();
  const { toast } = useToast();
  
  const [job, setJob] = useState<JobDetails | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  
  const [responseForm, setResponseForm] = useState({
    message: '',
    offer_price: '',
  });

  const [ratingForm, setRatingForm] = useState({
    rating: 0,
    comment: '',
  });

  const isOwner = profile?.id === job?.user_id;
  const hasResponded = responses.some(r => r.worker.id === profile?.id);

  useEffect(() => {
    if (id) {
      fetchJob();
      fetchResponses();
    }
  }, [id]);

  const fetchJob = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        category:categories(name, icon),
        job_images(image_url),
        profile:profiles!jobs_user_id_fkey(id, name, avatar_url, rating_avg, rating_count)
      `)
      .eq('id', id)
      .maybeSingle();

    if (!error && data) {
      setJob(data as any);
    }
    setLoading(false);
  };

  const fetchResponses = async () => {
    const { data, error } = await supabase
      .from('job_responses')
      .select(`
        id,
        message,
        offer_price,
        proposed_time,
        status,
        created_at,
        worker:profiles!job_responses_worker_id_fkey(id, name, avatar_url, rating_avg, rating_count, bio)
      `)
      .eq('job_id', id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setResponses(data as any);
    }
  };

  const handleSubmitResponse = async () => {
    if (!profile || !id) return;

    setSubmitting(true);
    const { error } = await supabase.from('job_responses').insert({
      job_id: id,
      worker_id: profile.id,
      message: responseForm.message || null,
      offer_price: responseForm.offer_price ? parseFloat(responseForm.offer_price) : null,
    });
    setSubmitting(false);

    if (error) {
      toast({
        title: 'Błąd',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Oferta wysłana!' });
      setDialogOpen(false);
      setResponseForm({ message: '', offer_price: '' });
      fetchResponses();
    }
  };

  const handleSelectWorker = async (workerId: string) => {
    if (!job) return;

    const { error } = await supabase
      .from('jobs')
      .update({ selected_worker_id: workerId })
      .eq('id', job.id);

    if (error) {
      toast({
        title: 'Błąd',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Wykonawca wybrany! Teraz możesz rozpocząć realizację.' });
      fetchJob();
    }
  };

  const handleStartProgress = async () => {
    if (!job) return;

    const { error } = await supabase
      .from('jobs')
      .update({ status: 'in_progress' })
      .eq('id', job.id);

    if (error) {
      toast({
        title: 'Błąd',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Zlecenie rozpoczęte!' });
      fetchJob();
    }
  };

  const handleMarkDone = async (withRating: boolean = false) => {
    if (!job) return;

    setSubmitting(true);

    // If rating is provided, save the review first
    if (withRating && ratingForm.rating > 0 && job.selected_worker_id && profile) {
      const { error: reviewError } = await supabase.from('reviews').insert({
        job_id: job.id,
        reviewer_id: profile.id,
        reviewed_id: job.selected_worker_id,
        rating: ratingForm.rating,
        comment: ratingForm.comment || null,
      });

      if (reviewError) {
        toast({
          title: 'Błąd przy dodawaniu oceny',
          description: reviewError.message,
          variant: 'destructive',
        });
        setSubmitting(false);
        return;
      }
    }

    const { error } = await supabase
      .from('jobs')
      .update({ status: 'done' })
      .eq('id', job.id);

    setSubmitting(false);

    if (error) {
      toast({
        title: 'Błąd',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: withRating && ratingForm.rating > 0 ? 'Zlecenie zakończone i ocena dodana!' : 'Zlecenie zakończone!' });
      setRatingDialogOpen(false);
      setRatingForm({ rating: 0, comment: '' });
      fetchJob();
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!job) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">Zlecenie nie zostało znalezione</p>
          <Button asChild className="mt-4">
            <Link to="/jobs">Wróć do listy</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" asChild>
            <Link to="/jobs">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Wróć do listy
            </Link>
          </Button>
          {isOwner && (
            <div className="flex gap-2">
              {job.status === 'active' && !job.selected_worker_id && (
                <Button variant="outline" asChild>
                  <Link to={`/jobs/${job.id}/edit`}>Edytuj zlecenie</Link>
                </Button>
              )}
              {job.status === 'active' && job.selected_worker_id && (
                <Button onClick={handleStartProgress} className="gap-2">
                  <Play className="h-4 w-4" />
                  Rozpocznij realizację
                </Button>
              )}
              {job.status === 'in_progress' && (
                <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="secondary" className="gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Oznacz jako zakończone
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Zakończ zlecenie</DialogTitle>
                      <DialogDescription>
                        Oceń wykonawcę (opcjonalnie) i zakończ zlecenie
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Ocena wykonawcy</Label>
                        <StarRating
                          value={ratingForm.rating}
                          onChange={(v) => setRatingForm(prev => ({ ...prev, rating: v }))}
                          size="lg"
                          showValue
                        />
                        <p className="text-xs text-muted-foreground">
                          Kliknij gwiazdki, aby ocenić (możesz wybrać połówki)
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Komentarz (opcjonalnie)</Label>
                        <Textarea
                          placeholder="Napisz kilka słów o współpracy..."
                          value={ratingForm.comment}
                          onChange={(e) => setRatingForm(prev => ({ ...prev, comment: e.target.value }))}
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button 
                          onClick={() => handleMarkDone(true)} 
                          disabled={submitting}
                          className="flex-1"
                        >
                          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {ratingForm.rating > 0 ? 'Zakończ i oceń' : 'Zakończ bez oceny'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          {/* Main content */}
          <div className="space-y-6">
            {/* Images */}
            {job.job_images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {job.job_images.map((img, i) => (
                  <img
                    key={i}
                    src={img.image_url}
                    alt={`${job.title} ${i + 1}`}
                    className="rounded-lg aspect-video object-cover w-full"
                  />
                ))}
              </div>
            )}

            {/* Title & badges */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {job.category && (
                  <Badge variant="secondary" className="gap-1">
                    <CategoryIcon name={job.category.name} className="h-3 w-3" />
                    {job.category.name}
                  </Badge>
                )}
                {job.urgent && <Badge className="badge-urgent">PILNE</Badge>}
                <Badge variant="outline">{job.status}</Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">{job.title}</h1>
            </div>

            {/* Details */}
            <Card>
              <CardContent className="p-6 grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lokalizacja</p>
                    <p className="font-medium">{job.miasto}, {job.wojewodztwo}</p>
                  </div>
                </div>
                {job.start_time && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Termin</p>
                      <p className="font-medium">
                        {format(new Date(job.start_time), 'dd MMMM yyyy, HH:mm', { locale: pl })}
                      </p>
                    </div>
                  </div>
                )}
                {job.duration_hours && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Czas pracy</p>
                      <p className="font-medium">{job.duration_hours} godzin</p>
                    </div>
                  </div>
                )}
                {job.budget && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Banknote className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Budżet</p>
                      <p className="font-medium text-primary">
                        {job.budget} zł{job.budget_type === 'hourly' ? '/h' : ''}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            {job.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Opis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{job.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Responses (visible only to owner) */}
            {isOwner && responses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Oferty ({responses.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {responses.map((response) => (
                    <div key={response.id} className="flex gap-4 p-4 rounded-lg border">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={response.worker.avatar_url || ''} />
                        <AvatarFallback>
                          {response.worker.name?.charAt(0)?.toUpperCase() || 'W'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Link 
                            to={`/worker/${response.worker.id}`}
                            className="font-medium hover:underline"
                          >
                            {response.worker.name || 'Wykonawca'}
                          </Link>
                          {response.worker.rating_count > 0 && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Star className="h-3 w-3 fill-warning text-warning" />
                              {response.worker.rating_avg.toFixed(1)}
                            </div>
                          )}
                        </div>
                        {response.message && (
                          <p className="text-sm text-muted-foreground mb-2">{response.message}</p>
                        )}
                        {response.offer_price && (
                          <p className="text-sm font-medium text-primary">
                            Proponowana cena: {response.offer_price} zł
                          </p>
                        )}
                        <div className="flex gap-2 mt-3">
                          <Button 
                            size="sm" 
                            onClick={() => handleSelectWorker(response.worker.id)}
                            disabled={job.status !== 'active'}
                          >
                            Wybierz
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/worker/${response.worker.id}`}>Profil</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Owner card */}
            {job.profile && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Zleceniodawca</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={job.profile.avatar_url || ''} />
                      <AvatarFallback>
                        {job.profile.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{job.profile.name || 'Użytkownik'}</p>
                      {job.profile.rating_count > 0 && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="h-3 w-3 fill-warning text-warning" />
                          {job.profile.rating_avg.toFixed(1)} ({job.profile.rating_count})
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            {isAuthenticated && isWorker && !isOwner && job.status === 'active' && (
              <Card>
                <CardContent className="p-6">
                  {hasResponded ? (
                    <p className="text-center text-muted-foreground">
                      Już wysłałeś ofertę na to zlecenie
                    </p>
                  ) : (
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full gap-2">
                          <Send className="h-4 w-4" />
                          Odpowiedz na zlecenie
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Wyślij ofertę</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Twoja propozycja cenowa (opcjonalnie)</Label>
                            <Input
                              type="number"
                              placeholder="np. 150"
                              value={responseForm.offer_price}
                              onChange={(e) => setResponseForm(p => ({ ...p, offer_price: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Wiadomość</Label>
                            <Textarea
                              placeholder="Przedstaw się i opisz swoje doświadczenie..."
                              value={responseForm.message}
                              onChange={(e) => setResponseForm(p => ({ ...p, message: e.target.value }))}
                              rows={4}
                            />
                          </div>
                          <Button 
                            className="w-full" 
                            onClick={handleSubmitResponse}
                            disabled={submitting}
                          >
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Wyślij ofertę
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Chat button if worker selected */}
            {(isOwner || job.selected_worker_id === profile?.id) && job.selected_worker_id && (
              <Button asChild className="w-full gap-2">
                <Link to={`/jobs/${job.id}/chat`}>
                  <MessageSquare className="h-4 w-4" />
                  Przejdź do czatu
                </Link>
              </Button>
            )}

            {!isAuthenticated && (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground mb-4">
                    Zaloguj się, aby odpowiedzieć na to zlecenie
                  </p>
                  <Button asChild className="w-full">
                    <Link to="/login">Zaloguj się</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}