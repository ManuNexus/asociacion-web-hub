import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CategoriaContabilidad {
  id: string;
  nombre: string;
  tipo: "ingreso" | "gasto";
  color: string;
  created_at: string;
}

export interface Proveedor {
  id: string;
  nombre: string;
  nif: string | null;
  direccion: string | null;
  email: string | null;
  telefono: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaccion {
  id: string;
  tipo: "ingreso" | "gasto";
  concepto: string;
  descripcion: string | null;
  importe: number;
  fecha: string;
  categoria_id: string | null;
  factura_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  categoria?: CategoriaContabilidad;
}

export interface Factura {
  id: string;
  numero: string;
  tipo: "emitida" | "recibida";
  concepto: string;
  importe_base: number;
  iva_porcentaje: number;
  importe_iva: number;
  importe_total: number;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  estado: "pendiente" | "pagada" | "vencida" | "cancelada";
  tercero_nombre: string;
  tercero_nif: string | null;
  tercero_direccion: string | null;
  proveedor_id: string | null;
  notas: string | null;
  archivo_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type TransaccionInsert = Omit<Transaccion, "id" | "created_at" | "updated_at" | "categoria">;
export type FacturaInsert = Omit<Factura, "id" | "created_at" | "updated_at" | "importe_iva" | "importe_total">;
export type ProveedorInsert = Omit<Proveedor, "id" | "created_at" | "updated_at">;

export const useContabilidad = () => {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [categorias, setCategorias] = useState<CategoriaContabilidad[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCategorias = async () => {
    const { data, error } = await supabase
      .from("categorias_contabilidad")
      .select("*")
      .order("tipo", { ascending: true })
      .order("nombre", { ascending: true });

    if (error) {
      console.error("Error fetching categorias:", error);
      return;
    }
    setCategorias(data as CategoriaContabilidad[]);
  };

  const fetchTransacciones = async () => {
    const { data, error } = await supabase
      .from("transacciones")
      .select(`
        *,
        categoria:categorias_contabilidad(*)
      `)
      .order("fecha", { ascending: false });

    if (error) {
      console.error("Error fetching transacciones:", error);
      return;
    }
    setTransacciones(data as Transaccion[]);
  };

  const fetchFacturas = async () => {
    const { data, error } = await supabase
      .from("facturas")
      .select("*")
      .order("fecha_emision", { ascending: false });

    if (error) {
      console.error("Error fetching facturas:", error);
      return;
    }
    setFacturas(data as Factura[]);
  };

  const fetchProveedores = async () => {
    const { data, error } = await supabase
      .from("proveedores")
      .select("*")
      .order("nombre", { ascending: true });

    if (error) {
      console.error("Error fetching proveedores:", error);
      return;
    }
    setProveedores(data as Proveedor[]);
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchCategorias(), fetchTransacciones(), fetchFacturas(), fetchProveedores()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const addTransaccion = async (transaccion: Omit<TransaccionInsert, "created_by">) => {
    const { data: userData } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("transacciones")
      .insert({
        ...transaccion,
        created_by: userData?.user?.id || null,
      });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear la transacción",
      });
      return false;
    }

    toast({ title: "Transacción creada correctamente" });
    fetchTransacciones();
    return true;
  };

  const updateTransaccion = async (id: string, updates: Partial<TransaccionInsert>) => {
    const { error } = await supabase
      .from("transacciones")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la transacción",
      });
      return false;
    }

    toast({ title: "Transacción actualizada" });
    fetchTransacciones();
    return true;
  };

  const deleteTransaccion = async (id: string) => {
    const { error } = await supabase
      .from("transacciones")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la transacción",
      });
      return false;
    }

    toast({ title: "Transacción eliminada" });
    fetchTransacciones();
    return true;
  };

  const addFactura = async (factura: Omit<FacturaInsert, "created_by">) => {
    const { data: userData } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("facturas")
      .insert({
        ...factura,
        created_by: userData?.user?.id || null,
      });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message.includes("unique") 
          ? "Ya existe una factura con ese número" 
          : "No se pudo crear la factura",
      });
      return false;
    }

    toast({ title: "Factura creada correctamente" });
    fetchFacturas();
    return true;
  };

  const updateFactura = async (id: string, updates: Partial<FacturaInsert>) => {
    const { error } = await supabase
      .from("facturas")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la factura",
      });
      return false;
    }

    toast({ title: "Factura actualizada" });
    fetchFacturas();
    return true;
  };

  const deleteFactura = async (id: string) => {
    const { error } = await supabase
      .from("facturas")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la factura",
      });
      return false;
    }

    toast({ title: "Factura eliminada" });
    fetchFacturas();
    return true;
  };

  const addCategoria = async (categoria: Omit<CategoriaContabilidad, "id" | "created_at">) => {
    const { error } = await supabase
      .from("categorias_contabilidad")
      .insert(categoria);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear la categoría",
      });
      return false;
    }

    toast({ title: "Categoría creada" });
    fetchCategorias();
    return true;
  };

  const deleteCategoria = async (id: string) => {
    const { error } = await supabase
      .from("categorias_contabilidad")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la categoría (puede tener transacciones asociadas)",
      });
      return false;
    }

    toast({ title: "Categoría eliminada" });
    fetchCategorias();
    return true;
  };

  const addProveedor = async (proveedor: ProveedorInsert) => {
    const { data, error } = await supabase
      .from("proveedores")
      .insert(proveedor)
      .select()
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el proveedor",
      });
      return null;
    }

    toast({ title: "Proveedor guardado" });
    fetchProveedores();
    return data as Proveedor;
  };

  const updateProveedor = async (id: string, updates: Partial<ProveedorInsert>) => {
    const { error } = await supabase
      .from("proveedores")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el proveedor",
      });
      return false;
    }

    toast({ title: "Proveedor actualizado" });
    fetchProveedores();
    return true;
  };

  const deleteProveedor = async (id: string) => {
    const { error } = await supabase
      .from("proveedores")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el proveedor (puede tener facturas asociadas)",
      });
      return false;
    }

    toast({ title: "Proveedor eliminado" });
    fetchProveedores();
    return true;
  };

  // Cálculos para informes
  const getBalance = () => {
    const ingresos = transacciones
      .filter(t => t.tipo === "ingreso")
      .reduce((sum, t) => sum + Number(t.importe), 0);
    const gastos = transacciones
      .filter(t => t.tipo === "gasto")
      .reduce((sum, t) => sum + Number(t.importe), 0);
    return { ingresos, gastos, balance: ingresos - gastos };
  };

  const getBalancePorPeriodo = (year: number, month?: number) => {
    const filtered = transacciones.filter(t => {
      const fecha = new Date(t.fecha);
      if (month !== undefined) {
        return fecha.getFullYear() === year && fecha.getMonth() === month;
      }
      return fecha.getFullYear() === year;
    });

    const ingresos = filtered
      .filter(t => t.tipo === "ingreso")
      .reduce((sum, t) => sum + Number(t.importe), 0);
    const gastos = filtered
      .filter(t => t.tipo === "gasto")
      .reduce((sum, t) => sum + Number(t.importe), 0);

    return { ingresos, gastos, balance: ingresos - gastos };
  };

  const getTransaccionesPorCategoria = (tipo?: "ingreso" | "gasto") => {
    const filtered = tipo ? transacciones.filter(t => t.tipo === tipo) : transacciones;
    const grouped: Record<string, { categoria: CategoriaContabilidad | null; total: number }> = {};

    filtered.forEach(t => {
      const key = t.categoria_id || "sin-categoria";
      if (!grouped[key]) {
        grouped[key] = {
          categoria: t.categoria || null,
          total: 0,
        };
      }
      grouped[key].total += Number(t.importe);
    });

    return Object.values(grouped).sort((a, b) => b.total - a.total);
  };

  return {
    transacciones,
    facturas,
    categorias,
    proveedores,
    loading,
    fetchAll,
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
  };
};
