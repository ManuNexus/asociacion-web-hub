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
} from "@/components/ui/dialog";
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
import { Loader2, Pencil, Search } from "lucide-react";
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
  const [editingSocio, setEditingSocio] = useState<Socio | null>(null);
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
    } else {
      toast({ title: "Socio actualizado correctamente" });
      setDialogOpen(false);
      fetchSocios();
    }
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(socio)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

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
    </Card>
  );
};
