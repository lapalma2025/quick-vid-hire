import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';

const Reviews = () => {
  const reviews = [
    {
      name: 'Anna K.',
      role: 'Zleceniodawca',
      rating: 5,
      text: 'Świetna platforma! Znalazłam wykonawcę do remontu łazienki w jeden dzień. Praca wykonana profesjonalnie i w terminie.',
      city: 'Warszawa'
    },
    {
      name: 'Marek W.',
      role: 'Wykonawca',
      rating: 5,
      text: 'Dzięki ZlecenieTeraz mam stały dopływ zleceń. Aplikacja jest prosta w obsłudze, a klienci są weryfikowani.',
      city: 'Kraków'
    },
    {
      name: 'Katarzyna M.',
      role: 'Zleceniodawca',
      rating: 5,
      text: 'Potrzebowałam pomocy z przeprowadzką na wczoraj. Znalazłam ekipę w 2 godziny. Polecam!',
      city: 'Gdańsk'
    },
    {
      name: 'Tomasz B.',
      role: 'Wykonawca',
      rating: 4,
      text: 'Dobra platforma dla elektryków. Zlecenia są uczciwe, a system ocen motywuje do dobrej pracy.',
      city: 'Poznań'
    },
    {
      name: 'Ewa S.',
      role: 'Zleceniodawca',
      rating: 5,
      text: 'Szukałam kogoś do sprzątania biura regularnie. Znalazłam idealną osobę i współpracujemy już od pół roku.',
      city: 'Wrocław'
    },
    {
      name: 'Piotr N.',
      role: 'Wykonawca',
      rating: 5,
      text: 'Jako hydraulik polecam tę platformę. Opłata 5 zł za zlecenie to uczciwa cena za dostęp do klientów.',
      city: 'Łódź'
    }
  ];

  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">Opinie użytkowników</h1>
          <p className="text-muted-foreground text-center mb-12 text-lg">
            Zobacz, co mówią o nas zleceniodawcy i wykonawcy.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {reviews.map((review, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <Quote className="w-8 h-8 text-primary/20 mb-4" />
                  <p className="text-muted-foreground mb-4">{review.text}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{review.name}</p>
                      <p className="text-sm text-muted-foreground">{review.role} • {review.city}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground">
              Dołącz do tysięcy zadowolonych użytkowników ZlecenieTeraz!
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Reviews;
