import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Users, Eye, Clock, TrendingUp, AlertTriangle, Info } from "lucide-react";
import { formatInMadrid } from "@/lib/timezone";
import { supabase } from "@/integrations/supabase/client";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis } from "recharts";

type DateRange = "7" | "15" | "30" | "90";

interface DailyData {
  fecha: string;
  visitors: number;
  pageviews: number;
}

interface SummaryData {
  total_visitors: number;
  total_pageviews: number;
  avg_pageviews_per_visit: number;
  avg_session_duration: number;
  last_updated: string;
}

const chartConfig = {
  visitors: {
    label: "Visitantes",
    color: "hsl(var(--primary))",
  },
  pageviews: {
    label: "Páginas vistas",
    color: "hsl(var(--secondary))",
  },
} satisfies ChartConfig;

const dateRangeLabels: Record<DateRange, string> = {
  "7": "Últimos 7 días",
  "15": "Últimos 15 días",
  "30": "Últimos 30 días",
  "90": "Últimos 90 días",
};

export const EstadisticasWeb = () => {
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>("15");
  const [dataWarning, setDataWarning] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    setDataWarning(null);
    
    try {
      const days = parseInt(dateRange);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Fetch daily snapshots from database
      const { data: snapshots, error: snapshotsError } = await supabase
        .from('analytics_snapshots')
        .select('fecha, visitors, pageviews')
        .gte('fecha', startDateStr)
        .lte('fecha', endDateStr)
        .order('fecha', { ascending: true });

      if (snapshotsError) {
        throw new Error(snapshotsError.message);
      }

      // Fetch summary
      const { data: summaryData, error: summaryError } = await supabase
        .from('analytics_summary')
        .select('*')
        .order('last_updated', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (summaryError) {
        throw new Error(summaryError.message);
      }

      // Check if we have data
      if (!snapshots || snapshots.length === 0) {
        setDataWarning(`No hay datos de analytics disponibles para los últimos ${days} días. Los datos comenzaron a recopilarse el 2 de diciembre de 2025.`);
        setDailyData([]);
      } else if (snapshots.length < days) {
        const firstDate = snapshots[0]?.fecha;
        setDataWarning(`Solo hay datos disponibles de ${snapshots.length} días (desde ${formatInMadrid(new Date(firstDate), "d 'de' MMMM")}). Se muestran los datos existentes.`);
        setDailyData(snapshots);
      } else {
        setDailyData(snapshots);
      }

      setSummary(summaryData);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError("No se pudieron cargar las estadísticas.");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  // Calculate totals from filtered data
  const totalVisitors = dailyData.reduce((sum, d) => sum + d.visitors, 0);
  const totalPageviews = dailyData.reduce((sum, d) => sum + d.pageviews, 0);
  const avgPageviewsPerVisit = totalVisitors > 0 ? totalPageviews / totalVisitors : 0;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const chartData = dailyData.map((d) => ({
    date: formatInMadrid(new Date(d.fecha), "dd MMM"),
    visitantes: d.visitors,
    paginas: d.pageviews,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold">{dateRangeLabels[dateRange]}</h3>
          <p className="text-sm text-muted-foreground">
            {summary?.last_updated 
              ? `Última sincronización: ${formatInMadrid(new Date(summary.last_updated), "d 'de' MMMM, HH:mm")}`
              : `Actualizado: ${formatInMadrid(new Date(), "d 'de' MMMM, HH:mm")}`
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 días</SelectItem>
              <SelectItem value="15">15 días</SelectItem>
              <SelectItem value="30">30 días</SelectItem>
              <SelectItem value="90">90 días</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-primary border-primary">
            <TrendingUp className="h-3 w-3 mr-1" />
            En vivo
          </Badge>
        </div>
      </div>

      {/* Warning Alert */}
      {dataWarning && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>{dataWarning}</AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Visitantes</span>
            </div>
            <p className="text-2xl font-bold">{totalVisitors.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="border-secondary/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="h-4 w-4 text-secondary" />
              <span className="text-sm text-muted-foreground">Páginas vistas</span>
            </div>
            <p className="text-2xl font-bold">{totalPageviews.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Tiempo medio</span>
            </div>
            <p className="text-2xl font-bold">{formatDuration(summary?.avg_session_duration || 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Págs/visita</span>
            </div>
            <p className="text-2xl font-bold">{avgPageviewsPerVisit.toFixed(1)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Chart */}
      {chartData.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tráfico</CardTitle>
            <CardDescription>Visitantes por día</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="fillVisitantes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="visitantes"
                  stroke="hsl(var(--primary))"
                  fill="url(#fillVisitantes)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay suficientes datos para mostrar el gráfico de tráfico</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
