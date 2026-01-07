import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowUpDown, FileText, BarChart3, Tag, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useContabilidad } from "@/hooks/useContabilidad";
import { TransaccionesTab } from "@/components/contabilidad/TransaccionesTab";
import { FacturasTab } from "@/components/contabilidad/FacturasTab";
import { InformesTab } from "@/components/contabilidad/InformesTab";
import { CategoriasTab } from "@/components/contabilidad/CategoriasTab";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Contabilidad = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    transacciones,
    facturas,
    categorias,
    loading,
    addTransaccion,
    updateTransaccion,
    deleteTransaccion,
    addFactura,
    updateFactura,
    deleteFactura,
    addCategoria,
    deleteCategoria,
    getBalance,
    getBalancePorPeriodo,
    getTransaccionesPorCategoria,
  } = useContabilidad();

  useEffect(() => {
    const checkAccess = async () => {
      if (authLoading) return;
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user has access (presidente, tesorero, or admin)
      const { data: socio } = await supabase
        .from("socios")
        .select("cargo_junta")
        .eq("user_id", user.id)
        .eq("activo", true)
        .maybeSingle();

      const { data: adminRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      const hasAccess = 
        adminRole?.role === "admin" ||
        socio?.cargo_junta === "presidente" ||
        socio?.cargo_junta === "tesorero";

      if (!hasAccess) {
        toast({
          variant: "destructive",
          title: "Acceso denegado",
          description: "Solo el Presidente y el Tesorero pueden acceder a la contabilidad",
        });
        navigate("/socios");
      }
    };

    checkAccess();
  }, [user, authLoading, navigate, toast]);

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/socios")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Contabilidad</h1>
            <p className="text-muted-foreground">Gestión financiera de la asociación</p>
          </div>
        </div>

        <Tabs defaultValue="transacciones" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 max-w-xl">
            <TabsTrigger value="transacciones" className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4" />
              <span className="hidden sm:inline">Transacciones</span>
            </TabsTrigger>
            <TabsTrigger value="facturas" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Facturas</span>
            </TabsTrigger>
            <TabsTrigger value="informes" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Informes</span>
            </TabsTrigger>
            <TabsTrigger value="categorias" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Categorías</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transacciones">
            <TransaccionesTab
              transacciones={transacciones}
              categorias={categorias}
              onAdd={addTransaccion}
              onUpdate={updateTransaccion}
              onDelete={deleteTransaccion}
            />
          </TabsContent>

          <TabsContent value="facturas">
            <FacturasTab
              facturas={facturas}
              onAdd={addFactura}
              onUpdate={updateFactura}
              onDelete={deleteFactura}
            />
          </TabsContent>

          <TabsContent value="informes">
            <InformesTab
              transacciones={transacciones}
              facturas={facturas}
              categorias={categorias}
              getBalance={getBalance}
              getBalancePorPeriodo={getBalancePorPeriodo}
              getTransaccionesPorCategoria={getTransaccionesPorCategoria}
            />
          </TabsContent>

          <TabsContent value="categorias">
            <CategoriasTab
              categorias={categorias}
              onAdd={addCategoria}
              onDelete={deleteCategoria}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Contabilidad;
