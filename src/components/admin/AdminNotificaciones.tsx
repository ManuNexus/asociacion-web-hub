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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Loader2, Send, Bell, Shield } from "lucide-react";
import { formatInMadrid } from "@/lib/timezone";

interface Notificacion {
  id: string;
  titulo: string;
  mensaje: string;
  solo_junta: boolean;
  created_at: string;
}

export const AdminNotificaciones = () => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    mensaje: "",
    solo_junta: false,
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchNotificaciones();
  }, []);

  const fetchNotificaciones = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notificaciones")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notificaciones:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las notificaciones",
      });
    } else {
      setNotificaciones(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.mensaje.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El título y mensaje son requeridos",
      });
      return;
    }

    setSaving(true);

    try {
      // Insert notification
      const { data: notificacion, error: insertError } = await supabase
        .from("notificaciones")
        .insert({
          titulo: formData.titulo,
          mensaje: formData.mensaje,
          solo_junta: formData.solo_junta,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Send email notification
      const { error: emailError } = await supabase.functions.invoke("send-notificacion", {
        body: {
          titulo: formData.titulo,
          mensaje: formData.mensaje,
          solo_junta: formData.solo_junta,
        },
      });

      if (emailError) {
        console.error("Error sending email:", emailError);
        toast({
          title: "Notificación creada",
          description: "La notificación se guardó pero hubo un error al enviar los correos",
        });
      } else {
        toast({
          title: "Notificación enviada",
          description: `Se ha enviado la notificación${formData.solo_junta ? " a los miembros de la junta" : " a todos los socios"}`,
        });
      }

      setDialogOpen(false);
      setFormData({ titulo: "", mensaje: "", solo_junta: false });
      fetchNotificaciones();
    } catch (error: any) {
      console.error("Error saving notificacion:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo enviar la notificación",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta notificación?")) return;

    const { error } = await supabase.from("notificaciones").delete().eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la notificación",
      });
    } else {
      toast({ title: "Notificación eliminada" });
      fetchNotificaciones();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Notificaciones</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Notificación
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Enviar Notificación</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) =>
                    setFormData({ ...formData, titulo: e.target.value })
                  }
                  placeholder="Título de la notificación"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mensaje">Mensaje *</Label>
                <Textarea
                  id="mensaje"
                  value={formData.mensaje}
                  onChange={(e) =>
                    setFormData({ ...formData, mensaje: e.target.value })
                  }
                  placeholder="Contenido de la notificación"
                  rows={4}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <Label htmlFor="solo_junta" className="cursor-pointer">
                    Solo para miembros de la Junta
                  </Label>
                </div>
                <Switch
                  id="solo_junta"
                  checked={formData.solo_junta}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, solo_junta: checked })
                  }
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {formData.solo_junta 
                  ? "Esta notificación solo llegará a los miembros de la Junta Directiva."
                  : "Esta notificación llegará a todos los socios activos."}
              </p>
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Notificación
                  </>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : notificaciones.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No hay notificaciones enviadas
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Destinatarios</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="w-[80px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notificaciones.map((notificacion) => (
                <TableRow key={notificacion.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{notificacion.titulo}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {notificacion.mensaje}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {notificacion.solo_junta ? (
                      <Badge variant="outline" className="border-primary text-primary">
                        <Shield className="h-3 w-3 mr-1" />
                        Junta
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Todos los socios</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatInMadrid(notificacion.created_at, "d MMM yyyy, HH:mm")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(notificacion.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
