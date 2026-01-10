import { Link, useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";

interface BreadcrumbConfig {
  label: string;
  parent?: string;
}

// Mapowanie ścieżek na nazwy stron
const routeLabels: Record<string, BreadcrumbConfig> = {
  "/": { label: "Strona główna" },
  "/jobs": { label: "Zlecenia" },
  "/jobs/new": { label: "Nowe zlecenie", parent: "/jobs" },
  "/workers": { label: "Wykonawcy" },
  "/work-map": { label: "Mapa pracy" },
  "/dashboard": { label: "Panel użytkownika" },
  "/profile": { label: "Profil", parent: "/dashboard" },
  "/subscription": { label: "Subskrypcja", parent: "/dashboard" },
  "/statistics": { label: "Statystyki", parent: "/dashboard" },
  "/worker-onboarding": { label: "Rejestracja wykonawcy" },
  "/how-it-works": { label: "Jak to działa" },
  "/pricing": { label: "Cennik" },
  "/faq": { label: "FAQ" },
  "/client-tips": { label: "Porady dla zleceniodawców" },
  "/safety": { label: "Bezpieczeństwo" },
  "/worker-guide": { label: "Poradnik dla wykonawców" },
  "/reviews": { label: "Opinie" },
  "/help": { label: "Pomoc" },
  "/terms": { label: "Regulamin" },
  "/privacy": { label: "Polityka prywatności" },
  "/login": { label: "Logowanie" },
  "/register": { label: "Rejestracja" },
};

// Funkcja do generowania ścieżki breadcrumb
const generateBreadcrumbPath = (pathname: string): { path: string; label: string }[] => {
  const breadcrumbs: { path: string; label: string }[] = [{ path: "/", label: "Strona główna" }];
  
  // Sprawdź czy to dynamiczna ścieżka (np. /jobs/:id)
  const segments = pathname.split("/").filter(Boolean);
  
  if (segments.length === 0) return [];
  
  // Obsługa ścieżek ze szczegółami zlecenia
  if (segments[0] === "jobs" && segments.length >= 2) {
    breadcrumbs.push({ path: "/jobs", label: "Zlecenia" });
    
    if (segments[1] === "new") {
      breadcrumbs.push({ path: "/jobs/new", label: "Nowe zlecenie" });
    } else if (segments.length === 2) {
      // /jobs/:id - szczegóły zlecenia
      breadcrumbs.push({ path: pathname, label: "Szczegóły zlecenia" });
    } else if (segments[2] === "edit") {
      breadcrumbs.push({ path: `/jobs/${segments[1]}`, label: "Szczegóły zlecenia" });
      breadcrumbs.push({ path: pathname, label: "Edycja zlecenia" });
    } else if (segments[2] === "chat") {
      breadcrumbs.push({ path: `/jobs/${segments[1]}`, label: "Szczegóły zlecenia" });
      breadcrumbs.push({ path: pathname, label: "Czat" });
    }
    return breadcrumbs;
  }
  
  // Obsługa profilu wykonawcy
  if (segments[0] === "worker" && segments.length === 2) {
    breadcrumbs.push({ path: "/workers", label: "Wykonawcy" });
    breadcrumbs.push({ path: pathname, label: "Profil wykonawcy" });
    return breadcrumbs;
  }
  
  // Standardowe ścieżki
  const config = routeLabels[pathname];
  if (config) {
    if (config.parent) {
      const parentConfig = routeLabels[config.parent];
      if (parentConfig) {
        breadcrumbs.push({ path: config.parent, label: parentConfig.label });
      }
    }
    breadcrumbs.push({ path: pathname, label: config.label });
  }
  
  return breadcrumbs;
};

// Generowanie JSON-LD dla breadcrumbs
const generateBreadcrumbSchema = (breadcrumbs: { path: string; label: string }[]) => {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://hophop.pl";
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.label,
      "item": `${baseUrl}${crumb.path}`
    }))
  };
};

export const Breadcrumbs = () => {
  const location = useLocation();
  const breadcrumbs = generateBreadcrumbPath(location.pathname);
  
  // Nie pokazuj breadcrumbs na stronie głównej
  if (location.pathname === "/" || breadcrumbs.length <= 1) {
    return null;
  }
  
  const schemaData = generateBreadcrumbSchema(breadcrumbs);
  
  return (
    <>
      {/* JSON-LD Schema dla SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      
      <nav aria-label="Nawigacja okruszkowa" className="container py-3">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              
              return (
                <BreadcrumbItem key={crumb.path}>
                  {index === 0 ? (
                    <>
                      <BreadcrumbLink asChild>
                        <Link to={crumb.path} className="flex items-center gap-1">
                          <Home className="h-4 w-4" />
                          <span className="sr-only">{crumb.label}</span>
                        </Link>
                      </BreadcrumbLink>
                      <BreadcrumbSeparator />
                    </>
                  ) : isLast ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <>
                      <BreadcrumbLink asChild>
                        <Link to={crumb.path}>{crumb.label}</Link>
                      </BreadcrumbLink>
                      <BreadcrumbSeparator />
                    </>
                  )}
                </BreadcrumbItem>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </nav>
    </>
  );
};
