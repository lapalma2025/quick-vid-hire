import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Zap, 
  Users, 
  Target, 
  Heart, 
  TrendingUp, 
  Briefcase,
  ArrowRight,
  Sparkles,
  Globe,
  Clock
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Safety = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const missionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animation
      gsap.fromTo(
        heroRef.current?.querySelectorAll('.hero-item'),
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
        }
      );

      // Features animation
      gsap.fromTo(
        featuresRef.current?.querySelectorAll('.feature-card'),
        { opacity: 0, y: 30, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'back.out(1.2)',
          scrollTrigger: {
            trigger: featuresRef.current,
            start: 'top 80%',
          },
        }
      );

      // Stats animation
      gsap.fromTo(
        statsRef.current?.querySelectorAll('.stat-item'),
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: 'back.out(1.5)',
          scrollTrigger: {
            trigger: statsRef.current,
            start: 'top 85%',
          },
        }
      );

      // Mission animation
      gsap.fromTo(
        missionRef.current?.querySelectorAll('.mission-item'),
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          stagger: 0.12,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: missionRef.current,
            start: 'top 80%',
          },
        }
      );
    });

    return () => ctx.revert();
  }, []);

  const platformFeatures = [
    {
      icon: Zap,
      title: 'Szybkie zlecenia',
      description: 'Znajdź pracę dorywczą w kilka minut. Bez zbędnych formalności i długiego oczekiwania.'
    },
    {
      icon: Users,
      title: 'Lokalna społeczność',
      description: 'Łączymy ludzi z Twojej okolicy. Zleceniodawcy i wykonawcy z tego samego miasta.'
    },
    {
      icon: Globe,
      title: 'Elastyczność',
      description: 'Pracuj kiedy chcesz i ile chcesz. Ty decydujesz o swoim czasie i zaangażowaniu.'
    },
    {
      icon: Heart,
      title: 'Ludzkie podejście',
      description: 'Nie jesteśmy korporacją. Budujemy platformę z myślą o prawdziwych potrzebach użytkowników.'
    }
  ];

  const stats = [
    { value: '100%', label: 'Za darmo', icon: Sparkles },
    { value: '24/7', label: 'Dostępność', icon: Clock },
    { value: '16', label: 'Województw', icon: Globe },
    { value: '12+', label: 'Kategorii zleceń', icon: Briefcase }
  ];

  const missionPoints = [
    {
      icon: Target,
      title: 'Dla szukających pracy dorywczej',
      description: 'Studenci, emeryci, osoby szukające dodatkowego dochodu - każdy znajdzie tu coś dla siebie. Bez umów, bez zobowiązań.'
    },
    {
      icon: Briefcase,
      title: 'Dla potrzebujących pomocy',
      description: 'Przeprowadzka, sprzątanie, drobne naprawy - znajdź sprawdzonego wykonawcę w swojej okolicy szybko i bezproblemowo.'
    },
    {
      icon: TrendingUp,
      title: 'Dla lokalnej gospodarki',
      description: 'Wspieramy lokalny rynek usług. Pieniądze zostają w społeczności, a relacje budowane są na zaufaniu.'
    }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container relative" ref={heroRef}>
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="hero-item inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Heart className="h-5 w-5 text-primary" />
              <span className="font-semibold text-primary">Platforma dla ludzi</span>
            </div>
            
            <h1 className="hero-item text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight">
              Hop Hop - 
              <span className="text-primary"> Twoja lokalna</span>
              <br />
              giełda zleceń
            </h1>
            
            <p className="hero-item text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Łączymy ludzi, którzy potrzebują pomocy z tymi, którzy chcą zarobić. 
              Prosta idea, która zmienia lokalny rynek pracy dorywczej.
            </p>
            
            <div className="hero-item flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" asChild className="h-14 px-8 rounded-2xl shadow-lg shadow-primary/25">
                <Link to="/register" className="flex items-center gap-2">
                  Dołącz do nas
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-14 px-8 rounded-2xl">
                <Link to="/jobs">Przeglądaj zlecenia</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border/50 bg-muted/30" ref={statsRef}>
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-3xl md:text-4xl font-display font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20" ref={featuresRef}>
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Dlaczego Hop Hop?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Stworzyliśmy platformę, która stawia na prostotę i wygodę użytkowników.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {platformFeatures.map((feature, index) => (
              <Card key={index} className="feature-card border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-muted/30" ref={missionRef}>
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="mission-item text-3xl md:text-4xl font-display font-bold mb-4">
                Dla kogo jest Hop Hop?
              </h2>
              <p className="mission-item text-muted-foreground text-lg">
                Platforma stworzona z myślą o różnych grupach użytkowników.
              </p>
            </div>
            
            <div className="space-y-6">
              {missionPoints.map((point, index) => (
                <Card key={index} className="mission-item border-border/50 overflow-hidden">
                  <CardContent className="p-6 md:p-8">
                    <div className="flex items-start gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
                        <point.icon className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-xl mb-2">{point.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">{point.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 overflow-hidden">
            <CardContent className="p-8 md:p-12 text-center">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Dołącz do społeczności Hop Hop
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
                Rejestracja jest całkowicie darmowa. Zacznij publikować zlecenia lub znajdź 
                swoją pierwszą pracę dorywczą już dziś.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="h-14 px-8 rounded-2xl shadow-lg shadow-primary/25">
                  <Link to="/register" className="flex items-center gap-2">
                    Zarejestruj się za darmo
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-14 px-8 rounded-2xl">
                  <Link to="/how-it-works">Dowiedz się więcej</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default Safety;
