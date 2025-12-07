import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Wrench, 
  Camera, 
  MapPin, 
  Banknote, 
  CheckCircle2, 
  Loader2,
  Eye,
  Sparkles,
  ArrowRight,
  ImagePlus,
  X,
  Images
} from "lucide-react";
import { WojewodztwoSelect } from "@/components/jobs/WojewodztwoSelect";
import { CityAutocomplete } from "@/components/jobs/CityAutocomplete";
import { WOJEWODZTWA } from "@/lib/constants";

interface Category {
  id: string;
  name: string;
}

interface GalleryImage {
  id?: string;
  url: string;
  file?: File;
  isNew?: boolean;
}

const FORM_STORAGE_KEY = "worker_onboarding_form";
const CATEGORIES_STORAGE_KEY = "worker_onboarding_categories";

export default function WorkerOnboarding() {
  const navigate = useNavigate();
  const { profile, refreshProfile, isAuthenticated, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [visibilitySuccess, setVisibilitySuccess] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    phone: "",
    wojewodztwo: "",
    miasto: "",
    bio: "",
    hourly_rate: "",
  });

  const [searchParams] = useSearchParams();

  // Save form to localStorage whenever it changes (after initialization)
  useEffect(() => {
    if (formInitialized) {
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(form));
    }
  }, [form, formInitialized]);

  // Save selected categories to localStorage
  useEffect(() => {
    if (formInitialized && selectedCategories.length > 0) {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(selectedCategories));
    }
  }, [selectedCategories, formInitialized]);

  // Handle visibility payment success
  useEffect(() => {
    if (searchParams.get("visibility_success") === "true") {
      setVisibilitySuccess(true);
      refreshProfile();
      // Clean URL
      window.history.replaceState({}, "", "/worker-onboarding");
      // Auto-hide success modal after 3 seconds
      setTimeout(() => {
        setVisibilitySuccess(false);
      }, 3000);
    }
    if (searchParams.get("visibility_cancelled") === "true") {
      toast.info("Płatność została anulowana");
      window.history.replaceState({}, "", "/worker-onboarding");
    }
  }, [searchParams, refreshProfile]);

  // Initialize form - restore from localStorage or profile
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
      return;
    }
    
    if (profile && !formInitialized) {
      // If already completed, redirect to profile
      if ((profile as any).worker_profile_completed) {
        // Clear storage on completion
        localStorage.removeItem(FORM_STORAGE_KEY);
        localStorage.removeItem(CATEGORIES_STORAGE_KEY);
        navigate("/profile");
        return;
      }
      
      // Try to restore from localStorage first (for returning after payment)
      const savedForm = localStorage.getItem(FORM_STORAGE_KEY);
      const savedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      
      if (savedForm) {
        try {
          const parsed = JSON.parse(savedForm);
          setForm(parsed);
        } catch (e) {
          // Fallback to profile data
          setForm({
            name: profile.name || "",
            phone: profile.phone || "",
            wojewodztwo: profile.wojewodztwo || "",
            miasto: profile.miasto || "",
            bio: profile.bio || "",
            hourly_rate: profile.hourly_rate?.toString() || "",
          });
        }
      } else {
        // Pre-fill with existing profile data
        setForm({
          name: profile.name || "",
          phone: profile.phone || "",
          wojewodztwo: profile.wojewodztwo || "",
          miasto: profile.miasto || "",
          bio: profile.bio || "",
          hourly_rate: profile.hourly_rate?.toString() || "",
        });
      }
      
      if (savedCategories) {
        try {
          setSelectedCategories(JSON.parse(savedCategories));
        } catch (e) {
          // Will be loaded from DB in fetchWorkerCategories
        }
      }
      
      setAvatarUrl(profile.avatar_url);
      setFormInitialized(true);
    }
  }, [profile, authLoading, isAuthenticated, navigate, formInitialized]);

  useEffect(() => {
    fetchCategories();
    if (profile) {
      fetchWorkerCategories();
    }
  }, [profile]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("id, name")
      .order("name");
    if (data) setCategories(data);
  };

  const fetchWorkerCategories = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("worker_categories")
      .select("category_id")
      .eq("worker_id", profile.id);
    if (data) {
      setSelectedCategories(data.map(wc => wc.category_id));
    }
  };

  const updateForm = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Wybierz plik graficzny");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Zdjęcie nie może być większe niż 5MB");
      return;
    }

    setUploading(true);
    
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || 'jpg';
      // Path must include user_id as folder for RLS policy to work
      const path = `${profile.user_id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) {
        console.error("Avatar upload error:", uploadError);
        toast.error("Błąd podczas przesyłania zdjęcia: " + uploadError.message);
        return;
      }

      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      const newAvatarUrl = publicData.publicUrl + `?t=${Date.now()}`;
      setAvatarUrl(newAvatarUrl);
      toast.success("Zdjęcie zostało przesłane");
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast.error("Wystąpił błąd podczas przesyłania zdjęcia");
    } finally {
      setUploading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !profile) return;

    const newImages: GalleryImage[] = [];
    
    for (let i = 0; i < files.length && galleryImages.length + newImages.length < 10; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      newImages.push({ url, file, isNew: true });
    }

    setGalleryImages(prev => [...prev, ...newImages]);
    
    if (files.length > 10 - galleryImages.length) {
      toast.info("Maksymalnie 10 zdjęć w galerii");
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
  };

  const isFormValid = () => {
    const valid = (
      form.name.trim() !== "" &&
      form.phone.trim() !== "" &&
      form.wojewodztwo !== "" &&
      form.miasto.trim() !== "" &&
      form.bio.trim() !== "" &&
      form.hourly_rate !== "" &&
      selectedCategories.length > 0
    );
    return valid;
  };

  const handleSubmit = async () => {
    if (!profile || !isFormValid()) {
      toast.error("Wypełnij wszystkie wymagane pola");
      return;
    }

    setLoading(true);

    try {
      // Update profile - also set is_available to true so worker appears in listings
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          name: form.name,
          phone: form.phone,
          wojewodztwo: form.wojewodztwo,
          miasto: form.miasto,
          bio: form.bio,
          hourly_rate: parseFloat(form.hourly_rate),
          avatar_url: avatarUrl,
          worker_profile_completed: true,
          is_available: true, // Important: make worker visible
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (profileError) throw profileError;

      // Update worker categories
      await supabase
        .from("worker_categories")
        .delete()
        .eq("worker_id", profile.id);

      if (selectedCategories.length > 0) {
        const categoryInserts = selectedCategories.map(catId => ({
          worker_id: profile.id,
          category_id: catId,
        }));
        const { error: catError } = await supabase.from("worker_categories").insert(categoryInserts);
        if (catError) {
          console.error("Error inserting categories:", catError);
        }
      }

      // Upload gallery images
      const newGalleryImages = galleryImages.filter(img => img.isNew && img.file);
      for (const img of newGalleryImages) {
        if (!img.file) continue;
        
        const ext = img.file.name.split(".").pop();
        const fileName = `${profile.user_id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
        
        const { error: uploadError } = await supabase.storage
          .from("worker-gallery")
          .upload(fileName, img.file);
        
        if (!uploadError) {
          const { data: publicData } = supabase.storage
            .from("worker-gallery")
            .getPublicUrl(fileName);
          
          await supabase.from("worker_gallery").insert({
            worker_id: profile.id,
            image_url: publicData.publicUrl,
          });
        }
      }

      // Clear localStorage after successful submission
      localStorage.removeItem(FORM_STORAGE_KEY);
      localStorage.removeItem(CATEGORIES_STORAGE_KEY);

      await refreshProfile();
      toast.success("Profil wykonawcy został aktywowany! Teraz możesz składać oferty na zlecenia.");
      navigate("/workers");
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(error.message || "Wystąpił błąd podczas aktywacji profilu");
    } finally {
      setLoading(false);
    }
  };

  const handlePayForVisibility = async () => {
    if (!profile) return;
    
    setPaymentLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("create-worker-visibility-payment", {
        body: { profileId: profile.id }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      toast.error("Błąd podczas tworzenia płatności");
    } finally {
      setPaymentLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container py-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const workerVisibilityPaid = (profile as any)?.worker_visibility_paid;

  return (
    <Layout>
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-hero border-b border-border/50">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />
        </div>
        <div className="container relative py-16 md:py-20">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Wrench className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Dołącz jako wykonawca
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Uzupełnij swój profil, aby móc składać oferty na zlecenia i zarabiać
          </p>
        </div>
      </div>

      <div className="container py-10">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Profile Form */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Dane profilu
              </CardTitle>
              <CardDescription>
                Wypełnij wszystkie pola, aby aktywować tryb wykonawcy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 rounded-2xl border-4 border-primary/20">
                  <AvatarImage src={avatarUrl || ""} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary-glow text-white text-2xl rounded-2xl">
                    {form.name?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors">
                      <Camera className="h-4 w-4" />
                      {uploading ? "Przesyłanie..." : "Zmień zdjęcie"}
                    </div>
                  </Label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Imię i nazwisko *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    placeholder="Jan Kowalski"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefon *</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => updateForm("phone", e.target.value)}
                    placeholder="+48 123 456 789"
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Województwo *
                  </Label>
                  <WojewodztwoSelect
                    value={form.wojewodztwo}
                    onChange={(v) => updateForm("wojewodztwo", v)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Miasto *
                  </Label>
                  <CityAutocomplete
                    value={form.miasto}
                    onChange={(v) => updateForm("miasto", v)}
                    onRegionChange={(region) => {
                      const normalizedRegion = region.toLowerCase();
                      const matchedWojewodztwo = WOJEWODZTWA.find(
                        (w) => w.toLowerCase() === normalizedRegion
                      );
                      if (matchedWojewodztwo && matchedWojewodztwo !== form.wojewodztwo) {
                        updateForm("wojewodztwo", matchedWojewodztwo);
                      }
                    }}
                    placeholder="Wpisz miasto..."
                  />
                </div>
              </div>

              {/* Hourly Rate */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  Stawka godzinowa (zł) *
                </Label>
                <Input
                  type="number"
                  value={form.hourly_rate}
                  onChange={(e) => updateForm("hourly_rate", e.target.value)}
                  placeholder="50"
                  min="1"
                  className="h-11 rounded-xl"
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label>O sobie *</Label>
                <Textarea
                  value={form.bio}
                  onChange={(e) => updateForm("bio", e.target.value)}
                  placeholder="Opisz swoje doświadczenie i umiejętności..."
                  className="min-h-[120px] rounded-xl resize-none"
                />
              </div>

              {/* Categories */}
              <div className="space-y-3">
                <Label>Kategorie usług * (wybierz co najmniej jedną)</Label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <Badge
                      key={cat.id}
                      variant={selectedCategories.includes(cat.id) ? "default" : "outline"}
                      className="cursor-pointer px-3 py-1.5 text-sm transition-all hover:scale-105"
                      onClick={() => toggleCategory(cat.id)}
                    >
                      {selectedCategories.includes(cat.id) && (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      )}
                      {cat.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Gallery */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Images className="h-4 w-4" />
                  Galeria prac (opcjonalne)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Dodaj zdjęcia swoich realizacji, aby pokazać zleceniodawcom swoje umiejętności (max. 10 zdjęć)
                </p>
                
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {galleryImages.map((img, index) => (
                    <div key={index} className="relative aspect-square group">
                      <img
                        src={img.url}
                        alt={`Galeria ${index + 1}`}
                        className="w-full h-full object-cover rounded-xl border border-border"
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(index)}
                        className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  
                  {galleryImages.length < 10 && (
                    <label className="aspect-square border-2 border-dashed border-primary/30 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 transition-colors">
                      <ImagePlus className="h-6 w-6 text-primary/50 mb-1" />
                      <span className="text-xs text-muted-foreground">Dodaj</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleGalleryUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visibility Success Modal - auto-closes after 3 seconds */}
          {visibilitySuccess && (
            <Card className="card-modern border-2 border-primary bg-gradient-to-br from-primary/10 to-primary/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-primary animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-primary">Gratulacje! 🎉</h3>
                <p className="text-lg text-foreground mb-4">
                  Twoja widoczność została aktywowana!
                </p>
                <p className="text-muted-foreground">
                  Teraz zleceniodawcy mogą Cię znaleźć w katalogu wykonawców.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Visibility Payment Option - optional, shown only if not paid */}
          {!visibilitySuccess && !workerVisibilityPaid && (
            <Card className="card-modern border-2 border-dashed border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Widoczność w katalogu wykonawców
                  <Badge variant="outline" className="ml-2">Opcjonalne</Badge>
                </CardTitle>
                <CardDescription>
                  Zapłać 5 zł, aby Twój profil był widoczny dla zleceniodawców szukających wykonawców
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium mb-1">Co zyskujesz?</p>
                      <ul className="text-muted-foreground space-y-1">
                        <li>• Twój profil pojawi się w katalogu wykonawców</li>
                        <li>• Zleceniodawcy będą mogli Cię wyszukać i skontaktować się bezpośrednio</li>
                        <li>• Jednorazowa opłata - bez ukrytych kosztów</li>
                      </ul>
                    </div>
                  </div>
                  <Button 
                    onClick={handlePayForVisibility}
                    disabled={paymentLoading}
                    variant="outline"
                    className="w-full h-12 rounded-xl gap-2"
                  >
                    {paymentLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        Wykup widoczność za 5 zł
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Możesz to zrobić teraz lub później z poziomu profilu
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Visibility confirmed - compact success info */}
          {!visibilitySuccess && workerVisibilityPaid && (
            <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-xl border border-primary/30">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="text-sm font-medium">
                Widoczność aktywna - zleceniodawcy mogą Cię znaleźć w katalogu wykonawców
              </span>
            </div>
          )}

          {/* Submit Button - FREE activation */}
          <Button
            onClick={handleSubmit}
            disabled={loading || !isFormValid()}
            className="w-full h-14 rounded-xl text-lg gap-2"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Aktywuj profil wykonawcy (za darmo)
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Po aktywacji będziesz mógł składać oferty na zlecenia.
            {!workerVisibilityPaid && " Wykup widoczność, aby pojawić się w katalogu wykonawców."}
          </p>
        </div>
      </div>
    </Layout>
  );
}