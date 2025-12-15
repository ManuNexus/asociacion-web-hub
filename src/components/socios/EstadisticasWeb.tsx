import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Users, Eye, Clock, TrendingUp, Smartphone, Monitor, Globe, AlertTriangle } from "lucide-react";
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
  date: string;
  visitors: number;
  pageviews: number;
}

interface AnalyticsData {
  visitors: number;
  pageviews: number;
  avgSessionDuration: number;
  pageviewsPerVisit: number;
  daily: DailyData[];
  hasData: boolean;
  dataStartDate: string | null;
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
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>("15");
  const [noDataWarning, setNoDataWarning] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    setNoDataWarning(null);
    
    try {
      const days = parseInt(dateRange);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Fetch analytics from Lovable's analytics API
      const { data: analyticsData, error: analyticsError } = await supabase.functions.invoke('get-analytics', {
        body: {
          startDate: startDateStr,
          endDate: endDateStr,
          granularity: days <= 15 ? 'daily' : 'daily'
        }
      });

      if (analyticsError) {
        throw new Error(analyticsError.message);
      }

      // Check if we have actual data
      if (!analyticsData || !analyticsData.daily || analyticsData.daily.length === 0) {
        setNoDataWarning(`No hay datos de analytics disponibles para los últimos ${days} días. Los datos comenzaron a recopilarse recientemente.`);
        setData({
          visitors: 0,
          pageviews: 0,
          avgSessionDuration: 0,
          pageviewsPerVisit: 0,
          daily: [],
          hasData: false,
          dataStartDate: null
        });
        return;
      }

      // Check if data is incomplete
      const actualDays = analyticsData.daily.length;
      if (actualDays < days) {
        const firstDataDate = analyticsData.daily[0]?.date;
        setNoDataWarning(`Solo hay datos disponibles de los últimos ${actualDays} días (desde ${formatInMadrid(new Date(firstDataDate), "d 'de' MMMM")}). Se muestran los datos existentes.`);
      }

      setData({
        visitors: analyticsData.visitors || 0,
        pageviews: analyticsData.pageviews || 0,
        avgSessionDuration: analyticsData.avgSessionDuration || 0,
        pageviewsPerVisit: analyticsData.pageviewsPerVisit || 0,
        daily: analyticsData.daily || [],
        hasData: true,
        dataStartDate: analyticsData.daily[0]?.date || null
      });
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError("No se pudieron cargar las estadísticas. Las estadísticas pueden no estar disponibles aún para este proyecto.");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data?.hasData) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-semibold">{dateRangeLabels[dateRange]}</h3>
            <p className="text-sm text-muted-foreground">
              Actualizado: {formatInMadrid(new Date(), "d 'de' MMMM, HH:mm")}
            </p>
          </div>
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
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error || `No hay datos de analytics disponibles para los últimos ${dateRange} días. Las estadísticas comenzarán a mostrarse cuando haya suficientes datos de tráfico en la web.`}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const chartData = data?.daily.map((d) => ({
    date: formatInMadrid(new Date(d.date), "dd MMM"),
    visitantes: d.visitors,
    paginas: d.pageviews,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold">{dateRangeLabels[dateRange]}</h3>
          <p className="text-sm text-muted-foreground">
            Actualizado: {formatInMadrid(new Date(), "d 'de' MMMM, HH:mm")}
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
      {noDataWarning && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{noDataWarning}</AlertDescription>
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
            <p className="text-2xl font-bold">{data?.visitors.toLocaleString() || 0}</p>
          </CardContent>
        </Card>

        <Card className="border-secondary/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="h-4 w-4 text-secondary" />
              <span className="text-sm text-muted-foreground">Páginas vistas</span>
            </div>
            <p className="text-2xl font-bold">{data?.pageviews.toLocaleString() || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Tiempo medio</span>
            </div>
            <p className="text-2xl font-bold">{formatDuration(data?.avgSessionDuration || 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Págs/visita</span>
            </div>
            <p className="text-2xl font-bold">{(data?.pageviewsPerVisit || 0).toFixed(1)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Chart */}
      {data?.hasData && chartData.length > 0 ? (
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
