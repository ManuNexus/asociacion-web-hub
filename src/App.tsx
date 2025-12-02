import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Nosotros from "./pages/Nosotros";
import Noticias from "./pages/Noticias";
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
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/nosotros" element={<Nosotros />} />
            <Route path="/noticias" element={<Noticias />} />
            <Route path="/transparencia" element={<Transparencia />} />
            <Route path="/hazte-socio" element={<HazteSocio />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin/noticias" element={<AdminNoticias />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
