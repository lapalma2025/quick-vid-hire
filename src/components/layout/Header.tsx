import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { Briefcase, Menu, Plus, User, LogOut, Settings, LayoutDashboard, Wrench, Crown, BarChart3 } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { NotificationBell } from "./NotificationBell";
import { useViewModeStore } from "@/store/viewModeStore";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Header = () => {
  const { isAuthenticated, profile, signOut, isAdmin } = useAuth();
  const { viewMode, setViewMode } = useViewModeStore();
  const isClientView = viewMode === 'client';
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-500 ${
        scrolled ? "bg-background/95 backdrop-blur-xl shadow-md border-b border-border/50" : "bg-transparent"
      }`}
    >
      <div className="container flex h-20 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow shadow-lg shadow-primary/20 group-hover:shadow-xl group-hover:shadow-primary/30 group-hover:scale-105 transition-all duration-300">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-display font-bold tracking-tight">Hop Hop</span>
          </Link>
          
          {isAuthenticated && (
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'client' | 'worker')} className="hidden md:block ml-4">
              <TabsList className="h-9 bg-muted/50">
                <TabsTrigger value="client" className="text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Briefcase className="h-3.5 w-3.5" />
                  Zleceniodawca
                </TabsTrigger>
                <TabsTrigger value="worker" className="text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Wrench className="h-3.5 w-3.5" />
                  Wykonawca
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            to="/jobs"
            className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
          >
            Zlecenia
          </Link>
          <Link
            to="/workers"
            className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
          >
            Wykonawcy
          </Link>
          {isAuthenticated && isClientView && (
            <Button
              asChild
              size="default"
              className="gap-2 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300"
            >
              <Link to="/jobs/new">
                <Plus className="h-4 w-4" />
                Dodaj zlecenie
              </Link>
            </Button>
          )}
          {isAuthenticated ? (
            <>
              <NotificationBell />
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-11 w-11 rounded-xl p-0 hover:bg-primary/10 transition-colors duration-300"
                >
                  <Avatar className="h-10 w-10 rounded-xl border-2 border-primary/20">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary-glow text-white rounded-xl font-semibold">
                      {profile?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-60 rounded-xl p-2" align="end">
                <div className="flex items-center gap-3 p-3 mb-2 bg-muted/50 rounded-lg">
                  <Avatar className="h-10 w-10 rounded-lg">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary-glow text-white rounded-lg">
                      {profile?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="font-semibold text-sm">{profile?.name || "Użytkownik"}</p>
                    <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
                  </div>
                </div>
                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                  <Link to="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Panel
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setViewMode('client')}
                  className={`rounded-lg cursor-pointer ${viewMode === 'client' ? 'bg-primary/10 text-primary' : ''}`}
                >
                  <Briefcase className="mr-2 h-4 w-4" />
                  Zleceniodawca
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setViewMode('worker')}
                  className={`rounded-lg cursor-pointer ${viewMode === 'worker' ? 'bg-primary/10 text-primary' : ''}`}
                >
                  <Wrench className="mr-2 h-4 w-4" />
                  Wykonawca
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                  <Link to="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                  <Link to="/subscription">
                    <Crown className="mr-2 h-4 w-4" />
                    Subskrypcja
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                  <Link to="/statistics">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Statystyki
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link to="/admin">
                      <Settings className="mr-2 h-4 w-4" />
                      Admin
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="rounded-lg cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Wyloguj
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild className="rounded-xl hover:bg-primary/10 transition-colors duration-300">
                <Link to="/login">Zaloguj</Link>
              </Button>
              <Button
                asChild
                className="rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300"
              >
                <Link to="/register">Zarejestruj</Link>
              </Button>
            </div>
          )}
        </nav>

        {/* Mobile Nav */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="rounded-xl h-11 w-11">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 p-0">
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-display font-bold">Hop hop</span>
                </div>
              </div>

              <nav className="flex flex-col gap-2 p-6 flex-1">
                <Link
                  to="/jobs"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-medium hover:bg-primary/10 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Zlecenia
                </Link>
                <Link
                  to="/workers"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-medium hover:bg-primary/10 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Wykonawcy
                </Link>
                {isAuthenticated ? (
                  <>
                    <div className="mb-4">
                      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'client' | 'worker')} className="w-full">
                        <TabsList className="w-full h-12 bg-muted/50">
                          <TabsTrigger value="client" className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Briefcase className="h-4 w-4" />
                            Zleceniodawca
                          </TabsTrigger>
                          <TabsTrigger value="worker" className="flex-1 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Wrench className="h-4 w-4" />
                            Wykonawca
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                    {isClientView && (
                      <Link
                        to="/jobs/new"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Plus className="h-5 w-5" />
                        Dodaj zlecenie
                      </Link>
                    )}
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-medium hover:bg-primary/10 transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      Panel
                    </Link>
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-medium hover:bg-primary/10 transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      <User className="h-5 w-5" />
                      Profil
                    </Link>
                    <Link
                      to="/subscription"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-medium hover:bg-primary/10 transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Crown className="h-5 w-5" />
                      Subskrypcja
                    </Link>
                    <Link
                      to="/statistics"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-medium hover:bg-primary/10 transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      <BarChart3 className="h-5 w-5" />
                      Statystyki
                    </Link>
                  </>
                ) : null}
              </nav>

              <div className="p-6 border-t border-border/50">
                {isAuthenticated ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleSignOut();
                      setMobileOpen(false);
                    }}
                    className="w-full rounded-xl h-12 text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    Wyloguj
                  </Button>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Button asChild variant="outline" className="w-full rounded-xl h-12">
                      <Link to="/login" onClick={() => setMobileOpen(false)}>
                        Zaloguj
                      </Link>
                    </Button>
                    <Button asChild className="w-full rounded-xl h-12">
                      <Link to="/register" onClick={() => setMobileOpen(false)}>
                        Zarejestruj
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};
