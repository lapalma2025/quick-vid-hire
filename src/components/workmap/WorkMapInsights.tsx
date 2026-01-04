import { Hotspot } from "@/pages/WorkMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Lightbulb, 
  MapPin, 
  Clock, 
  Flame,
  PlusCircle,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";

interface WorkMapInsightsProps {
  hotspots: Hotspot[];
}

function getActivityColor(activity: Hotspot["activity"]) {
  switch (activity) {
    case "Bardzo wysoka":
      return "bg-red-500/10 text-red-600 border-red-500/20";
    case "Wysoka":
      return "bg-orange-500/10 text-orange-600 border-orange-500/20";
    case "Średnia":
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    default:
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
  }
}

function getLevelStars(level: number) {
  return "🔥".repeat(Math.min(level, 5));
}

export function WorkMapInsights({ hotspots }: WorkMapInsightsProps) {
  const topHotspots = hotspots.slice(0, 5);

  const recommendations = [
    {
      icon: Flame,
      title: "Gastro & Eventy",
      text: "Centrum i okolice Rynku to idealne miejsce na oferty pracy w gastronomii i przy eventach.",
      color: "text-orange-500",
    },
    {
      icon: TrendingUp,
      title: "Logistyka & Dostawy",
      text: "Dworzec Główny i węzły komunikacyjne to hotspoty dla pracy w logistyce.",
      color: "text-blue-500",
    },
    {
      icon: Lightbulb,
      title: "Zwiększ stawkę",
      text: "W strefach niskiej aktywności rozważ wyższą stawkę lub elastyczne godziny.",
      color: "text-primary",
    },
  ];

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">
          Wnioski i rekomendacje
        </h2>
        <Link to="/jobs/new">
          <Button className="btn-primary gap-2">
            <PlusCircle className="h-4 w-4" />
            Dodaj ogłoszenie
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Hotspots */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Top 5 hotspotów dziś
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topHotspots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Ładowanie danych o hotspotach...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topHotspots.map((hotspot, index) => (
                  <div
                    key={hotspot.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-accent flex items-center justify-center text-primary-foreground font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {hotspot.name}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Peak: {hotspot.peakHours}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={getActivityColor(hotspot.activity)}
                      >
                        {hotspot.activity}
                      </Badge>
                      <span className="text-sm">{getLevelStars(hotspot.level)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-accent" />
              Rekomendacje
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-background ${rec.color}`}>
                    <rec.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{rec.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {rec.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* CTA */}
            <div className="pt-4 border-t border-border/50">
              <Link to="/jobs/new" className="block">
                <div className="p-4 rounded-xl bg-gradient-accent/10 hover:bg-gradient-accent/20 transition-colors group cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-foreground">
                        Dodaj ogłoszenie w popularnej lokalizacji
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Skorzystaj z danych o hotspotach przy tworzeniu oferty
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
