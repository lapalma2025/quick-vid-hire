import { ReactNode } from 'react';
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
                <li>Jak to działa</li>
                <li>Cennik</li>
                <li>FAQ</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Dla zleceniodawców</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Dodaj zlecenie</li>
                <li>Porady</li>
                <li>Bezpieczeństwo</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Dla wykonawców</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Znajdź zlecenie</li>
                <li>Jak zacząć</li>
                <li>Opinie</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Kontakt</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Pomoc</li>
                <li>Regulamin</li>
                <li>Polityka prywatności</li>
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