import { useState, useEffect } from "react";
import { Calendar, MapPin, Clock, Download, CalendarPlus } from "lucide-react";
import { format, isPast, isFuture, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toMadridTime } from "@/lib/timezone";

interface Evento {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha: string;
  ubicacion: string | null;
  solo_junta: boolean;
}

const generateICS = (evento: Evento): string => {
  const startDate = new Date(evento.fecha);
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration by default

  const formatICSDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const escapeText = (text: string): string => {
    return text.replace(/[,;\\]/g, "\\$&").replace(/\n/g, "\\n");
  };

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AHORA//Eventos//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
DTSTART:${formatICSDate(startDate)}
DTEND:${formatICSDate(endDate)}
SUMMARY:${escapeText(evento.titulo)}
DESCRIPTION:${evento.descripcion ? escapeText(evento.descripcion) : ""}
LOCATION:${evento.ubicacion ? escapeText(evento.ubicacion) : ""}
UID:${evento.id}@ahoraorg.es
END:VEVENT
END:VCALENDAR`;
};

const downloadICS = (evento: Evento) => {
  const icsContent = generateICS(evento);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${evento.titulo.replace(/[^a-zA-Z0-9]/g, "_")}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const addToGoogleCalendar = (evento: Evento) => {
  const startDate = new Date(evento.fecha);
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
  
  const formatGoogleDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: evento.titulo,
    dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
    details: evento.descripcion || "",
    location: evento.ubicacion || "",
  });

  window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, "_blank");
};

const EventoCard = ({ evento, isPastEvent }: { evento: Evento; isPastEvent: boolean }) => {
  const eventoDate = toMadridTime(new Date(evento.fecha));
  const isEventToday = isToday(eventoDate);

  return (
    <Card className={`transition-all hover:shadow-lg ${isPastEvent ? "opacity-70" : ""}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {isEventToday && !isPastEvent && (
                <Badge variant="default" className="bg-primary">Hoy</Badge>
              )}
              {isPastEvent && (
                <Badge variant="secondary">Finalizado</Badge>
              )}
            </div>
            <CardTitle className="text-xl">{evento.titulo}</CardTitle>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-primary">
              {format(eventoDate, "d", { locale: es })}
            </div>
            <div className="text-sm text-muted-foreground uppercase">
              {format(eventoDate, "MMM yyyy", { locale: es })}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {evento.descripcion && (
          <CardDescription className="text-base whitespace-pre-line">
            {evento.descripcion}
          </CardDescription>
        )}
        
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{format(eventoDate, "HH:mm", { locale: es })}h</span>
          </div>
          {evento.ubicacion && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span>{evento.ubicacion}</span>
            </div>
          )}
        </div>

        {!isPastEvent && (
          <div className="flex flex-wrap gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => addToGoogleCalendar(evento)}
              className="gap-1.5"
            >
              <CalendarPlus className="h-4 w-4" />
              Google Calendar
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => downloadICS(evento)}
              className="gap-1.5"
            >
              <Download className="h-4 w-4" />
              Descargar .ics
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const EventosSkeleton = () => (
  <div className="grid gap-6 md:grid-cols-2">
    {[1, 2, 3, 4].map((i) => (
      <Card key={i}>
        <CardHeader>
          <div className="flex justify-between">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-10 w-16" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export default function Eventos() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEventos = async () => {
      const { data, error } = await supabase
        .from("eventos")
        .select("*")
        .eq("publico", true)
        .order("fecha", { ascending: true });

      if (!error && data) {
        setEventos(data);
      }
      setLoading(false);
    };

    fetchEventos();
  }, []);

  const now = new Date();
  const upcomingEventos = eventos.filter((e) => !isPast(new Date(e.fecha)) || isToday(new Date(e.fecha)));
  const pastEventos = eventos.filter((e) => isPast(new Date(e.fecha)) && !isToday(new Date(e.fecha))).reverse();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Eventos</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Descubre nuestras actividades y encuentra oportunidades para participar y conectar con la comunidad AHORA.
            </p>
          </div>

          {loading ? (
            <EventosSkeleton />
          ) : eventos.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">
                  No hay eventos programados en este momento.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Vuelve pronto para ver nuestras próximas actividades.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="proximos" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="proximos" className="gap-2">
                  Próximos
                  {upcomingEventos.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {upcomingEventos.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="pasados" className="gap-2">
                  Pasados
                  {pastEventos.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {pastEventos.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="proximos">
                {upcomingEventos.length === 0 ? (
                  <Card className="text-center py-8">
                    <CardContent>
                      <p className="text-muted-foreground">
                        No hay eventos próximos programados.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {upcomingEventos.map((evento) => (
                      <EventoCard 
                        key={evento.id} 
                        evento={evento} 
                        isPastEvent={false} 
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="pasados">
                {pastEventos.length === 0 ? (
                  <Card className="text-center py-8">
                    <CardContent>
                      <p className="text-muted-foreground">
                        No hay eventos pasados.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {pastEventos.map((evento) => (
                      <EventoCard 
                        key={evento.id} 
                        evento={evento} 
                        isPastEvent={true} 
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </Layout>
  );
}
