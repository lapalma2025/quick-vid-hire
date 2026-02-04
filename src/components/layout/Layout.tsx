import { ReactNode, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Header } from "./Header";
import { Breadcrumbs } from "./Breadcrumbs";
import { SchemaOrg } from "@/components/seo/SchemaOrg";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface LayoutProps {
  children: ReactNode;
  showBreadcrumbs?: boolean;
  showFooter?: boolean;
}

export const Layout = ({
  children,
  showBreadcrumbs = true,
  showFooter = true,
}: LayoutProps) => {
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (showFooter && footerRef.current) {
      gsap.fromTo(
        footerRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top 95%",
          },
        },
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [showFooter]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SchemaOrg />
      <Header />
      {showBreadcrumbs && <Breadcrumbs />}
      <main className="flex-1">{children}</main>

      {showFooter && (
        <footer
          ref={footerRef}
          className="border-t border-border/50 bg-muted/30 py-12 mt-auto"
        >
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
              <div>
                <h4 className="font-display font-bold text-lg mb-4">O nas</h4>
                <ul className="space-y-3">
                  <li>
                    <Link
                      to="/how-it-works"
                      className="text-muted-foreground hover:text-primary transition-colors duration-300"
                    >
                      Jak to działa
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/safety"
                      className="text-muted-foreground hover:text-primary transition-colors duration-300"
                    >
                      O platformie
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/faq"
                      className="text-muted-foreground hover:text-primary transition-colors duration-300"
                    >
                      FAQ
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-display font-bold text-lg mb-4">
                  Dla zleceniodawców
                </h4>
                <ul className="space-y-3">
                  <li>
                    <Link
                      to="/jobs/new"
                      className="text-muted-foreground hover:text-primary transition-colors duration-300"
                    >
                      Dodaj zlecenie
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/client-tips"
                      className="text-muted-foreground hover:text-primary transition-colors duration-300"
                    >
                      Porady
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/safety"
                      className="text-muted-foreground hover:text-primary transition-colors duration-300"
                    >
                      Bezpieczeństwo
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-display font-bold text-lg mb-4">Dla wykonawców</h4>
                <ul className="space-y-3">
                  <li>
                    <Link
                      to="/jobs"
                      className="text-muted-foreground hover:text-primary transition-colors duration-300"
                    >
                      Znajdź zlecenie
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/worker-guide"
                      className="text-muted-foreground hover:text-primary transition-colors duration-300"
                    >
                      Jak zacząć
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/reviews"
                      className="text-muted-foreground hover:text-primary transition-colors duration-300"
                    >
                      Opinie
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-display font-bold text-lg mb-4">Kontakt</h4>
                <ul className="space-y-3">
                  <li>
                    <Link
                      to="/help"
                      className="text-muted-foreground hover:text-primary transition-colors duration-300"
                    >
                      Pomoc
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/terms"
                      className="text-muted-foreground hover:text-primary transition-colors duration-300"
                    >
                      Regulamin
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/privacy"
                      className="text-muted-foreground hover:text-primary transition-colors duration-300"
                    >
                      Polityka prywatności
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-display font-bold text-lg mb-4">Blog</h4>
                <ul className="space-y-3">
                  <li>
                    <Link
                      to="/blog"
                      className="text-muted-foreground hover:text-primary transition-colors duration-300"
                    >
                      Wszystkie wpisy
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/terms"
                      className="text-muted-foreground hover:text-primary transition-colors duration-300"
                    >
                      Regulamin
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/privacy"
                      className="text-muted-foreground hover:text-primary transition-colors duration-300"
                    >
                      Polityka prywatności
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-border/50 mt-10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                <span className="text-lg font-bold text-white">C</span>
              </div>
              <span className="font-display font-bold text-xl">Closey</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Closey. Wszystkie prawa zastrzeżone.
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};
