import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, MessageCircle, Shield, ChevronLeft } from "lucide-react";
import { formatInMadrid } from "@/lib/timezone";

interface Mensaje {
  id: string;
  user_id: string;
  socio_id: string;
  mensaje: string;
  created_at: string;
  es_junta: boolean;
}

interface Socio {
  id: string;
  nombre: string;
  apellidos: string;
}

interface ChatJuntaProps {
  miSocioId?: string;
}

export function ChatJunta({ miSocioId }: ChatJuntaProps) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  // For junta/admin: list of conversations
  const [conversaciones, setConversaciones] = useState<Socio[]>([]);
  const [selectedSocio, setSelectedSocio] = useState<Socio | null>(null);
  const [loadingConversaciones, setLoadingConversaciones] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { user, isJunta, isAdmin } = useAuth();
  const { toast } = useToast();

  // Only admin can see all conversations and respond as "Junta"
  const puedeVerTodas = isAdmin;

  useEffect(() => {
    if (puedeVerTodas) {
      fetchConversaciones();
    } else if (miSocioId) {
      fetchMensajes(miSocioId);
    }
  }, [puedeVerTodas, miSocioId]);

  // Subscribe to realtime updates
  useEffect(() => {
    const targetSocioId = puedeVerTodas ? selectedSocio?.id : miSocioId;
    if (!targetSocioId) return;

    const channel = supabase
      .channel(`mensajes_chat_${targetSocioId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes_chat',
          filter: `socio_id=eq.${targetSocioId}`
        },
        (payload) => {
          const nuevoMsg = payload.new as Mensaje;
          setMensajes(prev => [...prev, nuevoMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedSocio?.id, miSocioId, puedeVerTodas]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes]);

  const fetchConversaciones = async () => {
    setLoadingConversaciones(true);
    
    // Get all socios that have messages
    const { data: mensajesData } = await supabase
      .from("mensajes_chat")
      .select("socio_id")
      .not("socio_id", "is", null);

    if (mensajesData) {
      const socioIds = [...new Set(mensajesData.map(m => m.socio_id))];
      
      if (socioIds.length > 0) {
        // Get socio details - use RPC for junta members
        if (isAdmin) {
          const { data: socios } = await supabase
            .from("socios")
            .select("id, nombre, apellidos")
            .in("id", socioIds)
            .order("apellidos");
          
          if (socios) {
            setConversaciones(socios);
          }
        } else {
          // Junta uses RPC function
          const { data: socios } = await supabase.rpc("get_socios_for_junta");
          if (socios) {
            const filteredSocios = (socios as unknown as Socio[])
              .filter(s => socioIds.includes(s.id))
              .sort((a, b) => a.apellidos.localeCompare(b.apellidos));
            setConversaciones(filteredSocios);
          }
        }
      }
    }
    
    setLoadingConversaciones(false);
  };

  const fetchMensajes = async (socioId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("mensajes_chat")
      .select("*")
      .eq("socio_id", socioId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMensajes(data);
    }
    setLoading(false);
  };

  const handleSelectSocio = (socio: Socio) => {
    setSelectedSocio(socio);
    fetchMensajes(socio.id);
  };

  const handleBackToList = () => {
    setSelectedSocio(null);
    setMensajes([]);
    fetchConversaciones();
  };

  const handleEnviar = async () => {
    if (!nuevoMensaje.trim() || !user) return;

    const targetSocioId = puedeVerTodas ? selectedSocio?.id : miSocioId;
    if (!targetSocioId) return;

    setSending(true);
    
    try {
      const { error } = await supabase
        .from("mensajes_chat")
        .insert({
          user_id: user.id,
          socio_id: targetSocioId,
          mensaje: nuevoMensaje.trim(),
          es_junta: puedeVerTodas
        });

      if (error) throw error;
      
      setNuevoMensaje("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo enviar el mensaje",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  // Group messages by date
  const groupMessagesByDate = (msgs: Mensaje[]) => {
    const groups: { [date: string]: Mensaje[] } = {};
    msgs.forEach(msg => {
      const dateKey = formatInMadrid(msg.created_at, "yyyy-MM-dd");
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
    });
    return groups;
  };

  const formatDateLabel = (dateKey: string) => {
    const today = formatInMadrid(new Date(), "yyyy-MM-dd");
    const yesterday = formatInMadrid(new Date(Date.now() - 86400000), "yyyy-MM-dd");
    
    if (dateKey === today) return "Hoy";
    if (dateKey === yesterday) return "Ayer";
    return formatInMadrid(new Date(dateKey), "d 'de' MMMM 'de' yyyy");
  };

  const groupedMensajes = groupMessagesByDate(mensajes);

  // Junta/Admin view: show conversation list or selected conversation
  if (puedeVerTodas) {
    // Show conversation list
    if (!selectedSocio) {
      return (
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Conversaciones con Socios
            </CardTitle>
            <CardDescription>
              Mensajes privados de los socios
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            {loadingConversaciones ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : conversaciones.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mb-4 opacity-50" />
                <p>No hay conversaciones</p>
                <p className="text-sm">Los socios aún no han enviado mensajes</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto h-full">
                {conversaciones.map((socio) => (
                  <button
                    key={socio.id}
                    onClick={() => handleSelectSocio(socio)}
                    className="w-full flex items-center gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary font-medium">
                        {socio.nombre.charAt(0)}{socio.apellidos.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {socio.nombre} {socio.apellidos}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    // Show selected conversation with back button
    return (
      <Card className="flex flex-col h-[600px]">
        <CardHeader className="pb-3 shrink-0 border-b">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBackToList}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <CardTitle className="text-base">
                {selectedSocio.nombre} {selectedSocio.apellidos}
              </CardTitle>
              <CardDescription className="text-xs">
                Conversación privada
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        {renderChatContent()}
      </Card>
    );
  }

  // Regular socio view
  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Chat con la Junta
        </CardTitle>
        <CardDescription>
          Tu conversación privada con la Junta Directiva
        </CardDescription>
      </CardHeader>
      {renderChatContent()}
    </Card>
  );

  function renderChatContent() {
    return (
      <CardContent className="flex-1 flex flex-col min-h-0 pb-4">
        {/* Messages area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto mb-4 px-1"
        >
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : mensajes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mb-4 opacity-50" />
              <p>No hay mensajes todavía</p>
              <p className="text-sm">
                {puedeVerTodas ? "Escribe al socio" : "Escribe tu primer mensaje a la Junta"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedMensajes).map(([dateKey, msgs]) => (
                <div key={dateKey}>
                  {/* Date separator */}
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                      {formatDateLabel(dateKey)}
                    </div>
                  </div>
                  
                  {/* Messages for this date */}
                  <div className="space-y-3">
                    {msgs.map((msg) => {
                      const isOwnMessage = msg.user_id === user?.id;
                      const isFromJunta = msg.es_junta;
                      
                      return (
                        <div 
                          key={msg.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div 
                            className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 ${
                              isOwnMessage
                                ? 'bg-primary text-primary-foreground rounded-br-md'
                                : isFromJunta
                                  ? 'bg-secondary/20 border border-secondary/30 text-foreground rounded-bl-md'
                                  : 'bg-muted text-foreground rounded-bl-md'
                            }`}
                          >
                            {/* Sender label */}
                            {!isOwnMessage && (
                              <div className="flex items-center gap-2 mb-1">
                                {isFromJunta ? (
                                  <Badge variant="outline" className="border-primary text-primary text-xs py-0 h-5">
                                    <Shield className="h-3 w-3 mr-1" />
                                    Junta Directiva
                                  </Badge>
                                ) : (
                                  <span className="text-xs font-medium text-muted-foreground">
                                    Socio
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {/* Message content */}
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {msg.mensaje}
                            </p>
                            
                            {/* Time */}
                            <p className={`text-[10px] mt-1 text-right ${
                              isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}>
                              {formatInMadrid(msg.created_at, "HH:mm")}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="shrink-0 border-t pt-4">
          {puedeVerTodas && (
            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>Responderás como Junta Directiva</span>
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu mensaje..."
              className="min-h-[44px] max-h-[120px] resize-none"
              disabled={sending}
              rows={1}
            />
            <Button 
              onClick={handleEnviar} 
              disabled={!nuevoMensaje.trim() || sending}
              size="icon"
              className="shrink-0 h-[44px] w-[44px]"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    );
  }
}
