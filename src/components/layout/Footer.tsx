import { Link } from "react-router-dom";
import { Mail, MapPin, Twitter, Facebook, Send, Youtube } from "lucide-react";
import logoAhoraWhite from "@/assets/logo-ahora-white.png";
export function Footer() {
  return <footer className="bg-primary text-primary-foreground">
      <div className="container py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div className="space-y-4">
            <img src={logoAhoraWhite} alt="AHORA" className="h-8" width="116" height="32" />
            <p className="text-sm text-primary-foreground/80 max-w-xs">
              Asociación civil de ámbito nacional que defiende los valores constitucionales, el pluralismo ideológico y la convivencia.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h4 className="font-semibold">Enlaces</h4>
            <nav className="flex flex-col gap-2 text-sm">
              <Link to="/nosotros" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Quiénes Somos
              </Link>
              <Link to="/noticias" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Noticias
              </Link>
              <Link to="/transparencia" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Transparencia
              </Link>
              <Link to="/hazte-socio" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Hazte Socio
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold">Contacto</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-secondary" />
                <span className="text-primary-foreground/80">
                  C/ Aragón 458<br />08013 Barcelona
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-secondary" />
                <a className="text-primary-foreground/80 hover:text-primary-foreground transition-colors" href="mailto:info@ahoraorg.es">
                  info@ahoraorg.es
                </a>
              </div>
            </div>
            <div className="pt-2">
              <h5 className="text-xs font-medium text-primary-foreground/60 mb-2">Síguenos</h5>
              <div className="flex items-center gap-3">
                <a 
                  href="https://x.com/AhoraOrg_es" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-foreground/80 hover:text-secondary transition-colors"
                  title="X (Twitter)"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a 
                  href="https://www.facebook.com/profile.php?id=61585031630116" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-foreground/80 hover:text-secondary transition-colors"
                  title="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a 
                  href="https://t.me/ActuaAHORA" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-foreground/80 hover:text-secondary transition-colors"
                  title="Telegram"
                >
                  <Send className="h-5 w-5" />
                </a>
                <a 
                  href="https://www.youtube.com/@Asociaci%C3%B3nAHORA" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-foreground/80 hover:text-secondary transition-colors"
                  title="YouTube"
                >
                  <Youtube className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-primary-foreground/60">
            <p>© {new Date().getFullYear()} Asociación AHORA. Todos los derechos reservados.</p>
            <div className="flex items-center gap-4">
              <Link to="/politica-privacidad" className="hover:text-primary-foreground transition-colors">
                Política de Privacidad
              </Link>
              <span>|</span>
              <p>NIF: G24999484</p>
              <span>|</span>
              <p>Registro Nacional: Nº 631679</p>
            </div>
          </div>
          <p className="text-center text-xs text-primary-foreground/40 mt-6">
            Crafted with care by{" "}
            <a 
              href="https://x.com/framework_hq" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary-foreground transition-colors"
            >
              FRAMEWORK
            </a>
          </p>
        </div>
      </div>
    </footer>;
}