import { useMemo, useState } from "react";
import { format, addDays, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isAfter, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Factura } from "@/hooks/useContabilidad";

interface TesoreríaTabProps {
  facturas: Factura[];
  getBalance: () => { ingresos: number; gastos: number; balance: number };
}

export const TesoreríaTab = ({
  facturas,
  getBalance,
}: TesoreríaTabProps) => {
  const now = new Date();
  const [previewMonths, setPreviewMonths] = useState<number>(3);
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0);

  const currentViewMonth = addMonths(now, currentMonthOffset);
  const balance = getBalance();

  // Facturas pendientes de cobro/pago
  const facturasPendientes = useMemo(() => {
    return facturas.filter(f => f.estado === "pendiente" || f.estado === "vencida");
  }, [facturas]);

  const cobrosPendientes = facturasPendientes.filter(f => f.tipo === "emitida");
  const pagosPendientes = facturasPendientes.filter(f => f.tipo === "recibida");

  // Previsión de flujo de caja
  const flujoCajaPreview = useMemo(() => {
    const endDate = addMonths(now, previewMonths);
    let saldoActual = balance.balance;
    const data: { fecha: string; saldo: number; cobros: number; pagos: number }[] = [];

    // Agrupar facturas por fecha de vencimiento
    const movimientosPorFecha: Record<string, { cobros: number; pagos: number }> = {};

    facturasPendientes.forEach(f => {
      const fechaKey = f.fecha_vencimiento || f.fecha_emision;
      const fecha = new Date(fechaKey);
      
      if (isBefore(fecha, endDate) && isAfter(fecha, addDays(now, -1))) {
        const key = format(fecha, "yyyy-MM-dd");
        if (!movimientosPorFecha[key]) {
          movimientosPorFecha[key] = { cobros: 0, pagos: 0 };
        }
        if (f.tipo === "emitida") {
          movimientosPorFecha[key].cobros += Number(f.importe_total);
        } else {
          movimientosPorFecha[key].pagos += Number(f.importe_total);
        }
      }
    });

    // Generar puntos de datos semanales
    const weeks = Math.ceil((endDate.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000));
    for (let i = 0; i <= weeks; i++) {
      const weekStart = addDays(now, i * 7);
      const weekEnd = addDays(weekStart, 6);
      
      let cobrosSemanales = 0;
      let pagosSemanales = 0;

      Object.entries(movimientosPorFecha).forEach(([fechaStr, mov]) => {
        const fecha = new Date(fechaStr);
        if (fecha >= weekStart && fecha <= weekEnd) {
          cobrosSemanales += mov.cobros;
          pagosSemanales += mov.pagos;
        }
      });

      saldoActual += cobrosSemanales - pagosSemanales;

      data.push({
        fecha: format(weekStart, "dd MMM", { locale: es }),
        saldo: saldoActual,
        cobros: cobrosSemanales,
        pagos: pagosSemanales,
      });
    }

    return data;
  }, [facturasPendientes, balance.balance, now, previewMonths]);

  // Próximos vencimientos
  const proximosVencimientos = useMemo(() => {
    return facturasPendientes
      .filter(f => f.fecha_vencimiento)
      .sort((a, b) => new Date(a.fecha_vencimiento!).getTime() - new Date(b.fecha_vencimiento!).getTime())
      .slice(0, 10);
  }, [facturasPendientes]);

  // Calendario del mes
  const diasDelMes = useMemo(() => {
    const start = startOfMonth(currentViewMonth);
    const end = endOfMonth(currentViewMonth);
    return eachDayOfInterval({ start, end });
  }, [currentViewMonth]);

  const eventosCalendario = useMemo(() => {
    const eventos: Record<string, { cobros: number; pagos: number }> = {};
    
    facturasPendientes.forEach(f => {
      const fechaKey = f.fecha_vencimiento || f.fecha_emision;
      const key = format(new Date(fechaKey), "yyyy-MM-dd");
      
      if (!eventos[key]) {
        eventos[key] = { cobros: 0, pagos: 0 };
      }
      
      if (f.tipo === "emitida") {
        eventos[key].cobros++;
      } else {
        eventos[key].pagos++;
      }
    });

    return eventos;
  }, [facturasPendientes]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString("es-ES", {
      style: "currency",
      currency: "EUR",
    });
  };

  // Resumen previsión
  const totalCobros = cobrosPendientes.reduce((s, f) => s + Number(f.importe_total), 0);
  const totalPagos = pagosPendientes.reduce((s, f) => s + Number(f.importe_total), 0);
  const saldoFuturo = balance.balance + totalCobros - totalPagos;

  return (
    <div className="space-y-6">
      {/* KPIs de tesorería */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Saldo actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(balance.balance)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Cobros pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalCobros)}</div>
            <p className="text-xs text-muted-foreground">{cobrosPendientes.length} facturas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Pagos pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalPagos)}</div>
            <p className="text-xs text-muted-foreground">{pagosPendientes.length} facturas</p>
          </CardContent>
        </Card>

        <Card className={saldoFuturo < 0 ? "border-destructive/50 bg-destructive/5" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Saldo proyectado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldoFuturo >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(saldoFuturo)}
            </div>
            {saldoFuturo < 0 && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Posible déficit
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de previsión */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Previsión de tesorería</CardTitle>
              <CardDescription>Evolución estimada del saldo</CardDescription>
            </div>
            <Select value={String(previewMonths)} onValueChange={(v) => setPreviewMonths(parseInt(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 mes</SelectItem>
                <SelectItem value="3">3 meses</SelectItem>
                <SelectItem value="6">6 meses</SelectItem>
                <SelectItem value="12">12 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={flujoCajaPreview}>
                <defs>
                  <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="fecha" className="text-xs" />
                <YAxis 
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  className="text-xs"
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === "saldo" ? "Saldo" : name === "cobros" ? "Cobros" : "Pagos"
                  ]}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="saldo" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorSaldo)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Calendario y próximos vencimientos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Calendario */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Calendario de vencimientos</CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setCurrentMonthOffset(prev => prev - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[120px] text-center">
                  {format(currentViewMonth, "MMMM yyyy", { locale: es })}
                </span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setCurrentMonthOffset(prev => prev + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center">
              {["L", "M", "X", "J", "V", "S", "D"].map((dia) => (
                <div key={dia} className="text-xs font-medium text-muted-foreground py-2">
                  {dia}
                </div>
              ))}
              
              {/* Offset para el primer día del mes */}
              {Array.from({ length: (diasDelMes[0].getDay() + 6) % 7 }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              
              {diasDelMes.map((dia) => {
                const key = format(dia, "yyyy-MM-dd");
                const eventos = eventosCalendario[key];
                const isToday = isSameDay(dia, now);
                
                return (
                  <div
                    key={key}
                    className={`
                      relative p-2 text-sm rounded-md
                      ${isToday ? "bg-primary text-primary-foreground font-bold" : ""}
                      ${eventos ? "bg-muted/50" : ""}
                    `}
                  >
                    {dia.getDate()}
                    {eventos && (
                      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {eventos.cobros > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        )}
                        {eventos.pagos > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground justify-center">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" /> Cobros
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" /> Pagos
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Próximos vencimientos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Próximos vencimientos</CardTitle>
            <CardDescription>Facturas ordenadas por fecha</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {proximosVencimientos.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Sin vencimientos pendientes</p>
              ) : (
                <div className="space-y-3">
                  {proximosVencimientos.map((f) => {
                    const fecha = new Date(f.fecha_vencimiento!);
                    const vencida = isBefore(fecha, now);
                    
                    return (
                      <div 
                        key={f.id} 
                        className={`flex items-center justify-between p-3 rounded-lg border ${vencida ? 'border-destructive/50 bg-destructive/5' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${f.tipo === "emitida" ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                            {f.tipo === "emitida" ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{f.tercero_nombre}</p>
                            <p className="text-xs text-muted-foreground">
                              {f.numero} • {format(fecha, "dd MMM yyyy", { locale: es })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`font-semibold ${f.tipo === "emitida" ? "text-green-600" : "text-red-600"}`}>
                            {formatCurrency(Number(f.importe_total))}
                          </span>
                          {vencida && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              Vencida
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
