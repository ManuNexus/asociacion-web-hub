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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Loader2, FileText, ExternalLink, Shield, Folder, FolderPlus, ChevronRight, ArrowLeft } from "lucide-react";
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
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [editingDocumento, setEditingDocumento] = useState<Documento | null>(null);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  
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

  // Get unique folders
  const folders = [...new Set(documentos.map(d => d.categoria).filter(Boolean))] as string[];
  
  // Get documents without folder (root) or in current folder
  const currentDocuments = documentos.filter(d => 
    currentFolder === null 
      ? !d.categoria 
      : d.categoria === currentFolder
  );

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
      const categoriaToSave = formData.categoria || currentFolder || null;
      
      if (editingDocumento) {
        const { error } = await supabase
          .from("documentos_internos")
          .update({
            titulo: formData.titulo,
            descripcion: formData.descripcion || null,
            archivo_url: formData.archivo_url,
            categoria: categoriaToSave,
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
          categoria: categoriaToSave,
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

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El nombre de la carpeta es requerido",
      });
      return;
    }
    
    if (folders.includes(newFolderName.trim())) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ya existe una carpeta con ese nombre",
      });
      return;
    }

    // Navigate to the new folder - documents will be created there
    setCurrentFolder(newFolderName.trim());
    setNewFolderName("");
    setFolderDialogOpen(false);
    toast({ title: "Carpeta creada", description: "Ahora puedes añadir documentos a esta carpeta" });
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
      categoria: currentFolder || "",
      solo_junta: false,
    });
  };

  const getDocumentCountInFolder = (folder: string) => {
    return documentos.filter(d => d.categoria === folder).length;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documentos Internos
        </CardTitle>
        <div className="flex gap-2">
          <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderPlus className="h-4 w-4 mr-2" />
                Nueva Carpeta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Nueva Carpeta</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="folder-name">Nombre de la carpeta</Label>
                  <Input
                    id="folder-name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Ej: Actas, Normativa, Informes..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setFolderDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateFolder}>
                    Crear Carpeta
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}>
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
                  <Label htmlFor="categoria">Carpeta</Label>
                  <Select 
                    value={formData.categoria || "_root"} 
                    onValueChange={(value) => setFormData({ ...formData, categoria: value === "_root" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una carpeta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_root">📁 Raíz (sin carpeta)</SelectItem>
                      {folders.map((folder) => (
                        <SelectItem key={folder} value={folder}>
                          📁 {folder}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Breadcrumb navigation */}
            {currentFolder && (
              <div className="flex items-center gap-2 pb-4 border-b">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setCurrentFolder(null)}
                  className="gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </Button>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  {currentFolder}
                </span>
                <Badge variant="secondary" className="ml-2">
                  {currentDocuments.length} documentos
                </Badge>
              </div>
            )}

            {/* Folders (only show when at root) */}
            {currentFolder === null && folders.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Carpetas</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {folders.map((folder) => (
                    <button
                      key={folder}
                      onClick={() => setCurrentFolder(folder)}
                      className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-left"
                    >
                      <Folder className="h-8 w-8 text-secondary" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{folder}</p>
                        <p className="text-sm text-muted-foreground">
                          {getDocumentCountInFolder(folder)} documentos
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {(currentFolder !== null || currentDocuments.length > 0) && (
              <div className="space-y-2">
                {currentFolder === null && folders.length > 0 && (
                  <p className="text-sm font-medium text-muted-foreground pt-4">Sin carpeta</p>
                )}
                {currentDocuments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {currentFolder 
                      ? "No hay documentos en esta carpeta. Crea el primero."
                      : "No hay documentos sin carpeta."}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {currentDocuments.map((documento) => (
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
              </div>
            )}

            {/* Empty state when no folders and no documents */}
            {currentFolder === null && folders.length === 0 && currentDocuments.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No hay documentos. Crea el primero o crea una carpeta para organizar.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
