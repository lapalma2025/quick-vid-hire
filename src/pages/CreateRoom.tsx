import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";

const CreateRoom = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scheduled_at: "",
  });

  const generateToken = () => {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const invite_token = generateToken();

      const { data, error } = await supabase
        .from("interview_rooms")
        .insert({
          created_by: session.user.id,
          title: formData.title,
          description: formData.description,
          scheduled_at: formData.scheduled_at || null,
          invite_token,
          status: "draft",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sukces!",
        description: "Pokój rozmowy został utworzony",
      });

      navigate(`/rooms/${data.id}`);
    } catch (error: any) {
      console.error("Error creating room:", error);
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-subtle py-12">
        <div className="container max-w-3xl">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Powrót
          </Button>

          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="text-3xl">Utwórz pokój rozmowy</CardTitle>
              <CardDescription>
                Wypełnij szczegóły rozmowy i wygeneruj link zaproszenia dla kandydata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Tytuł rozmowy *</Label>
                  <Input
                    id="title"
                    placeholder="np. Rozmowa na stanowisko Frontend Developer"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Opis (opcjonalnie)</Label>
                  <Textarea
                    id="description"
                    placeholder="Dodatkowe informacje o rozmowie..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduled_at">Planowana data i godzina (opcjonalnie)</Label>
                  <Input
                    id="scheduled_at"
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                  />
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Po utworzeniu pokoju otrzymasz unikalny link zaproszenia, którym możesz podzielić się z kandydatem.
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Tworzenie..." : "Utwórz pokój"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/dashboard")}
                  >
                    Anuluj
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default CreateRoom;
