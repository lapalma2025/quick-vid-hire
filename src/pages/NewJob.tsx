import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight, ArrowLeft, CreditCard, CheckCircle, Users, Sparkles, Crown, Star, Zap, AlertTriangle } from 'lucide-react';
import { CategoryIcon } from '@/components/jobs/CategoryIcon';
import { ImageUpload } from '@/components/jobs/ImageUpload';
import { CityAutocomplete } from '@/components/jobs/CityAutocomplete';
import { WojewodztwoSelect } from '@/components/jobs/WojewodztwoSelect';
import { CountrySelect } from '@/components/jobs/CountrySelect';
import { ForeignCitySelect } from '@/components/jobs/ForeignCitySelect';
import { LocationTypeToggle } from '@/components/jobs/LocationTypeToggle';
import { WOJEWODZTWA } from '@/lib/constants';
import { PREMIUM_ADDONS } from '@/lib/stripe';

interface Category {
  id: string;
  name: string;
}

type Step = 1 | 2 | 3 | 4;

export default function NewJob() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile, isAuthenticated } = useAuth();
  const { subscribed, plan, remainingListings, remainingHighlights, checkSubscription } = useSubscription();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);

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
    allows_group: false,
    min_workers: '1',
    max_workers: '1',
  });

  const [addons, setAddons] = useState({
    highlight: false,
    promote: false,
    urgent: false,
    promote_24h: false,
  });

  // Check for success callback from Stripe
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setPaymentComplete(true);
      checkSubscription();
      toast({ title: 'Płatność zakończona!', description: 'Możesz teraz opublikować zlecenie.' });
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    fetchCategories();
  }, [isAuthenticated]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name').order('name');
    if (data) setCategories(data);
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

  const validateStep = (s: Step): boolean => {
    if (s === 1) {
      return form.title.length >= 5 && form.category_id !== '';
    }
    if (s === 2) {
      if (form.is_foreign) {
        return form.country !== '' && form.miasto !== '';
      }
      return form.wojewodztwo !== '' && form.miasto !== '';
    }
    return true;
  };

  // Calculate total price
  const calculatePrice = () => {
    let total = 0;
    const details: string[] = [];

    // Base price (if no subscription or no remaining listings)
    if (!subscribed || remainingListings <= 0) {
      total += 5;
      details.push('Publikacja: 5 zł');
    } else {
      details.push('Publikacja: z pakietu');
    }

    // Addons
    if (addons.highlight) {
      if (remainingHighlights > 0) {
        details.push('Wyróżnienie: z pakietu');
      } else {
        total += PREMIUM_ADDONS.highlight.price;
        details.push(`Wyróżnienie: ${PREMIUM_ADDONS.highlight.price} zł`);
      }
    }
    if (addons.promote) {
      total += PREMIUM_ADDONS.promote.price;
      details.push(`Podświetlenie: ${PREMIUM_ADDONS.promote.price} zł`);
    }
    if (addons.urgent) {
      total += PREMIUM_ADDONS.urgent.price;
      details.push(`PILNE: ${PREMIUM_ADDONS.urgent.price} zł`);
    }
    if (addons.promote_24h) {
      total += PREMIUM_ADDONS.promote_24h.price;
      details.push(`Promowanie 24h: ${PREMIUM_ADDONS.promote_24h.price} zł`);
    }

    return { total, details };
  };

  const handlePayment = async () => {
    if (!profile) return;
    
    const { total } = calculatePrice();
    
    // If user has subscription with remaining listings and total is 0
    if (subscribed && remainingListings > 0 && total === 0) {
      // Use from subscription - deduct listing
      const { error } = await supabase
        .from('profiles')
        .update({ 
          remaining_listings: remainingListings - 1,
          remaining_highlights: addons.highlight && remainingHighlights > 0 
            ? remainingHighlights - 1 
            : remainingHighlights
        })
        .eq('id', profile.id);

      if (!error) {
        setPaymentComplete(true);
        checkSubscription();
        toast({ title: 'Ogłoszenie odliczone z pakietu!' });
      }
      return;
    }

    // Proceed with Stripe checkout
    setPaymentProcessing(true);
    
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('Not authenticated');
      }

      const checkoutType = subscribed && remainingListings > 0 ? 'addons_only' : 'single_listing';
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          type: checkoutType, 
          addons: {
            highlight: addons.highlight && remainingHighlights <= 0,
            promote: addons.promote,
            urgent: addons.urgent,
            promote_24h: addons.promote_24h,
          }
        },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast({ title: 'Błąd', description: 'Nie udało się utworzyć płatności', variant: 'destructive' });
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (!profile || !paymentComplete) return;

    setLoading(true);

    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        user_id: profile.id,
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
        urgent: form.urgent || addons.urgent,
        status: 'active',
        paid: true,
        allows_group: form.allows_group,
        min_workers: form.allows_group ? parseInt(form.min_workers) : 1,
        max_workers: form.allows_group ? parseInt(form.max_workers) : 1,
        is_highlighted: addons.highlight,
        is_promoted: addons.promote || addons.promote_24h,
        promotion_expires_at: addons.promote_24h 
          ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() 
          : null,
      })
      .select()
      .single();

    if (error) {
      setLoading(false);
      toast({
        title: 'Błąd',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    if (form.images.length > 0 && job) {
      const imageInserts = form.images.map(url => ({
        job_id: job.id,
        image_url: url,
      }));
      await supabase.from('job_images').insert(imageInserts);
    }

    setLoading(false);
    toast({ title: 'Zlecenie dodane!' });
    navigate(`/jobs/${job.id}`);
  };

  const { total: totalPrice, details: priceDetails } = calculatePrice();

  return (
    <Layout>
      <div className="container max-w-2xl py-8">
        <h1 className="text-2xl font-bold mb-6">Dodaj nowe zlecenie</h1>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
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
              {s < 4 && (
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

              <div className="space-y-2">
                <Label>Zdjęcia (opcjonalnie)</Label>
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

              {/* Group application toggle */}
              <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-base">Zgłoszenia grupowe</Label>
                      <p className="text-xs text-muted-foreground">
                        Wykonawcy mogą zgłosić się jako grupa (np. rozładunek, przeprowadzka)
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={form.allows_group}
                    onCheckedChange={(v) => updateForm('allows_group', v)}
                  />
                </div>

                {form.allows_group && (
                  <div className="grid grid-cols-2 gap-4 pt-2 animate-fade-in">
                    <div className="space-y-2">
                      <Label className="text-sm">Min. osób</Label>
                      <Input
                        type="number"
                        min="1"
                        value={form.min_workers}
                        onChange={(e) => updateForm('min_workers', e.target.value)}
                        placeholder="np. 2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Max. osób</Label>
                      <Input
                        type="number"
                        min={form.min_workers || '1'}
                        value={form.max_workers}
                        onChange={(e) => updateForm('max_workers', e.target.value)}
                        placeholder="np. 5"
                      />
                    </div>
                  </div>
                )}
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
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Rodzaj lokalizacji *</Label>
                <LocationTypeToggle
                  isForeign={form.is_foreign}
                  onChange={(v) => updateForm('is_foreign', v)}
                />
              </div>

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
                      onChange={(v) => updateForm('miasto', v)}
                      onRegionChange={(region) => {
                        const normalizedRegion = region.toLowerCase();
                        const matchedWojewodztwo = WOJEWODZTWA.find(
                          w => w.toLowerCase() === normalizedRegion
                        );
                        if (matchedWojewodztwo && matchedWojewodztwo !== form.wojewodztwo) {
                          setForm(prev => ({ ...prev, wojewodztwo: matchedWojewodztwo }));
                        }
                      }}
                      placeholder="Wpisz miasto..."
                    />
                  </div>
                </div>
              )}

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
            </CardContent>
          </Card>
        )}

        {/* Step 4: Payment & Summary */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Podsumowanie i płatność</CardTitle>
              <CardDescription>Sprawdź dane i opłać publikację</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary */}
              <div className="rounded-lg border p-4 space-y-2">
                <h4 className="font-medium">Twoje zlecenie</h4>
                <p className="text-sm"><strong>Tytuł:</strong> {form.title}</p>
                <p className="text-sm">
                  <strong>Lokalizacja:</strong> {form.miasto}, {form.is_foreign ? form.country : form.wojewodztwo}
                  {form.is_foreign && <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Zagranica</span>}
                </p>
                {form.budget && (
                  <p className="text-sm">
                    <strong>Budżet:</strong> {form.budget} zł{form.budget_type === 'hourly' ? '/h' : ''}
                  </p>
                )}
                {form.images.length > 0 && (
                  <p className="text-sm"><strong>Zdjęcia:</strong> {form.images.length}</p>
                )}
                {form.urgent && <p className="text-sm text-destructive font-medium">⚡ Zlecenie pilne</p>}
              </div>

              {/* Subscription info */}
              {subscribed && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-5 w-5 text-primary" />
                    <span className="font-medium">Masz aktywny pakiet {plan?.toUpperCase()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Pozostałe ogłoszenia: <strong>{remainingListings}</strong> | 
                    Wyróżnienia: <strong>{remainingHighlights}</strong>
                  </p>
                </div>
              )}

              {/* Premium addons */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Opcje premium
                </h4>
                <div className="grid gap-3">
                  {(Object.entries(PREMIUM_ADDONS) as [keyof typeof PREMIUM_ADDONS, typeof PREMIUM_ADDONS[keyof typeof PREMIUM_ADDONS]][]).map(([key, addon]) => {
                    const isFreeHighlight = key === 'highlight' && remainingHighlights > 0;
                    return (
                      <label
                        key={key}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          addons[key] ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                        }`}
                      >
                        <Checkbox
                          checked={addons[key]}
                          onCheckedChange={(checked) => setAddons(prev => ({ ...prev, [key]: !!checked }))}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{addon.name}</span>
                            {isFreeHighlight && (
                              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                                z pakietu
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{addon.description}</p>
                        </div>
                        <span className={`font-medium ${isFreeHighlight ? 'line-through text-muted-foreground' : ''}`}>
                          {addon.price} zł
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Payment summary */}
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Podsumowanie kosztów</span>
                  </div>
                  {priceDetails.map((detail, i) => (
                    <p key={i} className="text-sm text-muted-foreground">{detail}</p>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <p className="font-bold text-lg">
                      Do zapłaty: {totalPrice > 0 ? `${totalPrice} zł` : 'GRATIS (z pakietu)'}
                    </p>
                  </div>
                </div>

                {!paymentComplete ? (
                  <Button 
                    className="w-full" 
                    onClick={handlePayment}
                    disabled={paymentProcessing}
                  >
                    {paymentProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {paymentProcessing 
                      ? 'Przekierowywanie...' 
                      : totalPrice > 0 
                        ? `Zapłać ${totalPrice} zł` 
                        : 'Użyj z pakietu'
                    }
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-primary">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Płatność zakończona</span>
                  </div>
                )}

                {!subscribed && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Publikujesz regularnie?
                    </p>
                    <Button variant="link" onClick={() => navigate('/subscription')}>
                      Sprawdź nasze pakiety →
                    </Button>
                  </div>
                )}
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
          
          {step < 4 ? (
            <Button 
              onClick={() => setStep((s) => (s + 1) as Step)}
              disabled={!validateStep(step)}
            >
              Dalej
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading || !paymentComplete}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Opublikuj zlecenie
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
}
