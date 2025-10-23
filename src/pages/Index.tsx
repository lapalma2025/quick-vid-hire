import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, Users, Clock, Shield, Zap, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";

const Index = () => {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-subtle">
        {/* Hero Section */}
        <section className="container py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6" variant="secondary">
              <Zap className="w-3 h-3 mr-1" />
              Rozmowy rekrutacyjne w czasie rzeczywistym
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              Rekrutacja na żywo
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Nowoczesna platforma do rozmów wideo 1:1 między kandydatami a firmami. 
              Bez pośredników, bez opóźnień – poznaj się na żywo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg shadow-elegant">
                <Link to="/auth">Rozpocznij za darmo</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg">
                <Link to="#features">Dowiedz się więcej</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Jak to działa?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Prosta i intuicyjna platforma do prowadzenia rozmów rekrutacyjnych online
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="shadow-card hover:shadow-elegant transition-all">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Rozmowy wideo 1:1</CardTitle>
                <CardDescription>
                  Prowadź rozmowy bezpośrednio w przeglądarce bez dodatkowych aplikacji. 
                  Wysoka jakość dźwięku i obrazu.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-card hover:shadow-elegant transition-all">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-accent flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Dwa panele</CardTitle>
                <CardDescription>
                  Osobne dashboardy dla kandydatów i firm. 
                  Wszystko, czego potrzebujesz w jednym miejscu.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-card hover:shadow-elegant transition-all">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Proste zaproszenia</CardTitle>
                <CardDescription>
                  Firma tworzy pokój i generuje link. 
                  Kandydat dołącza jednym kliknięciem.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-card hover:shadow-elegant transition-all">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-accent flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Bezpieczeństwo RODO</CardTitle>
                <CardDescription>
                  Zgodność z przepisami UE. 
                  Twoje dane są bezpieczne i zaszyfrowane.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-card hover:shadow-elegant transition-all">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Notatki i oceny</CardTitle>
                <CardDescription>
                  Firmy mogą robić notatki i oceniać kandydatów 
                  bezpośrednio po rozmowie.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-card hover:shadow-elegant transition-all">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-accent flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Zero instalacji</CardTitle>
                <CardDescription>
                  Wszystko działa w przeglądarce. 
                  Nie musisz instalować żadnego oprogramowania.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container py-20">
          <Card className="bg-gradient-primary text-white border-0 shadow-glow">
            <CardContent className="p-12 text-center">
              <h2 className="text-4xl font-bold mb-4">
                Zacznij rekrutować już dziś
              </h2>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                Dołącz do platform i poznaj kandydatów na żywo. 
                Bez ukrytych opłat, bez pośredników.
              </p>
              <Button asChild size="lg" variant="secondary" className="text-lg">
                <Link to="/auth">Utwórz darmowe konto</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
};

export default Index;
