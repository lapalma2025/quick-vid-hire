import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { WOJEWODZTWA, MIASTA_BY_WOJEWODZTWO } from '@/lib/constants';
import { Loader2, ArrowRight, ArrowLeft, CreditCard } from 'lucide-react';
import { CategoryIcon } from '@/components/jobs/CategoryIcon';

interface Category {
  id: string;
  name: string;
}

type Step = 1 | 2 | 3;

export default function NewJob() {
  const navigate = useNavigate();
  const { profile, isAuthenticated, isClient } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category_id: '',
    wojewodztwo: '',
    miasto: '',
    start_time: '',
    duration_hours: '',
    budget: '',
    budget_type: 'fixed' as 'fixed' | 'hourly',
    urgent: false,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (profile && !isClient) {
      toast({
        title: 'Brak dostępu',
        description: 'Tylko zleceniodawcy mogą dodawać zlecenia',
        variant: 'destructive',
      });
      navigate('/jobs');
      return;
    }
    
    fetchCategories();
  }, [isAuthenticated, profile, isClient]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name').order('name');
    if (data) setCategories(data);
  };

  const miasta = form.wojewodztwo ? MIASTA_BY_WOJEWODZTWO[form.wojewodztwo] || [] : [];

  const updateForm = (field: string, value: any) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'wojewodztwo') {
        updated.miasto = '';
      }
      return updated;
    });
  };

  const validateStep = (s: Step): boolean => {
    if (s === 1) {
      return form.title.length >= 5 && form.category_id !== '';
    }
    if (s === 2) {
      return form.wojewodztwo !== '' && form.miasto !== '';
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!profile) return;

    setLoading(true);

    // Create job
    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        user_id: profile.id,
        title: form.title,
        description: form.description || null,
        category_id: form.category_id,
        wojewodztwo: form.wojewodztwo,
        miasto: form.miasto,
        start_time: form.start_time || null,
        duration_hours: form.duration_hours ? parseInt(form.duration_hours) : null,
        budget: form.budget ? parseFloat(form.budget) : null,
        budget_type: form.budget_type,
        urgent: form.urgent,
        status: 'active', // For demo, skip payment
        paid: true,
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      toast({
        title: 'Błąd',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Zlecenie dodane!' });
      navigate(`/jobs/${job.id}`);
    }
  };

  return (
    <Layout>
      <div className="container max-w-2xl py-8">
        <h1 className="text-2xl font-bold mb-6">Dodaj nowe zlecenie</h1>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step >= s 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div className={`flex-1 h-1 rounded ${step > s ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Basic info */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Podstawowe informacje</CardTitle>
              <CardDescription>Opisz czego potrzebujesz</CardDescription>
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
                <Label>Opis (opcjonalnie)</Label>
                <Textarea
                  placeholder="Opisz szczegóły zlecenia..."
                  value={form.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  rows={4}
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
        )}

        {/* Step 2: Location & time */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Lokalizacja i termin</CardTitle>
              <CardDescription>Gdzie i kiedy potrzebujesz pomocy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Województwo *</Label>
                  <Select value={form.wojewodztwo} onValueChange={(v) => updateForm('wojewodztwo', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz" />
                    </SelectTrigger>
                    <SelectContent>
                      {WOJEWODZTWA.map((w) => (
                        <SelectItem key={w} value={w}>{w}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Miasto *</Label>
                  <Select 
                    value={form.miasto} 
                    onValueChange={(v) => updateForm('miasto', v)}
                    disabled={!form.wojewodztwo}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz" />
                    </SelectTrigger>
                    <SelectContent>
                      {miasta.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

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
        )}

        {/* Step 3: Budget */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Budżet</CardTitle>
              <CardDescription>Ile jesteś w stanie zapłacić</CardDescription>
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

              {/* Summary */}
              <div className="rounded-lg border p-4 space-y-2 mt-6">
                <h4 className="font-medium">Podsumowanie</h4>
                <p className="text-sm"><strong>Tytuł:</strong> {form.title}</p>
                <p className="text-sm"><strong>Lokalizacja:</strong> {form.miasto}, {form.wojewodztwo}</p>
                {form.budget && (
                  <p className="text-sm">
                    <strong>Budżet:</strong> {form.budget} zł{form.budget_type === 'hourly' ? '/h' : ''}
                  </p>
                )}
                {form.urgent && <p className="text-sm text-destructive font-medium">⚡ Zlecenie pilne</p>}
              </div>

              <div className="bg-muted rounded-lg p-4 flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-medium">Opłata za publikację: 5 zł</p>
                  <p className="text-muted-foreground">Karta lub BLIK</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep((s) => (s - 1) as Step)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Wstecz
            </Button>
          ) : (
            <div />
          )}
          
          {step < 3 ? (
            <Button 
              onClick={() => setStep((s) => (s + 1) as Step)}
              disabled={!validateStep(step)}
            >
              Dalej
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Opublikuj za 5 zł
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
}