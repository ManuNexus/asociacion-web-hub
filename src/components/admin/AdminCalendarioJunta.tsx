import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatInMadrid, toMadridTime, fromMadridTime } from "@/lib/timezone";
import { 
  CalendarDays, 
  Plus, 
  Loader2, 
  Clock, 
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  Users,
  Mail
} from "lucide-react";
import { format, isSameDay, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";

type CargoJunta = 'presidente' | 'vicepresidente' | 'secretario' | 'tesorero' | 'vocal';

interface EventoCalendario {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha: string;
  fecha_fin: string | null;
  roles: CargoJunta[] | null;
  created_by: string | null;
  created_at: string;
}

const CARGOS_JUNTA: { value: CargoJunta; label: string }[] = [
  { value: 'presidente', label: 'Presidente/a' },
  { value: 'vicepresidente', label: 'Vicepresidente/a' },
  { value: 'secretario', label: 'Secretario/a' },
  { value: 'tesorero', label: 'Tesorero/a' },
  { value: 'vocal', label: 'Vocales' },
];

export function AdminCalendarioJunta() {
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState<EventoCalendario | null>(null);
  const [saving, setSaving] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);
  
  // Form state
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaStr, setFechaStr] = useState("");
  const [horaInicio, setHoraInicio] = useState("10:00");
  const [horaFin, setHoraFin] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<CargoJunta[]>([]);
  
  const { toast } = useToast();

  const fetchEventos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("calendario_junta")
        .select("*")
        .order("fecha", { ascending: false });

      if (error) throw error;
      setEventos((data as EventoCalendario[]) || []);
    } catch (error: any) {
      console.error("Error fetching calendario:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el calendario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventos();
  }, []);

  const resetForm = () => {
    setTitulo("");
    setDescripcion("");
    setFechaStr("");
    setHoraInicio("10:00");
    setHoraFin("");
    setSelectedRoles([]);
    setEditingEvento(null);
  };

  const openNewEventDialog = (date?: Date) => {
    resetForm();
    if (date) {
      setFechaStr(format(date, "yyyy-MM-dd"));
    }
    setDialogOpen(true);
  };

  const openEditDialog = (evento: EventoCalendario) => {
    setEditingEvento(evento);
    setTitulo(evento.titulo);
    setDescripcion(evento.descripcion || "");
    const fechaMadrid = toMadridTime(evento.fecha);
    setFechaStr(format(fechaMadrid, "yyyy-MM-dd"));
    setHoraInicio(format(fechaMadrid, "HH:mm"));
    if (evento.fecha_fin) {
      const fechaFinMadrid = toMadridTime(evento.fecha_fin);
      setHoraFin(format(fechaFinMadrid, "HH:mm"));
    } else {
      setHoraFin("");
    }
    setSelectedRoles(evento.roles || []);
    setDialogOpen(true);
  };

  const toggleRole = (role: CargoJunta) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !fechaStr || !horaInicio) {
      toast({
        title: "Error",
        description: "Completa los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const fechaInicioUTC = fromMadridTime(`${fechaStr}T${horaInicio}`).toISOString();
      const fechaFinUTC = horaFin ? fromMadridTime(`${fechaStr}T${horaFin}`).toISOString() : null;

      if (editingEvento) {
        const { error } = await supabase
          .from("calendario_junta")
          .update({
            titulo: titulo.trim(),
            descripcion: descripcion.trim() || null,
            fecha: fechaInicioUTC,
            fecha_fin: fechaFinUTC,
            roles: selectedRoles.length > 0 ? selectedRoles : null,
          })
          .eq("id", editingEvento.id);

        if (error) throw error;
        toast({ title: "Evento actualizado" });
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: newEvento, error } = await supabase
          .from("calendario_junta")
          .insert({
            titulo: titulo.trim(),
            descripcion: descripcion.trim() || null,
            fecha: fechaInicioUTC,
            fecha_fin: fechaFinUTC,
            roles: selectedRoles.length > 0 ? selectedRoles : null,
            created_by: user?.id,
          })
          .select()
          .single();

        if (error) throw error;
        toast({ title: "Evento creado" });

        // Send notification email to assigned roles
        if (selectedRoles.length > 0 && newEvento) {
          sendNotificationEmail(newEvento as EventoCalendario, 'creation');
        }
      }

      setDialogOpen(false);
      resetForm();
      fetchEventos();
    } catch (error: any) {
      console.error("Error saving evento:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el evento",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const sendNotificationEmail = async (evento: EventoCalendario, type: 'creation' | 'reminder') => {
    try {
      const { error } = await supabase.functions.invoke('notify-calendario-junta', {
        body: {
          evento_id: evento.id,
          type,
        },
      });

      if (error) {
        console.error("Error sending notification:", error);
      }
    } catch (error) {
      console.error("Error invoking notification function:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("calendario_junta")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Evento eliminado" });
      fetchEventos();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el evento",
        variant: "destructive",
      });
    }
  };

  const getRoleLabel = (role: CargoJunta) => {
    return CARGOS_JUNTA.find(c => c.value === role)?.label || role;
  };

  // Get events for the selected date
  const eventosDelDia = selectedDate
    ? eventos.filter((e) => isSameDay(toMadridTime(e.fecha), selectedDate))
    : [];

  // Get dates that have events for highlighting in calendar
  const eventDates = eventos.map((e) => toMadridTime(e.fecha));

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Calendario de la Junta
              </CardTitle>
              <CardDescription>
                Gestiona eventos y reuniones de la Junta Directiva. Asigna roles para notificar a los miembros correspondientes.
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => openNewEventDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo evento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingEvento ? "Editar evento" : "Nuevo evento"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingEvento
                      ? "Modifica los datos del evento"
                      : "Añade un nuevo evento al calendario de la junta. Los miembros asignados recibirán un email de notificación."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="titulo">Título *</Label>
                    <Input
                      id="titulo"
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      placeholder="Ej: Reunión de junta"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      placeholder="Detalles del evento..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fecha">Fecha *</Label>
                      <Input
                        id="fecha"
                        type="date"
                        value={fechaStr}
                        onChange={(e) => setFechaStr(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hora-inicio">Hora inicio *</Label>
                      <Input
                        id="hora-inicio"
                        type="time"
                        value={horaInicio}
                        onChange={(e) => setHoraInicio(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hora-fin">Hora fin (opcional)</Label>
                    <Input
                      id="hora-fin"
                      type="time"
                      value={horaFin}
                      onChange={(e) => setHoraFin(e.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Roles asignados
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Selecciona los roles que deben participar. Recibirán emails de notificación.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {CARGOS_JUNTA.map((cargo) => (
                        <div key={cargo.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`role-${cargo.value}`}
                            checked={selectedRoles.includes(cargo.value)}
                            onCheckedChange={() => toggleRole(cargo.value)}
                          />
                          <Label
                            htmlFor={`role-${cargo.value}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {cargo.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancelar
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editingEvento ? "Guardar cambios" : "Crear evento"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-1">
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="font-semibold capitalize">
                  {format(currentMonth, "MMMM yyyy", { locale: es })}
                </h3>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                locale={es}
                className="rounded-md border w-full"
                modifiers={{
                  hasEvent: (date) =>
                    eventDates.some((eventDate) => isSameDay(eventDate, date)),
                }}
                modifiersStyles={{
                  hasEvent: {
                    fontWeight: "bold",
                    textDecoration: "underline",
                    textDecorationColor: "hsl(var(--primary))",
                  },
                }}
              />
              {selectedDate && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => openNewEventDialog(selectedDate)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir evento el {format(selectedDate, "d MMM", { locale: es })}
                </Button>
              )}
            </div>

            {/* Events table */}
            <div className="lg:col-span-2">
              <h3 className="font-semibold mb-4">Todos los eventos</h3>
              {eventos.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">
                  No hay eventos en el calendario
                </p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Evento</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead className="w-[100px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eventos.map((evento) => (
                        <TableRow key={evento.id}>
                          <TableCell className="whitespace-nowrap">
                            <div className="font-medium">
                              {formatInMadrid(evento.fecha, "d MMM yyyy")}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatInMadrid(evento.fecha, "HH:mm")}
                              {evento.fecha_fin && ` - ${formatInMadrid(evento.fecha_fin, "HH:mm")}`}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{evento.titulo}</div>
                            {evento.descripcion && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {evento.descripcion}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {evento.roles && evento.roles.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {evento.roles.map((role) => (
                                  <Badge key={role} variant="secondary" className="text-xs">
                                    {getRoleLabel(role)}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Toda la junta</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditDialog(evento)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar evento?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción no se puede deshacer.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(evento.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
