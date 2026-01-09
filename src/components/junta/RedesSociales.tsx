import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff, Lock, Share2, ExternalLink, Copy } from "lucide-react";

interface RedSocial {
  id: string;
  nombre: string;
  url: string | null;
  usuario: string;
  contrasena: string;
  notas: string | null;
  created_at: string;
}

export function RedesSociales() {
  const [redes, setRedes] = useState<RedSocial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRed, setEditingRed] = useState<RedSocial | null>(null);
  
  // Form state
  const [nombre, setNombre] = useState("");
  const [url, setUrl] = useState("");
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [notas, setNotas] = useState("");
  
  // Password visibility state
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [pendingPasswordView, setPendingPasswordView] = useState<string | null>(null);
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchRedes();
  }, []);

  const fetchRedes = async () => {
    try {
      const { data, error } = await supabase
        .from("redes_sociales")
        .select("*")
        .order("nombre");
      
      if (error) throw error;
      setRedes(data || []);
    } catch (error) {
      console.error("Error fetching redes sociales:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las redes sociales",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNombre("");
    setUrl("");
    setUsuario("");
    setContrasena("");
    setNotas("");
    setEditingRed(null);
  };

  const openEditDialog = (red: RedSocial) => {
    setEditingRed(red);
    setNombre(red.nombre);
    setUrl(red.url || "");
    setUsuario(red.usuario);
    setContrasena(red.contrasena);
    setNotas(red.notas || "");
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        nombre,
        url: url || null,
        usuario,
        contrasena,
        notas: notas || null,
      };

      if (editingRed) {
        const { error } = await supabase
          .from("redes_sociales")
          .update(data)
          .eq("id", editingRed.id);
        
        if (error) throw error;
        toast({ title: "Red social actualizada correctamente" });
      } else {
        const { error } = await supabase
          .from("redes_sociales")
          .insert(data);
        
        if (error) throw error;
        toast({ title: "Red social añadida correctamente" });
      }

      setDialogOpen(false);
      resetForm();
      fetchRedes();
    } catch (error) {
      console.error("Error saving red social:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la red social",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta red social?")) return;

    try {
      const { error } = await supabase
        .from("redes_sociales")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      toast({ title: "Red social eliminada" });
      fetchRedes();
    } catch (error) {
      console.error("Error deleting red social:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la red social",
      });
    }
  };

  const requestPasswordView = (id: string) => {
    setPendingPasswordView(id);
    setAuthPassword("");
    setAuthDialogOpen(true);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
      // Get current user email
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("No user found");

      // Try to sign in with the provided password to verify
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: authPassword,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Contraseña incorrecta",
          description: "La contraseña introducida no es correcta",
        });
        return;
      }

      // Password verified - show the password
      if (pendingPasswordView) {
        setVisiblePasswords(prev => new Set(prev).add(pendingPasswordView));
        // Auto-hide after 30 seconds
        setTimeout(() => {
          setVisiblePasswords(prev => {
            const next = new Set(prev);
            next.delete(pendingPasswordView);
            return next;
          });
        }, 30000);
      }

      setAuthDialogOpen(false);
      setAuthPassword("");
      setPendingPasswordView(null);
      toast({ title: "Contraseña visible durante 30 segundos" });
    } catch (error) {
      console.error("Error verifying password:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo verificar la contraseña",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const hidePassword = (id: string) => {
    setVisiblePasswords(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copiado al portapapeles` });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Redes Sociales
              </CardTitle>
              <CardDescription>
                Credenciales de acceso a las redes sociales de la asociación
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Red Social
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingRed ? "Editar Red Social" : "Nueva Red Social"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre de la red *</Label>
                    <Input
                      id="nombre"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej: Twitter, Instagram, Facebook..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="url">URL del perfil</Label>
                    <Input
                      id="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://twitter.com/usuario"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="usuario">Usuario / Email de acceso *</Label>
                    <Input
                      id="usuario"
                      value={usuario}
                      onChange={(e) => setUsuario(e.target.value)}
                      placeholder="Usuario o email de login"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contrasena">Contraseña *</Label>
                    <Input
                      id="contrasena"
                      type="password"
                      value={contrasena}
                      onChange={(e) => setContrasena(e.target.value)}
                      placeholder="Contraseña de la cuenta"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notas">Notas</Label>
                    <Textarea
                      id="notas"
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      placeholder="Información adicional..."
                      rows={3}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={saving}>
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {editingRed ? "Guardar cambios" : "Añadir"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {redes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Share2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay redes sociales registradas</p>
              <p className="text-sm">Añade las credenciales de las redes sociales de la asociación</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Red Social</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Contraseña</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {redes.map((red) => (
                    <TableRow key={red.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{red.nombre}</span>
                          {red.url && (
                            <a
                              href={red.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{red.usuario}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => copyToClipboard(red.usuario, "Usuario")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {visiblePasswords.has(red.id) ? (
                            <>
                              <span className="font-mono text-sm">{red.contrasena}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => copyToClipboard(red.contrasena, "Contraseña")}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => hidePassword(red.id)}
                              >
                                <EyeOff className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <span className="font-mono text-sm text-muted-foreground">••••••••</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => requestPasswordView(red.id)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {red.notas || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(red)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(red.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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

      {/* Auth Dialog for viewing passwords */}
      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Verificar identidad
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Por seguridad, introduce tu contraseña de socio para ver la contraseña de esta red social.
            </p>
            <div className="space-y-2">
              <Label htmlFor="auth-password">Tu contraseña</Label>
              <Input
                id="auth-password"
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Introduce tu contraseña"
                required
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAuthDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={authLoading}>
                {authLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Verificar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
