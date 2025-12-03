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
import { Plus, Pencil, Trash2, Loader2, FileText, ExternalLink, Shield } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Documento {
  id: string;
  titulo: string;
  descripcion: string | null;
  archivo_url: string;
  categoria: string | null;
  created_at: string;
  solo_junta: boolean;
}

export const AdminDocumentos = () => {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDocumento, setEditingDocumento] = useState<Documento | null>(null);
  
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    archivo_url: "",
    categoria: "",
    solo_junta: false,
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchDocumentos();
  }, []);

  const fetchDocumentos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("documentos_internos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching documentos:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los documentos",
      });
    } else {
      setDocumentos(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.archivo_url.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El título y la URL del archivo son requeridos",
      });
      return;
    }

    setSaving(true);

    try {
      if (editingDocumento) {
        const { error } = await supabase
          .from("documentos_internos")
          .update({
            titulo: formData.titulo,
            descripcion: formData.descripcion || null,
            archivo_url: formData.archivo_url,
            categoria: formData.categoria || null,
            solo_junta: formData.solo_junta,
          })
          .eq("id", editingDocumento.id);

        if (error) throw error;
        toast({ title: "Documento actualizado" });
      } else {
        const { error } = await supabase.from("documentos_internos").insert({
          titulo: formData.titulo,
          descripcion: formData.descripcion || null,
          archivo_url: formData.archivo_url,
          categoria: formData.categoria || null,
          solo_junta: formData.solo_junta,
        });

        if (error) throw error;
        toast({ title: "Documento creado" });
      }

      setDialogOpen(false);
      resetForm();
      fetchDocumentos();
    } catch (error: any) {
      console.error("Error saving documento:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo guardar el documento",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este documento?")) return;

    const { error } = await supabase.from("documentos_internos").delete().eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el documento",
      });
    } else {
      toast({ title: "Documento eliminado" });
      fetchDocumentos();
    }
  };

  const openEditDialog = (documento: Documento) => {
    setEditingDocumento(documento);
    setFormData({
      titulo: documento.titulo,
      descripcion: documento.descripcion || "",
      archivo_url: documento.archivo_url,
      categoria: documento.categoria || "",
      solo_junta: documento.solo_junta,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingDocumento(null);
    setFormData({
      titulo: "",
      descripcion: "",
      archivo_url: "",
      categoria: "",
      solo_junta: false,
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documentos Internos
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingDocumento ? "Editar Documento" : "Nuevo Documento"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Título del documento"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción del documento"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="archivo_url">URL del archivo *</Label>
                <Input
                  id="archivo_url"
                  value={formData.archivo_url}
                  onChange={(e) => setFormData({ ...formData, archivo_url: e.target.value })}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground">
                  Introduce la URL directa al archivo (PDF, documento, etc.)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoría</Label>
                <Input
                  id="categoria"
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  placeholder="Ej: Actas, Normativa, Informes..."
                />
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
                  {editingDocumento ? "Guardar" : "Crear"}
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
        ) : documentos.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No hay documentos. Crea el primero.
          </p>
        ) : (
          <div className="space-y-3">
            {documentos.map((documento) => (
              <div key={documento.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{documento.titulo}</h3>
                      <a
                        href={documento.archivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 shrink-0"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                    {documento.descripcion && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {documento.descripcion}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(documento)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(documento.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {documento.categoria && (
                    <Badge variant="outline">{documento.categoria}</Badge>
                  )}
                  {documento.solo_junta ? (
                    <Badge variant="outline" className="border-primary text-primary">
                      <Shield className="h-3 w-3 mr-1" />
                      Junta
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Todos</Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(documento.created_at), "dd/MM/yyyy", { locale: es })}
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
