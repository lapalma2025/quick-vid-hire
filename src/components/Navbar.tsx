import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Video, LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";

const Navbar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
      toast({
        title: "Wylogowano",
        description: "Do zobaczenia!",
      });
    } catch (error: any) {
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <span className="bg-gradient-primary bg-clip-text text-transparent">
            Rekrutacja na żywo
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard">
                  <User className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Wyloguj
              </Button>
            </>
          ) : (
            <Button asChild>
              <Link to="/auth">Zaloguj się</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
