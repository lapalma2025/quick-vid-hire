import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-card py-8 mt-auto">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-semibold mb-3">O nas</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/how-it-works" className="hover:text-foreground transition-colors">Jak to działa</Link></li>
                <li><Link to="/pricing" className="hover:text-foreground transition-colors">Cennik</Link></li>
                <li><Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Dla zleceniodawców</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/jobs/new" className="hover:text-foreground transition-colors">Dodaj zlecenie</Link></li>
                <li><Link to="/client-tips" className="hover:text-foreground transition-colors">Porady</Link></li>
                <li><Link to="/safety" className="hover:text-foreground transition-colors">Bezpieczeństwo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Dla wykonawców</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/jobs" className="hover:text-foreground transition-colors">Znajdź zlecenie</Link></li>
                <li><Link to="/worker-guide" className="hover:text-foreground transition-colors">Jak zacząć</Link></li>
                <li><Link to="/reviews" className="hover:text-foreground transition-colors">Opinie</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Kontakt</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/help" className="hover:text-foreground transition-colors">Pomoc</Link></li>
                <li><Link to="/terms" className="hover:text-foreground transition-colors">Regulamin</Link></li>
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Polityka prywatności</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2024 ZlecenieTeraz. Wszystkie prawa zastrzeżone.
          </div>
        </div>
      </footer>
    </div>
  );
};
