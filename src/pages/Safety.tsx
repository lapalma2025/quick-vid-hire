import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Lock, Eye, AlertTriangle, CheckCircle, MessageSquare } from 'lucide-react';

const Safety = () => {
  const safetyFeatures = [
    {
      icon: Shield,
      title: 'Weryfikacja użytkowników',
      description: 'Każdy użytkownik musi zarejestrować się i potwierdzić swój email przed korzystaniem z platformy.'
    },
    {
      icon: Lock,
      title: 'Bezpieczne płatności',
      description: 'Wszystkie płatności są obsługiwane przez Stripe - lidera w bezpiecznych płatnościach online.'
    },
    {
      icon: Eye,
      title: 'System ocen i opinii',
      description: 'Przejrzyste oceny i opinie pomagają identyfikować wiarygodnych użytkowników.'
    },
    {
      icon: MessageSquare,
      title: 'Komunikacja przez platformę',
      description: 'Zachęcamy do komunikacji przez wbudowany czat - mamy historię rozmów w razie sporów.'
    }
  ];

  const tips = [
    'Nigdy nie płać z góry całej kwoty - ustal płatność po wykonaniu zlecenia',
    'Sprawdzaj opinie i oceny wykonawców przed wyborem',
    'Nie udostępniaj danych osobowych poza platformą',
    'W razie wątpliwości - skontaktuj się z naszym wsparciem',
    'Dokumentuj ustalenia na czacie platformy',
    'Zgłaszaj podejrzane zachowania'
  ];

  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">Bezpieczeństwo</h1>
          <p className="text-muted-foreground text-center mb-12 text-lg">
            Twoje bezpieczeństwo jest dla nas priorytetem.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {safetyFeatures.map((feature, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                <h3 className="text-xl font-semibold">Wskazówki bezpieczeństwa</h3>
              </div>
              <ul className="space-y-3">
                {tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Safety;
