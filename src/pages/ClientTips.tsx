import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, Target, MessageSquare, Shield, Clock, Star } from 'lucide-react';

const ClientTips = () => {
  const tips = [
    {
      icon: Target,
      title: 'Opisz zlecenie szczegółowo',
      description: 'Im dokładniej opiszesz swoje potrzeby, tym lepsze oferty otrzymasz. Podaj wszystkie istotne szczegóły, wymiary, materiały i oczekiwania.'
    },
    {
      icon: Lightbulb,
      title: 'Ustal realistyczny budżet',
      description: 'Przed dodaniem zlecenia zorientuj się w cenach rynkowych. Zbyt niski budżet może odstraszyć dobrych wykonawców.'
    },
    {
      icon: MessageSquare,
      title: 'Komunikuj się jasno',
      description: 'Odpowiadaj na pytania wykonawców szybko i wyczerpująco. Dobra komunikacja to klucz do udanej współpracy.'
    },
    {
      icon: Clock,
      title: 'Daj rozsądny termin',
      description: 'Pilne zlecenia mogą kosztować więcej. Jeśli możesz, daj wykonawcom więcej czasu na realizację.'
    },
    {
      icon: Star,
      title: 'Sprawdzaj opinie',
      description: 'Przed wyborem wykonawcy przejrzyj jego profil, oceny i opinie od innych zleceniodawców.'
    },
    {
      icon: Shield,
      title: 'Ustal szczegóły przed rozpoczęciem',
      description: 'Przed zaakceptowaniem oferty ustal wszystkie szczegóły: cenę, termin, zakres prac i warunki płatności.'
    }
  ];

  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">Porady dla zleceniodawców</h1>
          <p className="text-muted-foreground text-center mb-12 text-lg">
            Jak skutecznie korzystać z ZlecenieTeraz i znajdować najlepszych wykonawców.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {tips.map((tip, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <tip.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">{tip.title}</h3>
                      <p className="text-muted-foreground text-sm">{tip.description}</p>
                    </div>
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

export default ClientTips;
