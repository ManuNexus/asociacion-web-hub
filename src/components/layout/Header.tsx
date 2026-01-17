import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import logoAhora from "@/assets/logo-ahora.png";
import logoIcon from "@/assets/logo-ahora-icon.png";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/nosotros", label: "Quiénes Somos" },
  { href: "/noticias", label: "Sala de Prensa" },
  { href: "/eventos", label: "Eventos" },
  { href: "/transparencia", label: "Transparencia" },
  { href: "/hazte-socio", label: "Hazte Socio" },
];

interface SocioBasic {
  nombre: string;
  apellidos: string;
  foto_url: string | null;
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [socioData, setSocioData] = useState<SocioBasic | null>(null);
  const location = useLocation();
  const { user, isSocio, loading } = useAuth();

  useEffect(() => {
    const fetchSocioData = async () => {
      if (user && isSocio) {
        const { data } = await supabase
          .from("socios")
          .select("nombre, apellidos, foto_url")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (data) {
          setSocioData(data);
        }
      } else {
        setSocioData(null);
      }
    };

    if (!loading) {
      fetchSocioData();
    }
  }, [user, isSocio, loading]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between lg:h-20">
        <Link to="/" className="flex items-center shrink-0">
          <img 
            src={logoAhora} 
            alt="AHORA" 
            className="h-8 lg:h-10 w-auto object-contain" 
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`px-2.5 xl:px-4 py-2 text-sm font-medium transition-colors rounded-md hover:bg-ahora-yellow/20 hover:text-ahora-yellow whitespace-nowrap ${
                location.pathname === link.href
                  ? "text-ahora-yellow bg-ahora-yellow/15"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {socioData ? (
            <Link
              to="/socios"
              className="ml-2 flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-ahora-yellow hover:bg-ahora-yellow/10 transition-colors"
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src={socioData.foto_url || undefined} alt={socioData.nombre} />
                <AvatarFallback className="bg-ahora-yellow/20">
                  <img src={logoIcon} alt="AHORA" className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-ahora-yellow whitespace-nowrap">
                {socioData.nombre}
              </span>
            </Link>
          ) : (
            <Link
              to="/socios"
              className="ml-2 px-3 xl:px-4 py-2 text-sm font-semibold uppercase tracking-wide border-2 border-ahora-yellow text-ahora-yellow rounded-md hover:bg-ahora-yellow hover:text-background transition-colors whitespace-nowrap"
            >
              Espacio Socio
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="lg:hidden border-t border-border bg-background animate-fade-in">
          <div className="container py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={`px-4 py-3 text-sm font-medium transition-colors rounded-md ${
                  location.pathname === link.href
                    ? "text-ahora-yellow bg-ahora-yellow/15"
                    : "text-muted-foreground hover:text-ahora-yellow hover:bg-ahora-yellow/20"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {socioData ? (
              <Link
                to="/socios"
                onClick={() => setIsMenuOpen(false)}
                className="mx-4 mt-2 flex items-center justify-center gap-3 px-4 py-3 rounded-lg border-2 border-ahora-yellow hover:bg-ahora-yellow/10 transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={socioData.foto_url || undefined} alt={socioData.nombre} />
                  <AvatarFallback className="bg-ahora-yellow/20">
                    <img src={logoIcon} alt="AHORA" className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-ahora-yellow">
                  {socioData.nombre} {socioData.apellidos}
                </span>
              </Link>
            ) : (
              <Link
                to="/socios"
                onClick={() => setIsMenuOpen(false)}
                className="mx-4 mt-2 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-center border-2 border-ahora-yellow text-ahora-yellow rounded-md hover:bg-ahora-yellow hover:text-background transition-colors"
              >
                Espacio Socio
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
