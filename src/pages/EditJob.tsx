import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, ArrowLeft, Users } from 'lucide-react';
import { CategoryIcon } from '@/components/jobs/CategoryIcon';
import { ImageUpload } from '@/components/jobs/ImageUpload';
import { CityAutocomplete } from '@/components/jobs/CityAutocomplete';
import { WojewodztwoSelect } from '@/components/jobs/WojewodztwoSelect';
import { CountrySelect } from '@/components/jobs/CountrySelect';
import { ForeignCitySelect } from '@/components/jobs/ForeignCitySelect';
import { LocationTypeToggle } from '@/components/jobs/LocationTypeToggle';
import { Link } from 'react-router-dom';
import { WOJEWODZTWA } from '@/lib/constants';

interface Category {
  id: string;
  name: string;
}

export default function EditJob() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category_id: '',
    is_foreign: false,
    wojewodztwo: '',
    miasto: '',
    country: '',
    start_time: '',
    duration_hours: '',
    budget: '',
    budget_type: 'fixed' as 'fixed' | 'hourly',
    urgent: false,
    images: [] as string[],
    applicant_limit: 'unlimited' as string,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchCategories();
    if (id) fetchJob();
  }, [isAuthenticated, id]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name').order('name');
    if (data) setCategories(data);
  };

  const fetchJob = async () => {
    const { data: job, error } = await supabase
      .from('jobs')
      .select('*, job_images(image_url)')
      .eq('id', id)
      .single();

    if (error || !job) {
      toast({ title: 'Błąd', description: 'Nie znaleziono zlecenia', variant: 'destructive' });
      navigate('/dashboard');
      return;
    }

    if (job.user_id !== profile?.id) {
      toast({ title: 'Brak dostępu', description: 'To nie jest Twoje zlecenie', variant: 'destructive' });
      navigate('/dashboard');
      return;
    }

    const imgs = job.job_images?.map((i: any) => i.image_url) || [];
    setExistingImages(imgs);

    const isForeign = job.is_foreign || false;

    setForm({
      title: job.title || '',
      description: job.description || '',
      category_id: job.category_id || '',
      is_foreign: isForeign,
      wojewodztwo: isForeign ? '' : (job.wojewodztwo || ''),
      miasto: job.miasto || '',
      country: job.country || (isForeign ? job.wojewodztwo : '') || '',
      start_time: job.start_time ? job.start_time.slice(0, 16) : '',
      duration_hours: job.duration_hours?.toString() || '',
      budget: job.budget?.toString() || '',
      budget_type: (job.budget_type as 'fixed' | 'hourly') || 'fixed',
      urgent: job.urgent || false,
      images: imgs,
      applicant_limit: job.applicant_limit?.toString() || 'unlimited',
    });
    setLoading(false);
  };

  const updateForm = (field: string, value: any) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'wojewodztwo') {
        updated.miasto = '';
      }
      if (field === 'country') {
        updated.miasto = '';
      }
      if (field === 'is_foreign') {
        updated.wojewodztwo = '';
        updated.miasto = '';
        updated.country = '';
      }
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!profile || !id) return;

    setSaving(true);

    const { error } = await supabase
      .from('jobs')
      .update({
        title: form.title,
        description: form.description || null,
        category_id: form.category_id,
        is_foreign: form.is_foreign,
        wojewodztwo: form.is_foreign ? form.country : form.wojewodztwo,
        miasto: form.miasto,
        country: form.is_foreign ? form.country : null,
        start_time: form.start_time || null,
        duration_hours: form.duration_hours ? parseInt(form.duration_hours) : null,
        budget: form.budget ? parseFloat(form.budget) : null,
        budget_type: form.budget_type,
        urgent: form.urgent,
        applicant_limit: form.applicant_limit && form.applicant_limit !== "unlimited" ? parseInt(form.applicant_limit) : null,
      })
      .eq('id', id);

    if (error) {
      setSaving(false);
      toast({ title: 'Błąd', description: error.message, variant: 'destructive' });
      return;
    }

    const newImages = form.images.filter(img => !existingImages.includes(img));
    const removedImages = existingImages.filter(img => !form.images.includes(img));

    if (removedImages.length > 0) {
      await supabase.from('job_images').delete().eq('job_id', id).in('image_url', removedImages);
    }

    if (newImages.length > 0) {
      const imageInserts = newImages.map(url => ({ job_id: id, image_url: url }));
      await supabase.from('job_images').insert(imageInserts);
    }

    setSaving(false);
    toast({ title: 'Zapisano zmiany!' });
    navigate(`/jobs/${id}`);
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

  const isValid = form.title && form.category_id && form.miasto && 
    (form.is_foreign ? form.country : form.wojewodztwo);

  return (
    <Layout>
      <div className="container max-w-2xl py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to={`/jobs/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Wróć do zlecenia
          </Link>
        </Button>

        <h1 className="text-2xl font-bold mb-6">Edytuj zlecenie</h1>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Podstawowe informacje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tytuł zlecenia *</Label>
                <Input
                  placeholder="np. Pomoc przy przeprowadzce"
                  value={form.title}
                  onChange={(e) => updateForm('title', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Kategoria *</Label>
                <Select value={form.category_id} onValueChange={(v) => updateForm('category_id', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz kategorię" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <CategoryIcon name={c.name} className="h-4 w-4" />
                          {c.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Opis</Label>
                <Textarea
                  placeholder="Opisz szczegóły zlecenia..."
                  value={form.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Zdjęcia</Label>
                <ImageUpload
                  images={form.images}
                  onChange={(imgs) => updateForm('images', imgs)}
                  maxImages={5}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Zlecenie pilne</Label>
                  <p className="text-xs text-muted-foreground">Start dziś lub jutro</p>
                </div>
                <Switch
                  checked={form.urgent}
                  onCheckedChange={(v) => updateForm('urgent', v)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lokalizacja i termin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Location type toggle */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Rodzaj lokalizacji *</Label>
                <LocationTypeToggle
                  isForeign={form.is_foreign}
                  onChange={(v) => updateForm('is_foreign', v)}
                />
              </div>

              {/* Polish location */}
              {!form.is_foreign && (
                <div className="grid sm:grid-cols-2 gap-4 animate-fade-in">
                  <div className="space-y-2">
                    <Label>Województwo *</Label>
                    <WojewodztwoSelect
                      value={form.wojewodztwo}
                      onChange={(v) => updateForm('wojewodztwo', v)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Miasto *</Label>
                    <CityAutocomplete
                      value={form.miasto}
                      onChange={(miasto, region) => {
                        updateForm('miasto', miasto);
                        if (region) {
                          const normalizedRegion = region.toLowerCase();
                          const matchedWojewodztwo = WOJEWODZTWA.find(
                            w => w.toLowerCase() === normalizedRegion
                          );
                          if (matchedWojewodztwo && matchedWojewodztwo !== form.wojewodztwo) {
                            setForm(prev => ({ ...prev, miasto, wojewodztwo: matchedWojewodztwo }));
                          }
                        }
                      }}
                      placeholder="Wpisz miasto..."
                    />
                  </div>
                </div>
              )}

              {/* Foreign location */}
              {form.is_foreign && (
                <div className="grid sm:grid-cols-2 gap-4 animate-fade-in">
                  <div className="space-y-2">
                    <Label>Kraj *</Label>
                    <CountrySelect
                      value={form.country}
                      onChange={(v) => updateForm('country', v)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Miasto *</Label>
                    <ForeignCitySelect
                      country={form.country}
                      value={form.miasto}
                      onChange={(v) => updateForm('miasto', v)}
                      disabled={!form.country}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Data i godzina rozpoczęcia</Label>
                <Input
                  type="datetime-local"
                  value={form.start_time}
                  onChange={(e) => updateForm('start_time', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Szacowany czas pracy (godziny)</Label>
                <Input
                  type="number"
                  placeholder="np. 4"
                  value={form.duration_hours}
                  onChange={(e) => updateForm('duration_hours', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Budżet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Typ stawki</Label>
                <Select value={form.budget_type} onValueChange={(v) => updateForm('budget_type', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Kwota całkowita</SelectItem>
                    <SelectItem value="hourly">Stawka godzinowa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Budżet (PLN)</Label>
                <Input
                  type="number"
                  placeholder={form.budget_type === 'hourly' ? 'np. 30 zł/h' : 'np. 200 zł'}
                  value={form.budget}
                  onChange={(e) => updateForm('budget', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Limit aplikacji
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Ile osób może aplikować na to zlecenie</Label>
                <Select
                  value={form.applicant_limit}
                  onValueChange={(v) => updateForm('applicant_limit', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Bez ograniczeń" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unlimited">Bez ograniczeń</SelectItem>
                    <SelectItem value="5">5 osób</SelectItem>
                    <SelectItem value="10">10 osób</SelectItem>
                    <SelectItem value="25">25 osób</SelectItem>
                    <SelectItem value="50">50 osób</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" asChild>
              <Link to={`/jobs/${id}`}>Anuluj</Link>
            </Button>
            <Button onClick={handleSubmit} disabled={saving || !isValid}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Zapisz zmiany
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
