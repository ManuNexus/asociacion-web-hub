import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Loader2, Calendar, MapPin, Shield, Globe, Building2, Send } from "lucide-react";
import { formatInMadrid, toDateTimeLocalValue, fromDateTimeLocalValue, toMadridTime } from "@/lib/timezone";

interface Evento {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha: string;
  ubicacion: string | null;
  solo_junta: boolean;
  publico: boolean;
  organizador: string | null;
}

export const AdminEventos = () => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingNotification, setSendingNotification] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
  
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    fecha: "",
    ubicacion: "",
    solo_junta: false,
    publico: false,
    organizador: "AHORA",
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchEventos();
  }, []);

  const fetchEventos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("eventos")
      .select("*")
      .order("fecha", { ascending: false });

    if (error) {
      console.error("Error fetching eventos:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los eventos",
      });
    } else {
      setEventos(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.fecha) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El título y la fecha son requeridos",
      });
      return;
    }

    setSaving(true);

    try {
      // Convert local Madrid time to UTC for storage
      const fechaUTC = fromDateTimeLocalValue(formData.fecha);
      
      if (editingEvento) {
        const { error } = await supabase
          .from("eventos")
          .update({
            titulo: formData.titulo,
            descripcion: formData.descripcion || null,
            fecha: fechaUTC,
            ubicacion: formData.ubicacion || null,
            solo_junta: formData.publico ? false : formData.solo_junta,
            publico: formData.publico,
            organizador: formData.organizador || "AHORA",
          })
          .eq("id", editingEvento.id);

        if (error) throw error;
        toast({ title: "Evento actualizado" });
      } else {
        const { data: newEvento, error } = await supabase.from("eventos").insert({
          titulo: formData.titulo,
          descripcion: formData.descripcion || null,
          fecha: fechaUTC,
          ubicacion: formData.ubicacion || null,
          solo_junta: formData.publico ? false : formData.solo_junta,
          publico: formData.publico,
          organizador: formData.organizador || "AHORA",
        }).select().single();

        if (error) throw error;
        
        // Send notification to socios
        try {
          const { data: { session } } = await supabase.auth.getSession();
          await supabase.functions.invoke("notify-socios", {
            body: {
              tipo: "evento",
              titulo: formData.titulo,
              descripcion: formData.descripcion || null,
              fecha: formData.fecha,
              ubicacion: formData.ubicacion || null,
              solo_junta: formData.solo_junta,
            },
            headers: session ? {
              Authorization: `Bearer ${session.access_token}`
            } : undefined,
          });
          toast({ title: "Evento creado y notificaciones enviadas" });
        } catch (notifyError) {
          console.error("Error sending notifications:", notifyError);
          toast({ title: "Evento creado (notificaciones fallidas)" });
        }
      }

      setDialogOpen(false);
      resetForm();
      fetchEventos();
    } catch (error: any) {
      console.error("Error saving evento:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo guardar el evento",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este evento?")) return;

    const { error } = await supabase.from("eventos").delete().eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el evento",
      });
    } else {
      toast({ title: "Evento eliminado" });
      fetchEventos();
    }
  };

  const openEditDialog = (evento: Evento) => {
    setEditingEvento(evento);
    setFormData({
      titulo: evento.titulo,
      descripcion: evento.descripcion || "",
      fecha: evento.fecha ? toDateTimeLocalValue(evento.fecha) : "",
      ubicacion: evento.ubicacion || "",
      solo_junta: evento.solo_junta,
      publico: evento.publico,
      organizador: evento.organizador || "AHORA",
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingEvento(null);
    setFormData({
      titulo: "",
      descripcion: "",
      fecha: "",
      ubicacion: "",
      solo_junta: false,
      publico: false,
      organizador: "AHORA",
    });
  };

  const handleResendNotification = async (evento: Evento) => {
    if (!confirm(`¿Reenviar notificación del evento "${evento.titulo}" a los socios?`)) return;
    
    setSendingNotification(evento.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("notify-socios", {
        body: {
          tipo: "evento",
          titulo: evento.titulo,
          descripcion: evento.descripcion || null,
          fecha: evento.fecha,
          ubicacion: evento.ubicacion || null,
          solo_junta: evento.solo_junta,
        },
        headers: session ? {
          Authorization: `Bearer ${session.access_token}`
        } : undefined,
      });
      
      if (error) throw error;
      
      toast({ 
        title: "Notificaciones enviadas",
        description: data?.message || "Las notificaciones se han enviado correctamente"
      });
    } catch (error: any) {
      console.error("Error sending notifications:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron enviar las notificaciones",
      });
    } finally {
      setSendingNotification(null);
    }
  };

  const isPastEvent = (fecha: string) => toMadridTime(fecha) < toMadridTime(new Date());

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Eventos
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingEvento ? "Editar Evento" : "Nuevo Evento"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Título del evento"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción del evento"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha y hora *</Label>
                <Input
                  id="fecha"
                  type="datetime-local"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ubicacion">Ubicación</Label>
                <Input
                  id="ubicacion"
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                  placeholder="Dirección o lugar"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organizador">Organizador</Label>
                <Input
                  id="organizador"
                  value={formData.organizador}
                  onChange={(e) => setFormData({ ...formData, organizador: e.target.value })}
                  placeholder="AHORA, otra asociación..."
                />
                <p className="text-xs text-muted-foreground">
                  Nombre de quien organiza el evento (por defecto AHORA)
                </p>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-green-600" />
                  <div>
                    <Label htmlFor="publico">Evento Público</Label>
                    <p className="text-xs text-muted-foreground">
                      Visible en la web pública para todos
                    </p>
                  </div>
                </div>
                <Switch
                  id="publico"
                  checked={formData.publico}
                  onCheckedChange={(checked) => setFormData({ ...formData, publico: checked, solo_junta: checked ? false : formData.solo_junta })}
                />
              </div>
              {!formData.publico && (
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
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingEvento ? "Guardar" : "Crear"}
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
        ) : eventos.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No hay eventos. Crea el primero.
          </p>
        ) : (
          <div className="space-y-3">
            {eventos.map((evento) => (
              <div key={evento.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{evento.titulo}</h3>
                    {evento.ubicacion && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{evento.ubicacion}</span>
                      </p>
                    )}
                    {evento.organizador && evento.organizador !== "AHORA" && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Building2 className="h-3 w-3 shrink-0" />
                        <span className="truncate">Organiza: {evento.organizador}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleResendNotification(evento)}
                      disabled={sendingNotification === evento.id}
                      title="Reenviar notificación a socios"
                    >
                      {sendingNotification === evento.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 text-blue-500" />
                      )}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(evento)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(evento.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {evento.publico ? (
                    <Badge className="bg-green-600">
                      <Globe className="h-3 w-3 mr-1" />
                      Público
                    </Badge>
                  ) : evento.solo_junta ? (
                    <Badge variant="outline" className="border-primary text-primary">
                      <Shield className="h-3 w-3 mr-1" />
                      Junta
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Socios</Badge>
                  )}
                  {isPastEvent(evento.fecha) ? (
                    <Badge variant="secondary">Pasado</Badge>
                  ) : (
                    <Badge className="bg-green-500">Próximo</Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {formatInMadrid(evento.fecha, "dd/MM/yyyy HH:mm")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
