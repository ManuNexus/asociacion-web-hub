import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Trash2, Pencil, Upload, FileText } from "lucide-react";

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
      toast({ title: editingCase ? "Caso actualizado" : "Caso creado" });
    },
    onError: () => toast({ title: "Error al guardar el caso", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("casos_semaforo").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-casos-semaforo"] });
      queryClient.invalidateQueries({ queryKey: ["casos-semaforo"] });
      toast({ title: "Caso eliminado" });
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

      {/* Casos header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Casos del Semáforo</h3>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo caso
        </Button>
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
                {format(parseISO(c.fecha), "d MMM yyyy", { locale: es })} · {c.ambito === "nacional" ? "Nacional" : "Local"}
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
                  if (confirm("¿Eliminar este caso?")) deleteMutation.mutate(c.id);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
        {casos.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No hay casos aún.</p>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCase ? "Editar caso" : "Nuevo caso"}</DialogTitle>
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
