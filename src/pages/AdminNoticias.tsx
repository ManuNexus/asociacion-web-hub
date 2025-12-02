import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Loader2, LogOut, Users, Newspaper, Mail, Phone, Eye } from "lucide-react";
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

interface SolicitudSocio {
  id: string;
  nombre: string;
  apellidos: string;
  dni: string;
  email: string;
  telefono: string | null;
  direccion: string | null;
  codigo_postal: string | null;
  ciudad: string | null;
  provincia: string | null;
  motivacion: string | null;
  estado: string;
  created_at: string;
}

const AdminNoticias = () => {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudSocio[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [solicitudDialogOpen, setSolicitudDialogOpen] = useState(false);
  const [editingNoticia, setEditingNoticia] = useState<Noticia | null>(null);
  const [viewingSolicitud, setViewingSolicitud] = useState<SolicitudSocio | null>(null);
  
  const [formData, setFormData] = useState({
    titulo: "",
    extracto: "",
    contenido: "",
    imagen_url: "",
    publicada: false,
  });

  const { user, isAdmin, loading: authLoading, adminLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !adminLoading) {
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
  }, [user, isAdmin, authLoading, adminLoading, navigate, toast]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchNoticias();
      fetchSolicitudes();
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

  const fetchSolicitudes = async () => {
    setLoadingSolicitudes(true);
    const { data, error } = await supabase
      .from("solicitudes_socio")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching solicitudes:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las solicitudes",
      });
    } else {
      setSolicitudes(data || []);
    }
    setLoadingSolicitudes(false);
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

  const handleDeleteNoticia = async (id: string) => {
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

  const handleDeleteSolicitud = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta solicitud?")) return;

    const { error } = await supabase.from("solicitudes_socio").delete().eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la solicitud",
      });
    } else {
      toast({ title: "Solicitud eliminada" });
      fetchSolicitudes();
    }
  };

  const handleUpdateEstado = async (id: string, estado: string) => {
    const { error } = await supabase
      .from("solicitudes_socio")
      .update({ estado })
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el estado",
      });
    } else {
      toast({ title: "Estado actualizado" });
      fetchSolicitudes();
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

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendiente</Badge>;
      case "contactado":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Contactado</Badge>;
      case "aceptado":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Aceptado</Badge>;
      case "rechazado":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Rechazado</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  if (authLoading || adminLoading || (!isAdmin && user)) {
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
                Panel de Administración
              </h1>
              <p className="text-primary-foreground/80 mt-1">
                Gestiona las noticias y solicitudes de AHORA
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
          <Tabs defaultValue="noticias" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger value="noticias" className="flex items-center gap-2">
                <Newspaper className="h-4 w-4" />
                Noticias
              </TabsTrigger>
              <TabsTrigger value="solicitudes" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Solicitudes
                {solicitudes.filter(s => s.estado === "pendiente").length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {solicitudes.filter(s => s.estado === "pendiente").length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Tab Noticias */}
            <TabsContent value="noticias">
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
                                    onClick={() => handleDeleteNoticia(noticia.id)}
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
            </TabsContent>

            {/* Tab Solicitudes */}
            <TabsContent value="solicitudes">
              <Card>
                <CardHeader>
                  <CardTitle>Solicitudes de Socio</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingSolicitudes ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : solicitudes.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No hay solicitudes de socio.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {solicitudes.map((solicitud) => (
                            <TableRow key={solicitud.id}>
                              <TableCell className="font-medium">
                                {solicitud.nombre} {solicitud.apellidos}
                              </TableCell>
                              <TableCell>
                                <a 
                                  href={`mailto:${solicitud.email}`} 
                                  className="text-primary hover:underline flex items-center gap-1"
                                >
                                  <Mail className="h-3 w-3" />
                                  {solicitud.email}
                                </a>
                              </TableCell>
                              <TableCell>
                                {solicitud.telefono ? (
                                  <a 
                                    href={`tel:${solicitud.telefono}`} 
                                    className="text-primary hover:underline flex items-center gap-1"
                                  >
                                    <Phone className="h-3 w-3" />
                                    {solicitud.telefono}
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {getEstadoBadge(solicitud.estado)}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {format(new Date(solicitud.created_at), "dd MMM yyyy", {
                                  locale: es,
                                })}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setViewingSolicitud(solicitud);
                                      setSolicitudDialogOpen(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteSolicitud(solicitud.id)}
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

              {/* Dialog para ver detalle de solicitud */}
              <Dialog open={solicitudDialogOpen} onOpenChange={setSolicitudDialogOpen}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Detalle de Solicitud</DialogTitle>
                  </DialogHeader>
                  {viewingSolicitud && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground text-xs">Nombre</Label>
                          <p className="font-medium">{viewingSolicitud.nombre} {viewingSolicitud.apellidos}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">DNI</Label>
                          <p className="font-medium">{viewingSolicitud.dni}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground text-xs">Email</Label>
                          <a href={`mailto:${viewingSolicitud.email}`} className="text-primary hover:underline block">
                            {viewingSolicitud.email}
                          </a>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">Teléfono</Label>
                          {viewingSolicitud.telefono ? (
                            <a href={`tel:${viewingSolicitud.telefono}`} className="text-primary hover:underline block">
                              {viewingSolicitud.telefono}
                            </a>
                          ) : (
                            <p className="text-muted-foreground">No proporcionado</p>
                          )}
                        </div>
                      </div>
                      {(viewingSolicitud.direccion || viewingSolicitud.ciudad) && (
                        <div>
                          <Label className="text-muted-foreground text-xs">Dirección</Label>
                          <p>
                            {viewingSolicitud.direccion && `${viewingSolicitud.direccion}, `}
                            {viewingSolicitud.codigo_postal && `${viewingSolicitud.codigo_postal} `}
                            {viewingSolicitud.ciudad}
                            {viewingSolicitud.provincia && ` (${viewingSolicitud.provincia})`}
                          </p>
                        </div>
                      )}
                      {viewingSolicitud.motivacion && (
                        <div>
                          <Label className="text-muted-foreground text-xs">Motivación</Label>
                          <p className="text-sm bg-muted p-3 rounded-md">{viewingSolicitud.motivacion}</p>
                        </div>
                      )}
                      <div>
                        <Label className="text-muted-foreground text-xs mb-2 block">Estado</Label>
                        <div className="flex gap-2 flex-wrap">
                          {["pendiente", "contactado", "aceptado", "rechazado"].map((estado) => (
                            <Button
                              key={estado}
                              variant={viewingSolicitud.estado === estado ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                handleUpdateEstado(viewingSolicitud.id, estado);
                                setViewingSolicitud({ ...viewingSolicitud, estado });
                              }}
                            >
                              {estado.charAt(0).toUpperCase() + estado.slice(1)}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
};

export default AdminNoticias;