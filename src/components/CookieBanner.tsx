import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";
import { Link } from "react-router-dom";

const COOKIE_CONSENT_KEY = "ahora_cookie_consent";

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay so it doesn't flash on load
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "rejected");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-card border-t border-border shadow-lg">
        <div className="container py-4 flex flex-col sm:flex-row items-center gap-4">
          <Cookie className="h-5 w-5 text-secondary flex-shrink-0 hidden sm:block" />
          <p className="text-sm text-muted-foreground text-center sm:text-left flex-1">
            Utilizamos cookies propias para el funcionamiento de la web (sesión y preferencias). 
            Puedes consultar más información en nuestra{" "}
            <Link to="/politica-privacidad" className="underline text-primary hover:text-primary/80">
              Política de Privacidad
            </Link>.
          </p>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={handleReject}>
              Rechazar
            </Button>
            <Button size="sm" onClick={handleAccept}>
              Aceptar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
