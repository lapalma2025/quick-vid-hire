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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useViewModeStore } from '@/store/viewModeStore';
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
  CheckCircle2,
  X,
  Check,
  Users
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
  allows_group: boolean | null;
  min_workers: number | null;
  max_workers: number | null;
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
  is_group_application: boolean | null;
  group_size: number | null;
  group_members: string[] | null;
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
  const { profile, isAuthenticated } = useAuth();
  const { viewMode } = useViewModeStore();
  const isWorkerView = viewMode === 'worker';
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
    is_group: false,
    group_size: '2',
    group_members: '',
  });

  const [ratingForm, setRatingForm] = useState({
    rating: 0,
    comment: '',
  });

  const [workerRatingForm, setWorkerRatingForm] = useState({
    rating: 0,
    comment: '',
  });

  const [workerRatingDialogOpen, setWorkerRatingDialogOpen] = useState(false);
  const [hasRatedClient, setHasRatedClient] = useState(false);
  const [hasClientRated, setHasClientRated] = useState(false);

  const isOwner = profile?.id === job?.user_id;
  const isSelectedWorker = profile?.id === job?.selected_worker_id;
  const hasResponded = responses.some(r => r.worker.id === profile?.id);
  
  // Find selected worker's response
  const selectedWorkerResponse = responses.find(r => r.worker.id === job?.selected_worker_id);
  // Find current user's response (if worker)
  const myResponse = responses.find(r => r.worker.id === profile?.id);

  useEffect(() => {
    if (id) {
      fetchJob();
      fetchResponses();
    }
  }, [id]);

  useEffect(() => {
    if (job && profile && job.status === 'done') {
      checkExistingRatings();
    }
  }, [job, profile]);

  const checkExistingRatings = async () => {
    if (!job || !profile) return;
    
    const { data: clientRating } = await supabase
      .from('reviews')
      .select('id')
      .eq('job_id', job.id)
      .eq('reviewer_id', job.user_id)
      .maybeSingle();
    
    setHasClientRated(!!clientRating);

    if (job.selected_worker_id) {
      const { data: workerRating } = await supabase
        .from('reviews')
        .select('id')
        .eq('job_id', job.id)
        .eq('reviewer_id', job.selected_worker_id)
        .maybeSingle();
      
      setHasRatedClient(!!workerRating);
    }
  };

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
        is_group_application,
        group_size,
        group_members,
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
    const groupMembers = responseForm.is_group && responseForm.group_members 
      ? responseForm.group_members.split(',').map(m => m.trim()).filter(Boolean)
      : null;
    
    const { error } = await supabase.from('job_responses').insert({
      job_id: id,
      worker_id: profile.id,
      message: responseForm.message || null,
      offer_price: responseForm.offer_price ? parseFloat(responseForm.offer_price) : null,
      is_group_application: responseForm.is_group,
      group_size: responseForm.is_group ? parseInt(responseForm.group_size) : 1,
      group_members: groupMembers,
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
      setResponseForm({ message: '', offer_price: '', is_group: false, group_size: '2', group_members: '' });
      fetchResponses();
    }
  };

  const handleSelectWorker = async (workerId: string, responseId: string) => {
    if (!job) return;

    setSubmitting(true);
    
    // Update job with selected worker
    const { error: jobError } = await supabase
      .from('jobs')
      .update({ selected_worker_id: workerId })
      .eq('id', job.id);

    if (jobError) {
      toast({ title: 'Błąd', description: jobError.message, variant: 'destructive' });
      setSubmitting(false);
      return;
    }

    // Update response status to 'selected'
    const { error: responseError } = await supabase
      .from('job_responses')
      .update({ status: 'selected' })
      .eq('id', responseId);

    if (responseError) {
      toast({ title: 'Błąd', description: responseError.message, variant: 'destructive' });
      setSubmitting(false);
      return;
    }

    // Update local state immediately for instant UI feedback
    setJob(prev => prev ? { ...prev, selected_worker_id: workerId } : null);
    setResponses(prev => prev.map(r => 
      r.id === responseId ? { ...r, status: 'selected' } : r
    ));

    toast({ title: 'Wykonawca wybrany! Teraz kliknij "Wyślij do realizacji".' });
    setSubmitting(false);
  };

  const handleStartProgress = async () => {
    if (!job || !job.selected_worker_id || !selectedWorkerResponse) return;

    setSubmitting(true);

    // Update job status
    const { error: jobError } = await supabase
      .from('jobs')
      .update({ status: 'in_progress' })
      .eq('id', job.id);

    if (jobError) {
      toast({ title: 'Błąd', description: jobError.message, variant: 'destructive' });
      setSubmitting(false);
      return;
    }

    // Update response status to awaiting confirmation
    const { error: responseError } = await supabase
      .from('job_responses')
      .update({ status: 'awaiting_confirmation' })
      .eq('id', selectedWorkerResponse.id);

    if (responseError) {
      toast({ title: 'Błąd', description: responseError.message, variant: 'destructive' });
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    toast({ title: 'Wysłano do potwierdzenia! Wykonawca zobaczy powiadomienie.' });
    fetchJob();
    fetchResponses();
  };

  const handleWorkerAccept = async () => {
    if (!myResponse || !job) return;

    setSubmitting(true);

    const { error } = await supabase
      .from('job_responses')
      .update({ status: 'accepted' })
      .eq('id', myResponse.id);

    if (error) {
      toast({ title: 'Błąd', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Zlecenie zaakceptowane!' });
      fetchResponses();
      fetchJob();
    }

    setSubmitting(false);
  };

  const handleWorkerReject = async () => {
    if (!myResponse || !job) return;

    setSubmitting(true);

    // Update response status
    const { error: responseError } = await supabase
      .from('job_responses')
      .update({ status: 'rejected' })
      .eq('id', myResponse.id);

    if (responseError) {
      toast({ title: 'Błąd', description: responseError.message, variant: 'destructive' });
      setSubmitting(false);
      return;
    }

    // Clear selected worker and set job back to active
    const { error: jobError } = await supabase
      .from('jobs')
      .update({ selected_worker_id: null, status: 'active' })
      .eq('id', job.id);

    if (jobError) {
      toast({ title: 'Błąd', description: jobError.message, variant: 'destructive' });
    } else {
      toast({ title: 'Zlecenie odrzucone' });
      fetchJob();
      fetchResponses();
    }

    setSubmitting(false);
  };

  const handleCancelJob = async () => {
    if (!job) return;

    setSubmitting(true);

    const { error } = await supabase
      .from('jobs')
      .update({ status: 'closed', selected_worker_id: null })
      .eq('id', job.id);

    setSubmitting(false);

    if (error) {
      toast({ title: 'Błąd', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Zlecenie anulowane' });
      navigate('/dashboard');
    }
  };

  const handleMarkDone = async (withRating: boolean = false) => {
    if (!job) return;

    setSubmitting(true);

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
      toast({ title: 'Błąd', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: withRating && ratingForm.rating > 0 ? 'Zlecenie zakończone i ocena dodana!' : 'Zlecenie zakończone!' });
      setRatingDialogOpen(false);
      setRatingForm({ rating: 0, comment: '' });
      fetchJob();
      checkExistingRatings();
    }
  };

  const handleWorkerRateClient = async () => {
    if (!job || !profile) return;

    setSubmitting(true);

    const { error } = await supabase.from('reviews').insert({
      job_id: job.id,
      reviewer_id: profile.id,
      reviewed_id: job.user_id,
      rating: workerRatingForm.rating,
      comment: workerRatingForm.comment || null,
    });

    setSubmitting(false);

    if (error) {
      toast({ title: 'Błąd', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Ocena dodana!' });
      setWorkerRatingDialogOpen(false);
      setWorkerRatingForm({ rating: 0, comment: '' });
      setHasRatedClient(true);
    }
  };

  const handleClientRateWorker = async () => {
    if (!job || !profile || !job.selected_worker_id) return;

    setSubmitting(true);

    const { error } = await supabase.from('reviews').insert({
      job_id: job.id,
      reviewer_id: profile.id,
      reviewed_id: job.selected_worker_id,
      rating: ratingForm.rating,
      comment: ratingForm.comment || null,
    });

    setSubmitting(false);

    if (error) {
      toast({ title: 'Błąd', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Ocena dodana!' });
      setRatingForm({ rating: 0, comment: '' });
      setHasClientRated(true);
    }
  };

  const getResponseStatusBadge = (status: string) => {
    switch (status) {
      case 'selected':
        return <Badge variant="secondary">Wybrany</Badge>;
      case 'awaiting_confirmation':
        return <Badge className="bg-warning text-warning-foreground">Oczekuje potwierdzenia</Badge>;
      case 'accepted':
        return <Badge className="bg-green-500 text-white">Zaakceptowany</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Odrzucony</Badge>;
      default:
        return null;
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
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Wróć
          </Button>
          {isOwner && (
            <div className="flex gap-2">
              {job.status === 'active' && !job.selected_worker_id && (
                <Button variant="outline" asChild>
                  <Link to={`/jobs/${job.id}/edit`}>Edytuj zlecenie</Link>
                </Button>
              )}
              {job.status === 'active' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10">
                      <X className="h-4 w-4 mr-2" />
                      Anuluj
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Anulować zlecenie?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Czy na pewno chcesz anulować to zlecenie? Ta akcja jest nieodwracalna.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Nie</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancelJob} className="bg-destructive hover:bg-destructive/90">
                        Tak, anuluj
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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

        <div className="max-w-4xl mx-auto">
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
                {job.allows_group && (
                  <Badge className="bg-purple-500 text-white gap-1">
                    <Users className="h-3 w-3" />
                    GRUPA {job.min_workers}-{job.max_workers}
                  </Badge>
                )}
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
                  {responses.map((response) => {
                    const isSelected = job.selected_worker_id === response.worker.id;
                    const canSelect = job.status === 'active' && !job.selected_worker_id;
                    const showStartButton = isSelected && response.status === 'selected';
                    
                    return (
                      <div key={response.id} className={`flex gap-4 p-4 rounded-lg border ${isSelected ? 'border-primary bg-primary/5' : ''}`}>
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={response.worker.avatar_url || ''} />
                          <AvatarFallback>
                            {response.worker.name?.charAt(0)?.toUpperCase() || 'W'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                            {getResponseStatusBadge(response.status)}
                          </div>
                          {response.message && (
                            <p className="text-sm text-muted-foreground mb-2">{response.message}</p>
                          )}
                          {response.offer_price && (
                            <p className="text-sm font-medium text-primary">
                              Proponowana cena: {response.offer_price} zł
                            </p>
                          )}
                          <div className="flex gap-2 mt-3 flex-wrap">
                            {canSelect && (
                              <Button 
                                size="sm" 
                                onClick={() => handleSelectWorker(response.worker.id, response.id)}
                                disabled={submitting}
                              >
                                {submitting && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                                Wybierz
                              </Button>
                            )}
                            {showStartButton && (
                              <Button 
                                size="sm" 
                                onClick={handleStartProgress}
                                disabled={submitting}
                                className="gap-1"
                              >
                                {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
                                <Send className="h-3 w-3" />
                                Wyślij do realizacji
                              </Button>
                            )}
                            <Button size="sm" variant="outline" asChild className="gap-1">
                              <Link to={`/jobs/${job.id}/chat`}>
                                <MessageSquare className="h-3 w-3" />
                                Czat
                              </Link>
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                              <Link to={`/worker/${response.worker.id}`}>Profil</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Worker confirmation dialog - opens automatically */}
            <Dialog open={isSelectedWorker && myResponse?.status === 'awaiting_confirmation'} onOpenChange={() => {}}>
              <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                  <DialogTitle className="text-xl">🎉 Zostałeś wybrany!</DialogTitle>
                  <DialogDescription className="text-base pt-2">
                    Zleceniodawca chce rozpocząć z Tobą realizację zlecenia <strong>"{job.title}"</strong>. Czy akceptujesz?
                  </DialogDescription>
                </DialogHeader>
                <div className="flex gap-3 pt-4">
                  <Button onClick={handleWorkerAccept} disabled={submitting} className="flex-1 gap-2">
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Check className="h-4 w-4" />
                    Akceptuję
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="flex-1 gap-2 text-destructive border-destructive hover:bg-destructive/10">
                        <X className="h-4 w-4" />
                        Odrzuć
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Odrzucić zlecenie?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Czy na pewno chcesz odrzucić to zlecenie? Zleceniodawca będzie mógł wybrać innego wykonawcę.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                        <AlertDialogAction onClick={handleWorkerReject} className="bg-destructive hover:bg-destructive/90">
                          Tak, odrzuć
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </DialogContent>
            </Dialog>

            {/* Worker response action - inline */}
            {isAuthenticated && isWorkerView && !isOwner && job.status === 'active' && !job.selected_worker_id && (
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
                          
                          {/* Group application section */}
                          {job.allows_group && (
                            <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                    <Users className="h-4 w-4 text-purple-500" />
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Zgłoś się jako grupa</Label>
                                    <p className="text-xs text-muted-foreground">
                                      Min. {job.min_workers} - max. {job.max_workers} osób
                                    </p>
                                  </div>
                                </div>
                                <Switch
                                  checked={responseForm.is_group}
                                  onCheckedChange={(v) => setResponseForm(p => ({ ...p, is_group: v }))}
                                />
                              </div>
                              
                              {responseForm.is_group && (
                                <div className="space-y-3 pt-2 animate-fade-in">
                                  <div className="space-y-2">
                                    <Label className="text-sm">Liczba osób w grupie</Label>
                                    <Select 
                                      value={responseForm.group_size} 
                                      onValueChange={(v) => setResponseForm(p => ({ ...p, group_size: v }))}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Array.from({ length: (job.max_workers || 5) - (job.min_workers || 1) + 1 }, (_, i) => (job.min_workers || 1) + i).map(n => (
                                          <SelectItem key={n} value={n.toString()}>{n} osób</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-sm">Imiona członków grupy (opcjonalnie)</Label>
                                    <Input
                                      placeholder="np. Jan, Anna, Piotr"
                                      value={responseForm.group_members}
                                      onChange={(e) => setResponseForm(p => ({ ...p, group_members: e.target.value }))}
                                    />
                                    <p className="text-xs text-muted-foreground">Oddziel imiona przecinkami</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <Button 
                            className="w-full" 
                            onClick={handleSubmitResponse}
                            disabled={submitting}
                          >
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {responseForm.is_group ? `Wyślij ofertę grupową (${responseForm.group_size} os.)` : 'Wyślij ofertę'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Worker rating for client (after job is done) */}
            {isSelectedWorker && job.status === 'done' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Oceń zleceniodawcę</CardTitle>
                </CardHeader>
                <CardContent>
                  {hasRatedClient ? (
                    <p className="text-sm text-muted-foreground text-center">
                      ✓ Już oceniłeś zleceniodawcę
                    </p>
                  ) : (
                    <Dialog open={workerRatingDialogOpen} onOpenChange={setWorkerRatingDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full gap-2">
                          <Star className="h-4 w-4" />
                          Wystaw ocenę
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Oceń zleceniodawcę</DialogTitle>
                          <DialogDescription>
                            Podziel się opinią o współpracy
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Ocena</Label>
                            <StarRating
                              value={workerRatingForm.rating}
                              onChange={(v) => setWorkerRatingForm(prev => ({ ...prev, rating: v }))}
                              size="lg"
                              showValue
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Komentarz (opcjonalnie)</Label>
                            <Textarea
                              placeholder="Napisz kilka słów o współpracy..."
                              value={workerRatingForm.comment}
                              onChange={(e) => setWorkerRatingForm(prev => ({ ...prev, comment: e.target.value }))}
                              rows={3}
                            />
                          </div>
                          <Button 
                            onClick={handleWorkerRateClient} 
                            disabled={submitting || workerRatingForm.rating === 0}
                            className="w-full"
                          >
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Wyślij ocenę
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Client rating reminder (after job is done) */}
            {isOwner && job.status === 'done' && !hasClientRated && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Oceń wykonawcę</CardTitle>
                </CardHeader>
                <CardContent>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full gap-2">
                        <Star className="h-4 w-4" />
                        Wystaw ocenę
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Oceń wykonawcę</DialogTitle>
                        <DialogDescription>
                          Podziel się opinią o współpracy
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Ocena</Label>
                          <StarRating
                            value={ratingForm.rating}
                            onChange={(v) => setRatingForm(prev => ({ ...prev, rating: v }))}
                            size="lg"
                            showValue
                          />
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
                        <Button 
                          onClick={handleClientRateWorker} 
                          disabled={submitting || ratingForm.rating === 0}
                          className="w-full"
                        >
                          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Wyślij ocenę
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
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
