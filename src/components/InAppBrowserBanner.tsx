import { useEffect, useState } from "react";
import { ExternalLink, X } from "lucide-react";

/**
 * Detecta navegadores in-app (Facebook, Instagram, Messenger, TikTok, LinkedIn, etc.)
 * que suelen fallar al cargar SPAs y muestra un banner para abrir en el navegador del sistema.
 */
const detectInAppBrowser = (): string | null => {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent || "";
  if (/FBAN|FBAV|FB_IAB|FBIOS/i.test(ua)) return "Facebook";
  if (/Instagram/i.test(ua)) return "Instagram";
  if (/Messenger/i.test(ua)) return "Messenger";
  if (/Twitter/i.test(ua)) return "Twitter";
  if (/LinkedInApp/i.test(ua)) return "LinkedIn";
  if (/TikTok|musical_ly|BytedanceWebview/i.test(ua)) return "TikTok";
  if (/Line\//i.test(ua)) return "Line";
  return null;
};

const STORAGE_KEY = "inapp-banner-dismissed";

export function InAppBrowserBanner() {
  const [appName, setAppName] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const detected = detectInAppBrowser();
    if (!detected) return;
    if (sessionStorage.getItem(STORAGE_KEY) === "1") {
      setDismissed(true);
    }
    setAppName(detected);
  }, []);

  if (!appName || dismissed) return null;

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  const openExternal = () => {
    if (isAndroid) {
      // Intent para abrir en Chrome en Android
      const url = currentUrl.replace(/^https?:\/\//, "");
      window.location.href = `intent://${url}#Intent;scheme=https;package=com.android.chrome;end`;
      // Fallback
      setTimeout(() => {
        window.open(currentUrl, "_blank");
      }, 500);
    } else if (isIOS) {
      // En iOS no hay forma fiable de forzar Safari; copiamos URL y mostramos instrucción
      window.open(currentUrl, "_blank");
    } else {
      window.open(currentUrl, "_blank");
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-primary text-primary-foreground shadow-lg">
      <div className="container py-3 flex items-center gap-3">
        <div className="flex-1 text-sm">
          <p className="font-medium">
            Estás viendo esta página dentro de {appName}
          </p>
          <p className="text-xs text-primary-foreground/80 mt-0.5">
            {isIOS
              ? "Ábrela en tu navegador para disfrutar de todas las funciones de la web. Pulsa los tres puntos «···» y elige «Abrir en el navegador»."
              : "Ábrela en tu navegador para disfrutar de todas las funciones de la web."}
          </p>
        </div>
        {!isIOS && (
          <button
            onClick={openExternal}
            className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir
          </button>
        )}
        <button
          onClick={handleDismiss}
          className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
