import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import { 
  ArrowRight, 
  Briefcase, 
  Shield, 
  Zap, 
  Users, 
  Star, 
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { CategoryIcon } from '@/components/jobs/CategoryIcon';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const categories = [
  'Prace fizyczne',
  'Sprzątanie', 
  'Przeprowadzki',
  'Eventy',
  'Gastronomia',
  'Ogród',
  'Transport',
  'Montaż i naprawy',
  'Opieka',
  'Dostawy',
];

export default function Index() {
  const [stats, setStats] = useState({ jobs: 0, workers: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [jobsRes, workersRes] = await Promise.all([
        supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'worker'),
      ]);
      setStats({
        jobs: jobsRes.count || 0,
        workers: workersRes.count || 0,
      });
    };
    fetchStats();
  }, []);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-hero opacity-5" />
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight animate-fade-in">
              Znajdź wykonawcę
              <span className="text-primary"> w kilka minut</span>
            </h1>
            <p className="text-xl text-muted-foreground animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Portal pracy krótkoterminowej. Dodaj zlecenie, wybierz wykonawcę, załatw sprawę.
              Prosto, szybko, lokalnie.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <Button size="lg" asChild className="gap-2 text-base">
                <Link to="/jobs/new">
                  <Briefcase className="h-5 w-5" />
                  Dodaj zlecenie za 5 zł
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="gap-2 text-base">
                <Link to="/jobs">
                  Przeglądaj zlecenia
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y bg-card">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary">{stats.jobs}+</div>
              <div className="text-sm text-muted-foreground mt-1">Aktywnych zleceń</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary">{stats.workers}+</div>
              <div className="text-sm text-muted-foreground mt-1">Wykonawców</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary">16</div>
              <div className="text-sm text-muted-foreground mt-1">Województw</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary">5 zł</div>
              <div className="text-sm text-muted-foreground mt-1">Za publikację</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Popularne kategorie</h2>
            <p className="text-muted-foreground">Znajdź zlecenie w swojej specjalizacji</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Link to={`/jobs?category=${encodeURIComponent(cat)}`} key={cat}>
                <Card className="card-hover text-center p-6">
                  <CardContent className="p-0 space-y-3">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <CategoryIcon name={cat} className="h-6 w-6 text-primary" />
                    </div>
                    <p className="font-medium text-sm">{cat}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Jak to działa?</h2>
            <p className="text-muted-foreground">Trzy proste kroki</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Dodaj zlecenie',
                desc: 'Opisz czego potrzebujesz, wybierz lokalizację i budżet. Publikacja kosztuje tylko 5 zł.',
                icon: Briefcase,
              },
              {
                step: '2',
                title: 'Otrzymaj oferty',
                desc: 'Wykonawcy z Twojej okolicy wyślą swoje propozycje. Porównaj i wybierz najlepszą.',
                icon: Users,
              },
              {
                step: '3',
                title: 'Załatw sprawę',
                desc: 'Porozmawiaj z wykonawcą, ustal szczegóły i zrealizuj zlecenie. Wystaw opinię.',
                icon: CheckCircle2,
              },
            ].map((item) => (
              <Card key={item.step} className="relative overflow-hidden">
                <div className="absolute top-4 right-4 text-6xl font-bold text-muted/30">
                  {item.step}
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: MapPin,
                title: 'Lokalnie',
                desc: 'Znajdź wykonawców w swoim mieście i województwie',
              },
              {
                icon: Zap,
                title: 'Szybko',
                desc: 'Otrzymaj oferty w ciągu minut, nie dni',
              },
              {
                icon: Shield,
                title: 'Bezpiecznie',
                desc: 'System opinii i weryfikacja wykonawców',
              },
              {
                icon: Star,
                title: 'Opinie',
                desc: 'Sprawdź oceny przed wyborem wykonawcy',
              },
              {
                icon: Users,
                title: 'Bez pośredników',
                desc: 'Rozmawiaj bezpośrednio z wykonawcą',
              },
              {
                icon: CheckCircle2,
                title: 'Prosto',
                desc: 'Intuicyjny interfejs, brak ukrytych opłat',
              },
            ].map((feature) => (
              <div key={feature.title} className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-gradient-hero text-primary-foreground">
        <div className="container text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">Gotowy do działania?</h2>
          <p className="text-lg opacity-90 max-w-xl mx-auto">
            Dołącz do tysięcy użytkowników, którzy już korzystają z ZlecenieTeraz
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register">Zarejestruj się za darmo</Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link to="/jobs">Zobacz zlecenia</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}