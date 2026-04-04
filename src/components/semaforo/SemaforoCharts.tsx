import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";

interface Caso {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha: string;
  gravedad: string;
  ambito: string;
  fuente_url: string | null;
}

const COLORS = {
  rojo: "#ef4444",
  ambar: "#f59e0b",
  verde: "#10b981",
};

const AMBITO_LABELS: Record<string, string> = {
  local: "Local",
  autonomico: "Autonómico",
  nacional: "Nacional",
};

const GRAVEDAD_LABELS: Record<string, string> = {
  rojo: "Alerta",
  ambar: "Riesgo",
  verde: "Estándar",
};

export function SemaforoCharts({ casos }: { casos: Caso[] }) {
  const pieData = useMemo(() => {
    const counts = { rojo: 0, ambar: 0, verde: 0 };
    casos.forEach((c) => {
      const g = c.gravedad as keyof typeof counts;
      if (counts[g] !== undefined) counts[g]++;
    });
    return Object.entries(counts).map(([key, value]) => ({
      name: GRAVEDAD_LABELS[key] || key,
      value,
      fill: COLORS[key as keyof typeof COLORS],
    }));
  }, [casos]);

  const timelineData = useMemo(() => {
    const months: Record<string, { rojo: number; ambar: number; verde: number; label: string }> = {};
    casos.forEach((c) => {
      const mes = c.fecha.substring(0, 7);
      if (!months[mes]) {
        const d = parseISO(c.fecha);
        months[mes] = { rojo: 0, ambar: 0, verde: 0, label: format(d, "MMM yy", { locale: es }) };
      }
      const g = c.gravedad as "rojo" | "ambar" | "verde";
      months[mes][g]++;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [casos]);

  const ambitoData = useMemo(() => {
    const counts: Record<string, number> = {};
    casos.forEach((c) => {
      counts[c.ambito] = (counts[c.ambito] || 0) + 1;
    });
    return Object.entries(counts).map(([key, value]) => ({
      name: AMBITO_LABELS[key] || key,
      value,
    }));
  }, [casos]);

  if (casos.length === 0) return null;

  return (
    <div>
      <h3 className="text-base font-bold text-foreground mb-4">📊 Radiografía institucional</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pie: por gravedad */}
        <div className="border border-border rounded-xl p-5">
          <p className="text-sm font-semibold text-muted-foreground mb-3">Por nivel de gravedad</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} strokeWidth={2}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar: por ámbito */}
        <div className="border border-border rounded-xl p-5">
          <p className="text-sm font-semibold text-muted-foreground mb-3">Por ámbito territorial</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ambitoData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 20% 88%)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(217 54% 29%)" radius={[4, 4, 0, 0]} name="Casos" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stacked bar: timeline */}
        <div className="border border-border rounded-xl p-5">
          <p className="text-sm font-semibold text-muted-foreground mb-3">Evolución temporal</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={timelineData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 20% 88%)" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="rojo" stackId="a" fill={COLORS.rojo} name="Alerta" />
              <Bar dataKey="ambar" stackId="a" fill={COLORS.ambar} name="Riesgo" />
              <Bar dataKey="verde" stackId="a" fill={COLORS.verde} name="Estándar" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
