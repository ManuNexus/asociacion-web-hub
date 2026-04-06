import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";
import { Link } from "react-router-dom";

const COOKIE_CONSENT_KEY = "ahora_cookie_consent";
const COOKIE_CONSENT_EXPIRY_KEY = "ahora_cookie_consent_expiry";
const CONSENT_DURATION_DAYS = 180; // 6 months

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    const expiry = localStorage.getItem(COOKIE_CONSENT_EXPIRY_KEY);

    if (consent && expiry) {
      if (Date.now() < Number(expiry)) return; // still valid
      // Expired — clear and show again
      localStorage.removeItem(COOKIE_CONSENT_KEY);
      localStorage.removeItem(COOKIE_CONSENT_EXPIRY_KEY);
    }

    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 400);
      return () => clearTimeout(timer);
    }
  }, []);

  const updateGtagConsent = (accepted: boolean) => {
    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        analytics_storage: accepted ? "granted" : "denied",
      });
    }
  };

  // On mount, restore consent state for GA
  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (consent === "accepted") updateGtagConsent(true);
  }, []);

  const saveConsent = (value: string) => {
    const expiryDate = Date.now() + CONSENT_DURATION_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(COOKIE_CONSENT_KEY, value);
    localStorage.setItem(COOKIE_CONSENT_EXPIRY_KEY, String(expiryDate));
    updateGtagConsent(value === "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-300">
      <div className="bg-card rounded-xl shadow-2xl border border-border max-w-md w-[calc(100%-2rem)] mx-4 p-6 animate-in zoom-in-95 duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
            <Cookie className="h-5 w-5 text-secondary" />
          </div>
          <h3 className="font-bold text-foreground text-lg">Uso de cookies</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Utilizamos cookies propias para el correcto funcionamiento de la web (sesión y preferencias). 
          Puedes consultar más información en nuestra{" "}
          <Link to="/politica-privacidad" className="underline text-primary hover:text-primary/80">
            Política de Privacidad
          </Link>.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => saveConsent("rejected")}>
            Rechazar
          </Button>
          <Button onClick={() => saveConsent("accepted")}>
            Aceptar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
