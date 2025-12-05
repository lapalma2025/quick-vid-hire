import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { StarRating } from '@/components/ui/star-rating';
import { 
  MapPin, 
  Star, 
  Clock, 
  Banknote,
  CheckCircle2,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface WorkerProfile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  wojewodztwo: string | null;
  miasto: string | null;
  hourly_rate: number | null;
  rating_avg: number;
  rating_count: number;
  is_available: boolean;
  created_at: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: {
    name: string | null;
    avatar_url: string | null;
  };
  job: {
    title: string;
  };
}

interface Category {
  id: string;
  name: string;
}

export default function WorkerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchWorker();
      fetchReviews();
      fetchCategories();
    }
  }, [id]);

  const fetchWorker = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .eq('role', 'worker')
      .maybeSingle();

    if (data) {
      setWorker(data as any);
    }
    setLoading(false);
  };

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        reviewer:profiles!reviews_reviewer_id_fkey(name, avatar_url),
        job:jobs(title)
      `)
      .eq('reviewed_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setReviews(data as any);
    }
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('worker_categories')
      .select('category:categories(id, name)')
      .eq('worker_id', id);

    if (data) {
      setCategories(data.map(d => d.category).filter(Boolean) as Category[]);
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

  if (!worker) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">Profil nie został znaleziony</p>
          <Button asChild className="mt-4">
            <Link to="/jobs">Przeglądaj zlecenia</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Wróć
        </Button>

        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={worker.avatar_url || ''} />
                  <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                    {worker.name?.charAt(0)?.toUpperCase() || 'W'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">{worker.name || 'Wykonawca'}</h1>
                    {worker.is_available ? (
                      <Badge className="bg-success">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Dostępny
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Niedostępny</Badge>
                    )}
                  </div>
                  
                  {worker.rating_count > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <StarRating value={worker.rating_avg} readonly size="sm" />
                      <span className="font-medium">{worker.rating_avg.toFixed(1)}</span>
                      <span className="text-muted-foreground">({worker.rating_count} opinii)</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {worker.miasto && worker.wojewodztwo && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {worker.miasto}, {worker.wojewodztwo}
                      </div>
                    )}
                    {worker.hourly_rate && (
                      <div className="flex items-center gap-1">
                        <Banknote className="h-4 w-4" />
                        {worker.hourly_rate} zł/h
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Od {format(new Date(worker.created_at), 'MMMM yyyy', { locale: pl })}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Two column layout for Bio/Reviews and Categories */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Bio */}
            <Card>
              <CardHeader>
                <CardTitle>O mnie</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{worker.bio || 'Brak opisu'}</p>
              </CardContent>
            </Card>

            {/* Specializations */}
            <Card>
              <CardHeader>
                <CardTitle>Specjalizacje</CardTitle>
              </CardHeader>
              <CardContent>
                {categories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <Badge key={cat.id} variant="secondary">{cat.name}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Brak specjalizacji</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Reviews - Full width */}
          <Card>
            <CardHeader>
              <CardTitle>Opinie ({worker.rating_count})</CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <p className="text-muted-foreground">Brak opinii</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={review.reviewer.avatar_url || ''} />
                          <AvatarFallback>
                            {review.reviewer.name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {review.reviewer.name || 'Użytkownik'}
                            </span>
                            <StarRating value={review.rating} readonly size="sm" />
                          </div>
                          {review.comment && (
                            <p className="text-sm text-muted-foreground">{review.comment}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {review.job.title} • {format(new Date(review.created_at), 'dd MMM yyyy', { locale: pl })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}