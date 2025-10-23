import { useState, useEffect } from "react";
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

const CandidateProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: "",
    headline: "",
    about: "",
    profession: "",
    location: "",
    linkedin_url: "",
    skills: [] as string[],
  });
  
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);

      const { data, error } = await supabase
        .from("candidate_profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setFormData({
          full_name: data.full_name || "",
          headline: data.headline || "",
          about: data.about || "",
          profession: data.profession || "",
          location: data.location || "",
          linkedin_url: data.linkedin_url || "",
          skills: data.skills || [],
        });
      }
    } catch (error: any) {
      console.error("Error loading profile:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się załadować profilu",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("candidate_profiles")
        .upsert({
          user_id: userId,
          ...formData,
        });

      if (error) throw error;

      toast({
        title: "Sukces!",
        description: "Profil został zapisany",
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()],
      });
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
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
              <CardTitle className="text-3xl">Edytuj profil kandydata</CardTitle>
              <CardDescription>
                Uzupełnij swoje dane, aby firmy mogły Cię lepiej poznać
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Imię i nazwisko *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="headline">Tytuł zawodowy *</Label>
                  <Input
                    id="headline"
                    placeholder="np. Junior Frontend Developer"
                    value={formData.headline}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profession">Branża</Label>
                  <Input
                    id="profession"
                    placeholder="np. IT, Marketing, Finanse"
                    value={formData.profession}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Lokalizacja</Label>
                  <Input
                    id="location"
                    placeholder="np. Warszawa, Polska"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                  <Input
                    id="linkedin_url"
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="about">O mnie</Label>
                  <Textarea
                    id="about"
                    placeholder="Opowiedz coś o sobie..."
                    value={formData.about}
                    onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                    rows={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Umiejętności</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Dodaj umiejętność"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                    />
                    <Button type="button" onClick={addSkill}>
                      Dodaj
                    </Button>
                  </div>
                  {formData.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.skills.map((skill) => (
                        <div
                          key={skill}
                          className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary"
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="hover:text-destructive"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Zapisywanie..." : "Zapisz profil"}
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

export default CandidateProfile;
