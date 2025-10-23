import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, UserCircle, Calendar, Video } from "lucide-react";
import Navbar from "@/components/Navbar";

const Dashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error loading profile:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Ładowanie...</div>
        </div>
      </>
    );
  }

  const isCandidate = profile?.role === "candidate";

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-subtle">
        <div className="container py-12">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              {isCandidate ? (
                <UserCircle className="w-8 h-8 text-primary" />
              ) : (
                <Briefcase className="w-8 h-8 text-primary" />
              )}
              <h1 className="text-4xl font-bold">
                {isCandidate ? "Panel Kandydata" : "Panel Firmy"}
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Witaj, {profile?.email}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="shadow-card hover:shadow-elegant transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCircle className="w-5 h-5 text-primary" />
                  Profil
                </CardTitle>
                <CardDescription>
                  {isCandidate 
                    ? "Uzupełnij swoje dane i CV" 
                    : "Uzupełnij informacje o firmie"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Edytuj profil
                </Button>
              </CardContent>
            </Card>

            {!isCandidate && (
              <Card className="shadow-card hover:shadow-elegant transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-primary" />
                    Pokoje rozmów
                  </CardTitle>
                  <CardDescription>
                    Twórz i zarządzaj rozmowami wideo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    Utwórz pokój
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-card hover:shadow-elegant transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  {isCandidate ? "Moje rozmowy" : "Zaplanowane rozmowy"}
                </CardTitle>
                <CardDescription>
                  {isCandidate 
                    ? "Zobacz zaplanowane rozmowy" 
                    : "Przeglądaj harmonogram"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-4">
                  Brak zaplanowanych rozmów
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 p-6 rounded-lg bg-gradient-primary text-white">
            <h2 className="text-2xl font-bold mb-2">
              {isCandidate 
                ? "Gotowy na rozmowę?" 
                : "Rozpocznij rekrutację"}
            </h2>
            <p className="mb-4 opacity-90">
              {isCandidate
                ? "Poczekaj na zaproszenie od firm i weź udział w rozmowie wideo 1:1"
                : "Utwórz pokój rozmowy, wygeneruj link i zaproś kandydatów"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
