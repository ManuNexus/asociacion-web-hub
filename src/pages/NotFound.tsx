import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
      <SEO title="Página no encontrada" noindex />
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center px-4">
          <p className="text-8xl font-extrabold text-primary/20 mb-2">404</p>
          <h1 className="text-2xl font-bold text-foreground mb-3">Página no encontrada</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            La página que buscas no existe o ha sido movida. Comprueba la URL o vuelve al inicio.
          </p>
          <Button asChild>
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Volver al inicio
            </Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
