import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Copy, Calendar, Video } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";

const RoomDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoom();
  }, [id]);

  const loadRoom = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("interview_rooms")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setRoom(data);
    } catch (error: any) {
      console.error("Error loading room:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się załadować pokoju",
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/join/${room.id}?t=${room.invite_token}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Skopiowano!",
      description: "Link zaproszenia został skopiowany do schowka",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      draft: { label: "Szkic", variant: "secondary" },
      open: { label: "Otwarta", variant: "default" },
      live: { label: "Na żywo", variant: "destructive" },
      closed: { label: "Zakończona", variant: "outline" },
    };
    
    const { label, variant } = variants[status] || variants.draft;
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Ładowanie...</div>
        </div>
      </>
    );
  }

  if (!room) return null;

  const inviteLink = `${window.location.origin}/join/${room.id}?t=${room.invite_token}`;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-subtle py-12">
        <div className="container max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Powrót do dashboardu
          </Button>

          <div className="grid gap-6">
            <Card className="shadow-elegant">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-3xl mb-2">{room.title}</CardTitle>
                    <CardDescription>{room.description || "Brak opisu"}</CardDescription>
                  </div>
                  {getStatusBadge(room.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {room.scheduled_at && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Zaplanowana: {new Date(room.scheduled_at).toLocaleString("pl-PL")}
                    </span>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-3">Link zaproszenia dla kandydata:</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={inviteLink}
                      className="flex-1 px-3 py-2 text-sm bg-muted rounded-md border"
                    />
                    <Button onClick={copyInviteLink} size="sm">
                      <Copy className="w-4 h-4 mr-2" />
                      Kopiuj
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Udostępnij ten link kandydatowi, aby mógł dołączyć do rozmowy
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Akcje</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-4">
                <Button className="flex-1" disabled={room.status === "closed"}>
                  <Video className="w-4 h-4 mr-2" />
                  Start rozmowy
                </Button>
                <Button variant="outline" className="flex-1">
                  Edytuj szczegóły
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Kandydat</CardTitle>
                <CardDescription>
                  {room.candidate_id 
                    ? "Kandydat został przypisany" 
                    : "Oczekiwanie na dołączenie kandydata"}
                </CardDescription>
              </CardHeader>
              {room.candidate_id && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Kandydat dołączył do rozmowy
                  </p>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default RoomDetails;
