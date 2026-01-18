import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, 
  Plus, 
  Pencil, 
  Search, 
  Trash2, 
  Phone, 
  Mail, 
  Building2,
  MapPin,
  BookUser
} from "lucide-react";

interface MiembroJunta {
  id: string;
  nombre: string;
  apellidos: string;
  cargo_junta: string | null;
}

interface Contacto {
  id: string;
  nombre: string;
  organizacion: string;
  tipo: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  notas: string | null;
  responsable_socio_id: string | null;
  created_at: string;
  responsable?: MiembroJunta | null;
}

const TIPOS_CONTACTO = [
  { value: 'asociacion', label: 'Asociación' },
  { value: 'fundacion', label: 'Fundación' },
  { value: 'organismo_publico', label: 'Organismo Público' },
  { value: 'banco', label: 'Banco' },
  { value: 'gestor', label: 'Gestor/Asesor' },
  { value: 'proveedor', label: 'Proveedor' },
  { value: 'medio_comunicacion', label: 'Medio de Comunicación' },
  { value: 'otro', label: 'Otro' },
];

const getTipoLabel = (tipo: string) => {
  return TIPOS_CONTACTO.find(t => t.value === tipo)?.label || tipo;
};

const getTipoColor = (tipo: string) => {
  const colors: Record<string, string> = {
    asociacion: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    fundacion: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    organismo_publico: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    banco: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    gestor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    proveedor: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    medio_comunicacion: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    otro: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  };
  return colors[tipo] || colors.otro;
};

export const AdminContactos = () => {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [miembrosJunta, setMiembrosJunta] = useState<MiembroJunta[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingContacto, setEditingContacto] = useState<Contacto | null>(null);
  const [contactoToDelete, setContactoToDelete] = useState<Contacto | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  
  // Form state
  const [nombre, setNombre] = useState("");
  const [organizacion, setOrganizacion] = useState("");
  const [tipo, setTipo] = useState("otro");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");
  const [responsableSocioId, setResponsableSocioId] = useState<string>("");
  
  const { toast } = useToast();

  useEffect(() => {
    fetchContactos();
    fetchMiembrosJunta();
  }, []);

  const fetchContactos = async () => {
    setLoading(true);
    
    // Fetch contacts
    const { data: contactosData, error: contactosError } = await supabase
      .from("contactos_directorio")
      .select("*")
      .order("organizacion");

    if (contactosError) {
      setLoading(false);
      return;
    }

    // Fetch junta members using the security definer function
    const { data: juntaData } = await supabase.rpc("get_socios_for_junta");
    
    // Map responsables to contacts
    const juntaMap = new Map<string, MiembroJunta>();
    if (juntaData) {
      for (const socio of juntaData) {
        juntaMap.set(socio.id, {
          id: socio.id,
          nombre: socio.nombre,
          apellidos: socio.apellidos,
          cargo_junta: null, // get_socios_for_junta doesn't return cargo_junta
        });
      }
    }

    // Enrich contacts with responsable data
    const enrichedContactos = (contactosData || []).map((c) => ({
      ...c,
      responsable: c.responsable_socio_id ? juntaMap.get(c.responsable_socio_id) || null : null,
    }));

    setContactos(enrichedContactos as Contacto[]);
    setLoading(false);
  };

  const fetchMiembrosJunta = async () => {
    // Use the security definer function that junta members can access
    const { data, error } = await supabase.rpc("get_socios_for_junta");

    if (!error && data) {
      // Filter to only get junta members (those who would have cargo_junta)
      // Since the function doesn't return cargo_junta, we'll fetch that separately
      const socioIds = data.map((s: { id: string }) => s.id);
      
      // Now get cargo_junta for these socios using admin access or just show all active junta
      // Actually, let's create a simpler approach - just show all socios returned
      setMiembrosJunta(data.map((s: { id: string; nombre: string; apellidos: string }) => ({
        id: s.id,
        nombre: s.nombre,
        apellidos: s.apellidos,
        cargo_junta: null,
      })));
    }
  };

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

  const resetForm = () => {
    setNombre("");
    setOrganizacion("");
    setTipo("otro");
    setEmail("");
    setTelefono("");
    setDireccion("");
    setNotas("");
    setResponsableSocioId("");
    setEditingContacto(null);
  };

  const openNewDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (contacto: Contacto) => {
    setEditingContacto(contacto);
    setNombre(contacto.nombre);
    setOrganizacion(contacto.organizacion);
    setTipo(contacto.tipo);
    setEmail(contacto.email || "");
    setTelefono(contacto.telefono || "");
    setDireccion(contacto.direccion || "");
    setNotas(contacto.notas || "");
    setResponsableSocioId(contacto.responsable_socio_id || "");
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre.trim() || !organizacion.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Nombre y organización son obligatorios",
      });
      return;
    }

    setSaving(true);

    const contactoData = {
      nombre: nombre.trim(),
      organizacion: organizacion.trim(),
      tipo,
      email: email.trim() || null,
      telefono: telefono.trim() || null,
      direccion: direccion.trim() || null,
      notas: notas.trim() || null,
      responsable_socio_id: responsableSocioId || null,
    };

    if (editingContacto) {
      const { error } = await supabase
        .from("contactos_directorio")
        .update(contactoData)
        .eq("id", editingContacto.id);

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo actualizar el contacto",
        });
        setSaving(false);
        return;
      }
      toast({ title: "Contacto actualizado" });
    } else {
      const { error } = await supabase
        .from("contactos_directorio")
        .insert(contactoData);

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo crear el contacto",
        });
        setSaving(false);
        return;
      }
      toast({ title: "Contacto añadido" });
    }

    setDialogOpen(false);
    resetForm();
    fetchContactos();
    setSaving(false);
  };

  const openDeleteDialog = (contacto: Contacto) => {
    setContactoToDelete(contacto);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!contactoToDelete) return;
    
    setSaving(true);
    const { error } = await supabase
      .from("contactos_directorio")
      .delete()
      .eq("id", contactoToDelete.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el contacto",
      });
    } else {
      toast({ title: "Contacto eliminado" });
      fetchContactos();
    }
    
    setDeleteDialogOpen(false);
    setContactoToDelete(null);
    setSaving(false);
  };

  const filteredContactos = contactos.filter((c) => {
    const matchesSearch = 
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.organizacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (c.telefono?.includes(searchTerm) ?? false);
    
    const matchesTipo = filterTipo === "todos" || c.tipo === filterTipo;
    
    return matchesSearch && matchesTipo;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <BookUser className="h-5 w-5" />
            Libreta de Contactos
          </CardTitle>
          <Button onClick={openNewDialog} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Contacto
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, organización, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              {TIPOS_CONTACTO.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredContactos.length === 0 ? (
          <div className="text-center py-12">
            <BookUser className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || filterTipo !== "todos" 
                ? "No se encontraron contactos" 
                : "No hay contactos en la libreta"}
            </p>
            {!searchTerm && filterTipo === "todos" && (
              <Button onClick={openNewDialog} variant="outline" className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Añadir primer contacto
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organización</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContactos.map((contacto) => (
                  <TableRow key={contacto.id}>
                    <TableCell>
                      <span className="font-medium">{contacto.organizacion}</span>
                    </TableCell>
                    <TableCell>{contacto.nombre}</TableCell>
                    <TableCell>
                      <Badge className={getTipoColor(contacto.tipo)}>
                        {getTipoLabel(contacto.tipo)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {contacto.responsable ? (
                        <div className="text-sm">
                          <span className="font-medium">{contacto.responsable.nombre} {contacto.responsable.apellidos}</span>
                          {contacto.responsable.cargo_junta && (
                            <span className="text-muted-foreground text-xs block">
                              {getCargoLabel(contacto.responsable.cargo_junta)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {contacto.telefono ? (
                        <a 
                          href={`tel:${contacto.telefono}`} 
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {contacto.telefono}
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {contacto.email ? (
                        <a 
                          href={`mailto:${contacto.email}`} 
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Mail className="h-3 w-3" />
                          {contacto.email}
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(contacto)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(contacto)}
                          title="Eliminar"
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingContacto ? "Editar Contacto" : "Nuevo Contacto"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="organizacion">Organización *</Label>
                <Input
                  id="organizacion"
                  value={organizacion}
                  onChange={(e) => setOrganizacion(e.target.value)}
                  placeholder="Nombre de la organización"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_CONTACTO.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombre">Persona de contacto *</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre completo"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="+34 600 000 000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@ejemplo.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Dirección completa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="responsable">Miembro de junta responsable</Label>
              <Select value={responsableSocioId} onValueChange={setResponsableSocioId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin asignar</SelectItem>
                  {miembrosJunta.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nombre} {m.apellidos} ({getCargoLabel(m.cargo_junta)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                {editingContacto ? "Guardar" : "Añadir"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este contacto?</AlertDialogTitle>
            <AlertDialogDescription>
              {contactoToDelete && (
                <>
                  Se eliminará el contacto de <strong>{contactoToDelete.nombre}</strong> de{" "}
                  <strong>{contactoToDelete.organizacion}</strong>.
                  <br /><br />
                  Esta acción no se puede deshacer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={saving}
              className="bg-destructive hover:bg-destructive/90"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
