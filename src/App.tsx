import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { PageTransition } from "@/components/PageTransition";
import { ScrollToTop } from "@/components/ScrollToTop";
import { LoadingScreen } from "@/components/LoadingScreen";

// Eager load the landing page for best LCP
import Index from "./pages/Index";

// Lazy load other pages to reduce initial bundle size
const Nosotros = lazy(() => import("./pages/Nosotros"));
const Noticias = lazy(() => import("./pages/Noticias"));
const NoticiaDetalle = lazy(() => import("./pages/NoticiaDetalle"));
const Transparencia = lazy(() => import("./pages/Transparencia"));
const HazteSocio = lazy(() => import("./pages/HazteSocio"));
const PoliticaPrivacidad = lazy(() => import("./pages/PoliticaPrivacidad"));
const Auth = lazy(() => import("./pages/Auth"));
const AdminNoticias = lazy(() => import("./pages/AdminNoticias"));
const PanelSocios = lazy(() => import("./pages/PanelSocios"));
const Eventos = lazy(() => import("./pages/Eventos"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <LoadingScreen />
          <Suspense fallback={null}>
            <PageTransition>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/nosotros" element={<Nosotros />} />
                <Route path="/noticias" element={<Noticias />} />
                <Route path="/noticias/:id" element={<NoticiaDetalle />} />
                <Route path="/transparencia" element={<Transparencia />} />
                <Route path="/hazte-socio" element={<HazteSocio />} />
                <Route path="/politica-privacidad" element={<PoliticaPrivacidad />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/admin/noticias" element={<AdminNoticias />} />
                <Route path="/socios" element={<PanelSocios />} />
                <Route path="/eventos" element={<Eventos />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </PageTransition>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
