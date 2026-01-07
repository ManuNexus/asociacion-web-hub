import { useState, useMemo } from "react";
import { format, startOfYear, endOfYear, eachMonthOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { TrendingUp, TrendingDown, Wallet, Calendar, PieChart as PieChartIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Transaccion, Factura, CategoriaContabilidad } from "@/hooks/useContabilidad";

interface InformesTabProps {
  transacciones: Transaccion[];
  facturas: Factura[];
  categorias: CategoriaContabilidad[];
  getBalance: () => { ingresos: number; gastos: number; balance: number };
  getBalancePorPeriodo: (year: number, month?: number) => { ingresos: number; gastos: number; balance: number };
  getTransaccionesPorCategoria: (tipo?: "ingreso" | "gasto") => { categoria: CategoriaContabilidad | null; total: number }[];
}

export const InformesTab = ({
  transacciones,
  facturas,
  categorias,
  getBalance,
  getBalancePorPeriodo,
  getTransaccionesPorCategoria,
}: InformesTabProps) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const balance = getBalance();
  const balanceAnual = getBalancePorPeriodo(selectedYear);

  // Generar años disponibles
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    transacciones.forEach(t => {
      years.add(new Date(t.fecha).getFullYear());
    });
    years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [transacciones, currentYear]);

  // Datos mensuales para el gráfico de barras
  const monthlyData = useMemo(() => {
    const start = startOfYear(new Date(selectedYear, 0));
    const end = endOfYear(new Date(selectedYear, 0));
    const months = eachMonthOfInterval({ start, end });

    return months.map(month => {
      const monthNum = month.getMonth();
      const data = getBalancePorPeriodo(selectedYear, monthNum);
      return {
        name: format(month, "MMM", { locale: es }),
        ingresos: data.ingresos,
        gastos: data.gastos,
        balance: data.balance,
      };
    });
  }, [selectedYear, getBalancePorPeriodo]);

  // Datos por categoría para gráficos de tarta
  const ingresosPorCategoria = useMemo(() => {
    return getTransaccionesPorCategoria("ingreso").map(item => ({
      name: item.categoria?.nombre || "Sin categoría",
      value: item.total,
      color: item.categoria?.color || "#94a3b8",
    }));
  }, [getTransaccionesPorCategoria]);

  const gastosPorCategoria = useMemo(() => {
    return getTransaccionesPorCategoria("gasto").map(item => ({
      name: item.categoria?.nombre || "Sin categoría",
      value: item.total,
      color: item.categoria?.color || "#94a3b8",
    }));
  }, [getTransaccionesPorCategoria]);

  // Facturas pendientes
  const facturasPendientes = useMemo(() => {
    return facturas.filter(f => f.estado === "pendiente" || f.estado === "vencida");
  }, [facturas]);

  const totalFacturasPendientesEmitidas = facturasPendientes
    .filter(f => f.tipo === "emitida")
    .reduce((sum, f) => sum + Number(f.importe_total), 0);

  const totalFacturasPendientesRecibidas = facturasPendientes
    .filter(f => f.tipo === "recibida")
    .reduce((sum, f) => sum + Number(f.importe_total), 0);

  const formatCurrency = (value: number) => {
    return value.toLocaleString("es-ES", {
      style: "currency",
      currency: "EUR",
    });
  };

  return (
    <div className="space-y-6">
      {/* Selector de año */}
      <div className="flex items-center gap-4">
        <Calendar className="h-5 w-5 text-muted-foreground" />
        <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map(year => (
              <SelectItem key={year} value={String(year)}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(balance.balance)}
            </div>
            <p className="text-xs text-muted-foreground">Desde el inicio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos {selectedYear}</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(balanceAnual.ingresos)}
            </div>
            <p className="text-xs text-muted-foreground">
              {transacciones.filter(t => t.tipo === "ingreso" && new Date(t.fecha).getFullYear() === selectedYear).length} transacciones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos {selectedYear}</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(balanceAnual.gastos)}
            </div>
            <p className="text-xs text-muted-foreground">
              {transacciones.filter(t => t.tipo === "gasto" && new Date(t.fecha).getFullYear() === selectedYear).length} transacciones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance {selectedYear}</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balanceAnual.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(balanceAnual.balance)}
            </div>
            <p className="text-xs text-muted-foreground">Resultado anual</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de barras mensual */}
      <Card>
        <CardHeader>
          <CardTitle>Evolución mensual {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis 
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  className="text-xs"
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="ingresos" fill="#22c55e" name="Ingresos" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gastos" fill="#ef4444" name="Gastos" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos de tarta por categoría */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-green-600" />
              Ingresos por categoría
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ingresosPorCategoria.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Sin datos</p>
            ) : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ingresosPorCategoria}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {ingresosPorCategoria.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend 
                      formatter={(value) => <span className="text-sm">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-red-600" />
              Gastos por categoría
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gastosPorCategoria.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Sin datos</p>
            ) : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={gastosPorCategoria}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {gastosPorCategoria.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend 
                      formatter={(value) => <span className="text-sm">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Facturas pendientes */}
      <Card>
        <CardHeader>
          <CardTitle>Facturas pendientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Por cobrar (emitidas)</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  {facturasPendientes.filter(f => f.tipo === "emitida").length}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalFacturasPendientesEmitidas)}
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-red-50 dark:bg-red-950/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Por pagar (recibidas)</span>
                <Badge variant="outline" className="text-red-600 border-red-600">
                  {facturasPendientes.filter(f => f.tipo === "recibida").length}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(totalFacturasPendientesRecibidas)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
