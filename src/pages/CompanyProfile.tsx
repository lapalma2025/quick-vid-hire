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

const CompanyProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    company_name: "",
    website: "",
    linkedin_url: "",
    about: "",
    size_range: "",
    industry: "",
  });

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
        .from("company_profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setFormData({
          company_name: data.company_name || "",
          website: data.website || "",
          linkedin_url: data.linkedin_url || "",
          about: data.about || "",
          size_range: data.size_range || "",
          industry: data.industry || "",
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
        .from("company_profiles")
        .upsert({
          user_id: userId,
          ...formData,
        });

      if (error) throw error;

      toast({
        title: "Sukces!",
        description: "Profil firmy został zapisany",
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
              <CardTitle className="text-3xl">Edytuj profil firmy</CardTitle>
              <CardDescription>
                Uzupełnij dane firmy, aby kandydaci mogli ją lepiej poznać
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Nazwa firmy *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Strona internetowa</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://..."
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                  <Input
                    id="linkedin_url"
                    type="url"
                    placeholder="https://linkedin.com/company/..."
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Branża</Label>
                  <Input
                    id="industry"
                    placeholder="np. Technologia, E-commerce, Finanse"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size_range">Wielkość firmy</Label>
                  <Input
                    id="size_range"
                    placeholder="np. 11-50, 51-200, 200+"
                    value={formData.size_range}
                    onChange={(e) => setFormData({ ...formData, size_range: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="about">O firmie</Label>
                  <Textarea
                    id="about"
                    placeholder="Opisz swoją firmę..."
                    value={formData.about}
                    onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                    rows={5}
                  />
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

export default CompanyProfile;
