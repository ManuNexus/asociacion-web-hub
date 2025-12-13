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
import { Loader2, Pencil, Search, Trash2, UserX, Shield, Hash, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Socio {
  id: string;
  user_id: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string | null;
  activo: boolean;
  tipo_cuota: string;
  tipo_pago: string;
  fecha_alta: string;
  numero_socio: string | null;
  al_corriente_pago: boolean;
  iban: string | null;
  titular_cuenta: string | null;
  dia_cobro: number | null;
  foto_url: string | null;
}

interface SocioWithJunta extends Socio {
  es_junta: boolean;
}

export const AdminSocios = () => {
  const [socios, setSocios] = useState<SocioWithJunta[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bajaDialogOpen, setBajaDialogOpen] = useState(false);
  const [editingSocio, setEditingSocio] = useState<SocioWithJunta | null>(null);
  const [socioToDelete, setSocioToDelete] = useState<SocioWithJunta | null>(null);
  const [socioToBaja, setSocioToBaja] = useState<SocioWithJunta | null>(null);
  const [numeroSocio, setNumeroSocio] = useState("");
  const [tipoPago, setTipoPago] = useState("mensual");
  const [activo, setActivo] = useState(true);
  const [alCorrientePago, setAlCorrientePago] = useState(true);
  const [esJunta, setEsJunta] = useState(false);
  const [iban, setIban] = useState("");
  const [titularCuenta, setTitularCuenta] = useState("");
  const [diaCobro, setDiaCobro] = useState<number>(1);
  const [fotoUrl, setFotoUrl] = useState("");
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
      // Fetch junta roles for all socios
      const userIds = data.map(s => s.user_id);
      const { data: juntaRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "junta")
        .in("user_id", userIds);

      const juntaUserIds = new Set(juntaRoles?.map(r => r.user_id) || []);
      
      const sociosWithJunta: SocioWithJunta[] = data.map(s => ({
        ...s,
        es_junta: juntaUserIds.has(s.user_id)
      }));
      
      setSocios(sociosWithJunta);
    }
    setLoading(false);
  };

  const openEditDialog = (socio: SocioWithJunta) => {
    setEditingSocio(socio);
    setNumeroSocio(socio.numero_socio || "");
    setTipoPago(socio.tipo_pago || "mensual");
    setActivo(socio.activo);
    setAlCorrientePago(socio.al_corriente_pago);
    setEsJunta(socio.es_junta);
    setIban(socio.iban || "");
    setTitularCuenta(socio.titular_cuenta || "");
    setDiaCobro(socio.dia_cobro || 1);
    setFotoUrl(socio.foto_url || "");
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
        tipo_pago: tipoPago,
        activo: activo,
        al_corriente_pago: alCorrientePago,
        iban: iban || null,
        titular_cuenta: titularCuenta || null,
        dia_cobro: diaCobro,
        foto_url: fotoUrl || null
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

    // Handle junta role change
    const wasJunta = editingSocio.es_junta;
    if (esJunta && !wasJunta) {
      // Add junta role
      await supabase.from("user_roles").insert({
        user_id: editingSocio.user_id,
        role: "junta" as any
      });
    } else if (!esJunta && wasJunta) {
      // Remove junta role
      await supabase.from("user_roles")
        .delete()
        .eq("user_id", editingSocio.user_id)
        .eq("role", "junta");
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

  const openBajaDialog = (socio: SocioWithJunta) => {
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

  const openDeleteDialog = (socio: SocioWithJunta) => {
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

  const getNextNumeroSocio = () => {
    const existingNumbers = socios
      .map(s => s.numero_socio)
      .filter(n => n && /^\d+$/.test(n))
      .map(n => parseInt(n!, 10));
    
    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    return String(maxNumber + 1).padStart(6, '0');
  };

  const sociosSinNumero = socios.filter(s => !s.numero_socio && s.activo);

  const handleAutoAssignNumbers = async () => {
    if (sociosSinNumero.length === 0) {
      toast({ title: "Todos los socios activos tienen número asignado" });
      return;
    }

    setSaving(true);
    let nextNumber = parseInt(getNextNumeroSocio(), 10);

    for (const socio of sociosSinNumero) {
      const numeroSocio = String(nextNumber).padStart(6, '0');
      await supabase
        .from("socios")
        .update({ numero_socio: numeroSocio })
        .eq("id", socio.id);
      nextNumber++;
    }

    toast({ 
      title: `${sociosSinNumero.length} número(s) de socio asignados`,
      description: "Los socios activos sin número han recibido uno automáticamente"
    });
    fetchSocios();
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Gestión de Socios</CardTitle>
          {sociosSinNumero.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAutoAssignNumbers}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Hash className="mr-2 h-4 w-4" />
              )}
              Asignar números ({sociosSinNumero.length})
            </Button>
          )}
        </div>
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
                  <TableHead>Rol</TableHead>
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
                      {socio.es_junta ? (
                        <Badge variant="outline" className="border-primary text-primary">
                          <Shield className="h-3 w-3 mr-1" />
                          Junta
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Socio</Badge>
                      )}
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Socio</DialogTitle>
          </DialogHeader>
          {editingSocio && (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-1">
                <p className="font-medium">{editingSocio.nombre} {editingSocio.apellidos}</p>
                <p className="text-sm text-muted-foreground">{editingSocio.email}</p>
                {editingSocio.telefono && (
                  <p className="text-sm text-muted-foreground">Tel: {editingSocio.telefono}</p>
                )}
              </div>
              
              {/* Datos bancarios editables */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 space-y-3">
                <p className="font-medium text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Datos Bancarios para Domiciliación
                </p>
                <div className="space-y-2">
                  <Label htmlFor="iban">IBAN</Label>
                  <Input
                    id="iban"
                    value={iban}
                    onChange={(e) => setIban(e.target.value.toUpperCase())}
                    placeholder="ES00 0000 0000 0000 0000 0000"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="titular_cuenta">Titular de la cuenta</Label>
                  <Input
                    id="titular_cuenta"
                    value={titularCuenta}
                    onChange={(e) => setTitularCuenta(e.target.value)}
                    placeholder="Nombre del titular"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="foto_url">Foto del Socio (URL)</Label>
                <Input
                  id="foto_url"
                  value={fotoUrl}
                  onChange={(e) => setFotoUrl(e.target.value)}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground">
                  URL de la foto del socio para el carnet digital
                </p>
                {fotoUrl && (
                  <div className="mt-2">
                    <img 
                      src={fotoUrl} 
                      alt="Vista previa" 
                      className="w-20 h-20 object-cover rounded-lg border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo_pago">Tipo de Pago</Label>
                  <Select value={tipoPago} onValueChange={setTipoPago}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensual">Mensual (5€/mes)</SelectItem>
                      <SelectItem value="anual">Anual (50€/año)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dia_cobro">Día de Cobro</Label>
                  <Select value={diaCobro.toString()} onValueChange={(v) => setDiaCobro(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          Día {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <div>
                    <Label htmlFor="es_junta">Miembro de la Junta</Label>
                    <p className="text-xs text-muted-foreground">
                      Acceso a contenido exclusivo de la junta directiva
                    </p>
                  </div>
                </div>
                <Switch
                  id="es_junta"
                  checked={esJunta}
                  onCheckedChange={setEsJunta}
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
