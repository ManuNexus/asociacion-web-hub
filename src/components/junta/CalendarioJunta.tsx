import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  ChevronRight
} from "lucide-react";
import { format, startOfMonth, endOfMonth, isSameDay, addMonths, subMonths } from "date-fns";
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

interface CalendarioJuntaProps {
  canEdit: boolean;
  miCargoJunta?: CargoJunta | null;
}

export function CalendarioJunta({ canEdit, miCargoJunta }: CalendarioJuntaProps) {
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState<EventoCalendario | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaStr, setFechaStr] = useState("");
  const [horaInicio, setHoraInicio] = useState("10:00");
  const [horaFin, setHoraFin] = useState("");
  
  const { toast } = useToast();

  const fetchEventos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("calendario_junta")
        .select("*")
        .order("fecha", { ascending: true });

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
    setDialogOpen(true);
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
          })
          .eq("id", editingEvento.id);

        if (error) throw error;
        toast({ title: "Evento actualizado" });
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
          .from("calendario_junta")
          .insert({
            titulo: titulo.trim(),
            descripcion: descripcion.trim() || null,
            fecha: fechaInicioUTC,
            fecha_fin: fechaFinUTC,
            created_by: user?.id,
          });

        if (error) throw error;
        toast({ title: "Evento creado" });
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

  // Get events for the selected date
  const eventosDelDia = selectedDate
    ? eventos.filter((e) => isSameDay(toMadridTime(e.fecha), selectedDate))
    : [];

  // Get dates that have events for highlighting in calendar
  const eventDates = eventos.map((e) => toMadridTime(e.fecha));

  // Get upcoming events (next 7 days)
  const today = new Date();
  const proximosEventos = eventos
    .filter((e) => toMadridTime(e.fecha) >= today)
    .slice(0, 5);

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
                Registro de actividades y reuniones de la Junta Directiva
              </CardDescription>
            </div>
            {canEdit && (
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
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingEvento ? "Editar evento" : "Nuevo evento"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingEvento
                        ? "Modifica los datos del evento"
                        : "Añade un nuevo evento al calendario de la junta"}
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
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Calendar */}
            <div>
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
                    color: "hsl(var(--accent))",
                  },
                }}
              />
              {canEdit && selectedDate && (
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

            {/* Events for selected date */}
            <div>
              <h3 className="font-semibold mb-4">
                {selectedDate
                  ? format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })
                  : "Selecciona una fecha"}
              </h3>
              {eventosDelDia.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">
                  No hay eventos para este día
                </p>
              ) : (
                <div className="space-y-3">
                  {eventosDelDia.map((evento) => {
                    // Check if user can edit this specific event
                    const esMiEvento = miCargoJunta && evento.roles?.includes(miCargoJunta);
                    const puedeEditarEvento = canEdit || esMiEvento;
                    
                    return (
                      <Card key={evento.id} className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className="font-medium">{evento.titulo}</h4>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {formatInMadrid(evento.fecha, "HH:mm")}
                                  {evento.fecha_fin && ` - ${formatInMadrid(evento.fecha_fin, "HH:mm")}`}
                                </span>
                              </div>
                              {/* Show role badges */}
                              {evento.roles && evento.roles.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {evento.roles.map((rol) => {
                                    const cargoInfo = CARGOS_JUNTA.find(c => c.value === rol);
                                    const esMiRol = rol === miCargoJunta;
                                    return (
                                      <Badge 
                                        key={rol} 
                                        variant={esMiRol ? "default" : "secondary"}
                                        className="text-xs"
                                      >
                                        {cargoInfo?.label || rol}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              )}
                              {evento.descripcion && (
                                <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                                  {evento.descripcion}
                                </p>
                              )}
                            </div>
                            {puedeEditarEvento && (
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
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Próximos eventos */}
      {proximosEventos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Próximos eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {proximosEventos.map((evento) => {
                const esMiEvento = miCargoJunta && evento.roles?.includes(miCargoJunta);
                return (
                  <div
                    key={evento.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => {
                      setSelectedDate(toMadridTime(evento.fecha));
                      setCurrentMonth(toMadridTime(evento.fecha));
                    }}
                  >
                    <div className="text-center min-w-[50px]">
                      <div className="text-2xl font-bold text-primary">
                        {formatInMadrid(evento.fecha, "d")}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase">
                        {formatInMadrid(evento.fecha, "MMM")}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{evento.titulo}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatInMadrid(evento.fecha, "EEEE, HH:mm")}
                      </p>
                      {/* Show role badges in upcoming events */}
                      {evento.roles && evento.roles.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {evento.roles.map((rol) => {
                            const cargoInfo = CARGOS_JUNTA.find(c => c.value === rol);
                            const esMiRol = rol === miCargoJunta;
                            return (
                              <Badge 
                                key={rol} 
                                variant={esMiRol ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {cargoInfo?.label || rol}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
