import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoAhora from "@/assets/logo-ahora.png";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/nosotros", label: "Quiénes Somos" },
  { href: "/noticias", label: "Sala de Prensa" },
  { href: "/eventos", label: "Eventos" },
  { href: "/transparencia", label: "Transparencia" },
  { href: "/hazte-socio", label: "Hazte Socio" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between md:h-20">
        <Link to="/" className="flex items-center">
          <img 
            src={logoAhora} 
            alt="AHORA" 
            className="h-8 md:h-10 w-auto object-contain" 
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`px-4 py-2 text-sm font-medium transition-colors rounded-md hover:bg-ahora-yellow/20 hover:text-ahora-yellow ${
                location.pathname === link.href
                  ? "text-ahora-yellow bg-ahora-yellow/15"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/socios"
            className="ml-2 px-4 py-2 text-sm font-semibold uppercase tracking-wide border-2 border-ahora-yellow text-ahora-yellow rounded-md hover:bg-ahora-yellow hover:text-background transition-colors"
          >
            Espacio Socio
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="md:hidden border-t border-border bg-background animate-fade-in">
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
            <Link
              to="/socios"
              onClick={() => setIsMenuOpen(false)}
              className="mx-4 mt-2 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-center border-2 border-ahora-yellow text-ahora-yellow rounded-md hover:bg-ahora-yellow hover:text-background transition-colors"
            >
              Espacio Socio
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
