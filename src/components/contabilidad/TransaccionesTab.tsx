import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Pencil, Trash2, ArrowUpCircle, ArrowDownCircle, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Transaccion, CategoriaContabilidad, TransaccionInsert } from "@/hooks/useContabilidad";

interface TransaccionesTabProps {
  transacciones: Transaccion[];
  categorias: CategoriaContabilidad[];
  onAdd: (transaccion: Omit<TransaccionInsert, "created_by">) => Promise<boolean>;
  onUpdate: (id: string, updates: Partial<TransaccionInsert>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export const TransaccionesTab = ({
  transacciones,
  categorias,
  onAdd,
  onUpdate,
  onDelete,
}: TransaccionesTabProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<"todos" | "ingreso" | "gasto">("todos");

  // Form fields
  const [tipo, setTipo] = useState<"ingreso" | "gasto">("ingreso");
  const [concepto, setConcepto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [importe, setImporte] = useState("");
  const [fecha, setFecha] = useState(format(new Date(), "yyyy-MM-dd"));
  const [categoriaId, setCategoriaId] = useState<string>("");

  const resetForm = () => {
    setTipo("ingreso");
    setConcepto("");
    setDescripcion("");
    setImporte("");
    setFecha(format(new Date(), "yyyy-MM-dd"));
    setCategoriaId("");
    setEditingId(null);
  };

  const openNewDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (t: Transaccion) => {
    setEditingId(t.id);
    setTipo(t.tipo);
    setConcepto(t.concepto);
    setDescripcion(t.descripcion || "");
    setImporte(String(t.importe));
    setFecha(t.fecha);
    setCategoriaId(t.categoria_id || "");
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concepto.trim() || !importe) return;

    setSaving(true);
    const data = {
      tipo,
      concepto: concepto.trim(),
      descripcion: descripcion.trim() || null,
      importe: parseFloat(importe),
      fecha,
      categoria_id: categoriaId || null,
      factura_id: null,
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

  const filteredTransacciones = transacciones.filter(t => {
    const matchesSearch = 
      t.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.categoria?.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = filterTipo === "todos" || t.tipo === filterTipo;
    return matchesSearch && matchesTipo;
  });

  const categoriasFiltered = categorias.filter(c => c.tipo === tipo);

  return (
    <div className="space-y-4">
      {/* Header con filtros */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar transacciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterTipo} onValueChange={(v) => setFilterTipo(v as typeof filterTipo)}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ingreso">Ingresos</SelectItem>
              <SelectItem value="gasto">Gastos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva transacción
        </Button>
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Importe</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransacciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay transacciones registradas
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransacciones.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      {t.tipo === "ingreso" ? (
                        <ArrowUpCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowDownCircle className="h-5 w-5 text-red-600" />
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(t.fecha), "dd MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{t.concepto}</p>
                        {t.descripcion && (
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {t.descripcion}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {t.categoria ? (
                        <Badge 
                          variant="outline" 
                          style={{ 
                            borderColor: t.categoria.color,
                            color: t.categoria.color 
                          }}
                        >
                          {t.categoria.nombre}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sin categoría</span>
                      )}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      t.tipo === "ingreso" ? "text-green-600" : "text-red-600"
                    }`}>
                      {t.tipo === "ingreso" ? "+" : "-"}
                      {Number(t.importe).toLocaleString("es-ES", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(t)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(t.id)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar transacción" : "Nueva transacción"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={(v) => {
                  setTipo(v as "ingreso" | "gasto");
                  setCategoriaId("");
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ingreso">
                      <div className="flex items-center gap-2">
                        <ArrowUpCircle className="h-4 w-4 text-green-600" />
                        Ingreso
                      </div>
                    </SelectItem>
                    <SelectItem value="gasto">
                      <div className="flex items-center gap-2">
                        <ArrowDownCircle className="h-4 w-4 text-red-600" />
                        Gasto
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Concepto *</Label>
              <Input
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                placeholder="Ej: Cuotas mes enero"
                required
              />
            </div>

            <div>
              <Label>Descripción</Label>
              <Textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Detalles adicionales..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Importe (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={importe}
                  onChange={(e) => setImporte(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label>Categoría</Label>
                <Select value={categoriaId} onValueChange={setCategoriaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasFiltered.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: c.color }} 
                          />
                          {c.nombre}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            <AlertDialogTitle>¿Eliminar transacción?</AlertDialogTitle>
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
