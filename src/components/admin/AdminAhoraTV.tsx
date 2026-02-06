import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Pencil, Trash2, Tv, Radio, Play, Star } from "lucide-react";
import { formatInMadrid } from "@/lib/timezone";

interface Video {
  id: string;
  titulo: string;
  descripcion: string | null;
  youtube_url: string;
  tipo: string;
  en_directo: boolean;
  activo: boolean;
  destacado: boolean;
  created_at: string;
}

// Extract YouTube video ID from various URL formats
function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function AdminAhoraTV() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    youtube_url: "",
    tipo: "video",
    en_directo: false,
    activo: true,
    destacado: false,
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ahora_tv")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching videos:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los vídeos",
      });
    } else {
      setVideos(data || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      titulo: "",
      descripcion: "",
      youtube_url: "",
      tipo: "video",
      en_directo: false,
      activo: true,
      destacado: false,
    });
    setEditingVideo(null);
  };

  const handleEdit = (video: Video) => {
    setEditingVideo(video);
    setFormData({
      titulo: video.titulo,
      descripcion: video.descripcion || "",
      youtube_url: video.youtube_url,
      tipo: video.tipo,
      en_directo: video.en_directo,
      activo: video.activo,
      destacado: video.destacado,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo.trim() || !formData.youtube_url.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El título y la URL de YouTube son obligatorios",
      });
      return;
    }

    // Validate YouTube URL
    if (!getYouTubeVideoId(formData.youtube_url)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "La URL de YouTube no es válida",
      });
      return;
    }

    setSaving(true);

    try {
      if (editingVideo) {
        const { error } = await supabase
          .from("ahora_tv")
          .update({
            titulo: formData.titulo.trim(),
            descripcion: formData.descripcion.trim() || null,
            youtube_url: formData.youtube_url.trim(),
            tipo: formData.tipo,
            en_directo: formData.en_directo,
            activo: formData.activo,
            destacado: formData.destacado,
          })
          .eq("id", editingVideo.id);

        if (error) throw error;
        toast({ title: "Contenido actualizado" });
      } else {
        const { error } = await supabase
          .from("ahora_tv")
          .insert({
            titulo: formData.titulo.trim(),
            descripcion: formData.descripcion.trim() || null,
            youtube_url: formData.youtube_url.trim(),
            tipo: formData.tipo,
            en_directo: formData.en_directo,
            activo: formData.activo,
            destacado: formData.destacado,
          });

        if (error) throw error;
        toast({ title: "Contenido añadido" });
      }

      setDialogOpen(false);
      resetForm();
      fetchVideos();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo guardar el contenido",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este contenido?")) return;

    const { error } = await supabase.from("ahora_tv").delete().eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el contenido",
      });
    } else {
      toast({ title: "Contenido eliminado" });
      fetchVideos();
    }
  };

  const handleToggleLive = async (video: Video) => {
    const { error } = await supabase
      .from("ahora_tv")
      .update({ en_directo: !video.en_directo })
      .eq("id", video.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el estado",
      });
    } else {
      fetchVideos();
    }
  };

  const handleToggleActive = async (video: Video) => {
    const { error } = await supabase
      .from("ahora_tv")
      .update({ activo: !video.activo })
      .eq("id", video.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el estado",
      });
    } else {
      fetchVideos();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Tv className="h-5 w-5" />
          AHORA TV
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Añadir contenido
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingVideo ? "Editar contenido" : "Nuevo contenido"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Título del vídeo o emisión"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="youtube_url">URL de YouTube *</Label>
                <Input
                  id="youtube_url"
                  value={formData.youtube_url}
                  onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                {formData.youtube_url && getYouTubeVideoId(formData.youtube_url) && (
                  <div className="mt-2">
                    <img 
                      src={`https://img.youtube.com/vi/${getYouTubeVideoId(formData.youtube_url)}/mqdefault.jpg`}
                      alt="Preview"
                      className="rounded-md w-full max-w-[320px]"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de contenido</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">
                      <div className="flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        Vídeo
                      </div>
                    </SelectItem>
                    <SelectItem value="directo">
                      <div className="flex items-center gap-2">
                        <Radio className="h-4 w-4" />
                        Emisión en directo
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción opcional"
                  rows={3}
                />
              </div>

              <div className="space-y-4 pt-2">
                {formData.tipo === "directo" && (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>En directo ahora</Label>
                      <p className="text-xs text-muted-foreground">
                        Marcar si la emisión está en directo
                      </p>
                    </div>
                    <Switch
                      checked={formData.en_directo}
                      onCheckedChange={(checked) => setFormData({ ...formData, en_directo: checked })}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Destacado</Label>
                    <p className="text-xs text-muted-foreground">
                      Mostrar en posición destacada
                    </p>
                  </div>
                  <Switch
                    checked={formData.destacado}
                    onCheckedChange={(checked) => setFormData({ ...formData, destacado: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Activo</Label>
                    <p className="text-xs text-muted-foreground">
                      Visible para los socios
                    </p>
                  </div>
                  <Switch
                    checked={formData.activo}
                    onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingVideo ? "Guardar cambios" : "Añadir"}
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
        ) : videos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Tv className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay contenido todavía</p>
            <p className="text-sm">Añade vídeos o emisiones en directo para que los socios puedan verlos</p>
          </div>
        ) : (
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Preview</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videos.map((video) => {
                  const videoId = getYouTubeVideoId(video.youtube_url);
                  return (
                    <TableRow key={video.id} className={!video.activo ? "opacity-50" : ""}>
                      <TableCell>
                        {videoId && (
                          <img 
                            src={`https://img.youtube.com/vi/${videoId}/default.jpg`}
                            alt=""
                            className="w-16 h-12 object-cover rounded"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium line-clamp-1">{video.titulo}</span>
                          {video.destacado && (
                            <Star className="h-4 w-4 text-secondary fill-secondary shrink-0" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {video.tipo === "directo" ? (
                          <Badge variant="outline" className="gap-1">
                            <Radio className="h-3 w-3" />
                            Directo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <Play className="h-3 w-3" />
                            Vídeo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {video.tipo === "directo" && video.en_directo && (
                            <Badge className="bg-destructive w-fit gap-1 animate-pulse">
                              <Radio className="h-3 w-3" />
                              EN DIRECTO
                            </Badge>
                          )}
                          {video.activo ? (
                            <Badge variant="outline" className="w-fit text-green-600 border-green-600">
                              Activo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="w-fit text-muted-foreground">
                              Inactivo
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatInMadrid(video.created_at, "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {video.tipo === "directo" && (
                            <Button
                              variant={video.en_directo ? "destructive" : "outline"}
                              size="sm"
                              onClick={() => handleToggleLive(video)}
                              title={video.en_directo ? "Finalizar directo" : "Iniciar directo"}
                            >
                              <Radio className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(video)}
                            title={video.activo ? "Desactivar" : "Activar"}
                          >
                            {video.activo ? "👁" : "👁‍🗨"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(video)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(video.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
