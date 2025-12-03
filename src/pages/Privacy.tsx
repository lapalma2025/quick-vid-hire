import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';

const Privacy = () => {
  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">Polityka prywatności</h1>
          <p className="text-muted-foreground text-center mb-12">
            Ostatnia aktualizacja: 1 grudnia 2024
          </p>

          <Card>
            <CardContent className="p-6 prose prose-sm dark:prose-invert max-w-none">
              <h2>1. Administrator danych</h2>
              <p>
                Administratorem danych osobowych jest ZlecenieTeraz Sp. z o.o. z siedzibą w Warszawie, 
                ul. Przykładowa 1, 00-001 Warszawa.
              </p>

              <h2>2. Jakie dane zbieramy</h2>
              <p>Zbieramy następujące dane osobowe:</p>
              <ul>
                <li>Imię i nazwisko</li>
                <li>Adres e-mail</li>
                <li>Numer telefonu (opcjonalnie)</li>
                <li>Lokalizacja (województwo, miasto)</li>
                <li>Dane dotyczące korzystania z serwisu</li>
              </ul>

              <h2>3. Cel przetwarzania danych</h2>
              <p>Dane osobowe przetwarzamy w celu:</p>
              <ul>
                <li>Świadczenia usług dostępnych w Serwisie</li>
                <li>Obsługi konta użytkownika</li>
                <li>Realizacji płatności</li>
                <li>Komunikacji z użytkownikami</li>
                <li>Celów statystycznych i analitycznych</li>
              </ul>

              <h2>4. Podstawa prawna</h2>
              <p>
                Przetwarzanie danych odbywa się na podstawie zgody użytkownika (art. 6 ust. 1 lit. a RODO), 
                wykonania umowy (art. 6 ust. 1 lit. b RODO) oraz prawnie uzasadnionego interesu 
                administratora (art. 6 ust. 1 lit. f RODO).
              </p>

              <h2>5. Okres przechowywania</h2>
              <p>
                Dane osobowe przechowujemy przez okres korzystania z Serwisu oraz przez czas niezbędny 
                do realizacji celów, dla których zostały zebrane, lub do czasu wycofania zgody.
              </p>

              <h2>6. Prawa użytkowników</h2>
              <p>Każdy użytkownik ma prawo do:</p>
              <ul>
                <li>Dostępu do swoich danych</li>
                <li>Sprostowania danych</li>
                <li>Usunięcia danych</li>
                <li>Ograniczenia przetwarzania</li>
                <li>Przenoszenia danych</li>
                <li>Wniesienia sprzeciwu</li>
                <li>Wycofania zgody</li>
              </ul>

              <h2>7. Pliki cookies</h2>
              <p>
                Serwis wykorzystuje pliki cookies do prawidłowego działania, analizy ruchu 
                oraz personalizacji treści. Użytkownik może zarządzać plikami cookies w ustawieniach przeglądarki.
              </p>

              <h2>8. Bezpieczeństwo danych</h2>
              <p>
                Stosujemy odpowiednie środki techniczne i organizacyjne w celu ochrony danych osobowych 
                przed nieuprawnionym dostępem, utratą lub zniszczeniem.
              </p>

              <h2>9. Kontakt</h2>
              <p>
                W sprawach związanych z ochroną danych osobowych prosimy o kontakt: 
                privacy@zlecenieteraz.pl
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Privacy;
