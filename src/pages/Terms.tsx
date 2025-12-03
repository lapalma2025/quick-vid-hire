import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';

const Terms = () => {
  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">Regulamin</h1>
          <p className="text-muted-foreground text-center mb-12">
            Ostatnia aktualizacja: 1 grudnia 2024
          </p>

          <Card>
            <CardContent className="p-6 prose prose-sm dark:prose-invert max-w-none">
              <h2>1. Postanowienia ogólne</h2>
              <p>
                Niniejszy Regulamin określa zasady korzystania z serwisu ZlecenieTeraz.pl, 
                którego właścicielem jest ZlecenieTeraz Sp. z o.o. z siedzibą w Warszawie.
              </p>

              <h2>2. Definicje</h2>
              <ul>
                <li><strong>Serwis</strong> - platforma internetowa ZlecenieTeraz.pl</li>
                <li><strong>Użytkownik</strong> - osoba korzystająca z Serwisu</li>
                <li><strong>Zleceniodawca</strong> - Użytkownik publikujący zlecenia</li>
                <li><strong>Wykonawca</strong> - Użytkownik składający oferty na zlecenia</li>
                <li><strong>Zlecenie</strong> - ogłoszenie o zapotrzebowaniu na usługę</li>
              </ul>

              <h2>3. Rejestracja i konto</h2>
              <p>
                Korzystanie z pełnej funkcjonalności Serwisu wymaga rejestracji. 
                Użytkownik zobowiązuje się do podania prawdziwych danych podczas rejestracji.
              </p>

              <h2>4. Zasady publikacji zleceń</h2>
              <p>
                Zleceniodawca może publikować zlecenia po uiszczeniu opłaty w wysokości 5 zł za każde zlecenie.
                Zlecenia muszą być zgodne z prawem i dobrymi obyczajami.
              </p>

              <h2>5. Zasady składania ofert</h2>
              <p>
                Wykonawcy mogą bezpłatnie składać oferty na opublikowane zlecenia.
                Oferta powinna zawierać proponowaną cenę i termin realizacji.
              </p>

              <h2>6. Płatności</h2>
              <p>
                Płatności za publikację zleceń są obsługiwane przez zewnętrznego operatora Stripe.
                Rozliczenia między Zleceniodawcą a Wykonawcą odbywają się poza Serwisem.
              </p>

              <h2>7. Odpowiedzialność</h2>
              <p>
                Serwis nie ponosi odpowiedzialności za jakość wykonanych usług ani za spory 
                między Zleceniodawcami a Wykonawcami. Serwis pełni jedynie rolę platformy pośredniczącej.
              </p>

              <h2>8. Ochrona danych osobowych</h2>
              <p>
                Dane osobowe Użytkowników są przetwarzane zgodnie z Polityką Prywatności 
                oraz obowiązującymi przepisami o ochronie danych osobowych.
              </p>

              <h2>9. Postanowienia końcowe</h2>
              <p>
                Regulamin wchodzi w życie z dniem publikacji. Właściciel Serwisu zastrzega sobie 
                prawo do zmiany Regulaminu. Użytkownicy zostaną poinformowani o zmianach.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Terms;
