import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Loader2, Vote, X, BarChart3, Shield } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Votacion {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  activa: boolean;
  solo_junta: boolean;
}

interface OpcionVotacion {
  id: string;
  votacion_id: string;
  texto: string;
}

interface VotoCount {
  opcion_id: string;
  count: number;
}

export const AdminVotaciones = () => {
  const [votaciones, setVotaciones] = useState<Votacion[]>([]);
  const [opciones, setOpciones] = useState<OpcionVotacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVotacion, setEditingVotacion] = useState<Votacion | null>(null);
  const [nuevasOpciones, setNuevasOpciones] = useState<string[]>(["", ""]);
  
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    fecha_inicio: "",
    fecha_fin: "",
    activa: true,
    solo_junta: false,
  });
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [selectedVotacionResults, setSelectedVotacionResults] = useState<Votacion | null>(null);
  const [votosCount, setVotosCount] = useState<VotoCount[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchVotaciones();
  }, []);

  const fetchVotaciones = async () => {
    setLoading(true);
    const { data: votacionesData, error: votacionesError } = await supabase
      .from("votaciones")
      .select("*")
      .order("created_at", { ascending: false });

    if (votacionesError) {
      console.error("Error fetching votaciones:", votacionesError);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las votaciones",
      });
    } else {
      setVotaciones(votacionesData || []);
      
      const { data: opcionesData } = await supabase
        .from("opciones_votacion")
        .select("*");
      
      if (opcionesData) {
        setOpciones(opcionesData);
      }
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.fecha_fin) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El título y fecha de fin son requeridos",
      });
      return;
    }

    const opcionesValidas = nuevasOpciones.filter(o => o.trim());
    if (!editingVotacion && opcionesValidas.length < 2) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Se requieren al menos 2 opciones",
      });
      return;
    }

    setSaving(true);

    try {
      if (editingVotacion) {
        const { error } = await supabase
          .from("votaciones")
          .update({
            titulo: formData.titulo,
            descripcion: formData.descripcion || null,
            fecha_inicio: formData.fecha_inicio || new Date().toISOString(),
            fecha_fin: formData.fecha_fin,
            activa: formData.activa,
            solo_junta: formData.solo_junta,
          })
          .eq("id", editingVotacion.id);

        if (error) throw error;
        toast({ title: "Votación actualizada" });
      } else {
        const { data: newVotacion, error } = await supabase
          .from("votaciones")
          .insert({
            titulo: formData.titulo,
            descripcion: formData.descripcion || null,
            fecha_inicio: formData.fecha_inicio || new Date().toISOString(),
            fecha_fin: formData.fecha_fin,
            activa: formData.activa,
            solo_junta: formData.solo_junta,
          })
          .select()
          .single();

        if (error) throw error;

        // Insert options
        const opcionesInsert = opcionesValidas.map(texto => ({
          votacion_id: newVotacion.id,
          texto,
        }));

        const { error: opcionesError } = await supabase
          .from("opciones_votacion")
          .insert(opcionesInsert);

        if (opcionesError) throw opcionesError;
        
        toast({ title: "Votación creada" });
      }

      setDialogOpen(false);
      resetForm();
      fetchVotaciones();
    } catch (error: any) {
      console.error("Error saving votacion:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo guardar la votación",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta votación?")) return;

    // First delete options
    await supabase.from("opciones_votacion").delete().eq("votacion_id", id);
    
    const { error } = await supabase.from("votaciones").delete().eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la votación",
      });
    } else {
      toast({ title: "Votación eliminada" });
      fetchVotaciones();
    }
  };

  const openEditDialog = (votacion: Votacion) => {
    setEditingVotacion(votacion);
    setFormData({
      titulo: votacion.titulo,
      descripcion: votacion.descripcion || "",
      fecha_inicio: votacion.fecha_inicio ? votacion.fecha_inicio.slice(0, 16) : "",
      fecha_fin: votacion.fecha_fin ? votacion.fecha_fin.slice(0, 16) : "",
      activa: votacion.activa,
      solo_junta: votacion.solo_junta,
    });
    setNuevasOpciones(["", ""]);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingVotacion(null);
    setFormData({
      titulo: "",
      descripcion: "",
      fecha_inicio: "",
      fecha_fin: "",
      activa: true,
      solo_junta: false,
    });
    setNuevasOpciones(["", ""]);
  };

  const addOpcion = () => {
    setNuevasOpciones([...nuevasOpciones, ""]);
  };

  const removeOpcion = (index: number) => {
    if (nuevasOpciones.length > 2) {
      setNuevasOpciones(nuevasOpciones.filter((_, i) => i !== index));
    }
  };

  const updateOpcion = (index: number, value: string) => {
    const updated = [...nuevasOpciones];
    updated[index] = value;
    setNuevasOpciones(updated);
  };

  const getVotacionOpciones = (votacionId: string) => {
    return opciones.filter(o => o.votacion_id === votacionId);
  };

  const isVotacionActiva = (votacion: Votacion) => {
    const now = new Date();
    return votacion.activa && 
           new Date(votacion.fecha_inicio) <= now && 
           new Date(votacion.fecha_fin) >= now;
  };

  const openResultsDialog = async (votacion: Votacion) => {
    setSelectedVotacionResults(votacion);
    setResultsDialogOpen(true);
    setLoadingResults(true);

    const { data: votos, error } = await supabase
      .from("votos")
      .select("opcion_id")
      .eq("votacion_id", votacion.id);

    if (error) {
      console.error("Error fetching votes:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los resultados",
      });
    } else {
      // Count votes per option
      const counts: Record<string, number> = {};
      votos?.forEach(v => {
        counts[v.opcion_id] = (counts[v.opcion_id] || 0) + 1;
      });
      
      setVotosCount(
        Object.entries(counts).map(([opcion_id, count]) => ({ opcion_id, count }))
      );
    }
    setLoadingResults(false);
  };

  const getVotoCountForOpcion = (opcionId: string) => {
    return votosCount.find(v => v.opcion_id === opcionId)?.count || 0;
  };

  const getTotalVotos = () => {
    return votosCount.reduce((sum, v) => sum + v.count, 0);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Vote className="h-5 w-5" />
          Votaciones
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Votación
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingVotacion ? "Editar Votación" : "Nueva Votación"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Título de la votación"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción de la votación"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha_inicio">Fecha inicio</Label>
                  <Input
                    id="fecha_inicio"
                    type="datetime-local"
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha_fin">Fecha fin *</Label>
                  <Input
                    id="fecha_fin"
                    type="datetime-local"
                    value={formData.fecha_fin}
                    onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                  />
                </div>
              </div>
              
              {!editingVotacion && (
                <div className="space-y-2">
                  <Label>Opciones de voto *</Label>
                  {nuevasOpciones.map((opcion, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={opcion}
                        onChange={(e) => updateOpcion(index, e.target.value)}
                        placeholder={`Opción ${index + 1}`}
                      />
                      {nuevasOpciones.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOpcion(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addOpcion}>
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir opción
                  </Button>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="activa"
                  checked={formData.activa}
                  onCheckedChange={(checked) => setFormData({ ...formData, activa: checked })}
                />
                <Label htmlFor="activa">Activa</Label>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <div>
                    <Label htmlFor="solo_junta">Solo Junta Directiva</Label>
                    <p className="text-xs text-muted-foreground">
                      Solo visible para miembros de la junta
                    </p>
                  </div>
                </div>
                <Switch
                  id="solo_junta"
                  checked={formData.solo_junta}
                  onCheckedChange={(checked) => setFormData({ ...formData, solo_junta: checked })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingVotacion ? "Guardar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : votaciones.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No hay votaciones. Crea la primera.
          </p>
        ) : (
          <div className="space-y-3">
            {votaciones.map((votacion) => {
              const activa = isVotacionActiva(votacion);
              const opcionesVotacion = getVotacionOpciones(votacion.id);
              
              return (
                <div key={votacion.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{votacion.titulo}</h3>
                      {votacion.descripcion && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {votacion.descripcion}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => openResultsDialog(votacion)} title="Ver resultados">
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(votacion)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(votacion.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {opcionesVotacion.map(o => (
                      <Badge key={o.id} variant="outline" className="text-xs">
                        {o.texto}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {votacion.solo_junta ? (
                      <Badge variant="outline" className="border-primary text-primary">
                        <Shield className="h-3 w-3 mr-1" />
                        Junta
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Todos</Badge>
                    )}
                    {activa ? (
                      <Badge className="bg-green-500">Activa</Badge>
                    ) : new Date(votacion.fecha_fin) < new Date() ? (
                      <Badge variant="secondary">Finalizada</Badge>
                    ) : (
                      <Badge variant="outline">Próximamente</Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      Fin: {format(new Date(votacion.fecha_fin), "dd/MM/yyyy HH:mm", { locale: es })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Results Dialog */}
        <Dialog open={resultsDialogOpen} onOpenChange={setResultsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Resultados: {selectedVotacionResults?.titulo}
              </DialogTitle>
            </DialogHeader>
            {loadingResults ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {selectedVotacionResults && getVotacionOpciones(selectedVotacionResults.id).map(opcion => {
                  const count = getVotoCountForOpcion(opcion.id);
                  const total = getTotalVotos();
                  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                  
                  return (
                    <div key={opcion.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{opcion.texto}</span>
                        <span className="text-muted-foreground">
                          {count} voto{count !== 1 ? "s" : ""} ({percentage}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-3" />
                    </div>
                  );
                })}
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground text-center">
                    Total de votos: <strong>{getTotalVotos()}</strong>
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
