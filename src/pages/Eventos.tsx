import { useState, useEffect } from "react";
import { Calendar, MapPin, Clock, Download, CalendarPlus, Building2 } from "lucide-react";
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
  publico: boolean;
  organizador: string | null;
  imagen_url: string | null;
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

  // Use brand colors only - primary (blue) with secondary (yellow) accents
  const gradient = "from-primary via-primary/90 to-primary/80";

  return (
    <div className={`group relative overflow-hidden rounded-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl ${isPastEvent ? "opacity-60 grayscale-[30%]" : ""}`}>
      {/* Poster Background - Gradient only */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      
      {/* Decorative Elements - Yellow accents */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/30 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/20 rounded-full translate-y-1/2 -translate-x-1/2" />
      <div className="absolute top-4 left-4 w-2 h-16 bg-secondary rounded-full" />
      <div className="absolute bottom-4 right-4 w-16 h-2 bg-secondary rounded-full" />
      
      {/* Content */}
      <div className="relative p-6 md:p-8 min-h-[320px] flex flex-col text-white">
        {/* Header with badges */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex flex-wrap gap-2">
            {isEventToday && !isPastEvent && (
              <Badge className="bg-secondary text-primary font-bold animate-pulse">
                ¡HOY!
              </Badge>
            )}
            {isPastEvent && (
              <Badge variant="secondary" className="bg-black/30 text-white border-0">
                Finalizado
              </Badge>
            )}
          </div>
          {evento.organizador && (
            <div className="flex items-center gap-1.5 text-sm bg-secondary/90 text-primary backdrop-blur-sm rounded-full px-3 py-1 font-medium">
              <Building2 className="h-3 w-3" />
              <span>{evento.organizador}</span>
            </div>
          )}
        </div>

        {/* Event Image - Above title */}
        {evento.imagen_url && (
          <div className="mb-4 rounded-xl overflow-hidden border-2 border-secondary/50 shadow-lg">
            <img 
              src={evento.imagen_url} 
              alt={evento.titulo}
              className="w-full h-40 object-cover"
            />
          </div>
        )}

        {/* Main Content - Title */}
        <div className="mb-6">
          <h3 className="text-2xl md:text-3xl font-bold leading-tight drop-shadow-lg">
            {evento.titulo}
          </h3>
          {evento.descripcion && (
            <p className="mt-3 text-white/90 text-sm md:text-base line-clamp-3">
              {evento.descripcion}
            </p>
          )}
        </div>

        {/* Date Display - Prominent with yellow accent */}
        <div className="flex items-end justify-between mt-auto pt-4 border-t border-white/20">
          <div className="bg-secondary text-primary backdrop-blur-sm rounded-xl p-4 shadow-lg">
            <div className="text-4xl md:text-5xl font-black leading-none">
              {format(eventoDate, "d", { locale: es })}
            </div>
            <div className="text-sm md:text-base font-semibold uppercase tracking-wider mt-1">
              {format(eventoDate, "MMMM", { locale: es })}
            </div>
            <div className="text-xs opacity-70 mt-1">
              {format(eventoDate, "yyyy", { locale: es })}
            </div>
          </div>

          <div className="text-right space-y-2">
            <div className="flex items-center justify-end gap-2 text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 border-l-2 border-secondary">
              <Clock className="h-4 w-4" />
              <span className="font-bold">{format(eventoDate, "HH:mm", { locale: es })}h</span>
            </div>
            {evento.ubicacion && (
              <div className="flex items-center justify-end gap-2 text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 border-l-2 border-secondary">
                <MapPin className="h-4 w-4" />
                <span className="truncate max-w-[150px]">{evento.ubicacion}</span>
              </div>
            )}
          </div>
        </div>

        {/* Calendar Buttons */}
        {!isPastEvent && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-secondary/50">
            <Button 
              variant="secondary"
              size="sm"
              onClick={() => addToGoogleCalendar(evento)}
              className="bg-secondary hover:bg-secondary/80 text-primary border-0 gap-1.5 flex-1 font-semibold"
            >
              <CalendarPlus className="h-4 w-4" />
              Google Calendar
            </Button>
            <Button 
              variant="secondary"
              size="sm"
              onClick={() => downloadICS(evento)}
              className="bg-white/20 hover:bg-white/30 text-white border border-secondary/50 backdrop-blur-sm gap-1.5 flex-1"
            >
              <Download className="h-4 w-4" />
              .ics
            </Button>
          </div>
        )}
      </div>
    </div>
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
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
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
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
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
