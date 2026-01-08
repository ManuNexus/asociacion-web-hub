import { useState, useEffect, useMemo } from "react";
import { format, addMonths, addYears, isBefore, isAfter, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  RefreshCw,
  Users,
  Euro,
  Calendar,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Socio {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  tipo_cuota: string;
  tipo_pago: string;
  dia_cobro: number | null;
  fecha_alta: string;
  activo: boolean;
  al_corriente_pago: boolean;
}

interface CobroCuota {
  id: string;
  socio_id: string;
  periodo_inicio: string;
  periodo_fin: string;
  importe: number;
  estado: string;
  fecha_cobro: string | null;
  notas: string | null;
  created_at: string;
  socio?: Socio;
}

const CUOTA_MENSUAL = 5;
const CUOTA_ANUAL = 50;

export const CobrosTab = () => {
  const { toast } = useToast();
  const [cobros, setCobros] = useState<CobroCuota[]>([]);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingCobros, setGeneratingCobros] = useState(false);
  const [selectedCobro, setSelectedCobro] = useState<CobroCuota | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notas, setNotas] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("pendiente");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cobrosRes, sociosRes] = await Promise.all([
        supabase.from("cobros_cuotas").select("*").order("periodo_fin", { ascending: false }),
        supabase.from("socios").select("*").eq("activo", true),
      ]);

      if (cobrosRes.error) throw cobrosRes.error;
      if (sociosRes.error) throw sociosRes.error;

      setSocios(sociosRes.data || []);
      
      // Enriquecer cobros con datos del socio
      const cobrosEnriquecidos = (cobrosRes.data || []).map((cobro) => ({
        ...cobro,
        socio: sociosRes.data?.find((s) => s.id === cobro.socio_id),
      }));
      
      setCobros(cobrosEnriquecidos);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Generar cobros pendientes para todos los socios activos
  const generarCobros = async () => {
    setGeneratingCobros(true);
    try {
      const today = new Date();
      let cobrosGenerados = 0;

      for (const socio of socios) {
        const fechaAlta = new Date(socio.fecha_alta);
        const esMensual = socio.tipo_pago === "mensual";
        const importe = esMensual ? CUOTA_MENSUAL : CUOTA_ANUAL;

        // Buscar el último cobro del socio
        const ultimoCobro = cobros
          .filter((c) => c.socio_id === socio.id)
          .sort((a, b) => new Date(b.periodo_fin).getTime() - new Date(a.periodo_fin).getTime())[0];

        let periodoInicio: Date;
        let periodoFin: Date;

        if (ultimoCobro) {
          // Siguiente periodo después del último
          periodoInicio = new Date(ultimoCobro.periodo_fin);
          periodoInicio.setDate(periodoInicio.getDate() + 1);
        } else {
          // Primer cobro desde fecha de alta
          periodoInicio = fechaAlta;
        }

        if (esMensual) {
          periodoFin = addMonths(periodoInicio, 1);
          periodoFin.setDate(periodoFin.getDate() - 1);
        } else {
          periodoFin = addYears(periodoInicio, 1);
          periodoFin.setDate(periodoFin.getDate() - 1);
        }

        // Solo generar si el periodo ya debería estar pagado (pasó la fecha de fin)
        if (isBefore(periodoFin, today)) {
          const { error } = await supabase.from("cobros_cuotas").insert({
            socio_id: socio.id,
            periodo_inicio: format(periodoInicio, "yyyy-MM-dd"),
            periodo_fin: format(periodoFin, "yyyy-MM-dd"),
            importe,
            estado: "pendiente",
          });

          if (!error) cobrosGenerados++;
        }
      }

      if (cobrosGenerados > 0) {
        toast({
          title: "Cobros generados",
          description: `Se han generado ${cobrosGenerados} cobros pendientes`,
        });
        fetchData();
      } else {
        toast({
          title: "Sin cobros nuevos",
          description: "No hay cobros pendientes por generar",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setGeneratingCobros(false);
    }
  };

  const actualizarEstadoCobro = async (estado: "cobrado" | "fallido") => {
    if (!selectedCobro) return;

    try {
      const updates: any = {
        estado,
        notas: notas || null,
      };

      if (estado === "cobrado") {
        updates.fecha_cobro = new Date().toISOString();
      }

      const { error } = await supabase
        .from("cobros_cuotas")
        .update(updates)
        .eq("id", selectedCobro.id);

      if (error) throw error;

      // Actualizar estado de pago del socio
      if (selectedCobro.socio_id) {
        const alCorriente = estado === "cobrado";
        await supabase
          .from("socios")
          .update({ al_corriente_pago: alCorriente })
          .eq("id", selectedCobro.socio_id);
      }

      toast({
        title: estado === "cobrado" ? "Cobro registrado" : "Cobro marcado como fallido",
        description: `El cobro de ${selectedCobro.socio?.nombre} ${selectedCobro.socio?.apellidos} ha sido actualizado`,
      });

      setDialogOpen(false);
      setSelectedCobro(null);
      setNotas("");
      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const cobrosFiltrados = useMemo(() => {
    if (filterEstado === "todos") return cobros;
    return cobros.filter((c) => c.estado === filterEstado);
  }, [cobros, filterEstado]);

  const stats = useMemo(() => {
    const pendientes = cobros.filter((c) => c.estado === "pendiente");
    const cobrados = cobros.filter((c) => c.estado === "cobrado");
    const fallidos = cobros.filter((c) => c.estado === "fallido");
    
    const vencidos = pendientes.filter((c) => 
      isBefore(new Date(c.periodo_fin), new Date())
    );

    return {
      pendientes: pendientes.length,
      cobrados: cobrados.length,
      fallidos: fallidos.length,
      vencidos: vencidos.length,
      totalPendiente: pendientes.reduce((sum, c) => sum + Number(c.importe), 0),
      totalCobrado: cobrados.reduce((sum, c) => sum + Number(c.importe), 0),
    };
  }, [cobros]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const getEstadoBadge = (estado: string, periodoFin: string) => {
    const vencido = isBefore(new Date(periodoFin), new Date());
    
    switch (estado) {
      case "cobrado":
        return <Badge className="bg-green-500/10 text-green-600 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" /> Cobrado</Badge>;
      case "fallido":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Fallido</Badge>;
      default:
        return vencido 
          ? <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Vencido</Badge>
          : <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Pendiente</Badge>;
    }
  };

  const getDiasRestantes = (periodoFin: string) => {
    const dias = differenceInDays(new Date(periodoFin), new Date());
    if (dias < 0) return `Vencido hace ${Math.abs(dias)} días`;
    if (dias === 0) return "Vence hoy";
    return `Vence en ${dias} días`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" /> Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendientes}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.totalPendiente)} por cobrar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" /> Vencidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.vencidos}</div>
            <p className="text-xs text-muted-foreground">Requieren revisión</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" /> Cobrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.cobrados}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.totalCobrado)} recaudado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4" /> Fallidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.fallidos}</div>
            <p className="text-xs text-muted-foreground">Sin poder cobrar</p>
          </CardContent>
        </Card>
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendiente">Pendientes</SelectItem>
              <SelectItem value="cobrado">Cobrados</SelectItem>
              <SelectItem value="fallido">Fallidos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={generarCobros} disabled={generatingCobros}>
            {generatingCobros ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Calendar className="h-4 w-4 mr-2" />
            )}
            Generar cobros pendientes
          </Button>
        </div>
      </div>

      {/* Tabla de cobros */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Socio</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Importe</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cobrosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No hay cobros {filterEstado !== "todos" ? `con estado "${filterEstado}"` : "registrados"}
                  </TableCell>
                </TableRow>
              ) : (
                cobrosFiltrados.map((cobro) => (
                  <TableRow key={cobro.id} className={cn(
                    cobro.estado === "pendiente" && isBefore(new Date(cobro.periodo_fin), new Date()) && "bg-destructive/5"
                  )}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {cobro.socio?.nombre} {cobro.socio?.apellidos}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {cobro.socio?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(cobro.periodo_inicio), "dd MMM yyyy", { locale: es })}
                        {" - "}
                        {format(new Date(cobro.periodo_fin), "dd MMM yyyy", { locale: es })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {cobro.socio?.tipo_pago === "mensual" ? "Mensual" : "Anual"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(cobro.importe))}
                    </TableCell>
                    <TableCell>{getEstadoBadge(cobro.estado, cobro.periodo_fin)}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "text-sm",
                        isBefore(new Date(cobro.periodo_fin), new Date()) && cobro.estado === "pendiente" && "text-destructive font-medium"
                      )}>
                        {getDiasRestantes(cobro.periodo_fin)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {cobro.estado === "pendiente" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedCobro(cobro);
                            setNotas(cobro.notas || "");
                            setDialogOpen(true);
                          }}
                        >
                          Revisar
                        </Button>
                      )}
                      {cobro.estado !== "pendiente" && cobro.notas && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedCobro(cobro);
                            setNotas(cobro.notas || "");
                            setDialogOpen(true);
                          }}
                        >
                          Ver notas
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog para marcar cobro */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCobro?.estado === "pendiente" 
                ? "Revisar cobro de cuota" 
                : "Detalles del cobro"}
            </DialogTitle>
          </DialogHeader>

          {selectedCobro && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Socio:</span>
                  <p className="font-medium">
                    {selectedCobro.socio?.nombre} {selectedCobro.socio?.apellidos}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Importe:</span>
                  <p className="font-medium">{formatCurrency(Number(selectedCobro.importe))}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Periodo:</span>
                  <p className="font-medium">
                    {format(new Date(selectedCobro.periodo_inicio), "dd/MM/yyyy")} -{" "}
                    {format(new Date(selectedCobro.periodo_fin), "dd/MM/yyyy")}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Estado:</span>
                  <div className="mt-1">
                    {getEstadoBadge(selectedCobro.estado, selectedCobro.periodo_fin)}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Notas</label>
                <Textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Añade notas sobre este cobro..."
                  className="mt-1"
                  disabled={selectedCobro.estado !== "pendiente"}
                />
              </div>

              {selectedCobro.fecha_cobro && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Fecha de cobro:</span>
                  <p className="font-medium">
                    {format(new Date(selectedCobro.fecha_cobro), "dd/MM/yyyy HH:mm", { locale: es })}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {selectedCobro?.estado === "pendiente" ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => actualizarEstadoCobro("fallido")}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  No se ha podido cobrar
                </Button>
                <Button onClick={() => actualizarEstadoCobro("cobrado")}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marcar como cobrado
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cerrar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
