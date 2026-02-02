import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, MessageCircle, Shield } from "lucide-react";
import { formatInMadrid } from "@/lib/timezone";

interface Mensaje {
  id: string;
  user_id: string;
  mensaje: string;
  created_at: string;
  es_junta: boolean;
}

export function ChatJunta() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { user, isJunta, isAdmin } = useAuth();
  const { toast } = useToast();

  // Check if current user can send as "Junta"
  const puedeEnviarComoJunta = isJunta || isAdmin;

  useEffect(() => {
    fetchMensajes();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('mensajes_chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes_chat'
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
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes]);

  const fetchMensajes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("mensajes_chat")
      .select("*")
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMensajes(data);
    }
    setLoading(false);
  };

  const handleEnviar = async () => {
    if (!nuevoMensaje.trim() || !user) return;

    setSending(true);
    
    try {
      const { error } = await supabase
        .from("mensajes_chat")
        .insert({
          user_id: user.id,
          mensaje: nuevoMensaje.trim(),
          es_junta: puedeEnviarComoJunta
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

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Canal de la Junta
        </CardTitle>
        <CardDescription>
          Comunicación directa con la Junta Directiva
        </CardDescription>
      </CardHeader>
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
              <p className="text-sm">Sé el primero en escribir</p>
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
                    {msgs.map((msg, index) => {
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
          {puedeEnviarComoJunta && (
            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>Enviarás como Junta Directiva</span>
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
    </Card>
  );
}
