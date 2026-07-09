import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload, ExternalLink } from "lucide-react";

interface Partido {
  id: string;
  nombre: string;
  color: string;
  logo_url: string | null;
  axis_x: number;
  axis_y: number;
  orden: number;
  activo: boolean;
}

const empty: Partido = {
  id: "",
  nombre: "",
  color: "#224172",
  logo_url: null,
  axis_x: 0,
  axis_y: 0,
  orden: 100,
  activo: true,
};

export default function AdminRadarPolitico() {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partido>(empty);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("radar_partidos")
      .select("*")
      .order("orden", { ascending: true });
    if (error) toast.error(error.message);
    else setPartidos((data as Partido[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing({ ...empty, orden: (partidos[partidos.length - 1]?.orden ?? 0) + 1 });
    setOpen(true);
  };

  const openEdit = (p: Partido) => {
    setEditing({ ...p });
    setOpen(true);
  };

  const save = async () => {
    if (!editing.id.trim() || !editing.nombre.trim()) {
      toast.error("ID y nombre son obligatorios");
      return;
    }
    const payload = {
      id: editing.id.trim().toUpperCase(),
      nombre: editing.nombre.trim(),
      color: editing.color,
      logo_url: editing.logo_url,
      axis_x: Number(editing.axis_x),
      axis_y: Number(editing.axis_y),
      orden: Number(editing.orden),
      activo: editing.activo,
    };
    const { error } = await supabase.from("radar_partidos").upsert(payload);
    if (error) return toast.error(error.message);
    toast.success("Partido guardado");
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm(`¿Eliminar ${id}?`)) return;
    const { error } = await supabase.from("radar_partidos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminado");
    load();
  };

  const uploadLogo = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "png";
      const safeId = (editing.id || "sin-id").toLowerCase().replace(/[^a-z0-9]/g, "-");
      const path = `radar-logos/${safeId}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("mailing-images")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("mailing-images").getPublicUrl(path);
      setEditing((e) => ({ ...e, logo_url: data.publicUrl }));
      toast.success("Logo subido");
    } catch (e: any) {
      toast.error(e.message ?? "Error subiendo logo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Radar Político — Partidos</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Configura logo, color y posición ideológica. La página está en{" "}
            <a href="/radar-politico" target="_blank" className="text-primary inline-flex items-center gap-1 underline">
              /radar-politico <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo partido
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Logo</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Eje X</TableHead>
                <TableHead>Eje Y</TableHead>
                <TableHead>Orden</TableHead>
                <TableHead>Activo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partidos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    {p.logo_url ? (
                      <img src={p.logo_url} alt={p.nombre} className="w-10 h-10 object-contain rounded bg-white border" />
                    ) : (
                      <div
                        className="w-10 h-10 rounded flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: p.color }}
                      >
                        {p.id.slice(0, 2)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{p.id}</TableCell>
                  <TableCell className="font-semibold">{p.nombre}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded border" style={{ backgroundColor: p.color }} />
                      <span className="text-xs font-mono">{p.color}</span>
                    </div>
                  </TableCell>
                  <TableCell>{Number(p.axis_x).toFixed(2)}</TableCell>
                  <TableCell>{Number(p.axis_y).toFixed(2)}</TableCell>
                  <TableCell>{p.orden}</TableCell>
                  <TableCell>
                    <span className={p.activo ? "text-green-600" : "text-muted-foreground"}>
                      {p.activo ? "Sí" : "No"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(p.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="mt-4 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Guía del eje ideológico (rango −2 a +2):</p>
          <p><strong>Eje X:</strong> Izquierda (−) ↔ Derecha (+) económica.</p>
          <p><strong>Eje Y:</strong> Progresista (−) ↔ Conservador (+) cultural.</p>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing.id && partidos.find((p) => p.id === editing.id) ? "Editar" : "Nuevo"} partido</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>ID (código)</Label>
                <Input
                  value={editing.id}
                  onChange={(e) => setEditing({ ...editing, id: e.target.value })}
                  placeholder="PP, PSOE, VOX…"
                  disabled={!!partidos.find((p) => p.id === editing.id)}
                />
              </div>
              <div>
                <Label>Nombre visible</Label>
                <Input value={editing.nombre} onChange={(e) => setEditing({ ...editing, nombre: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Color corporativo</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={editing.color}
                    onChange={(e) => setEditing({ ...editing, color: e.target.value })}
                    className="w-16 p-1 h-10"
                  />
                  <Input
                    value={editing.color}
                    onChange={(e) => setEditing({ ...editing, color: e.target.value })}
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
              <div>
                <Label>Orden</Label>
                <Input
                  type="number"
                  value={editing.orden}
                  onChange={(e) => setEditing({ ...editing, orden: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label>Logo</Label>
              <div className="flex items-center gap-3">
                {editing.logo_url && (
                  <img src={editing.logo_url} alt="Logo" className="w-14 h-14 object-contain rounded border bg-white" />
                )}
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-center gap-2 h-10 border-2 border-dashed rounded hover:bg-muted transition-colors text-sm">
                    <Upload className="w-4 h-4" />
                    {uploading ? "Subiendo…" : editing.logo_url ? "Reemplazar logo" : "Subir logo"}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadLogo(f);
                    }}
                  />
                </label>
                {editing.logo_url && (
                  <Button variant="ghost" size="sm" onClick={() => setEditing({ ...editing, logo_url: null })}>
                    Quitar
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Eje X (izq −2 / der +2)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="-2.5"
                  max="2.5"
                  value={editing.axis_x}
                  onChange={(e) => setEditing({ ...editing, axis_x: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Eje Y (prog −2 / cons +2)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="-2.5"
                  max="2.5"
                  value={editing.axis_y}
                  onChange={(e) => setEditing({ ...editing, axis_y: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Switch
                checked={editing.activo}
                onCheckedChange={(v) => setEditing({ ...editing, activo: v })}
              />
              <Label>Activo (visible en el Radar)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
