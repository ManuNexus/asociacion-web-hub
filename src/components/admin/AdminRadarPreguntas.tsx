import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Partido {
  id: string;
  nombre: string;
  color: string;
}

interface Pregunta {
  id: string;
  categoria: string;
  texto: string;
  scores: Record<string, number>;
  orden: number;
  activa: boolean;
}

const empty: Pregunta = {
  id: "",
  categoria: "",
  texto: "",
  scores: {},
  orden: 100,
  activa: true,
};

const SCALE_LABEL: Record<number, string> = {
  1: "Totalmente en desacuerdo",
  2: "En desacuerdo",
  3: "Ni de acuerdo ni en desacuerdo",
  4: "De acuerdo",
  5: "Totalmente de acuerdo",
};

export default function AdminRadarPreguntas() {
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Pregunta>(empty);
  const [isNew, setIsNew] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: qs, error: e1 }, { data: ps, error: e2 }] = await Promise.all([
      supabase.from("radar_preguntas").select("*").order("orden", { ascending: true }),
      supabase.from("radar_partidos").select("id,nombre,color").order("orden", { ascending: true }),
    ]);
    if (e1) toast.error(e1.message);
    if (e2) toast.error(e2.message);
    setPreguntas((qs as any) ?? []);
    setPartidos((ps as Partido[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    const nextOrden = (preguntas[preguntas.length - 1]?.orden ?? 0) + 10;
    const nextId = `q${(preguntas.length ?? 0) + 1}`;
    // Inicializa todas las posturas a 3 (neutro)
    const scores: Record<string, number> = {};
    partidos.forEach((p) => (scores[p.id] = 3));
    setEditing({ ...empty, id: nextId, orden: nextOrden, scores });
    setIsNew(true);
    setOpen(true);
  };

  const openEdit = (q: Pregunta) => {
    // Asegura clave para cada partido activo
    const scores = { ...q.scores };
    partidos.forEach((p) => {
      if (scores[p.id] == null) scores[p.id] = 3;
    });
    setEditing({ ...q, scores });
    setIsNew(false);
    setOpen(true);
  };

  const save = async () => {
    if (!editing.id.trim() || !editing.texto.trim() || !editing.categoria.trim()) {
      toast.error("ID, categoría y texto son obligatorios");
      return;
    }
    const payload = {
      id: editing.id.trim(),
      categoria: editing.categoria.trim(),
      texto: editing.texto.trim(),
      scores: editing.scores,
      orden: Number(editing.orden),
      activa: editing.activa,
    };
    const { error } = await supabase.from("radar_preguntas").upsert(payload);
    if (error) return toast.error(error.message);
    toast.success("Pregunta guardada");
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm(`¿Eliminar pregunta ${id}?`)) return;
    const { error } = await supabase.from("radar_preguntas").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminada");
    load();
  };

  const setScore = (partidoId: string, value: number) => {
    setEditing((e) => ({ ...e, scores: { ...e.scores, [partidoId]: value } }));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Radar Político — Preguntas</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Edita el enunciado, la categoría y la postura de cada partido (1 = totalmente en desacuerdo, 5 = totalmente de acuerdo).
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" /> Nueva pregunta
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead className="w-40">Categoría</TableHead>
                  <TableHead>Pregunta</TableHead>
                  {partidos.map((p) => (
                    <TableHead key={p.id} className="text-center">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs font-bold text-white"
                        style={{ backgroundColor: p.color }}
                      >
                        {p.id}
                      </span>
                    </TableHead>
                  ))}
                  <TableHead className="w-16 text-center">Orden</TableHead>
                  <TableHead className="w-16 text-center">Activa</TableHead>
                  <TableHead className="w-24 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preguntas.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-mono text-xs">{q.id}</TableCell>
                    <TableCell className="text-xs">{q.categoria}</TableCell>
                    <TableCell className="text-sm max-w-md">{q.texto}</TableCell>
                    {partidos.map((p) => (
                      <TableCell key={p.id} className="text-center font-mono text-sm">
                        {q.scores?.[p.id] ?? "—"}
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-xs">{q.orden}</TableCell>
                    <TableCell className="text-center">
                      <span className={q.activa ? "text-green-600" : "text-muted-foreground"}>
                        {q.activa ? "Sí" : "No"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(q)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(q.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? "Nueva" : "Editar"} pregunta</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>ID (código)</Label>
                <Input
                  value={editing.id}
                  onChange={(e) => setEditing({ ...editing, id: e.target.value })}
                  placeholder="q37"
                  disabled={!isNew}
                />
              </div>
              <div>
                <Label>Categoría</Label>
                <Input
                  value={editing.categoria}
                  onChange={(e) => setEditing({ ...editing, categoria: e.target.value })}
                  placeholder="Economía, Vivienda…"
                />
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
              <Label>Enunciado</Label>
              <Textarea
                value={editing.texto}
                onChange={(e) => setEditing({ ...editing, texto: e.target.value })}
                rows={3}
                placeholder="Redáctala como afirmación en positivo…"
              />
            </div>

            <div>
              <Label className="mb-2 block">Postura de cada partido</Label>
              <div className="space-y-2">
                {partidos.map((p) => {
                  const val = editing.scores[p.id] ?? 3;
                  return (
                    <div key={p.id} className="flex items-center gap-3">
                      <div className="w-28 flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="text-sm font-semibold">{p.nombre}</span>
                      </div>
                      <div className="flex gap-1 flex-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setScore(p.id, n)}
                            className={`flex-1 py-1.5 rounded text-xs font-semibold border transition-colors ${
                              val === n
                                ? "text-white border-transparent"
                                : "bg-background hover:bg-muted border-input text-muted-foreground"
                            }`}
                            style={val === n ? { backgroundColor: p.color } : {}}
                            title={SCALE_LABEL[n]}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground w-48 text-right">
                        {SCALE_LABEL[val]}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                1 = Totalmente en desacuerdo · 3 = Neutro · 5 = Totalmente de acuerdo
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Switch
                checked={editing.activa}
                onCheckedChange={(v) => setEditing({ ...editing, activa: v })}
              />
              <Label>Activa (se muestra en el test)</Label>
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
