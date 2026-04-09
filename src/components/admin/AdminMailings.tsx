import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RichTextEditor } from "./RichTextEditor";
import { 
  Loader2, 
  Send, 
  Eye, 
  Image as ImageIcon, 
  Users, 
  UserCheck, 
  X,
  Mail,
  FileText
} from "lucide-react";

interface Destinatario {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  tipo: "socio" | "amigo" | "newsletter";
  cargo_junta?: string | null;
}

interface MailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
}

const TEMPLATES: MailTemplate[] = [
  {
    id: "comunicado",
    name: "Comunicado General",
    subject: "Comunicado de la Junta Directiva",
    content: "<p>Estimado/a socio/a,</p><p><br></p><p>Nos dirigimos a usted para comunicarle...</p><p><br></p><p>Un cordial saludo,</p><p><em>Junta Directiva de AHORA</em></p>",
  },
  {
    id: "evento",
    name: "Invitación a Evento",
    subject: "Te invitamos a nuestro próximo evento",
    content: "<p>Estimado/a socio/a,</p><p><br></p><p>Tenemos el placer de invitarle a nuestro próximo evento:</p><p><br></p><h2>[Nombre del evento]</h2><p><strong>📅 Fecha:</strong> [fecha]</p><p><strong>📍 Lugar:</strong> [ubicación]</p><p><br></p><p>Esperamos contar con su presencia.</p><p><br></p><p>Un cordial saludo,</p><p><em>Junta Directiva de AHORA</em></p>",
  },
  {
    id: "recordatorio",
    name: "Recordatorio",
    subject: "Recordatorio importante",
    content: "<p>Estimado/a socio/a,</p><p><br></p><p>Le recordamos que...</p><p><br></p><p>Un cordial saludo,</p><p><em>Junta Directiva de AHORA</em></p>",
  },
  {
    id: "boletin",
    name: "Boletín Informativo",
    subject: "Boletín de AHORA",
    content: "<h2>Boletín de AHORA</h2><p><br></p><h3>📰 Últimas novedades</h3><p>[Contenido]</p><p><br></p><h3>📅 Próximos eventos</h3><p>[Contenido]</p><p><br></p><p>Un cordial saludo,</p><p><em>Junta Directiva de AHORA</em></p>",
  },
  {
    id: "vacio",
    name: "Plantilla vacía",
    subject: "",
    content: "",
  },
];

const getCargoLabel = (cargo: string | null) => {
  const labels: Record<string, string> = {
    presidente: 'Presidente/a',
    vicepresidente: 'Vicepresidente/a',
    secretario: 'Secretario/a',
    tesorero: 'Tesorero/a',
    vocal: 'Vocal',
  };
  return cargo ? labels[cargo] || cargo : '';
};

export const AdminMailings = () => {
  const [destinatarios, setDestinatarios] = useState<Destinatario[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Form state
  const [asunto, setAsunto] = useState("");
  const [contenido, setContenido] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [selectedDestinatarios, setSelectedDestinatarios] = useState<Set<string>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"todos" | "junta" | "socios" | "amigos">("todos");
  
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDestinatarios();
  }, []);

  const fetchDestinatarios = async () => {
    setLoading(true);
    
    const [sociosRes, amigosRes] = await Promise.all([
      supabase
        .from("socios")
        .select("id, nombre, apellidos, email, cargo_junta")
        .eq("activo", true)
        .order("apellidos"),
      supabase
        .from("amigos")
        .select("id, nombre, apellidos, email")
        .order("apellidos"),
    ]);

    const sociosList: Destinatario[] = (sociosRes.data || []).map(s => ({
      ...s,
      tipo: "socio" as const,
    }));
    
    const amigosList: Destinatario[] = (amigosRes.data || []).map(a => ({
      ...a,
      tipo: "amigo" as const,
      cargo_junta: null,
    }));

    setDestinatarios([...sociosList, ...amigosList]);
    setLoading(false);
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setAsunto(template.subject);
      setContenido(template.content);
    }
  };

  const toggleDestinatario = (id: string) => {
    const newSelected = new Set(selectedDestinatarios);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDestinatarios(newSelected);
  };

  const selectAll = () => {
    const filtered = getFilteredDestinatarios();
    setSelectedDestinatarios(new Set(filtered.map(s => s.id)));
  };

  const selectNone = () => {
    setSelectedDestinatarios(new Set());
  };

  const selectJunta = () => {
    const juntaIds = destinatarios.filter(s => s.cargo_junta).map(s => s.id);
    setSelectedDestinatarios(new Set(juntaIds));
  };

  const selectAmigos = () => {
    const amigoIds = destinatarios.filter(s => s.tipo === "amigo").map(s => s.id);
    setSelectedDestinatarios(new Set(amigoIds));
  };

  const getFilteredDestinatarios = () => {
    return destinatarios.filter(s => {
      const matchesSearch = 
        `${s.nombre} ${s.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = 
        filterType === "todos" ||
        (filterType === "junta" && s.cargo_junta) ||
        (filterType === "socios" && s.tipo === "socio" && !s.cargo_junta) ||
        (filterType === "amigos" && s.tipo === "amigo");
      
      return matchesSearch && matchesFilter;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Solo se permiten archivos de imagen",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "La imagen no puede superar los 2MB",
      });
      return;
    }

    try {
      // Upload to Supabase storage
      const sanitizedName = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileName = `mailing-${Date.now()}-${sanitizedName}`;
      const { data, error } = await supabase.storage
        .from("mailing-images")
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("mailing-images")
        .getPublicUrl(fileName);

      setImagenUrl(urlData.publicUrl);
      toast({ title: "Imagen subida correctamente" });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Error al subir imagen",
        description: error.message,
      });
    } finally {
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = () => {
    setImagenUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const generatePreviewHtml = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { margin: 0; font-size: 28px; letter-spacing: 1px; }
          .header p { margin: 10px 0 0 0; font-size: 14px; letter-spacing: 2px; color: #f1c40f; font-weight: 600; }
          .content { background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; }
          .content h1, .content h2, .content h3 { color: #1e3a5f; }
          .content img { max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background: #f1c40f; color: #1e3a5f !important; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; padding: 20px; }
          .featured-image { width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>AHORA</h1>
            <p>ACTUAR EN EL PRESENTE PARA CONSTRUIR EL FUTURO</p>
          </div>
          <div class="content">
            ${imagenUrl ? `<img src="${imagenUrl}" alt="Imagen destacada" class="featured-image" />` : ""}
            <h2 style="color: #1e3a5f; margin-top: 0;">${asunto || "[Asunto del email]"}</h2>
            ${contenido || "<p>[Contenido del email]</p>"}
            <p style="text-align: center; margin-top: 30px;">
              <a href="https://ahoraorg.es/socios" class="button">Acceder al Panel de Socios</a>
            </p>
          </div>
          <div class="footer">
            <p>AHORA - Actuar en el presente para construir el futuro</p>
            <p style="color: #999;">Este email fue enviado a [email del destinatario]</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleSend = async () => {
    if (!asunto.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El asunto es obligatorio",
      });
      return;
    }

    if (!contenido.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El contenido es obligatorio",
      });
      return;
    }

    if (selectedDestinatarios.size === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Selecciona al menos un destinatario",
      });
      return;
    }

    setSending(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("No hay sesión activa");
      }

      // Get emails of selected destinatarios
      const selectedEmails = destinatarios
        .filter(s => selectedDestinatarios.has(s.id))
        .map(s => s.email);

      const { data, error } = await supabase.functions.invoke("send-mailing", {
        body: {
          asunto,
          contenido,
          imagen_url: imagenUrl || null,
          destinatarios: selectedEmails,
        },
      });

      if (error) throw error;

      toast({
        title: "Mailing enviado",
        description: data.message || `Enviado a ${selectedEmails.length} destinatarios`,
      });

      // Reset form
      setAsunto("");
      setContenido("");
      setImagenUrl("");
      setSelectedDestinatarios(new Set());
      setSelectedTemplate("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al enviar",
        description: error.message,
      });
    } finally {
      setSending(false);
    }
  };

  const filteredDestinatarios = getFilteredDestinatarios();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Panel de destinatarios */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Destinatarios ({selectedDestinatarios.size})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Todos
            </Button>
            <Button variant="outline" size="sm" onClick={selectJunta}>
              Junta
            </Button>
            <Button variant="outline" size="sm" onClick={selectAmigos}>
              Amigos
            </Button>
            <Button variant="outline" size="sm" onClick={selectNone}>
              Ninguno
            </Button>
          </div>
          
          <Input
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <Select value={filterType} onValueChange={(v: "todos" | "junta" | "socios" | "amigos") => setFilterType(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="junta">Solo Junta Directiva</SelectItem>
              <SelectItem value="socios">Solo socios (sin junta)</SelectItem>
              <SelectItem value="amigos">Solo amigos</SelectItem>
            </SelectContent>
          </Select>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <ScrollArea className="h-[400px] border rounded-md p-2">
              <div className="space-y-1">
                {filteredDestinatarios.map((dest) => (
                  <div
                    key={`${dest.tipo}-${dest.id}`}
                    className={`flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-muted transition-colors ${
                      selectedDestinatarios.has(dest.id) ? "bg-primary/10" : ""
                    }`}
                    onClick={() => toggleDestinatario(dest.id)}
                  >
                    <Checkbox
                      checked={selectedDestinatarios.has(dest.id)}
                      onCheckedChange={() => toggleDestinatario(dest.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {dest.nombre} {dest.apellidos}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {dest.email}
                      </p>
                    </div>
                    {dest.cargo_junta ? (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {getCargoLabel(dest.cargo_junta)}
                      </Badge>
                    ) : dest.tipo === "amigo" ? (
                      <Badge variant="outline" className="text-xs shrink-0">
                        Amigo
                      </Badge>
                    ) : null}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Panel de contenido */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5" />
            Composición del Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Plantilla</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar plantilla..." />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATES.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {template.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="asunto">Asunto *</Label>
            <Input
              id="asunto"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              placeholder="Asunto del email"
            />
          </div>

          <div className="space-y-2">
            <Label>Imagen destacada (opcional)</Label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                ref={fileInputRef}
                className="hidden"
                id="image-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Subir imagen
              </Button>
              {imagenUrl && (
                <div className="flex items-center gap-2 flex-1">
                  <img
                    src={imagenUrl}
                    alt="Preview"
                    className="h-10 w-16 object-cover rounded"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={removeImage}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Contenido *</Label>
            <RichTextEditor
              value={contenido}
              onChange={setContenido}
              placeholder="Escribe el contenido del email..."
            />
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setPreviewOpen(true)}
              disabled={!asunto && !contenido}
            >
              <Eye className="h-4 w-4 mr-2" />
              Previsualizar
            </Button>
            
            <Button
              onClick={handleSend}
              disabled={sending || selectedDestinatarios.size === 0 || !asunto || !contenido}
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar a {selectedDestinatarios.size} destinatario{selectedDestinatarios.size !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Vista previa del email</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-gray-100 rounded-lg">
            <iframe
              srcDoc={generatePreviewHtml()}
              className="w-full h-[600px] border-0"
              title="Email Preview"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
