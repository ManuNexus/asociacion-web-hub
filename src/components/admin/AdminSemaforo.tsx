import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Trash2, Pencil, Upload, FileText, Download, UploadCloud, Mail, Users, Search } from "lucide-react";

interface Caso {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha: string;
  gravedad: string;
  ambito: string;
  fuente_url: string | null;
}

const GRAVEDAD_OPTIONS = [
  { value: "rojo", label: "🔴 Rojo — Alerta de Integridad" },
  { value: "ambar", label: "🟡 Ámbar — Riesgo Institucional" },
  { value: "verde", label: "🟢 Verde — Estándar de Calidad" },
];

export default function AdminSemaforo() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<Caso | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newsletterSearch, setNewsletterSearch] = useState("");

  // Form state
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState(format(new Date(), "yyyy-MM-dd"));
  const [gravedad, setGravedad] = useState("rojo");
  const [ambito, setAmbito] = useState("nacional");
  const [fuenteUrl, setFuenteUrl] = useState("");

  const { data: casos = [] } = useQuery({
    queryKey: ["admin-casos-semaforo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("casos_semaforo")
        .select("*")
        .order("fecha", { ascending: false });
      if (error) throw error;
      return data as Caso[];
    },
  });

  const { data: informe } = useQuery({
    queryKey: ["admin-informe-trimestral"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("informe_trimestral")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: subscribers = [] } = useQuery({
    queryKey: ["admin-newsletter-semaforo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_semaforo")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggleSubscriberMutation = useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      const { error } = await supabase
        .from("newsletter_semaforo")
        .update({ activo })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-newsletter-semaforo"] });
      toast({ title: "Suscriptor actualizado" });
    },
  });

  const deleteSubscriberMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("newsletter_semaforo").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-newsletter-semaforo"] });
      toast({ title: "Suscriptor eliminado" });
    },
  });

  const filteredSubscribers = subscribers.filter((s) => {
    const q = newsletterSearch.toLowerCase();
    return !q || s.email.toLowerCase().includes(q) || (s.nombre || "").toLowerCase().includes(q);
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        titulo,
        descripcion: descripcion || null,
        fecha,
        gravedad,
        ambito,
        fuente_url: fuenteUrl || null,
      };
      if (editingCase) {
        const { error } = await supabase
          .from("casos_semaforo")
          .update(payload)
          .eq("id", editingCase.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("casos_semaforo").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-casos-semaforo"] });
      queryClient.invalidateQueries({ queryKey: ["casos-semaforo"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: editingCase ? "Alerta actualizada" : "Alerta creada" });
    },
    onError: () => toast({ title: "Error al guardar la alerta", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("casos_semaforo").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-casos-semaforo"] });
      queryClient.invalidateQueries({ queryKey: ["casos-semaforo"] });
      toast({ title: "Alerta eliminada" });
    },
  });

  const resetForm = () => {
    setTitulo("");
    setDescripcion("");
    setFecha(format(new Date(), "yyyy-MM-dd"));
    setGravedad("rojo");
    setAmbito("nacional");
    setFuenteUrl("");
    setEditingCase(null);
  };

  const handleDownloadCsv = () => {
    if (casos.length === 0) return;
    const headers = ["titulo", "descripcion", "fecha", "gravedad", "ambito", "fuente_url"];
    const rows = casos.map((c) =>
      headers.map((h) => {
        const val = c[h as keyof Caso] ?? "";
        const escaped = String(val).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alertas-semaforo-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) {
      toast({ title: "El CSV está vacío o no tiene datos", variant: "destructive" });
      return;
    }

    const headerLine = lines[0].toLowerCase();
    const expectedHeaders = ["titulo", "descripcion", "fecha", "gravedad", "ambito", "fuente_url"];
    const headers = headerLine.split(",").map((h) => h.replace(/"/g, "").trim());

    const missingHeaders = expectedHeaders.filter((h) => !headers.includes(h));
    if (missingHeaders.length > 0) {
      toast({ title: `Faltan columnas: ${missingHeaders.join(", ")}`, variant: "destructive" });
      return;
    }

    const parseCsvLine = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      }
      result.push(current.trim());
      return result;
    };

    const rows = lines.slice(1).map((line) => {
      const vals = parseCsvLine(line);
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = vals[i] ?? "";
      });
      return obj;
    });

    const validGravedades = ["rojo", "ambar", "verde"];
    const validAmbitos = ["nacional", "autonomico", "local"];
    const payloads = rows
      .filter((r) => r.titulo)
      .map((r) => ({
        titulo: r.titulo,
        descripcion: r.descripcion || null,
        fecha: r.fecha || format(new Date(), "yyyy-MM-dd"),
        gravedad: validGravedades.includes(r.gravedad) ? r.gravedad : "rojo",
        ambito: validAmbitos.includes(r.ambito) ? r.ambito : "nacional",
        fuente_url: r.fuente_url || null,
      }));

    if (payloads.length === 0) {
      toast({ title: "No se encontraron alertas válidas en el CSV", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("casos_semaforo").insert(payloads);
    if (error) {
      toast({ title: "Error al importar alertas", variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["admin-casos-semaforo"] });
      queryClient.invalidateQueries({ queryKey: ["casos-semaforo"] });
      toast({ title: `${payloads.length} alerta(s) importadas correctamente` });
    }
    e.target.value = "";
  };

  const openNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (c: Caso) => {
    setEditingCase(c);
    setTitulo(c.titulo);
    setDescripcion(c.descripcion || "");
    setFecha(c.fecha);
    setGravedad(c.gravedad);
    setAmbito(c.ambito);
    setFuenteUrl(c.fuente_url || "");
    setDialogOpen(true);
  };

  const handleUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileName = `informe-${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("informes-semaforo")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("informes-semaforo")
        .getPublicUrl(fileName);

      // Delete old informe record if exists
      if (informe) {
        await supabase.from("informe_trimestral").delete().eq("id", informe.id);
      }

      const { error: insertError } = await supabase.from("informe_trimestral").insert({
        titulo: file.name,
        archivo_url: urlData.publicUrl,
      });
      if (insertError) throw insertError;

      queryClient.invalidateQueries({ queryKey: ["admin-informe-trimestral"] });
      queryClient.invalidateQueries({ queryKey: ["informe-trimestral"] });
      toast({ title: "Informe subido correctamente" });
    } catch {
      toast({ title: "Error al subir el informe", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const gravedadDot = (g: string) =>
    g === "rojo" ? "bg-red-500" : g === "ambar" ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="space-y-8">
      {/* Informe trimestral */}
      <div className="border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" /> Informe Trimestral
        </h3>
        {informe && (
          <p className="text-sm text-muted-foreground mb-3">
            Actual: <span className="font-medium text-foreground">{informe.titulo}</span>
          </p>
        )}
        <label className="cursor-pointer">
          <Button variant="outline" className="gap-2" disabled={uploading} asChild>
            <span>
              <Upload className="h-4 w-4" />
              {uploading ? "Subiendo..." : "Subir nuevo PDF"}
            </span>
          </Button>
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleUploadPdf}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Newsletter subscribers */}
      <div className="border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Mail className="h-5 w-5" /> Suscriptores Newsletter Semáforo
          <Badge variant="secondary" className="ml-2">
            <Users className="h-3 w-3 mr-1" />
            {subscribers.filter((s) => s.activo).length} activos
          </Badge>
          <Badge variant="outline">
            {subscribers.length} total
          </Badge>
        </h3>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por email o nombre..."
            value={newsletterSearch}
            onChange={(e) => setNewsletterSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {filteredSubscribers.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 border border-border rounded-lg p-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {s.email}
                  {!s.activo && (
                    <Badge variant="outline" className="ml-2 text-muted-foreground">Inactivo</Badge>
                  )}
                </p>
                {s.nombre && (
                  <p className="text-xs text-muted-foreground">{s.nombre}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(s.created_at), "d MMM yyyy", { locale: es })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={s.activo}
                  onCheckedChange={(checked) =>
                    toggleSubscriberMutation.mutate({ id: s.id, activo: checked })
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm("¿Eliminar este suscriptor?")) deleteSubscriberMutation.mutate(s.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {filteredSubscribers.length === 0 && (
            <p className="text-center text-muted-foreground py-6">
              {newsletterSearch ? "Sin resultados" : "No hay suscriptores aún."}
            </p>
          )}
        </div>
      </div>

      {/* Casos header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-semibold">Alertas del Semáforo</h3>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={handleDownloadCsv} className="gap-2" disabled={casos.length === 0}>
            <Download className="h-4 w-4" /> Descargar CSV
          </Button>
          <label className="cursor-pointer">
            <Button variant="outline" className="gap-2" asChild>
              <span>
                <UploadCloud className="h-4 w-4" /> Importar CSV
              </span>
            </Button>
            <input type="file" accept=".csv" className="hidden" onChange={handleUploadCsv} />
          </label>
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" /> Nueva alerta
          </Button>
        </div>
      </div>

      {/* Cases list */}
      <div className="space-y-3">
        {casos.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-4 border border-border rounded-lg p-4"
          >
            <span className={`h-3 w-3 rounded-full shrink-0 ${gravedadDot(c.gravedad)}`} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{c.titulo}</p>
              <p className="text-xs text-muted-foreground">
                {format(parseISO(c.fecha), "d MMM yyyy", { locale: es })} · {c.ambito === "nacional" ? "Nacional" : c.ambito === "autonomico" ? "Autonómico" : "Local"}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (confirm("¿Eliminar esta alerta?")) deleteMutation.mutate(c.id);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
        {casos.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No hay alertas aún.</p>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCase ? "Editar alerta" : "Nueva alerta"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gravedad</Label>
                <Select value={gravedad} onValueChange={setGravedad}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRAVEDAD_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ámbito</Label>
                <Select value={ambito} onValueChange={setAmbito}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nacional">Nacional</SelectItem>
                    <SelectItem value="autonomico">Autonómico</SelectItem>
                    <SelectItem value="local">Local</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Enlace a fuente</Label>
              <Input
                type="url"
                value={fuenteUrl}
                onChange={(e) => setFuenteUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
