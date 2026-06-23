import { lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { PageTransition } from "@/components/PageTransition";
import { ScrollToTop } from "@/components/ScrollToTop";
import { LoadingScreen } from "@/components/LoadingScreen";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import CookieBanner from "@/components/CookieBanner";
import { InAppBrowserBanner } from "@/components/InAppBrowserBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Eager load the landing page for best LCP
import Index from "./pages/Index";
// Eager load NoticiaDetalle to avoid lazy-chunk failures in Facebook/Instagram in-app browsers
import NoticiaDetalle from "./pages/NoticiaDetalle";

// Lazy load other pages to reduce initial bundle size
const Nosotros = lazy(() => import("./pages/Nosotros"));
const Noticias = lazy(() => import("./pages/Noticias"));
const Transparencia = lazy(() => import("./pages/Transparencia"));
const HazteSocio = lazy(() => import("./pages/HazteSocio"));
const TarjetaConfirmada = lazy(() => import("./pages/TarjetaConfirmada"));
const HazteAmigo = lazy(() => import("./pages/HazteAmigo"));
const Dona = lazy(() => import("./pages/Dona"));
const CompletarIban = lazy(() => import("./pages/CompletarIban"));
const PoliticaPrivacidad = lazy(() => import("./pages/PoliticaPrivacidad"));
const CondicionesAfiliacion = lazy(() => import("./pages/CondicionesAfiliacion"));
const Auth = lazy(() => import("./pages/Auth"));
const AdminNoticias = lazy(() => import("./pages/AdminNoticias"));
const PanelSocios = lazy(() => import("./pages/PanelSocios"));
const Contabilidad = lazy(() => import("./pages/Contabilidad"));
const Eventos = lazy(() => import("./pages/Eventos"));
const SemaforoInstitucional = lazy(() => import("./pages/SemaforoInstitucional"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <GoogleAnalytics />
            <LoadingScreen />
            <InAppBrowserBanner />
            <CookieBanner />
            <Suspense fallback={null}>
              <PageTransition>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/nosotros" element={<Nosotros />} />
                  <Route path="/noticias" element={<Noticias />} />
                  <Route path="/noticias/:id" element={<NoticiaDetalle />} />
                  <Route path="/transparencia" element={<Transparencia />} />
                  <Route path="/hazte-socio" element={<HazteSocio />} />
                  <Route path="/hazte-socio/tarjeta-confirmada" element={<TarjetaConfirmada />} />
                  <Route path="/hazte-amigo" element={<HazteAmigo />} />
                  <Route path="/dona" element={<Dona />} />
                  <Route path="/completar-iban" element={<CompletarIban />} />
                  <Route path="/politica-privacidad" element={<PoliticaPrivacidad />} />
                  <Route path="/condiciones-afiliacion" element={<CondicionesAfiliacion />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/admin/noticias" element={<AdminNoticias />} />
                  <Route path="/socios" element={<PanelSocios />} />
                  <Route path="/contabilidad" element={<Contabilidad />} />
                  <Route path="/eventos" element={<Eventos />} />
                  <Route path="/semaforo-institucional" element={<SemaforoInstitucional />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </PageTransition>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
  </ErrorBoundary>
);

export default App;
