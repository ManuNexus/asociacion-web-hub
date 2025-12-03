import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogDescription,
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Pencil, Search, Trash2, UserX } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Socio {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  activo: boolean;
  tipo_cuota: string;
  fecha_alta: string;
  numero_socio: string | null;
  al_corriente_pago: boolean;
}

export const AdminSocios = () => {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bajaDialogOpen, setBajaDialogOpen] = useState(false);
  const [editingSocio, setEditingSocio] = useState<Socio | null>(null);
  const [socioToDelete, setSocioToDelete] = useState<Socio | null>(null);
  const [socioToBaja, setSocioToBaja] = useState<Socio | null>(null);
  const [numeroSocio, setNumeroSocio] = useState("");
  const [tipoCuota, setTipoCuota] = useState("normal");
  const [activo, setActivo] = useState(true);
  const [alCorrientePago, setAlCorrientePago] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchSocios();
  }, []);

  const fetchSocios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("socios")
      .select("*")
      .order("apellidos");

    if (!error && data) {
      setSocios(data);
    }
    setLoading(false);
  };

  const openEditDialog = (socio: Socio) => {
    setEditingSocio(socio);
    setNumeroSocio(socio.numero_socio || "");
    setTipoCuota(socio.tipo_cuota || "normal");
    setActivo(socio.activo);
    setAlCorrientePago(socio.al_corriente_pago);
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSocio) return;

    // Check if we're deactivating
    const wasActive = editingSocio.activo;
    const isBeingDeactivated = wasActive && !activo;

    setSaving(true);
    const { error } = await supabase
      .from("socios")
      .update({ 
        numero_socio: numeroSocio || null,
        tipo_cuota: tipoCuota,
        activo: activo,
        al_corriente_pago: alCorrientePago
      })
      .eq("id", editingSocio.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el socio",
      });
      setSaving(false);
      return;
    }

    // If being deactivated, send baja email
    if (isBeingDeactivated) {
      await sendBajaEmail(editingSocio, false);
    }

    toast({ title: "Socio actualizado correctamente" });
    setDialogOpen(false);
    fetchSocios();
    setSaving(false);
  };

  const sendBajaEmail = async (socio: Socio, eliminarDatos: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No hay sesión activa");
      }

      const response = await supabase.functions.invoke("baja-socio", {
        body: {
          socio_id: socio.id,
          email: socio.email,
          nombre: socio.nombre,
          apellidos: socio.apellidos,
          eliminar_datos: eliminarDatos,
        },
      });

      if (response.error) {
        console.error("Error sending baja email:", response.error);
        toast({
          variant: "destructive",
          title: "Aviso",
          description: "Socio procesado pero no se pudo enviar el correo",
        });
      } else {
        toast({ 
          title: eliminarDatos 
            ? "Datos eliminados y correo enviado" 
            : "Baja procesada y correo enviado" 
        });
      }
    } catch (error) {
      console.error("Error in sendBajaEmail:", error);
    }
  };

  const openBajaDialog = (socio: Socio) => {
    setSocioToBaja(socio);
    setBajaDialogOpen(true);
  };

  const handleBaja = async () => {
    if (!socioToBaja) return;
    
    setSaving(true);
    await supabase
      .from("socios")
      .update({ activo: false })
      .eq("id", socioToBaja.id);
    
    await sendBajaEmail(socioToBaja, false);
    setBajaDialogOpen(false);
    setSocioToBaja(null);
    fetchSocios();
    setSaving(false);
  };

  const openDeleteDialog = (socio: Socio) => {
    setSocioToDelete(socio);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!socioToDelete) return;
    
    setSaving(true);
    await sendBajaEmail(socioToDelete, true);
    setDeleteDialogOpen(false);
    setSocioToDelete(null);
    fetchSocios();
    setSaving(false);
  };

  const filteredSocios = socios.filter(
    (s) =>
      s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.numero_socio?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Socios</CardTitle>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o número..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredSocios.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No hay socios registrados
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Socio</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cuota</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Alta</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSocios.map((socio) => (
                  <TableRow key={socio.id}>
                    <TableCell>
                      {socio.numero_socio ? (
                        <Badge variant="outline" className="font-mono">
                          {socio.numero_socio}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sin asignar</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {socio.nombre} {socio.apellidos}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {socio.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {socio.tipo_cuota === "reducida" ? "Reducida" : "Normal"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={socio.al_corriente_pago ? "default" : "destructive"}
                        className={socio.al_corriente_pago ? "bg-green-600" : ""}
                      >
                        {socio.al_corriente_pago ? "Al día" : "Pendiente"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={socio.activo ? "default" : "destructive"}
                        className={socio.activo ? "bg-green-500" : ""}
                      >
                        {socio.activo ? "Activo" : "Baja"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(socio.fecha_alta), "dd/MM/yyyy", {
                        locale: es,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(socio)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {socio.activo && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openBajaDialog(socio)}
                            title="Dar de baja"
                            className="text-orange-500 hover:text-orange-600"
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(socio)}
                          title="Eliminar datos"
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

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Socio</DialogTitle>
          </DialogHeader>
          {editingSocio && (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{editingSocio.nombre} {editingSocio.apellidos}</p>
                <p className="text-sm text-muted-foreground">{editingSocio.email}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero_socio">Número de Socio</Label>
                <Input
                  id="numero_socio"
                  value={numeroSocio}
                  onChange={(e) => setNumeroSocio(e.target.value)}
                  placeholder="Ej: 001, AHORA-001..."
                />
                <p className="text-xs text-muted-foreground">
                  Este número aparecerá en el carnet digital del socio
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo_cuota">Tipo de Membresía</Label>
                <Select value={tipoCuota} onValueChange={setTipoCuota}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal (5€/mes)</SelectItem>
                    <SelectItem value="reducida">Reducida (2,50€/mes)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Cuota reducida para estudiantes y desempleados
                </p>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label htmlFor="al_corriente_pago">Al corriente de pago</Label>
                  <p className="text-xs text-muted-foreground">
                    Indica si el socio tiene los pagos al día
                  </p>
                </div>
                <Switch
                  id="al_corriente_pago"
                  checked={alCorrientePago}
                  onCheckedChange={setAlCorrientePago}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label htmlFor="activo">Socio activo</Label>
                  <p className="text-xs text-muted-foreground">
                    Desactiva para dar de baja al socio
                  </p>
                </div>
                <Switch
                  id="activo"
                  checked={activo}
                  onCheckedChange={setActivo}
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
                  Guardar
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Baja Dialog */}
      <AlertDialog open={bajaDialogOpen} onOpenChange={setBajaDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Dar de baja a este socio?</AlertDialogTitle>
            <AlertDialogDescription>
              {socioToBaja && (
                <>
                  <strong>{socioToBaja.nombre} {socioToBaja.apellidos}</strong> perderá acceso al área de socios.
                  Se le enviará un correo informándole de la baja.
                  <br /><br />
                  Los datos del socio se conservarán en el sistema. Para eliminar los datos completamente, usa el botón de eliminar.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBaja}
              disabled={saving}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Dar de baja
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar datos del socio?</AlertDialogTitle>
            <AlertDialogDescription>
              {socioToDelete && (
                <>
                  Esta acción <strong>eliminará permanentemente</strong> todos los datos de{" "}
                  <strong>{socioToDelete.nombre} {socioToDelete.apellidos}</strong>, incluyendo su cuenta de usuario.
                  <br /><br />
                  Se enviará un correo confirmando la eliminación de datos conforme al RGPD.
                  <br /><br />
                  <span className="text-destructive font-medium">Esta acción no se puede deshacer.</span>
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
              Eliminar datos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
