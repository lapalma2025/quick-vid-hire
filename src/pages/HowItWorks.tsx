import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Search, FileText, MessageSquare, CheckCircle, Star } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: FileText,
      title: 'Dodaj zlecenie',
      description: 'Opisz swoje zlecenie, wybierz kategorię i lokalizację. Ustal budżet i termin realizacji.'
    },
    {
      icon: Search,
      title: 'Wykonawcy składają oferty',
      description: 'Zainteresowani wykonawcy przeglądają Twoje zlecenie i składają swoje propozycje z ceną i terminem.'
    },
    {
      icon: MessageSquare,
      title: 'Wybierz i rozmawiaj',
      description: 'Przejrzyj profile wykonawców, ich oceny i wybierz najlepszego. Ustal szczegóły przez czat.'
    },
    {
      icon: CheckCircle,
      title: 'Zlecenie wykonane',
      description: 'Po zakończeniu pracy potwierdź wykonanie zlecenia i rozlicz się z wykonawcą.'
    },
    {
      icon: Star,
      title: 'Oceń współpracę',
      description: 'Wystaw opinię wykonawcy, aby pomóc innym użytkownikom w wyborze.'
    }
  ];

  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">Jak to działa?</h1>
          <p className="text-muted-foreground text-center mb-12 text-lg">
            ZlecenieTeraz łączy zleceniodawców z wykonawcami w prosty i bezpieczny sposób.
          </p>

          <div className="space-y-8">
            {steps.map((step, index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardContent className="p-6 flex gap-6 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl font-bold text-primary">{index + 1}</span>
                      <h3 className="text-xl font-semibold">{step.title}</h3>
                    </div>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HowItWorks;
