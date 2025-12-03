import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Loader2, Save, Star } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const { profile, isAuthenticated, isLoading, isWorker, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
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
    }
  }, [profile]);

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

  const handleSave = async () => {
    if (!profile) return;

    setLoading(true);
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

    setLoading(false);

    if (error) {
      toast({
        title: 'Błąd',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Profil zaktualizowany!' });
      refreshProfile();
    }
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
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
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
              <Label>O mnie</Label>
              <Textarea
                value={form.bio}
                onChange={(e) => updateForm('bio', e.target.value)}
                placeholder="Kilka słów o sobie..."
                rows={4}
              />
            </div>

            {isWorker && (
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