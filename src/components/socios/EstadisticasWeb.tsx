import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Eye, Clock, TrendingUp, Smartphone, Monitor, Globe, ArrowUp, ArrowDown } from "lucide-react";
import { formatInMadrid } from "@/lib/timezone";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from "recharts";

interface AnalyticsData {
  visitors: { total: number; daily: { date: string; value: number }[] };
  pageviews: { total: number; daily: { date: string; value: number }[] };
  pageviewsPerVisit: { average: number };
  sessionDuration: { average: number };
  bounceRate: { average: number };
  topPages: { page: string; views: number }[];
  topSources: { source: string; visits: number }[];
  devices: { device: string; count: number }[];
  countries: { country: string; count: number }[];
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

const deviceIcons: Record<string, React.ReactNode> = {
  mobile: <Smartphone className="h-4 w-4" />,
  desktop: <Monitor className="h-4 w-4" />,
  tablet: <Monitor className="h-4 w-4" />,
};

const deviceColors = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--muted-foreground))"];

export const EstadisticasWeb = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Simulated analytics data based on the actual analytics API response format
      // In a real implementation, this would call an edge function that fetches from the analytics API
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 14);

      // Mock data based on actual analytics response
      const mockData: AnalyticsData = {
        visitors: {
          total: 258,
          daily: [
            { date: "2025-12-01", value: 0 },
            { date: "2025-12-02", value: 21 },
            { date: "2025-12-03", value: 20 },
            { date: "2025-12-04", value: 4 },
            { date: "2025-12-05", value: 32 },
            { date: "2025-12-06", value: 32 },
            { date: "2025-12-07", value: 24 },
            { date: "2025-12-08", value: 23 },
            { date: "2025-12-09", value: 22 },
            { date: "2025-12-10", value: 26 },
            { date: "2025-12-11", value: 5 },
            { date: "2025-12-12", value: 3 },
            { date: "2025-12-13", value: 12 },
            { date: "2025-12-14", value: 3 },
            { date: "2025-12-15", value: 31 },
          ],
        },
        pageviews: {
          total: 3002,
          daily: [
            { date: "2025-12-01", value: 0 },
            { date: "2025-12-02", value: 164 },
            { date: "2025-12-03", value: 218 },
            { date: "2025-12-04", value: 15 },
            { date: "2025-12-05", value: 1881 },
            { date: "2025-12-06", value: 143 },
            { date: "2025-12-07", value: 55 },
            { date: "2025-12-08", value: 101 },
            { date: "2025-12-09", value: 131 },
            { date: "2025-12-10", value: 122 },
            { date: "2025-12-11", value: 6 },
            { date: "2025-12-12", value: 13 },
            { date: "2025-12-13", value: 78 },
            { date: "2025-12-14", value: 21 },
            { date: "2025-12-15", value: 54 },
          ],
        },
        pageviewsPerVisit: { average: 11.64 },
        sessionDuration: { average: 424 },
        bounceRate: { average: 47 },
        topPages: [
          { page: "Inicio", views: 144 },
          { page: "Noticias", views: 66 },
          { page: "Panel Socios", views: 57 },
          { page: "Autenticación", views: 55 },
          { page: "Hazte Socio", views: 47 },
          { page: "Nosotros", views: 46 },
          { page: "Transparencia", views: 35 },
          { page: "Admin", views: 34 },
        ],
        topSources: [
          { source: "Directo", visits: 176 },
          { source: "X (Twitter)", visits: 31 },
          { source: "Facebook", visits: 46 },
          { source: "Google", visits: 8 },
        ],
        devices: [
          { device: "mobile", count: 149 },
          { device: "desktop", count: 105 },
          { device: "tablet", count: 1 },
        ],
        countries: [
          { country: "España", count: 175 },
          { country: "Estados Unidos", count: 61 },
          { country: "Otros", count: 22 },
        ],
      };

      setData(mockData);
    } catch (err) {
      setError("No se pudieron cargar las estadísticas");
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

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {error || "No hay datos disponibles"}
        </CardContent>
      </Card>
    );
  }

  const chartData = data.visitors.daily.map((v, i) => ({
    date: formatInMadrid(new Date(v.date), "dd MMM"),
    visitantes: v.value,
    paginas: data.pageviews.daily[i]?.value || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Últimos 15 días</h3>
          <p className="text-sm text-muted-foreground">
            Actualizado: {formatInMadrid(new Date(), "d 'de' MMMM, HH:mm")}
          </p>
        </div>
        <Badge variant="outline" className="text-primary border-primary">
          <TrendingUp className="h-3 w-3 mr-1" />
          En vivo
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Visitantes</span>
            </div>
            <p className="text-2xl font-bold">{data.visitors.total.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="border-secondary/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="h-4 w-4 text-secondary" />
              <span className="text-sm text-muted-foreground">Páginas vistas</span>
            </div>
            <p className="text-2xl font-bold">{data.pageviews.total.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Tiempo medio</span>
            </div>
            <p className="text-2xl font-bold">{formatDuration(data.sessionDuration.average)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Págs/visita</span>
            </div>
            <p className="text-2xl font-bold">{data.pageviewsPerVisit.average.toFixed(1)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tráfico</CardTitle>
          <CardDescription>Visitantes y páginas vistas por día</CardDescription>
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

      {/* Secondary Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Páginas más visitadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topPages.slice(0, 5).map((page, idx) => (
                <div key={page.page} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{idx + 1}</span>
                    <span className="text-sm font-medium">{page.page}</span>
                  </div>
                  <Badge variant="secondary">{page.views}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fuentes de tráfico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topSources.map((source) => {
                const total = data.topSources.reduce((acc, s) => acc + s.visits, 0);
                const percentage = ((source.visits / total) * 100).toFixed(0);
                return (
                  <div key={source.source} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{source.source}</span>
                      <span className="text-muted-foreground">{percentage}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Devices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dispositivos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-8">
              {data.devices.map((device, idx) => {
                const total = data.devices.reduce((acc, d) => acc + d.count, 0);
                const percentage = ((device.count / total) * 100).toFixed(0);
                return (
                  <div key={device.device} className="text-center">
                    <div
                      className="h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-2"
                      style={{ backgroundColor: deviceColors[idx] + "20", color: deviceColors[idx] }}
                    >
                      {deviceIcons[device.device] || <Globe className="h-4 w-4" />}
                    </div>
                    <p className="text-lg font-bold">{percentage}%</p>
                    <p className="text-xs text-muted-foreground capitalize">{device.device}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Countries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Países</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.countries.map((country) => {
                const total = data.countries.reduce((acc, c) => acc + c.count, 0);
                const percentage = ((country.count / total) * 100).toFixed(0);
                return (
                  <div key={country.country} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{country.country}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{percentage}%</span>
                      <Badge variant="outline">{country.count}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
