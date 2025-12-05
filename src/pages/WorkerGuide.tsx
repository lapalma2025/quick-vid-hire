import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { UserPlus, Search, Send, MessageSquare, CheckCircle, Star } from "lucide-react";

const WorkerGuide = () => {
  const steps = [
    {
      icon: UserPlus,
      title: "Załóż konto",
      description: "Zarejestruj się. Uzupełnij swój profil - dodaj zdjęcie, opis i kategorie usług.",
    },
    {
      icon: Search,
      title: "Przeglądaj zlecenia",
      description:
        "Szukaj zleceń w swojej okolicy i kategorii. Używaj filtrów, aby znaleźć idealne zlecenia dla siebie.",
    },
    {
      icon: Send,
      title: "Składaj oferty",
      description: "Znalazłeś ciekawe zlecenie? Złóż ofertę z proponowaną ceną i terminem realizacji. Wyróżnij się!",
    },
    {
      icon: MessageSquare,
      title: "Rozmawiaj ze zleceniodawcą",
      description:
        "Po zaakceptowaniu oferty skontaktuj się przez czat. Ustal szczegóły i potwierdź warunki współpracy.",
    },
    {
      icon: CheckCircle,
      title: "Wykonaj zlecenie",
      description: "Zrealizuj zlecenie zgodnie z ustaleniami. Dbaj o jakość - to buduje Twoją reputację.",
    },
    {
      icon: Star,
      title: "Zbieraj opinie",
      description: "Dobre opinie przyciągają więcej klientów. Proś o ocenę po każdym udanym zleceniu.",
    },
  ];

  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">Jak zacząć jako wykonawca?</h1>
          <p className="text-muted-foreground text-center mb-12 text-lg">
            Przewodnik krok po kroku dla nowych wykonawców.
          </p>

          <div className="space-y-6 mb-12">
            {steps.map((step, index) => (
              <Card key={index}>
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

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-semibold mb-2">Gotowy do działania?</h3>
              <p className="text-muted-foreground mb-4">Dołącz do tysięcy wykonawców i zacznij zarabiać już dziś!</p>
              <div className="flex gap-4 justify-center">
                <Button asChild>
                  <Link to="/register">Zarejestruj się</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/jobs">Przeglądaj zlecenia</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default WorkerGuide;
