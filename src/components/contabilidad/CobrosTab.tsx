import { useState, useEffect, useMemo } from "react";
import { format, addMonths, addYears, isBefore, isAfter, differenceInDays, startOfMonth, setDate } from "date-fns";
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
  Search,
  History,
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

      // Buscar cobros del socio ordenados por fecha
      const cobrosDelSocio = cobros
        .filter((c) => c.socio_id === socio.id)
        .sort((a, b) => new Date(b.periodo_fin).getTime() - new Date(a.periodo_fin).getTime());

      const ultimoCobro = cobrosDelSocio[0] || null;
      const ultimoCobroPagado = cobrosDelSocio.find(c => c.estado === "cobrado");

      let proximaCuota: Date;
      let estadoCuota: "al_dia" | "pendiente" | "vencido";

      if (ultimoCobroPagado) {
        // Calcular siguiente cuota desde el último pago
        const finUltimoPago = new Date(ultimoCobroPagado.periodo_fin);
        if (esMensual) {
          proximaCuota = addMonths(finUltimoPago, 1);
          proximaCuota = setDate(proximaCuota, diaCobro);
        } else {
          proximaCuota = addYears(finUltimoPago, 1);
        }
      } else {
        // Primera cuota desde fecha de alta
        if (esMensual) {
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getHistorialSocio(selectedSocio.id).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
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
    </div>
  );
};
