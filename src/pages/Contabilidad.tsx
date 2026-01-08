import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useContabilidad } from "@/hooks/useContabilidad";
import { ContabilidadSidebar, ContabilidadSection } from "@/components/contabilidad/ContabilidadSidebar";
import { DashboardTab } from "@/components/contabilidad/DashboardTab";
import { TransaccionesTab } from "@/components/contabilidad/TransaccionesTab";
import { FacturasTab } from "@/components/contabilidad/FacturasTab";
import { TesoreríaTab } from "@/components/contabilidad/TesoreríaTab";
import { CobrosTab } from "@/components/contabilidad/CobrosTab";
import { InformesTab } from "@/components/contabilidad/InformesTab";
import { CategoriasTab } from "@/components/contabilidad/CategoriasTab";
import { ProveedoresTab } from "@/components/contabilidad/ProveedoresTab";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Contabilidad = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<ContabilidadSection>("dashboard");
  const {
    transacciones,
    facturas,
    categorias,
    proveedores,
    loading,
    addTransaccion,
    updateTransaccion,
    deleteTransaccion,
    addFactura,
    updateFactura,
    deleteFactura,
    addCategoria,
    deleteCategoria,
    addProveedor,
    updateProveedor,
    deleteProveedor,
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

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <DashboardTab
            transacciones={transacciones}
            facturas={facturas}
            categorias={categorias}
            getBalance={getBalance}
            getBalancePorPeriodo={getBalancePorPeriodo}
          />
        );
      case "transacciones":
        return (
          <TransaccionesTab
            transacciones={transacciones}
            categorias={categorias}
            onAdd={addTransaccion}
            onUpdate={updateTransaccion}
            onDelete={deleteTransaccion}
          />
        );
      case "facturas":
        return (
          <FacturasTab
            facturas={facturas}
            proveedores={proveedores}
            onAdd={addFactura}
            onUpdate={updateFactura}
            onDelete={deleteFactura}
            onAddProveedor={addProveedor}
          />
        );
      case "tesoreria":
        return (
          <TesoreríaTab
            facturas={facturas}
            getBalance={getBalance}
          />
        );
      case "cobros":
        return <CobrosTab />;
      case "informes":
        return (
          <InformesTab
            transacciones={transacciones}
            facturas={facturas}
            categorias={categorias}
            getBalance={getBalance}
            getBalancePorPeriodo={getBalancePorPeriodo}
            getTransaccionesPorCategoria={getTransaccionesPorCategoria}
          />
        );
      case "categorias":
        return (
          <CategoriasTab
            categorias={categorias}
            onAdd={addCategoria}
            onDelete={deleteCategoria}
          />
        );
      case "proveedores":
        return (
          <ProveedoresTab
            proveedores={proveedores}
            onAdd={addProveedor}
            onUpdate={updateProveedor}
            onDelete={deleteProveedor}
          />
        );
      default:
        return null;
    }
  };

  const sectionTitles: Record<ContabilidadSection, string> = {
    dashboard: "Dashboard",
    transacciones: "Transacciones",
    facturas: "Facturas",
    tesoreria: "Tesorería",
    cobros: "Cobros de Cuotas",
    informes: "Informes",
    categorias: "Categorías",
    proveedores: "Proveedores",
  };

  return (
    <Layout>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <ContabilidadSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="icon" onClick={() => navigate("/socios")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{sectionTitles[activeSection]}</h1>
                <p className="text-sm text-muted-foreground">Gestión financiera de la asociación</p>
              </div>
            </div>
            
            {renderContent()}
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default Contabilidad;
