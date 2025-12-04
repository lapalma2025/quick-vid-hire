import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { useToast } from '@/hooks/use-toast';
import { WOJEWODZTWA } from '@/lib/constants';
import { CityAutocomplete } from '@/components/jobs/CityAutocomplete';
import { Loader2, Save, Star, Camera, X } from 'lucide-react';
import { useViewModeStore } from '@/store/viewModeStore';
import { CategoryIcon } from '@/components/jobs/CategoryIcon';

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

export default function Profile() {
  const navigate = useNavigate();
  const { profile, isAuthenticated, isLoading, refreshProfile } = useAuth();
  const { viewMode } = useViewModeStore();
  const isWorkerView = viewMode === 'worker';
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    wojewodztwo: '',
    miasto: '',
    bio: '',
    hourly_rate: '',
    is_available: true,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        phone: profile.phone || '',
        wojewodztwo: profile.wojewodztwo || '',
        miasto: profile.miasto || '',
        bio: profile.bio || '',
        hourly_rate: profile.hourly_rate?.toString() || '',
        is_available: profile.is_available,
      });
      setAvatarUrl(profile.avatar_url);
      fetchWorkerCategories();
    }
  }, [profile]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('id, name, icon')
      .order('name');
    if (data) setCategories(data);
  };

  const fetchWorkerCategories = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('worker_categories')
      .select('category_id')
      .eq('worker_id', profile.id);
    if (data) {
      setSelectedCategories(data.map(wc => wc.category_id));
    }
  };

  

  const updateForm = (field: string, value: any) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'wojewodztwo') {
        updated.miasto = '';
      }
      return updated;
    });
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Błąd', description: 'Wybierz plik graficzny', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Błąd', description: 'Plik nie może być większy niż 5MB', variant: 'destructive' });
      return;
    }

    setUploadingAvatar(true);

    try {
      // Get user id for folder path
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nie zalogowany');

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Add cache buster
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlWithCacheBuster })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setAvatarUrl(urlWithCacheBuster);
      toast({ title: 'Avatar zaktualizowany!' });
      refreshProfile();
    } catch (error: any) {
      toast({ title: 'Błąd', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!profile) return;

    setUploadingAvatar(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', profile.id);

      if (error) throw error;

      setAvatarUrl(null);
      toast({ title: 'Avatar usunięty' });
      refreshProfile();
    } catch (error: any) {
      toast({ title: 'Błąd', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSave = async () => {
    if (!profile) return;

    setLoading(true);
    
    // Update profile
    const { error } = await supabase
      .from('profiles')
      .update({
        name: form.name || null,
        phone: form.phone || null,
        wojewodztwo: form.wojewodztwo || null,
        miasto: form.miasto || null,
        bio: form.bio || null,
        hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null,
        is_available: form.is_available,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (error) {
      toast({
        title: 'Błąd',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    // Update worker categories (only in worker view)
    if (isWorkerView) {
      // Delete existing categories
      await supabase
        .from('worker_categories')
        .delete()
        .eq('worker_id', profile.id);

      // Insert new categories
      if (selectedCategories.length > 0) {
        const { error: catError } = await supabase
          .from('worker_categories')
          .insert(selectedCategories.map(catId => ({
            worker_id: profile.id,
            category_id: catId,
          })));

        if (catError) {
          toast({
            title: 'Błąd przy zapisie kategorii',
            description: catError.message,
            variant: 'destructive',
          });
        }
      }
    }

    setLoading(false);
    toast({ title: 'Profil zaktualizowany!' });
    refreshProfile();
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-2xl py-8">
        <h1 className="text-2xl font-bold mb-6">Mój profil</h1>

        {/* Avatar & stats */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarUrl || ''} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </button>
                {avatarUrl && (
                  <button
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                    className="absolute -top-1 -right-1 h-6 w-6 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{profile?.name || 'Użytkownik'}</h2>
                <p className="text-muted-foreground capitalize">{profile?.role}</p>
                {profile?.rating_count! > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    <span className="font-medium">{profile?.rating_avg?.toFixed(1)}</span>
                    <span className="text-muted-foreground">({profile?.rating_count} opinii)</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Najedź na zdjęcie, aby zmienić
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Informacje</CardTitle>
            <CardDescription>Zaktualizuj swoje dane</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Imię i nazwisko</Label>
              <Input
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                placeholder="Jan Kowalski"
              />
            </div>

            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input
                value={form.phone}
                onChange={(e) => updateForm('phone', e.target.value)}
                placeholder="+48 123 456 789"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Województwo</Label>
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
                <Label>Miasto</Label>
                <CityAutocomplete
                  value={form.miasto}
                  onChange={(v) => updateForm('miasto', v)}
                  placeholder="Wpisz nazwę miejscowości..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>O mnie</Label>
              <Textarea
                value={form.bio}
                onChange={(e) => updateForm('bio', e.target.value)}
                placeholder="Kilka słów o sobie..."
                rows={4}
              />
            </div>

            {isWorkerView && (
              <>
                <div className="space-y-2">
                  <Label>Stawka godzinowa (zł/h)</Label>
                  <Input
                    type="number"
                    value={form.hourly_rate}
                    onChange={(e) => updateForm('hourly_rate', e.target.value)}
                    placeholder="np. 30"
                  />
                </div>

                {/* Categories section */}
                <div className="space-y-3">
                  <Label className="text-base">Moje kategorie usług</Label>
                  <p className="text-sm text-muted-foreground">
                    Wybierz kategorie, w których oferujesz swoje usługi. Dzięki temu klienci łatwiej Cię znajdą.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedCategories.includes(category.id)
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:bg-muted/50'
                        }`}
                        onClick={() => toggleCategory(category.id)}
                      >
                        <Checkbox
                          checked={selectedCategories.includes(category.id)}
                          onCheckedChange={() => toggleCategory(category.id)}
                        />
                        <CategoryIcon name={category.name} className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium truncate">{category.name}</span>
                      </div>
                    ))}
                  </div>
                  {selectedCategories.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Wybrano: {selectedCategories.length} {selectedCategories.length === 1 ? 'kategoria' : selectedCategories.length < 5 ? 'kategorie' : 'kategorii'}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                  <div className="space-y-0.5">
                    <Label className="text-base">Dostępny do pracy</Label>
                    <p className="text-sm text-muted-foreground">
                      Włącz, aby pojawić się na publicznej liście wykonawców
                    </p>
                  </div>
                  <Switch
                    checked={form.is_available}
                    onCheckedChange={(v) => updateForm('is_available', v)}
                  />
                </div>
              </>
            )}

            <Button onClick={handleSave} disabled={loading} className="w-full gap-2">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Zapisz zmiany
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
