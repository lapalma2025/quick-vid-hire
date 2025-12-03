import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const Pricing = () => {
  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">Cennik</h1>
          <p className="text-muted-foreground text-center mb-12 text-lg">
            Przejrzysty i prosty cennik bez ukrytych kosztów.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl">Dla Zleceniodawców</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">5 zł</span>
                  <span className="text-muted-foreground"> / zlecenie</span>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  {[
                    "Publikacja zlecenia na portalu",
                    "Nieograniczona liczba ofert od wykonawców",
                    "Czat z wykonawcami",
                    "Wybór najlepszego wykonawcy",
                    "System ocen i opinii",
                    "Wsparcie techniczne",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-6" asChild>
                  <Link to="/jobs/new">Dodaj zlecenie</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary">
              <CardHeader className="text-center pb-2">
                <div className="bg-primary text-primary-foreground text-sm py-1 px-3 rounded-full w-fit mx-auto mb-2">
                  Popularne
                </div>
                <CardTitle className="text-2xl">Dla Wykonawców</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">0 zł</span>
                  <span className="text-muted-foreground"> / zawsze</span>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  {[
                    "Przeglądanie wszystkich zleceń",
                    "Składanie nieograniczonych ofert",
                    "Kontakt ze zleceniodawcami",
                    "Zbieranie opinii i ocen",
                    "Powiadomienia o nowych zleceniach",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-6" variant="outline" asChild>
                  <Link to="/register">Zarejestruj się</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-12">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Dlaczego 5 zł za zlecenie?</h3>
              <p className="text-muted-foreground">
                Symboliczna opłata pozwala nam utrzymać platformę i zapewnić wysoką jakość usług. Dzięki niej filtrujemy
                niepoważne ogłoszenia i gwarantujemy, że każde zlecenie jest autentyczne. Płatność odbywa się
                bezpiecznie przez Stripe - obsługujemy karty płatnicze oraz BLIK.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Pricing;
