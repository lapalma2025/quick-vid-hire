import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Cookie, Settings, Shield, BarChart3, Target } from "lucide-react";
import { Link } from "react-router-dom";

const COOKIE_CONSENT_KEY = "hophop_cookie_consent";

export interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  consented: boolean;
  timestamp: number;
}

const defaultPreferences: CookiePreferences = {
  necessary: true, // Always true, cannot be disabled
  functional: false,
  analytics: false,
  marketing: false,
  consented: false,
  timestamp: 0,
};

export const getCookiePreferences = (): CookiePreferences | null => {
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const saveCookiePreferences = (prefs: CookiePreferences) => {
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(prefs));
};

export const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    const stored = getCookiePreferences();
    if (!stored || !stored.consented) {
      // Small delay so it doesn't flash immediately on page load
      const timer = setTimeout(() => setShowBanner(true), 500);
      return () => clearTimeout(timer);
    }
    setPreferences(stored);
  }, []);

  const handleAcceptAll = () => {
    const newPrefs: CookiePreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
      consented: true,
      timestamp: Date.now(),
    };
    saveCookiePreferences(newPrefs);
    setPreferences(newPrefs);
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleRejectAll = () => {
    const newPrefs: CookiePreferences = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
      consented: true,
      timestamp: Date.now(),
    };
    saveCookiePreferences(newPrefs);
    setPreferences(newPrefs);
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleSavePreferences = () => {
    const newPrefs: CookiePreferences = {
      ...preferences,
      necessary: true,
      consented: true,
      timestamp: Date.now(),
    };
    saveCookiePreferences(newPrefs);
    setPreferences(newPrefs);
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  if (!showBanner && !showSettings) return null;

  return (
    <>
      {/* Cookie Banner */}
      {showBanner && !showSettings && (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 animate-in slide-in-from-bottom duration-500">
          <div className="max-w-4xl mx-auto bg-background border border-border rounded-2xl shadow-2xl p-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Cookie className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">
                  Używamy plików cookies 🍪
                </h3>
                <p className="text-sm text-muted-foreground">
                  Ta strona wykorzystuje pliki cookies, aby zapewnić najlepsze doświadczenie 
                  użytkownika. Możesz dostosować swoje preferencje lub zaakceptować wszystkie.{" "}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Polityka prywatności
                  </Link>
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenSettings}
                  className="gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Dostosuj
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRejectAll}
                >
                  Odrzuć wszystkie
                </Button>
                <Button
                  size="sm"
                  onClick={handleAcceptAll}
                  className="bg-primary hover:bg-primary/90"
                >
                  Akceptuję wszystkie
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="w-5 h-5 text-primary" />
              Ustawienia plików cookies
            </DialogTitle>
            <DialogDescription>
              Dostosuj swoje preferencje dotyczące plików cookies. Niezbędne cookies
              są zawsze aktywne, ponieważ są wymagane do prawidłowego działania strony.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Necessary Cookies - Always On */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <Label className="font-semibold">Niezbędne</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Wymagane do podstawowego funkcjonowania strony. Bez nich strona 
                    nie będzie działać poprawnie.
                  </p>
                </div>
              </div>
              <Switch checked disabled className="data-[state=checked]:bg-primary" />
            </div>

            {/* Functional Cookies */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Settings className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <Label className="font-semibold">Funkcjonalne</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Umożliwiają zapamiętanie Twoich preferencji i ustawień, 
                    takich jak język czy region.
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.functional}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, functional: checked }))
                }
              />
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <Label className="font-semibold">Analityczne</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pomagają nam zrozumieć, jak użytkownicy korzystają ze strony, 
                    co pozwala ją ulepszać.
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.analytics}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, analytics: checked }))
                }
              />
            </div>

            {/* Marketing Cookies */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <Label className="font-semibold">Marketingowe</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Służą do wyświetlania spersonalizowanych reklam 
                    i śledzenia skuteczności kampanii.
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.marketing}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, marketing: checked }))
                }
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleRejectAll}
              className="flex-1"
            >
              Odrzuć wszystkie
            </Button>
            <Button
              variant="outline"
              onClick={handleAcceptAll}
              className="flex-1"
            >
              Akceptuj wszystkie
            </Button>
            <Button
              onClick={handleSavePreferences}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              Zapisz preferencje
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
