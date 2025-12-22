import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

// COMMENTED OUT - FULL PRICING PAGE DISABLED FOR FREE ACCESS
// Original imports:
// import { CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Check, Crown, Sparkles, Zap } from "lucide-react";
// import { SUBSCRIPTION_PLANS } from "@/lib/stripe";

const Pricing = () => {
  // SIMPLIFIED VERSION - ALL FEATURES FREE
  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">Cennik</h1>
          <p className="text-muted-foreground text-center mb-12 text-lg">
            Aktualnie wszystkie funkcje są dostępne za darmo!
          </p>

          <Card className="border-2 border-primary bg-primary/5">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-16 w-16 text-primary mx-auto mb-6" />
              <h2 className="text-3xl font-bold mb-4">Za darmo!</h2>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                W ramach promocji wszystkie funkcje platformy są dostępne 
                całkowicie za darmo dla zarejestrowanych użytkowników.
              </p>
              <ul className="text-left max-w-md mx-auto space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Dodawanie nieograniczonej liczby ogłoszeń</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Brak opłat za publikację</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Pełen dostęp do wszystkich funkcji</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Bezpłatne przeglądanie ofert dla wykonawców</span>
                </li>
              </ul>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link to="/jobs/new">Dodaj zlecenie</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/register">Zarejestruj się</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-8">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Dlaczego za darmo?</h3>
              <p className="text-muted-foreground">
                Jesteśmy na etapie budowania społeczności i chcemy dać wszystkim 
                użytkownikom możliwość bezpłatnego korzystania z platformy. 
                Zarejestruj się i korzystaj z pełni możliwości bez żadnych opłat!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );

  /* ORIGINAL PAID PRICING PAGE - COMMENTED OUT
  const getPlanIcon = (planKey: string) => {
    if (planKey === "basic") return <Zap className="h-6 w-6" />;
    if (planKey === "pro") return <Sparkles className="h-6 w-6" />;
    return <Crown className="h-6 w-6" />;
  };

  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">Cennik</h1>
          <p className="text-muted-foreground text-center mb-12 text-lg">
            Przejrzysty i prosty cennik bez ukrytych kosztów.
          </p>

          <Card className="mb-8 border-2">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold">Pojedyncze ogłoszenie</h3>
                  <p className="text-muted-foreground">Bez subskrypcji, płacisz za każde ogłoszenie osobno</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold">5 zł</span>
                  <Button asChild>
                    <Link to="/jobs/new">Dodaj zlecenie</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Plany subskrypcyjne</h2>
            <p className="text-muted-foreground">Oszczędzaj publikując regularnie</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {(Object.entries(SUBSCRIPTION_PLANS) as [keyof typeof SUBSCRIPTION_PLANS, typeof SUBSCRIPTION_PLANS[keyof typeof SUBSCRIPTION_PLANS]][]).map(([key, plan]) => {
              const isPopular = key === "pro";
              return (
                <Card
                  key={key}
                  className={`relative transition-all ${
                    isPopular ? "border-primary ring-2 ring-primary/20" : ""
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">Popularne</Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className={`mx-auto h-14 w-14 rounded-full flex items-center justify-center mb-4 ${
                      key === "boost" ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white" :
                      key === "pro" ? "bg-gradient-to-br from-purple-500 to-indigo-600 text-white" :
                      "bg-primary/10 text-primary"
                    }`}>
                      {getPlanIcon(key)}
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{plan.price} zł</span>
                      <span className="text-muted-foreground"> / miesiąc</span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full"
                      variant={isPopular ? "default" : "outline"}
                      asChild
                    >
                      <Link to="/subscription">Wybierz plan</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="border-2 border-primary bg-primary/5">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-primary">Dla Wykonawców</Badge>
                  </div>
                  <h3 className="text-xl font-bold">Zawsze za darmo</h3>
                  <p className="text-muted-foreground">
                    Przeglądaj zlecenia, składaj oferty i buduj swoją reputację bez żadnych opłat
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link to="/register">Zarejestruj się</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="mt-12">
            <h2 className="text-2xl font-bold text-center mb-6">Opcje dodatkowe</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: "Wyróżnienie", price: 9, desc: "Zwiększona widoczność" },
                { name: "Podświetlenie", price: 5, desc: "Wyróżniający kolor" },
                { name: "PILNE", price: 4, desc: "Odznaka pilności" },
                { name: "Promowanie 24h", price: 3, desc: "Promocja czasowa" },
              ].map((addon) => (
                <Card key={addon.name}>
                  <CardContent className="p-4 text-center">
                    <h4 className="font-semibold">{addon.name}</h4>
                    <p className="text-2xl font-bold text-primary my-2">{addon.price} zł</p>
                    <p className="text-xs text-muted-foreground">{addon.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              * Użytkownicy z subskrypcją mogą korzystać z wyróżnień w ramach swojego pakietu
            </p>
          </div>

          <Card className="mt-12">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Dlaczego płatne ogłoszenia?</h3>
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
  */
};

export default Pricing;