import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { PageTransition } from "@/components/PageTransition";
import { LoadingScreen } from "@/components/LoadingScreen";
import Index from "./pages/Index";
import Nosotros from "./pages/Nosotros";
import Noticias from "./pages/Noticias";
import NoticiaDetalle from "./pages/NoticiaDetalle";
import Transparencia from "./pages/Transparencia";
import HazteSocio from "./pages/HazteSocio";
import Auth from "./pages/Auth";
import AdminNoticias from "./pages/AdminNoticias";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <LoadingScreen />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PageTransition>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/nosotros" element={<Nosotros />} />
              <Route path="/noticias" element={<Noticias />} />
              <Route path="/noticias/:id" element={<NoticiaDetalle />} />
              <Route path="/transparencia" element={<Transparencia />} />
              <Route path="/hazte-socio" element={<HazteSocio />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin/noticias" element={<AdminNoticias />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PageTransition>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
