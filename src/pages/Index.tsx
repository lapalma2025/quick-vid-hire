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
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { CategoryIcon } from '@/components/jobs/CategoryIcon';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

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
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animations
      if (heroRef.current) {
        const tl = gsap.timeline();
        tl.fromTo('.hero-badge', { opacity: 0, y: -20, scale: 0.8 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.7)' })
          .fromTo('.hero-title', { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 1, ease: 'power4.out' }, '-=0.3')
          .fromTo('.hero-subtitle', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6')
          .fromTo('.hero-buttons', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.4')
          .fromTo('.hero-blob', { scale: 0, opacity: 0 }, { scale: 1, opacity: 0.3, duration: 1.5, ease: 'power2.out', stagger: 0.2 }, '-=1');
      }

      // Stats counter animation
      if (statsRef.current) {
        gsap.fromTo(statsRef.current.querySelectorAll('.stat-item'),
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: { trigger: statsRef.current, start: 'top 85%' }
          }
        );
      }

      // Categories stagger
      if (categoriesRef.current) {
        gsap.fromTo(categoriesRef.current.querySelectorAll('.category-card'),
          { opacity: 0, y: 30, scale: 0.9 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.08,
            ease: 'power3.out',
            scrollTrigger: { trigger: categoriesRef.current, start: 'top 80%' }
          }
        );
      }

      // How it works
      if (howItWorksRef.current) {
        gsap.fromTo(howItWorksRef.current.querySelectorAll('.step-card'),
          { opacity: 0, x: -40 },
          {
            opacity: 1,
            x: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: 'power3.out',
            scrollTrigger: { trigger: howItWorksRef.current, start: 'top 75%' }
          }
        );
      }

      // Features
      if (featuresRef.current) {
        gsap.fromTo(featuresRef.current.querySelectorAll('.feature-item'),
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: { trigger: featuresRef.current, start: 'top 80%' }
          }
        );
      }

      // CTA
      if (ctaRef.current) {
        gsap.fromTo(ctaRef.current,
          { opacity: 0, scale: 0.95 },
          {
            opacity: 1,
            scale: 1,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: { trigger: ctaRef.current, start: 'top 85%' }
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <Layout>
      {/* Hero Section */}
      <section ref={heroRef} className="relative overflow-hidden py-24 md:py-36">
        {/* Background blobs */}
        <div className="hero-blob absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="hero-blob absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animation-delay-2000" />
        <div className="hero-blob absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl" />
        
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Nowa era zleceń krótkoterminowych
            </div>
            
            <h1 className="hero-title text-5xl md:text-7xl font-display font-bold tracking-tight leading-tight">
              Znajdź wykonawcę
              <span className="block text-primary mt-2">w kilka minut</span>
            </h1>
            
            <p className="hero-subtitle text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Portal pracy krótkoterminowej. Dodaj zlecenie, wybierz wykonawcę, załatw sprawę.
              <span className="text-foreground font-medium"> Prosto, szybko, lokalnie.</span>
            </p>
            
            <div className="hero-buttons flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" asChild className="gap-3 text-lg h-14 px-8 rounded-2xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300">
                <Link to="/jobs/new">
                  <Briefcase className="h-5 w-5" />
                  Dodaj zlecenie za 5 zł
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="gap-3 text-lg h-14 px-8 rounded-2xl border-2 hover:bg-primary/5 hover:-translate-y-1 transition-all duration-300">
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
      <section ref={statsRef} className="py-16 border-y border-border/50 bg-gradient-hero">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { value: stats.jobs, label: 'Aktywnych zleceń', suffix: '+' },
              { value: stats.workers, label: 'Wykonawców', suffix: '+' },
              { value: 16, label: 'Województw', suffix: '' },
              { value: 5, label: 'Za publikację', suffix: ' zł' },
            ].map((stat, i) => (
              <div key={i} className="stat-item text-center">
                <div className="text-4xl md:text-5xl font-display font-bold text-primary">
                  {stat.value}{stat.suffix}
                </div>
                <div className="text-sm text-muted-foreground mt-2 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section ref={categoriesRef} className="py-20 md:py-28">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Popularne kategorie</h2>
            <p className="text-lg text-muted-foreground">Znajdź zlecenie w swojej specjalizacji</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6">
            {categories.map((cat) => (
              <Link to={`/jobs?category=${encodeURIComponent(cat)}`} key={cat}>
                <Card className="category-card card-modern text-center p-6 group cursor-pointer">
                  <CardContent className="p-0 space-y-4">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                      <CategoryIcon name={cat} className="h-7 w-7 text-primary" />
                    </div>
                    <p className="font-semibold text-sm group-hover:text-primary transition-colors">{cat}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section ref={howItWorksRef} className="py-20 md:py-28 bg-muted/30">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Jak to działa?</h2>
            <p className="text-lg text-muted-foreground">Trzy proste kroki do sukcesu</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Dodaj zlecenie',
                desc: 'Opisz czego potrzebujesz, wybierz lokalizację i budżet. Publikacja kosztuje tylko 5 zł.',
                icon: Briefcase,
                color: 'bg-primary/10 text-primary',
              },
              {
                step: '02',
                title: 'Otrzymaj oferty',
                desc: 'Wykonawcy z Twojej okolicy wyślą swoje propozycje. Porównaj i wybierz najlepszą.',
                icon: Users,
                color: 'bg-accent/10 text-accent-foreground',
              },
              {
                step: '03',
                title: 'Załatw sprawę',
                desc: 'Porozmawiaj z wykonawcą, ustal szczegóły i zrealizuj zlecenie. Wystaw opinię.',
                icon: CheckCircle2,
                color: 'bg-success/10 text-success',
              },
            ].map((item) => (
              <Card key={item.step} className="step-card card-modern relative overflow-hidden group">
                <div className="absolute top-6 right-6 text-7xl font-display font-bold text-muted/20 group-hover:text-primary/10 transition-colors">
                  {item.step}
                </div>
                <CardContent className="p-8 space-y-5 relative">
                  <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-display font-bold">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section ref={featuresRef} className="py-20 md:py-28">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Dlaczego my?</h2>
            <p className="text-lg text-muted-foreground">Wszystko czego potrzebujesz w jednym miejscu</p>
          </div>
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
              <div key={feature.title} className="feature-item flex gap-5 p-6 rounded-2xl hover:bg-muted/50 transition-colors duration-300">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaRef} className="py-20 md:py-28">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-glow p-12 md:p-16 text-center">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
            
            <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-display font-bold text-white">Gotowy do działania?</h2>
              <p className="text-xl text-white/90 leading-relaxed">
                Dołącz do tysięcy użytkowników, którzy już korzystają z ZlecenieTeraz
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" variant="secondary" asChild className="h-14 px-8 text-lg rounded-2xl hover:-translate-y-1 transition-all duration-300">
                  <Link to="/register">Zarejestruj się za darmo</Link>
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-2xl bg-white/10 border-white/30 text-white hover:bg-white/20 hover:-translate-y-1 transition-all duration-300" asChild>
                  <Link to="/jobs">Zobacz zlecenia</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}