import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, isAfter, isBefore, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertTriangle,
  Clock,
  ArrowUpCircle,
  ArrowDownCircle,
  FileText,
  CalendarClock,
  Euro
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Transaccion, Factura, CategoriaContabilidad } from "@/hooks/useContabilidad";

interface DashboardTabProps {
  transacciones: Transaccion[];
  facturas: Factura[];
  categorias: CategoriaContabilidad[];
  getBalance: () => { ingresos: number; gastos: number; balance: number };
  getBalancePorPeriodo: (year: number, month?: number) => { ingresos: number; gastos: number; balance: number };
}

export const DashboardTab = ({
  transacciones,
  facturas,
  getBalance,
  getBalancePorPeriodo,
}: DashboardTabProps) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const balance = getBalance();
  const balanceMensual = getBalancePorPeriodo(currentYear, currentMonth);
  const balanceAnual = getBalancePorPeriodo(currentYear);

  // Facturas pendientes y vencidas
  const facturasPendientes = useMemo(() => {
    return facturas.filter(f => f.estado === "pendiente" || f.estado === "vencida");
  }, [facturas]);

  const facturasVencidas = useMemo(() => {
    return facturas.filter(f => 
      f.estado === "vencida" || 
      (f.estado === "pendiente" && f.fecha_vencimiento && isBefore(new Date(f.fecha_vencimiento), now))
    );
  }, [facturas, now]);

  const facturasProximasVencer = useMemo(() => {
    const in7Days = addDays(now, 7);
    return facturas.filter(f => 
      f.estado === "pendiente" && 
      f.fecha_vencimiento && 
      isAfter(new Date(f.fecha_vencimiento), now) &&
      isBefore(new Date(f.fecha_vencimiento), in7Days)
    );
  }, [facturas, now]);

  // Totales por cobrar y pagar
  const porCobrar = facturasPendientes
    .filter(f => f.tipo === "emitida")
    .reduce((sum, f) => sum + Number(f.importe_total), 0);

  const porPagar = facturasPendientes
    .filter(f => f.tipo === "recibida")
    .reduce((sum, f) => sum + Number(f.importe_total), 0);

  // Últimas transacciones
  const ultimasTransacciones = useMemo(() => {
    return [...transacciones].slice(0, 5);
  }, [transacciones]);

  // Progreso mensual (comparación con mes anterior)
  const mesAnterior = currentMonth === 0 
    ? getBalancePorPeriodo(currentYear - 1, 11) 
    : getBalancePorPeriodo(currentYear, currentMonth - 1);
  
  const ingresosVariacion = mesAnterior.ingresos > 0 
    ? ((balanceMensual.ingresos - mesAnterior.ingresos) / mesAnterior.ingresos) * 100 
    : 0;
  const gastosVariacion = mesAnterior.gastos > 0 
    ? ((balanceMensual.gastos - mesAnterior.gastos) / mesAnterior.gastos) * 100 
    : 0;

  const formatCurrency = (value: number) => {
    return value.toLocaleString("es-ES", {
      style: "currency",
      currency: "EUR",
    });
  };

  return (
    <div className="space-y-6">
      {/* Alertas */}
      {(facturasVencidas.length > 0 || facturasProximasVencer.length > 0) && (
        <div className="space-y-2">
          {facturasVencidas.length > 0 && (
            <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-destructive">
                  {facturasVencidas.length} factura{facturasVencidas.length !== 1 ? 's' : ''} vencida{facturasVencidas.length !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total: {formatCurrency(facturasVencidas.reduce((s, f) => s + Number(f.importe_total), 0))}
                </p>
              </div>
            </div>
          )}
          {facturasProximasVencer.length > 0 && (
            <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-yellow-700 dark:text-yellow-500">
                  {facturasProximasVencer.length} factura{facturasProximasVencer.length !== 1 ? 's' : ''} vence{facturasProximasVencer.length !== 1 ? 'n' : ''} esta semana
                </p>
                <p className="text-sm text-muted-foreground">
                  Total: {formatCurrency(facturasProximasVencer.reduce((s, f) => s + Number(f.importe_total), 0))}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KPIs principales */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Balance actual</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance.balance >= 0 ? "text-primary" : "text-destructive"}`}>
              {formatCurrency(balance.balance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Saldo total acumulado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(balanceMensual.ingresos)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {ingresosVariacion !== 0 && (
                <Badge variant={ingresosVariacion >= 0 ? "default" : "destructive"} className="text-xs">
                  {ingresosVariacion >= 0 ? "+" : ""}{ingresosVariacion.toFixed(1)}%
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">vs mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gastos del mes</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(balanceMensual.gastos)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {gastosVariacion !== 0 && (
                <Badge variant={gastosVariacion <= 0 ? "default" : "destructive"} className="text-xs">
                  {gastosVariacion >= 0 ? "+" : ""}{gastosVariacion.toFixed(1)}%
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">vs mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resultado anual</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balanceAnual.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(balanceAnual.balance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentYear}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Segunda fila: Cobros/Pagos pendientes y últimas transacciones */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Por cobrar y pagar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ArrowDownCircle className="h-4 w-4 text-green-600" />
                Por cobrar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(porCobrar)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {facturasPendientes.filter(f => f.tipo === "emitida").length} facturas emitidas pendientes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ArrowUpCircle className="h-4 w-4 text-red-600" />
                Por pagar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(porPagar)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {facturasPendientes.filter(f => f.tipo === "recibida").length} facturas recibidas pendientes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Últimas transacciones */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Últimas transacciones</CardTitle>
            <CardDescription>Movimientos más recientes</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              {ultimasTransacciones.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Sin transacciones</p>
              ) : (
                <div className="space-y-3">
                  {ultimasTransacciones.map((t) => (
                    <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        {t.tipo === "ingreso" ? (
                          <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                            <ArrowUpCircle className="h-4 w-4 text-green-600" />
                          </div>
                        ) : (
                          <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                            <ArrowDownCircle className="h-4 w-4 text-red-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm">{t.concepto}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(t.fecha), "dd MMM yyyy", { locale: es })}
                          </p>
                        </div>
                      </div>
                      <span className={`font-semibold ${t.tipo === "ingreso" ? "text-green-600" : "text-red-600"}`}>
                        {t.tipo === "ingreso" ? "+" : "-"}{formatCurrency(Number(t.importe))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Resumen del año */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumen {currentYear}</CardTitle>
          <CardDescription>Comparativa ingresos vs gastos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Ingresos</span>
              <span className="text-sm text-green-600 font-medium">{formatCurrency(balanceAnual.ingresos)}</span>
            </div>
            <Progress value={100} className="h-2 bg-green-100" />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Gastos</span>
              <span className="text-sm text-red-600 font-medium">{formatCurrency(balanceAnual.gastos)}</span>
            </div>
            <Progress 
              value={balanceAnual.ingresos > 0 ? (balanceAnual.gastos / balanceAnual.ingresos) * 100 : 0} 
              className="h-2 bg-red-100"
            />
          </div>
          <div className="pt-2 border-t">
            <div className="flex justify-between">
              <span className="font-medium">Resultado neto</span>
              <span className={`font-bold ${balanceAnual.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(balanceAnual.balance)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
