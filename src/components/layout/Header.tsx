import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { Briefcase, Menu, Plus, User, LogOut, Settings, LayoutDashboard, Users } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

export const Header = () => {
  const { isAuthenticated, profile, signOut, isClient, isWorker, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full glass">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary">
            <Briefcase className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">ZlecenieTeraz</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/jobs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Zlecenia
          </Link>
          <Link to="/workers" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Wykonawcy
          </Link>
          {isAuthenticated && isClient && (
            <Button asChild size="sm" className="gap-2">
              <Link to="/jobs/new">
                <Plus className="h-4 w-4" />
                Dodaj zlecenie
              </Link>
            </Button>
          )}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={profile?.avatar_url || ''} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-0.5 leading-none">
                    <p className="font-medium text-sm">{profile?.name || 'Użytkownik'}</p>
                    <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Panel
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profil
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Admin
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Wyloguj
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link to="/login">Zaloguj</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Zarejestruj</Link>
              </Button>
            </div>
          )}
        </nav>

        {/* Mobile Nav */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <nav className="flex flex-col gap-4 mt-8">
              <Link 
                to="/jobs" 
                className="text-lg font-medium"
                onClick={() => setMobileOpen(false)}
              >
                Zlecenia
              </Link>
              <Link 
                to="/workers" 
                className="text-lg font-medium"
                onClick={() => setMobileOpen(false)}
              >
                Znajdź wykonawcę
              </Link>
              {isAuthenticated ? (
                <>
                  {isClient && (
                    <Link 
                      to="/jobs/new" 
                      className="text-lg font-medium text-primary"
                      onClick={() => setMobileOpen(false)}
                    >
                      Dodaj zlecenie
                    </Link>
                  )}
                  <Link 
                    to="/dashboard" 
                    className="text-lg font-medium"
                    onClick={() => setMobileOpen(false)}
                  >
                    Panel
                  </Link>
                  <Link 
                    to="/profile" 
                    className="text-lg font-medium"
                    onClick={() => setMobileOpen(false)}
                  >
                    Profil
                  </Link>
                  <Button 
                    variant="destructive" 
                    onClick={() => { handleSignOut(); setMobileOpen(false); }}
                    className="mt-4"
                  >
                    Wyloguj
                  </Button>
                </>
              ) : (
                <div className="flex flex-col gap-2 mt-4">
                  <Button asChild variant="outline">
                    <Link to="/login" onClick={() => setMobileOpen(false)}>Zaloguj</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/register" onClick={() => setMobileOpen(false)}>Zarejestruj</Link>
                  </Button>
                </div>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};