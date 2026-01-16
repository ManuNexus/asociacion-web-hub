import { useState, useEffect, useMemo } from "react";
import { format, addMonths, addYears, isBefore, differenceInDays, startOfMonth, setDate } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  RefreshCw,
  Users,
  Euro,
  Calendar as CalendarIcon,
  Search,
  History,
  Pencil,
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
  fecha_primera_cuota: string | null;
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
}

interface SocioConCuota extends Socio {
  proximaCuota: Date;
  importeCuota: number;
  diasHastaProximaCuota: number;
  ultimoCobro: CobroCuota | null;
  estadoCuota: "al_dia" | "pendiente" | "vencido";
}

const CUOTA_MENSUAL = 5;
const CUOTA_ANUAL = 50;

export const CobrosTab = () => {
  const { toast } = useToast();
  const [socios, setSocios] = useState<Socio[]>([]);
  const [cobros, setCobros] = useState<CobroCuota[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("todos");
  
  // Dialog states
  const [selectedSocio, setSelectedSocio] = useState<SocioConCuota | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [historialDialogOpen, setHistorialDialogOpen] = useState(false);
  const [notas, setNotas] = useState("");
  const [processing, setProcessing] = useState(false);

  // Edit cobro states
  const [editCobroDialogOpen, setEditCobroDialogOpen] = useState(false);
  const [editingCobro, setEditingCobro] = useState<CobroCuota | null>(null);
  const [editFechaCobro, setEditFechaCobro] = useState<Date | undefined>(undefined);
  const [editPeriodoInicio, setEditPeriodoInicio] = useState<Date | undefined>(undefined);
  const [editPeriodoFin, setEditPeriodoFin] = useState<Date | undefined>(undefined);
  const [editNotas, setEditNotas] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sociosRes, cobrosRes] = await Promise.all([
        supabase.from("socios").select("*").eq("activo", true).order("apellidos"),
        supabase.from("cobros_cuotas").select("*").order("periodo_fin", { ascending: false }),
      ]);

      if (sociosRes.error) throw sociosRes.error;
      if (cobrosRes.error) throw cobrosRes.error;

      setSocios(sociosRes.data || []);
      setCobros(cobrosRes.data || []);
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

  // Calcular próxima cuota para cada socio
  const sociosConCuotas = useMemo((): SocioConCuota[] => {
    const today = new Date();
    
    return socios.map((socio) => {
      const esMensual = socio.tipo_pago === "mensual";
      const importeCuota = esMensual ? CUOTA_MENSUAL : CUOTA_ANUAL;
      const fechaAlta = new Date(socio.fecha_alta);
      const diaCobro = socio.dia_cobro || 1;
      // Usar fecha_primera_cuota si existe, si no calcular desde fecha_alta
      const fechaPrimeraCuota = socio.fecha_primera_cuota 
        ? new Date(socio.fecha_primera_cuota) 
        : null;

      // Buscar cobros del socio ordenados por fecha
      const cobrosDelSocio = cobros
        .filter((c) => c.socio_id === socio.id)
        .sort((a, b) => new Date(b.periodo_fin).getTime() - new Date(a.periodo_fin).getTime());

      const ultimoCobro = cobrosDelSocio[0] || null;
      const ultimoCobroPagado = cobrosDelSocio.find(c => c.estado === "cobrado");

      let proximaCuota: Date;
      let estadoCuota: "al_dia" | "pendiente" | "vencido";

      if (ultimoCobroPagado) {
        // La próxima cuota es cuando termina el periodo del último pago (periodo_fin)
        // El periodo_fin ya representa el fin del periodo cubierto por ese pago
        proximaCuota = new Date(ultimoCobroPagado.periodo_fin);
      } else {
        // Primera cuota: usar fecha_primera_cuota si existe
        if (fechaPrimeraCuota) {
          proximaCuota = fechaPrimeraCuota;
        } else if (esMensual) {
          proximaCuota = setDate(startOfMonth(fechaAlta), diaCobro);
          if (isBefore(proximaCuota, fechaAlta)) {
            proximaCuota = addMonths(proximaCuota, 1);
          }
        } else {
          proximaCuota = fechaAlta;
        }
      }

      // Determinar estado
      const diasHastaProximaCuota = differenceInDays(proximaCuota, today);

      if (diasHastaProximaCuota > 0) {
        estadoCuota = "al_dia";
      } else if (diasHastaProximaCuota >= -7) {
        estadoCuota = "pendiente";
      } else {
        estadoCuota = "vencido";
      }

      return {
        ...socio,
        proximaCuota,
        importeCuota,
        diasHastaProximaCuota,
        ultimoCobro,
        estadoCuota,
      };
    });
  }, [socios, cobros]);

  // Filtrar socios
  const sociosFiltrados = useMemo(() => {
    let resultado = sociosConCuotas;

    // Filtrar por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      resultado = resultado.filter(
        (s) =>
          s.nombre.toLowerCase().includes(term) ||
          s.apellidos.toLowerCase().includes(term) ||
          s.email.toLowerCase().includes(term)
      );
    }

    // Filtrar por estado
    if (filterEstado !== "todos") {
      resultado = resultado.filter((s) => s.estadoCuota === filterEstado);
    }

    // Ordenar por urgencia (vencidos primero)
    resultado.sort((a, b) => a.diasHastaProximaCuota - b.diasHastaProximaCuota);

    return resultado;
  }, [sociosConCuotas, searchTerm, filterEstado]);

  // Registrar pago de cuota
  const registrarPago = async (pagado: boolean) => {
    if (!selectedSocio) return;
    setProcessing(true);

    try {
      const esMensual = selectedSocio.tipo_pago === "mensual";
      const periodoInicio = selectedSocio.proximaCuota;
      const periodoFin = esMensual 
        ? addMonths(periodoInicio, 1)
        : addYears(periodoInicio, 1);

      // Crear registro de cobro
      const { error: cobroError } = await supabase.from("cobros_cuotas").insert({
        socio_id: selectedSocio.id,
        periodo_inicio: format(periodoInicio, "yyyy-MM-dd"),
        periodo_fin: format(periodoFin, "yyyy-MM-dd"),
        importe: selectedSocio.importeCuota,
        estado: pagado ? "cobrado" : "fallido",
        fecha_cobro: pagado ? new Date().toISOString() : null,
        notas: notas || null,
      });

      if (cobroError) throw cobroError;

      // Actualizar estado del socio
      const { error: socioError } = await supabase
        .from("socios")
        .update({ al_corriente_pago: pagado })
        .eq("id", selectedSocio.id);

      if (socioError) throw socioError;

      // Si el pago fue cobrado, crear transacción de ingreso
      if (pagado) {
        const mesFormateado = format(periodoInicio, "MMMM yyyy", { locale: es });
        const concepto = `Cuota ${selectedSocio.nombre} ${selectedSocio.apellidos} - ${mesFormateado}`;

        const { error: transaccionError } = await supabase.from("transacciones").insert({
          tipo: "ingreso",
          concepto: concepto,
          descripcion: `Cobro de cuota ${esMensual ? "mensual" : "anual"} del socio ${selectedSocio.nombre} ${selectedSocio.apellidos}`,
          importe: selectedSocio.importeCuota,
          fecha: format(new Date(), "yyyy-MM-dd"),
        });

        if (transaccionError) {
          console.error("Error creando transacción:", transaccionError);
          // No lanzamos error para no bloquear el registro del cobro
          toast({
            variant: "destructive",
            title: "Advertencia",
            description: "El cobro se registró pero no se pudo crear la transacción automática",
          });
        }
      }

      toast({
        title: pagado ? "Pago registrado" : "Impago registrado",
        description: `Cuota de ${selectedSocio.nombre} ${selectedSocio.apellidos} actualizada`,
      });

      setDialogOpen(false);
      setSelectedSocio(null);
      setNotas("");
      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  // Abrir diálogo de edición de cobro
  const openEditCobroDialog = (cobro: CobroCuota) => {
    setEditingCobro(cobro);
    setEditFechaCobro(cobro.fecha_cobro ? new Date(cobro.fecha_cobro) : undefined);
    setEditPeriodoInicio(new Date(cobro.periodo_inicio));
    setEditPeriodoFin(new Date(cobro.periodo_fin));
    setEditNotas(cobro.notas || "");
    setEditCobroDialogOpen(true);
  };

  // Actualizar cobro con cascada
  const updateCobro = async () => {
    if (!editingCobro || !editPeriodoInicio || !editPeriodoFin) return;
    setProcessing(true);

    try {
      const newFechaCobro = editFechaCobro ? editFechaCobro.toISOString() : null;
      const newPeriodoInicio = format(editPeriodoInicio, "yyyy-MM-dd");
      const newPeriodoFin = format(editPeriodoFin, "yyyy-MM-dd");

      // 1. Actualizar el cobro
      const { error: cobroError } = await supabase
        .from("cobros_cuotas")
        .update({
          fecha_cobro: newFechaCobro,
          periodo_inicio: newPeriodoInicio,
          periodo_fin: newPeriodoFin,
          notas: editNotas || null,
        })
        .eq("id", editingCobro.id);

      if (cobroError) throw cobroError;

      // 2. Buscar y actualizar transacción asociada si existe
      // Las transacciones de cuotas tienen un concepto específico con el nombre del socio
      const socio = socios.find(s => s.id === editingCobro.socio_id);
      if (socio && editingCobro.estado === "cobrado") {
        // Buscar transacciones que contengan el nombre del socio y sean de cuota
        const { data: transacciones } = await supabase
          .from("transacciones")
          .select("*")
          .eq("tipo", "ingreso")
          .ilike("concepto", `%Cuota ${socio.nombre} ${socio.apellidos}%`);

        if (transacciones && transacciones.length > 0) {
          // Buscar la transacción que coincida con el periodo del cobro original
          const mesOriginal = format(new Date(editingCobro.periodo_inicio), "MMMM yyyy", { locale: es });
          const transaccionAsociada = transacciones.find(t => 
            t.concepto.includes(mesOriginal)
          );

          if (transaccionAsociada) {
            // Actualizar fecha y concepto de la transacción
            const nuevoMes = format(editPeriodoInicio, "MMMM yyyy", { locale: es });
            const nuevoConcepto = `Cuota ${socio.nombre} ${socio.apellidos} - ${nuevoMes}`;
            const nuevaFechaTransaccion = editFechaCobro 
              ? format(editFechaCobro, "yyyy-MM-dd") 
              : format(new Date(), "yyyy-MM-dd");

            const { error: transError } = await supabase
              .from("transacciones")
              .update({
                concepto: nuevoConcepto,
                fecha: nuevaFechaTransaccion,
              })
              .eq("id", transaccionAsociada.id);

            if (transError) {
              console.error("Error actualizando transacción:", transError);
              toast({
                variant: "destructive",
                title: "Advertencia",
                description: "El cobro se actualizó pero no se pudo actualizar la transacción asociada",
              });
            }
          }
        }
      }

      toast({
        title: "Cobro actualizado",
        description: "Los datos del cobro y la transacción asociada han sido actualizados",
      });

      setEditCobroDialogOpen(false);
      setEditingCobro(null);
      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  // Estadísticas
  const stats = useMemo(() => {
    const alDia = sociosConCuotas.filter((s) => s.estadoCuota === "al_dia").length;
    const pendientes = sociosConCuotas.filter((s) => s.estadoCuota === "pendiente").length;
    const vencidos = sociosConCuotas.filter((s) => s.estadoCuota === "vencido").length;
    
    const importePendiente = sociosConCuotas
      .filter((s) => s.estadoCuota !== "al_dia")
      .reduce((sum, s) => sum + s.importeCuota, 0);

    return { alDia, pendientes, vencidos, importePendiente, total: sociosConCuotas.length };
  }, [sociosConCuotas]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const getEstadoBadge = (estado: "al_dia" | "pendiente" | "vencido") => {
    switch (estado) {
      case "al_dia":
        return <Badge className="bg-green-500/10 text-green-600 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" /> Al día</Badge>;
      case "pendiente":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-200"><Clock className="h-3 w-3 mr-1" /> Pendiente</Badge>;
      case "vencido":
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Vencido</Badge>;
    }
  };

  const getHistorialSocio = (socioId: string) => {
    return cobros
      .filter((c) => c.socio_id === socioId)
      .sort((a, b) => new Date(b.periodo_fin).getTime() - new Date(a.periodo_fin).getTime());
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
              <Users className="h-4 w-4" /> Total Socios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Socios activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" /> Al día
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.alDia}</div>
            <p className="text-xs text-muted-foreground">Con cuota pagada</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" /> Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendientes}</div>
            <p className="text-xs text-muted-foreground">Próximos a vencer</p>
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
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.importePendiente)} pendiente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar socio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="al_dia">Al día</SelectItem>
            <SelectItem value="pendiente">Pendientes</SelectItem>
            <SelectItem value="vencido">Vencidos</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Tabla de socios */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Socio</TableHead>
                <TableHead>Tipo de pago</TableHead>
                <TableHead className="text-right">Cuota</TableHead>
                <TableHead>Próximo cobro</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sociosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No se encontraron socios
                  </TableCell>
                </TableRow>
              ) : (
                sociosFiltrados.map((socio) => (
                  <TableRow 
                    key={socio.id} 
                    className={cn(
                      socio.estadoCuota === "vencido" && "bg-destructive/5"
                    )}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {socio.nombre} {socio.apellidos}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {socio.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {socio.tipo_pago === "mensual" ? "Mensual" : "Anual"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(socio.importeCuota)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {format(socio.proximaCuota, "dd MMM yyyy", { locale: es })}
                        </div>
                        <div className={cn(
                          "text-xs",
                          socio.diasHastaProximaCuota < 0 && "text-destructive font-medium",
                          socio.diasHastaProximaCuota >= 0 && socio.diasHastaProximaCuota <= 7 && "text-yellow-600"
                        )}>
                          {socio.diasHastaProximaCuota > 0 
                            ? `En ${socio.diasHastaProximaCuota} días`
                            : socio.diasHastaProximaCuota === 0
                            ? "Hoy"
                            : `Hace ${Math.abs(socio.diasHastaProximaCuota)} días`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getEstadoBadge(socio.estadoCuota)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedSocio(socio);
                            setHistorialDialogOpen(true);
                          }}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        {socio.estadoCuota !== "al_dia" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedSocio(socio);
                              setNotas("");
                              setDialogOpen(true);
                            }}
                          >
                            Registrar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog para registrar pago */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar cuota</DialogTitle>
            <DialogDescription>
              Indica si se ha podido cobrar la cuota al socio
            </DialogDescription>
          </DialogHeader>

          {selectedSocio && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <span className="text-sm text-muted-foreground">Socio</span>
                  <p className="font-medium">
                    {selectedSocio.nombre} {selectedSocio.apellidos}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Importe</span>
                  <p className="font-medium text-lg">{formatCurrency(selectedSocio.importeCuota)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Tipo de pago</span>
                  <p className="font-medium capitalize">{selectedSocio.tipo_pago}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Fecha de cobro</span>
                  <p className="font-medium">
                    {format(selectedSocio.proximaCuota, "dd/MM/yyyy")}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Notas (opcional)</label>
                <Textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Añade notas sobre este cobro..."
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => registrarPago(false)}
              disabled={processing}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              No se ha cobrado
            </Button>
            <Button 
              onClick={() => registrarPago(true)}
              disabled={processing}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Cobrado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog historial de pagos */}
      <Dialog open={historialDialogOpen} onOpenChange={setHistorialDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Historial de cuotas - {selectedSocio?.nombre} {selectedSocio?.apellidos}
            </DialogTitle>
          </DialogHeader>

          {selectedSocio && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg text-sm">
                <div>
                  <span className="text-muted-foreground">Tipo de pago</span>
                  <p className="font-medium capitalize">{selectedSocio.tipo_pago}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Cuota</span>
                  <p className="font-medium">{formatCurrency(selectedSocio.importeCuota)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Próximo cobro</span>
                  <p className="font-medium">{format(selectedSocio.proximaCuota, "dd/MM/yyyy")}</p>
                </div>
              </div>

              <div className="max-h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Periodo</TableHead>
                      <TableHead className="text-right">Importe</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha cobro</TableHead>
                      <TableHead>Notas</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getHistorialSocio(selectedSocio.id).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                          Sin historial de cobros
                        </TableCell>
                      </TableRow>
                    ) : (
                      getHistorialSocio(selectedSocio.id).map((cobro) => (
                        <TableRow key={cobro.id}>
                          <TableCell className="text-sm">
                            {format(new Date(cobro.periodo_inicio), "dd/MM/yy")} - {format(new Date(cobro.periodo_fin), "dd/MM/yy")}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(Number(cobro.importe))}
                          </TableCell>
                          <TableCell>
                            {cobro.estado === "cobrado" ? (
                              <Badge className="bg-green-500/10 text-green-600 border-green-200">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Cobrado
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" /> Fallido
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {cobro.fecha_cobro 
                              ? format(new Date(cobro.fecha_cobro), "dd/MM/yyyy")
                              : "-"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                            {cobro.notas || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditCobroDialog(cobro)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setHistorialDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar cobro */}
      <Dialog open={editCobroDialogOpen} onOpenChange={setEditCobroDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar cobro</DialogTitle>
            <DialogDescription>
              Modifica los datos del cobro. Los cambios se reflejarán en la transacción asociada.
            </DialogDescription>
          </DialogHeader>

          {editingCobro && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Fecha de cobro</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editFechaCobro && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editFechaCobro ? format(editFechaCobro, "PPP", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editFechaCobro}
                      onSelect={setEditFechaCobro}
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Periodo inicio</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editPeriodoInicio && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editPeriodoInicio ? format(editPeriodoInicio, "PPP", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editPeriodoInicio}
                      onSelect={setEditPeriodoInicio}
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Periodo fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editPeriodoFin && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editPeriodoFin ? format(editPeriodoFin, "PPP", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editPeriodoFin}
                      onSelect={setEditPeriodoFin}
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={editNotas}
                  onChange={(e) => setEditNotas(e.target.value)}
                  placeholder="Notas del cobro..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditCobroDialogOpen(false)}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              onClick={updateCobro}
              disabled={processing || !editPeriodoInicio || !editPeriodoFin}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
