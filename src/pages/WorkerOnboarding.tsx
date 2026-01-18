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
import { CategorySubcategorySelect } from "@/components/jobs/CategorySubcategorySelect";
import { WOJEWODZTWA, WROCLAW_DISTRICTS, WROCLAW_AREA_CITIES } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
const AVATAR_STORAGE_KEY = "worker_onboarding_avatar";
const GALLERY_STORAGE_KEY = "worker_onboarding_gallery";

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
  const [visibilityHandled, setVisibilityHandled] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    wojewodztwo: "",
    miasto: "",
    district: "",
    street: "",
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

  // Save selected categories to localStorage (even empty array to track that user visited)
  useEffect(() => {
    if (formInitialized) {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(selectedCategories));
    }
  }, [selectedCategories, formInitialized]);

  // Handle visibility payment success - verify with Stripe API and auto-activate profile
  useEffect(() => {
    if (visibilityHandled) return;
    
    const isSuccess = searchParams.get("visibility_success") === "true";
    const isCancelled = searchParams.get("visibility_cancelled") === "true";
    
    if (isSuccess && profile && formInitialized) {
      setVisibilityHandled(true);
      // Clean URL immediately
      window.history.replaceState({}, "", "/worker-onboarding");
      
      // Verify payment with Stripe API and auto-activate profile
      const verifyAndActivateProfile = async () => {
        try {
          // First, verify the payment with Stripe API (bypasses webhook issues)
          const { data: verifyData, error: verifyError } = await supabase.functions.invoke("verify-visibility-payment");
          
          if (verifyError) {
            console.error("Verification error:", verifyError);
            toast.error("Błąd weryfikacji płatności - spróbuj ponownie");
            return;
          }
          
          if (!verifyData?.success) {
            console.error("Payment not verified:", verifyData);
            toast.error("Płatność nie została potwierdzona - skontaktuj się z obsługą");
            return;
          }
          
          // Get form data from state or localStorage
          const savedForm = localStorage.getItem(FORM_STORAGE_KEY);
          const savedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY);
          const savedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);
          const savedGallery = localStorage.getItem(GALLERY_STORAGE_KEY);
          
          const formData = savedForm ? JSON.parse(savedForm) : form;
          const categoriesData = savedCategories ? JSON.parse(savedCategories) : selectedCategories;
          const finalAvatarUrl = savedAvatar || avatarUrl;
          const galleryUrls: string[] = savedGallery ? JSON.parse(savedGallery) : [];
          
          // Update profile with all data + mark as completed
          await supabase
            .from("profiles")
            .update({
              name: formData.name,
              phone: formData.phone,
              wojewodztwo: formData.wojewodztwo,
              miasto: formData.miasto,
              bio: formData.bio,
              hourly_rate: parseFloat(formData.hourly_rate),
              avatar_url: finalAvatarUrl,
              worker_profile_completed: true,
              worker_visibility_paid: true,
              is_available: true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", profile.id);

          // Update categories
          await supabase
            .from("worker_categories")
            .delete()
            .eq("worker_id", profile.id);

          if (categoriesData.length > 0) {
            const categoryInserts = categoriesData.map((catId: string) => ({
              worker_id: profile.id,
              category_id: catId,
            }));
            await supabase.from("worker_categories").insert(categoryInserts);
          }

          // Save gallery images to database
          if (galleryUrls.length > 0) {
            await supabase
              .from("worker_gallery")
              .delete()
              .eq("worker_id", profile.id);
            
            const galleryInserts = galleryUrls.map((url: string) => ({
              worker_id: profile.id,
              image_url: url,
            }));
            await supabase.from("worker_gallery").insert(galleryInserts);
          }

          // Clear localStorage
          localStorage.removeItem(FORM_STORAGE_KEY);
          localStorage.removeItem(CATEGORIES_STORAGE_KEY);
          localStorage.removeItem(AVATAR_STORAGE_KEY);
          localStorage.removeItem(GALLERY_STORAGE_KEY);
          
          await refreshProfile();
          toast.success("Profil wykonawcy aktywowany! Jesteś widoczny w katalogu wykonawców.");
          navigate("/workers");
        } catch (error) {
          console.error("Auto-activation error:", error);
          toast.error("Błąd podczas aktywacji - wypełnij formularz i kliknij aktywuj");
        }
      };
      
      verifyAndActivateProfile();
    }
    
    if (isCancelled) {
      setVisibilityHandled(true);
      toast.info("Płatność została anulowana");
      window.history.replaceState({}, "", "/worker-onboarding");
    }
  }, [searchParams, visibilityHandled, profile, formInitialized, form, selectedCategories, avatarUrl, navigate, refreshProfile]);

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
            wojewodztwo: profile.wojewodztwo || "",
            miasto: profile.miasto || "",
            district: (profile as any).district || "",
            street: (profile as any).street || "",
            bio: profile.bio || "",
            hourly_rate: profile.hourly_rate?.toString() || "",
          });
        }
      } else {
        // Pre-fill with existing profile data
        setForm({
          name: profile.name || "",
          wojewodztwo: profile.wojewodztwo || "",
          miasto: profile.miasto || "",
          district: (profile as any).district || "",
          street: (profile as any).street || "",
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
      
      // Restore avatar from localStorage first, then fallback to profile
      const savedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);
      if (savedAvatar) {
        setAvatarUrl(savedAvatar);
      } else {
        setAvatarUrl(profile.avatar_url);
      }
      
      // Restore gallery from localStorage
      const savedGallery = localStorage.getItem(GALLERY_STORAGE_KEY);
      if (savedGallery) {
        try {
          const galleryUrls = JSON.parse(savedGallery);
          setGalleryImages(galleryUrls.map((url: string) => ({ url, isNew: false })));
        } catch (e) {
          // Ignore
        }
      }
      
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
    
    // Don't overwrite if we already have categories from localStorage
    const savedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (savedCategories) {
      try {
        const parsed = JSON.parse(savedCategories);
        if (parsed.length > 0) {
          setSelectedCategories(parsed);
          return;
        }
      } catch (e) {
        // Continue to fetch from DB
      }
    }
    
    const { data } = await supabase
      .from("worker_categories")
      .select("category_id")
      .eq("worker_id", profile.id);
    if (data && data.length > 0) {
      setSelectedCategories(data.map(wc => wc.category_id));
    }
  };

  const updateForm = (key: string, value: string) => {
    setForm(prev => {
      const updated = { ...prev, [key]: value };
      // Reset dependent fields
      if (key === "wojewodztwo") {
        updated.miasto = "";
        updated.district = "";
        updated.street = "";
      }
      if (key === "miasto") {
        updated.district = "";
        updated.street = "";
      }
      return updated;
    });
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
      // Save to localStorage for persistence across payment redirect
      localStorage.setItem(AVATAR_STORAGE_KEY, newAvatarUrl);
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

    setUploadingGallery(true);
    const newImages: GalleryImage[] = [];
    
    try {
      for (let i = 0; i < files.length && galleryImages.length + newImages.length < 10; i++) {
        const file = files[i];
        
        // Upload immediately to storage
        const ext = file.name.split(".").pop()?.toLowerCase() || 'jpg';
        const fileName = `${profile.user_id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
        
        const { error: uploadError } = await supabase.storage
          .from("worker-gallery")
          .upload(fileName, file);
        
        if (!uploadError) {
          const { data: publicData } = supabase.storage
            .from("worker-gallery")
            .getPublicUrl(fileName);
          
          newImages.push({ url: publicData.publicUrl, isNew: true });
        }
      }

      const updatedGallery = [...galleryImages, ...newImages];
      setGalleryImages(updatedGallery);
      
      // Save to localStorage for persistence across payment redirect
      const urlsToSave = updatedGallery.map(img => img.url);
      localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(urlsToSave));
      
      if (files.length > 10 - galleryImages.length) {
        toast.info("Maksymalnie 10 zdjęć w galerii");
      }
      
      if (newImages.length > 0) {
        toast.success(`Dodano ${newImages.length} zdjęć do galerii`);
      }
    } catch (error) {
      console.error("Gallery upload error:", error);
      toast.error("Błąd podczas przesyłania zdjęć");
    } finally {
      setUploadingGallery(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages(prev => {
      const updated = prev.filter((_, i) => i !== index);
      const urlsToSave = updated.map(img => img.url);
      localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(urlsToSave));
      return updated;
    });
  };

  const isFormValid = () => {
    const nameValid = form.name.trim() !== "";
    const wojewodztwoValid = form.wojewodztwo !== "";
    const miastoValid = form.miasto.trim() !== "";
    const bioValid = form.bio.trim() !== "";
    const hourlyRateValid = form.hourly_rate !== "" && parseFloat(form.hourly_rate) > 0;
    const categoriesValid = selectedCategories.length > 0;
    
    return nameValid && wojewodztwoValid && miastoValid && bioValid && hourlyRateValid && categoriesValid;
  };

  const handleSubmit = async () => {
    if (!profile || !isFormValid()) {
      toast.error("Wypełnij wszystkie wymagane pola");
      return;
    }

    setLoading(true);

    try {
      // Geocode street if provided to get precise coordinates
      let locationLat: number | null = null;
      let locationLng: number | null = null;

      if (form.street.trim() && form.miasto) {
        try {
          const query = `${form.street.trim()}, ${form.miasto}, ${form.wojewodztwo || ""}, Polska`;
          const params = new URLSearchParams({
            q: query,
            format: "json",
            limit: "1",
            countrycodes: "pl",
            "accept-language": "pl",
          });
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?${params.toString()}`,
            { headers: { "User-Agent": "ZlecenieTeraz/1.0" } }
          );
          if (res.ok) {
            const data = await res.json();
            if (data.length > 0) {
              locationLat = parseFloat(data[0].lat);
              locationLng = parseFloat(data[0].lon);
            }
          }
        } catch (e) {
          console.error("Geocoding error:", e);
        }
      }

      // Update profile - also set is_available to true so worker appears in listings
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          name: form.name,
          wojewodztwo: form.wojewodztwo,
          miasto: form.miasto,
          district: form.district || null,
          street: form.street || null,
          location_lat: locationLat,
          location_lng: locationLng,
          bio: form.bio,
          hourly_rate: parseFloat(form.hourly_rate),
          avatar_url: avatarUrl,
          worker_profile_completed: true,
          is_available: true, // Important: make worker visible
          updated_at: new Date().toISOString(),
        } as any)
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

      // Save gallery images to database (already uploaded to storage)
      const galleryUrls = galleryImages.map(img => img.url).filter(Boolean);
      if (galleryUrls.length > 0) {
        // Delete existing gallery
        await supabase
          .from("worker_gallery")
          .delete()
          .eq("worker_id", profile.id);
        
        // Insert all gallery images
        const galleryInserts = galleryUrls.map(url => ({
          worker_id: profile.id,
          image_url: url,
        }));
        const { error: galleryError } = await supabase.from("worker_gallery").insert(galleryInserts);
        if (galleryError) {
          console.error("Error inserting gallery:", galleryError);
        }
      }

      // Clear localStorage after successful submission
      localStorage.removeItem(FORM_STORAGE_KEY);
      localStorage.removeItem(CATEGORIES_STORAGE_KEY);
      localStorage.removeItem(AVATAR_STORAGE_KEY);
      localStorage.removeItem(GALLERY_STORAGE_KEY);

      await refreshProfile();
      toast.success("Profil wykonawcy został aktywowany! Teraz możesz składać oferty na zlecenia.");
      // Free activation (without visibility) -> redirect to jobs
      navigate("/jobs");
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
              <div className="space-y-2">
                <Label>Imię i nazwisko *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  placeholder="Jan Kowalski"
                  className="h-11 rounded-xl"
                />
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
                    onChange={(miasto, region) => {
                      updateForm("miasto", miasto);
                      if (region) {
                        const normalizedRegion = region.toLowerCase();
                        const matchedWojewodztwo = WOJEWODZTWA.find(
                          (w) => w.toLowerCase() === normalizedRegion
                        );
                        if (matchedWojewodztwo && matchedWojewodztwo !== form.wojewodztwo) {
                          updateForm("wojewodztwo", matchedWojewodztwo);
                        }
                      }
                    }}
                    placeholder="Wpisz miasto..."
                  />
                </div>
              </div>

              {/* District for Wrocław */}
              {form.miasto.toLowerCase() === "wrocław" && (
                <div className="space-y-2 animate-fade-in">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Rejon / Osiedle (opcjonalnie)
                  </Label>
                  <Select
                    value={form.district}
                    onValueChange={(v) => updateForm("district", v === "__none__" ? "" : v)}
                  >
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Wybierz rejon..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">-- Nie wybieram --</SelectItem>
                      {Object.keys(WROCLAW_DISTRICTS).map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Wybierz rejon, aby być widocznym dla klientów szukających wykonawców w Twojej okolicy
                  </p>
                </div>
              )}

              {/* Street (no house number) for Wrocław area cities */}
              {form.miasto && (form.miasto.toLowerCase() === "wrocław" || WROCLAW_AREA_CITIES[form.miasto]) && (
                <div className="space-y-2 animate-fade-in">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Ulica (opcjonalnie, bez numeru domu)
                  </Label>
                  <Input
                    value={form.street}
                    onChange={(e) => updateForm("street", e.target.value)}
                    placeholder="np. Świdnicka"
                    className="h-11 rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground">
                    Jeśli podasz ulicę, na mapie pojawi się dokładniejsza lokalizacja Twojego profilu
                  </p>
                </div>
              )}

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
                <CategorySubcategorySelect
                  selectedCategories={selectedCategories}
                  onCategoriesChange={setSelectedCategories}
                  mode="multi"
                />
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

          {/* Free visibility info */}
          <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-xl border border-primary/30">
            <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="text-sm font-medium">
              Darmowa widoczność - po aktywacji profilu zleceniodawcy będą mogli Cię znaleźć w katalogu wykonawców
            </span>
          </div>

          {/* COMMENTED OUT - Visibility Payment Option - kept for future use
          {!workerVisibilityPaid && (
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

          {workerVisibilityPaid && (
            <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-xl border border-primary/30">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="text-sm font-medium">
                Widoczność aktywna - zleceniodawcy mogą Cię znaleźć w katalogu wykonawców
              </span>
            </div>
          )}
          END COMMENTED OUT */}

          {/* Submit Button - FREE activation */}
          <div className="space-y-3">
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
            
            {/* Show missing fields hint */}
            {!isFormValid() && (
              <div className="text-sm text-muted-foreground text-center space-y-1">
                <p>Wypełnij brakujące pola:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {!form.name.trim() && <Badge variant="outline" className="text-destructive border-destructive/50">Imię i nazwisko</Badge>}
                  {!form.wojewodztwo && <Badge variant="outline" className="text-destructive border-destructive/50">Województwo</Badge>}
                  {!form.miasto.trim() && <Badge variant="outline" className="text-destructive border-destructive/50">Miasto</Badge>}
                  {(!form.hourly_rate || parseFloat(form.hourly_rate) <= 0) && <Badge variant="outline" className="text-destructive border-destructive/50">Stawka godzinowa</Badge>}
                  {!form.bio.trim() && <Badge variant="outline" className="text-destructive border-destructive/50">O sobie</Badge>}
                  {selectedCategories.length === 0 && <Badge variant="outline" className="text-destructive border-destructive/50">Kategorie usług</Badge>}
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Po aktywacji będziesz mógł składać oferty na zlecenia.
            {!workerVisibilityPaid && " Wykup widoczność, aby pojawić się w katalogu wykonawców."}
          </p>
        </div>
      </div>
    </Layout>
  );
}