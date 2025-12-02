import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
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
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Loader2, LogOut } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Noticia {
  id: string;
  titulo: string;
  extracto: string | null;
  contenido: string | null;
  imagen_url: string | null;
  publicada: boolean;
  fecha_publicacion: string | null;
  created_at: string;
}

const AdminNoticias = () => {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNoticia, setEditingNoticia] = useState<Noticia | null>(null);
  
  const [formData, setFormData] = useState({
    titulo: "",
    extracto: "",
    contenido: "",
    imagen_url: "",
    publicada: false,
  });

  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!isAdmin) {
        toast({
          variant: "destructive",
          title: "Acceso denegado",
          description: "No tienes permisos de administrador",
        });
        navigate("/");
      }
    }
  }, [user, isAdmin, authLoading, navigate, toast]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchNoticias();
    }
  }, [user, isAdmin]);

  const fetchNoticias = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("noticias")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching noticias:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las noticias",
      });
    } else {
      setNoticias(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El título es requerido",
      });
      return;
    }

    setSaving(true);

    try {
      if (editingNoticia) {
        const { error } = await supabase
          .from("noticias")
          .update({
            titulo: formData.titulo,
            extracto: formData.extracto || null,
            contenido: formData.contenido || null,
            imagen_url: formData.imagen_url || null,
            publicada: formData.publicada,
          })
          .eq("id", editingNoticia.id);

        if (error) throw error;
        toast({ title: "Noticia actualizada" });
      } else {
        const { error } = await supabase.from("noticias").insert({
          titulo: formData.titulo,
          extracto: formData.extracto || null,
          contenido: formData.contenido || null,
          imagen_url: formData.imagen_url || null,
          publicada: formData.publicada,
          fecha_publicacion: formData.publicada ? new Date().toISOString() : null,
        });

        if (error) throw error;
        toast({ title: "Noticia creada" });
      }

      setDialogOpen(false);
      resetForm();
      fetchNoticias();
    } catch (error: any) {
      console.error("Error saving noticia:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo guardar la noticia",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta noticia?")) return;

    const { error } = await supabase.from("noticias").delete().eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la noticia",
      });
    } else {
      toast({ title: "Noticia eliminada" });
      fetchNoticias();
    }
  };

  const openEditDialog = (noticia: Noticia) => {
    setEditingNoticia(noticia);
    setFormData({
      titulo: noticia.titulo,
      extracto: noticia.extracto || "",
      contenido: noticia.contenido || "",
      imagen_url: noticia.imagen_url || "",
      publicada: noticia.publicada,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingNoticia(null);
    setFormData({
      titulo: "",
      extracto: "",
      contenido: "",
      imagen_url: "",
      publicada: false,
    });
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || (!isAdmin && user)) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="bg-hero py-12">
        <div className="container">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-primary-foreground">
                Panel de Noticias
              </h1>
              <p className="text-primary-foreground/80 mt-1">
                Gestiona las noticias de AHORA
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="bg-background/10 border-primary-foreground/20 text-primary-foreground hover:bg-background/20">
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Noticias</CardTitle>
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Noticia
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingNoticia ? "Editar Noticia" : "Nueva Noticia"}
                    </DialogTitle>
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
                        placeholder="Título de la noticia"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="extracto">Extracto</Label>
                      <Textarea
                        id="extracto"
                        value={formData.extracto}
                        onChange={(e) =>
                          setFormData({ ...formData, extracto: e.target.value })
                        }
                        placeholder="Breve descripción de la noticia"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contenido">Contenido</Label>
                      <Textarea
                        id="contenido"
                        value={formData.contenido}
                        onChange={(e) =>
                          setFormData({ ...formData, contenido: e.target.value })
                        }
                        placeholder="Contenido completo de la noticia"
                        rows={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imagen_url">URL de Imagen</Label>
                      <Input
                        id="imagen_url"
                        value={formData.imagen_url}
                        onChange={(e) =>
                          setFormData({ ...formData, imagen_url: e.target.value })
                        }
                        placeholder="https://..."
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="publicada"
                        checked={formData.publicada}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, publicada: checked })
                        }
                      />
                      <Label htmlFor="publicada">Publicada</Label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingNoticia ? "Guardar" : "Crear"}
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
              ) : noticias.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay noticias. Crea la primera.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {noticias.map((noticia) => (
                        <TableRow key={noticia.id}>
                          <TableCell className="font-medium max-w-xs truncate">
                            {noticia.titulo}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                noticia.publicada
                                  ? "bg-green-100 text-green-700"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {noticia.publicada ? "Publicada" : "Borrador"}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(noticia.created_at), "dd MMM yyyy", {
                              locale: es,
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(noticia)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(noticia.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default AdminNoticias;
