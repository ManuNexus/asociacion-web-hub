import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Pencil, Trash2, Search, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Factura, FacturaInsert, Proveedor, ProveedorInsert } from "@/hooks/useContabilidad";

interface FacturasTabProps {
  facturas: Factura[];
  proveedores: Proveedor[];
  onAdd: (factura: Omit<FacturaInsert, "created_by">) => Promise<boolean>;
  onUpdate: (id: string, updates: Partial<FacturaInsert>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onAddProveedor: (proveedor: ProveedorInsert) => Promise<Proveedor | null>;
}

const estadoColors: Record<string, { bg: string; text: string }> = {
  pendiente: { bg: "bg-yellow-100", text: "text-yellow-800" },
  pagada: { bg: "bg-green-100", text: "text-green-800" },
  vencida: { bg: "bg-red-100", text: "text-red-800" },
  cancelada: { bg: "bg-gray-100", text: "text-gray-800" },
};

const estadoLabels: Record<string, string> = {
  pendiente: "Pendiente",
  pagada: "Pagada",
  vencida: "Vencida",
  cancelada: "Cancelada",
};

export const FacturasTab = ({
  facturas,
  proveedores,
  onAdd,
  onUpdate,
  onDelete,
  onAddProveedor,
}: FacturasTabProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<"todas" | "emitida" | "recibida">("todas");
  const [filterEstado, setFilterEstado] = useState<string>("todos");

  // Form fields
  const [numero, setNumero] = useState("");
  const [tipo, setTipo] = useState<"emitida" | "recibida">("recibida");
  const [concepto, setConcepto] = useState("");
  const [importeBase, setImporteBase] = useState("");
  const [ivaPorcentaje, setIvaPorcentaje] = useState("21");
  const [fechaEmision, setFechaEmision] = useState(format(new Date(), "yyyy-MM-dd"));
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [estado, setEstado] = useState<"pendiente" | "pagada" | "vencida" | "cancelada">("pendiente");
  const [terceroNombre, setTerceroNombre] = useState("");
  const [terceroNif, setTerceroNif] = useState("");
  const [terceroDireccion, setTerceroDireccion] = useState("");
  const [notas, setNotas] = useState("");
  const [proveedorId, setProveedorId] = useState<string | null>(null);

  const resetForm = () => {
    setNumero("");
    setTipo("recibida");
    setConcepto("");
    setImporteBase("");
    setIvaPorcentaje("21");
    setFechaEmision(format(new Date(), "yyyy-MM-dd"));
    setFechaVencimiento("");
    setEstado("pendiente");
    setTerceroNombre("");
    setTerceroNif("");
    setTerceroDireccion("");
    setNotas("");
    setProveedorId(null);
    setEditingId(null);
  };

  const openNewDialog = () => {
    resetForm();
    // Generate next invoice number
    const year = new Date().getFullYear();
    const lastNumber = facturas
      .filter(f => f.numero.startsWith(`${year}-`))
      .map(f => parseInt(f.numero.split("-")[1]) || 0)
      .reduce((max, n) => Math.max(max, n), 0);
    setNumero(`${year}-${String(lastNumber + 1).padStart(4, "0")}`);
    setIsDialogOpen(true);
  };

  const openEditDialog = (f: Factura) => {
    setEditingId(f.id);
    setNumero(f.numero);
    setTipo(f.tipo);
    setConcepto(f.concepto);
    setImporteBase(String(f.importe_base));
    setIvaPorcentaje(String(f.iva_porcentaje));
    setFechaEmision(f.fecha_emision);
    setFechaVencimiento(f.fecha_vencimiento || "");
    setEstado(f.estado);
    setTerceroNombre(f.tercero_nombre);
    setTerceroNif(f.tercero_nif || "");
    setTerceroDireccion(f.tercero_direccion || "");
    setNotas(f.notas || "");
    setProveedorId(f.proveedor_id);
    setIsDialogOpen(true);
  };

  const handleProveedorSelect = (provId: string) => {
    if (provId === "nuevo") {
      setProveedorId(null);
      return;
    }
    setProveedorId(provId);
    const proveedor = proveedores.find(p => p.id === provId);
    if (proveedor) {
      setTerceroNombre(proveedor.nombre);
      setTerceroNif(proveedor.nif || "");
      setTerceroDireccion(proveedor.direccion || "");
    }
  };

  const handleSaveProveedor = async () => {
    if (!terceroNombre.trim()) return;
    
    const newProveedor = await onAddProveedor({
      nombre: terceroNombre.trim(),
      nif: terceroNif.trim() || null,
      direccion: terceroDireccion.trim() || null,
      email: null,
      telefono: null,
      notas: null,
    });
    
    if (newProveedor) {
      setProveedorId(newProveedor.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numero.trim() || !concepto.trim() || !importeBase || !terceroNombre.trim()) return;

    setSaving(true);
    const data: Omit<FacturaInsert, "created_by"> = {
      numero: numero.trim(),
      tipo,
      concepto: concepto.trim(),
      importe_base: parseFloat(importeBase),
      iva_porcentaje: parseFloat(ivaPorcentaje),
      fecha_emision: fechaEmision,
      fecha_vencimiento: fechaVencimiento || null,
      estado,
      tercero_nombre: terceroNombre.trim(),
      tercero_nif: terceroNif.trim() || null,
      tercero_direccion: terceroDireccion.trim() || null,
      proveedor_id: proveedorId,
      notas: notas.trim() || null,
      archivo_url: null,
    };

    const success = editingId
      ? await onUpdate(editingId, data)
      : await onAdd(data);

    setSaving(false);
    if (success) {
      setIsDialogOpen(false);
      resetForm();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await onDelete(deleteId);
    setDeleteId(null);
  };

  const calcularTotal = () => {
    const base = parseFloat(importeBase) || 0;
    const iva = parseFloat(ivaPorcentaje) || 0;
    return base * (1 + iva / 100);
  };

  const filteredFacturas = facturas.filter(f => {
    const matchesSearch = 
      f.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.tercero_nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = filterTipo === "todas" || f.tipo === filterTipo;
    const matchesEstado = filterEstado === "todos" || f.estado === filterEstado;
    return matchesSearch && matchesTipo && matchesEstado;
  });

  return (
    <div className="space-y-4">
      {/* Header con filtros */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar facturas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterTipo} onValueChange={(v) => setFilterTipo(v as typeof filterTipo)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="emitida">Emitidas</SelectItem>
              <SelectItem value="recibida">Recibidas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="pagada">Pagada</SelectItem>
              <SelectItem value="vencida">Vencida</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva factura
        </Button>
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Tercero</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFacturas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No hay facturas registradas
                  </TableCell>
                </TableRow>
              ) : (
                filteredFacturas.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-mono text-sm">{f.numero}</TableCell>
                    <TableCell>
                      <Badge variant={f.tipo === "emitida" ? "default" : "secondary"}>
                        {f.tipo === "emitida" ? "Emitida" : "Recibida"}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(f.fecha_emision), "dd MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{f.tercero_nombre}</p>
                        {f.tercero_nif && (
                          <p className="text-xs text-muted-foreground">{f.tercero_nif}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {f.concepto}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {Number(f.importe_total).toLocaleString("es-ES", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${estadoColors[f.estado].bg} ${estadoColors[f.estado].text} border-0`}>
                        {estadoLabels[f.estado]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(f)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(f.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog crear/editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar factura" : "Nueva factura"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Número *</Label>
                <Input
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="2026-0001"
                  required
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recibida">Recibida</SelectItem>
                    <SelectItem value="emitida">Emitida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={estado} onValueChange={(v) => setEstado(v as typeof estado)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="pagada">Pagada</SelectItem>
                    <SelectItem value="vencida">Vencida</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fecha emisión *</Label>
                <Input
                  type="date"
                  value={fechaEmision}
                  onChange={(e) => setFechaEmision(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Fecha vencimiento</Label>
                <Input
                  type="date"
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">{tipo === "emitida" ? "Cliente" : "Proveedor"}</h4>
                {tipo === "recibida" && terceroNombre.trim() && !proveedorId && (
                  <Button type="button" variant="outline" size="sm" onClick={handleSaveProveedor}>
                    <Save className="h-4 w-4 mr-1" />
                    Guardar proveedor
                  </Button>
                )}
              </div>
              
              {tipo === "recibida" && proveedores.length > 0 && (
                <div className="mb-3">
                  <Label>Seleccionar proveedor guardado</Label>
                  <Select value={proveedorId || "nuevo"} onValueChange={handleProveedorSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar o escribir nuevo..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nuevo">-- Nuevo proveedor --</SelectItem>
                      {proveedores.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nombre} {p.nif ? `(${p.nif})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre/Razón social *</Label>
                  <Input
                    value={terceroNombre}
                    onChange={(e) => setTerceroNombre(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>NIF/CIF</Label>
                  <Input
                    value={terceroNif}
                    onChange={(e) => setTerceroNif(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-2">
                <Label>Dirección</Label>
                <Input
                  value={terceroDireccion}
                  onChange={(e) => setTerceroDireccion(e.target.value)}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <div>
                <Label>Concepto *</Label>
                <Input
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  placeholder="Descripción de los servicios/productos"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Base imponible (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={importeBase}
                  onChange={(e) => setImporteBase(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label>IVA (%)</Label>
                <Select value={ivaPorcentaje} onValueChange={setIvaPorcentaje}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0% (Exento)</SelectItem>
                    <SelectItem value="4">4% (Superreducido)</SelectItem>
                    <SelectItem value="10">10% (Reducido)</SelectItem>
                    <SelectItem value="21">21% (General)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Total</Label>
                <div className="h-10 px-3 py-2 rounded-md border bg-muted font-medium">
                  {calcularTotal().toLocaleString("es-ES", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </div>
              </div>
            </div>

            <div>
              <Label>Notas</Label>
              <Textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Notas adicionales..."
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog confirmar eliminar */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar factura?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
