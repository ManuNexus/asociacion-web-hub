import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, 
  LogOut, 
  Users, 
  Vote, 
  Calendar, 
  FileText, 
  User,
  Clock,
  MapPin,
  CheckCircle2,
  Download,
  Key,
  Eye,
  EyeOff
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import logoIcon from "@/assets/logo-ahora-icon.png";

interface Socio {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  activo: boolean;
  tipo_cuota: string;
  fecha_alta: string;
}

interface Votacion {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  activa: boolean;
}

interface OpcionVotacion {
  id: string;
  votacion_id: string;
  texto: string;
}

interface Evento {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha: string;
  ubicacion: string | null;
}

interface Documento {
  id: string;
  titulo: string;
  descripcion: string | null;
  archivo_url: string;
  categoria: string | null;
}

const PanelSocios = () => {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [miSocio, setMiSocio] = useState<Socio | null>(null);
  const [votaciones, setVotaciones] = useState<Votacion[]>([]);
  const [opciones, setOpciones] = useState<OpcionVotacion[]>([]);
  const [misVotos, setMisVotos] = useState<string[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const { user, isSocio, loading: authLoading, socioLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !socioLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!isSocio) {
        toast({
          variant: "destructive",
          title: "Acceso denegado",
          description: "No tienes permisos de socio",
        });
        navigate("/");
      }
    }
  }, [user, isSocio, authLoading, socioLoading, navigate, toast]);

  useEffect(() => {
    if (user && isSocio) {
      fetchAllData();
    }
  }, [user, isSocio]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchMiSocio(),
      fetchSocios(),
      fetchVotaciones(),
      fetchEventos(),
      fetchDocumentos(),
      fetchMisVotos(),
    ]);
    setLoading(false);
  };

  const fetchMiSocio = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("socios")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && data) {
      setMiSocio(data);
    }
  };

  const fetchSocios = async () => {
    const { data, error } = await supabase
      .from("socios")
      .select("*")
      .eq("activo", true)
      .order("apellidos");

    if (!error && data) {
      setSocios(data);
    }
  };

  const fetchVotaciones = async () => {
    const { data: votacionesData, error: votacionesError } = await supabase
      .from("votaciones")
      .select("*")
      .order("fecha_fin", { ascending: false });

    if (!votacionesError && votacionesData) {
      setVotaciones(votacionesData);
      
      // Fetch options for all votaciones
      const { data: opcionesData } = await supabase
        .from("opciones_votacion")
        .select("*");
      
      if (opcionesData) {
        setOpciones(opcionesData);
      }
    }
  };

  const fetchMisVotos = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("votos")
      .select("votacion_id")
      .eq("user_id", user.id);

    if (!error && data) {
      setMisVotos(data.map(v => v.votacion_id));
    }
  };

  const fetchEventos = async () => {
    const { data, error } = await supabase
      .from("eventos")
      .select("*")
      .gte("fecha", new Date().toISOString())
      .order("fecha");

    if (!error && data) {
      setEventos(data);
    }
  };

  const fetchDocumentos = async () => {
    const { data, error } = await supabase
      .from("documentos_internos")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setDocumentos(data);
    }
  };

  const handleVotar = async (votacionId: string, opcionId: string) => {
    if (!user) return;
    
    setVoting(votacionId);
    
    const { error } = await supabase.from("votos").insert({
      votacion_id: votacionId,
      opcion_id: opcionId,
      user_id: user.id,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo registrar tu voto",
      });
    } else {
      toast({ title: "Voto registrado correctamente" });
      setMisVotos([...misVotos, votacionId]);
    }
    
    setVoting(null);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "La nueva contraseña debe tener al menos 6 caracteres",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Las contraseñas no coinciden",
      });
      return;
    }
    
    setChangingPassword(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) {
        throw error;
      }
      
      toast({ title: "Contraseña actualizada correctamente" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo cambiar la contraseña",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const isVotacionActiva = (votacion: Votacion) => {
    const now = new Date();
    return votacion.activa && 
           new Date(votacion.fecha_inicio) <= now && 
           new Date(votacion.fecha_fin) >= now;
  };

  if (authLoading || socioLoading || (!isSocio && user)) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="bg-hero py-12">
        <div className="container">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-primary-foreground">
                Panel de Socios
              </h1>
              <p className="text-primary-foreground/80 mt-1">
                Bienvenido al área privada de AHORA
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="bg-background/10 border-primary-foreground/20 text-primary-foreground hover:bg-background/20">
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </section>

      <div className="h-1 bg-secondary" />

      <section className="py-8">
        <div className="container">
          {/* Welcome Card */}
          <Card className="mb-8 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <img src={logoIcon} alt="AHORA" className="h-12 w-12" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    ¡Hola, {miSocio?.nombre || "socio"}!
                  </h2>
                  <p className="text-muted-foreground">
                    Gracias por ser parte de AHORA. Aquí tienes acceso a toda la información y herramientas exclusivas para socios.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="socios" className="w-full">
            <TabsList className="grid w-full max-w-3xl grid-cols-5 mb-6">
              <TabsTrigger value="socios" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Socios</span>
              </TabsTrigger>
              <TabsTrigger value="votaciones" className="flex items-center gap-2">
                <Vote className="h-4 w-4" />
                <span className="hidden sm:inline">Votaciones</span>
              </TabsTrigger>
              <TabsTrigger value="eventos" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Eventos</span>
              </TabsTrigger>
              <TabsTrigger value="documentos" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Documentos</span>
              </TabsTrigger>
              <TabsTrigger value="cuenta" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                <span className="hidden sm:inline">Mi cuenta</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab Socios Activos */}
            <TabsContent value="socios">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Socios Activos
                  </CardTitle>
                  <CardDescription>
                    Lista de todos los socios activos de la asociación
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : socios.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No hay socios activos registrados
                    </p>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {socios.map((socio) => (
                        <div 
                          key={socio.id} 
                          className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="p-2 bg-primary/10 rounded-full">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {socio.nombre} {socio.apellidos}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Socio desde {format(new Date(socio.fecha_alta), "MMM yyyy", { locale: es })}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-secondary/20 text-secondary-foreground">
                            {socio.tipo_cuota === "reducida" ? "Reducida" : "Normal"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Votaciones */}
            <TabsContent value="votaciones">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Vote className="h-5 w-5" />
                    Votaciones
                  </CardTitle>
                  <CardDescription>
                    Participa en las votaciones activas de la asociación
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : votaciones.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No hay votaciones disponibles
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {votaciones.map((votacion) => {
                        const activa = isVotacionActiva(votacion);
                        const yaVotado = misVotos.includes(votacion.id);
                        const opcionesVotacion = opciones.filter(o => o.votacion_id === votacion.id);
                        
                        return (
                          <div 
                            key={votacion.id} 
                            className={`p-4 rounded-lg border ${activa ? 'border-primary/30 bg-primary/5' : 'bg-muted/30'}`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-lg">{votacion.titulo}</h3>
                                {votacion.descripcion && (
                                  <p className="text-muted-foreground text-sm mt-1">
                                    {votacion.descripcion}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                {activa ? (
                                  <Badge className="bg-green-500">Activa</Badge>
                                ) : new Date(votacion.fecha_fin) < new Date() ? (
                                  <Badge variant="secondary">Finalizada</Badge>
                                ) : (
                                  <Badge variant="outline">Próximamente</Badge>
                                )}
                                {yaVotado && (
                                  <Badge variant="outline" className="bg-green-100 text-green-800">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Votado
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {format(new Date(votacion.fecha_inicio), "d MMM", { locale: es })} - {format(new Date(votacion.fecha_fin), "d MMM yyyy", { locale: es })}
                              </span>
                            </div>

                            {activa && !yaVotado && opcionesVotacion.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                                {opcionesVotacion.map((opcion) => (
                                  <Button
                                    key={opcion.id}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleVotar(votacion.id, opcion.id)}
                                    disabled={voting === votacion.id}
                                  >
                                    {voting === votacion.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : null}
                                    {opcion.texto}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Eventos */}
            <TabsContent value="eventos">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Próximos Eventos
                  </CardTitle>
                  <CardDescription>
                    Eventos y actividades programadas para socios
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : eventos.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No hay eventos programados próximamente
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {eventos.map((evento) => (
                        <div 
                          key={evento.id} 
                          className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-14 h-14 bg-primary/10 rounded-lg flex flex-col items-center justify-center">
                              <span className="text-xl font-bold text-primary">
                                {format(new Date(evento.fecha), "d", { locale: es })}
                              </span>
                              <span className="text-xs text-primary uppercase">
                                {format(new Date(evento.fecha), "MMM", { locale: es })}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{evento.titulo}</h3>
                              {evento.descripcion && (
                                <p className="text-muted-foreground text-sm mt-1">
                                  {evento.descripcion}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {format(new Date(evento.fecha), "HH:mm", { locale: es })}
                                </span>
                                {evento.ubicacion && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {evento.ubicacion}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Documentos */}
            <TabsContent value="documentos">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documentación Interna
                  </CardTitle>
                  <CardDescription>
                    Documentos y recursos exclusivos para socios
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : documentos.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No hay documentos disponibles
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {documentos.map((documento) => (
                        <div 
                          key={documento.id} 
                          className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="p-3 bg-primary/10 rounded-lg">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{documento.titulo}</h3>
                            {documento.descripcion && (
                              <p className="text-sm text-muted-foreground truncate">
                                {documento.descripcion}
                              </p>
                            )}
                            {documento.categoria && (
                              <Badge variant="outline" className="mt-1">
                                {documento.categoria}
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a href={documento.archivo_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-2" />
                              Descargar
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Mi Cuenta */}
            <TabsContent value="cuenta">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Cambiar Contraseña
                  </CardTitle>
                  <CardDescription>
                    Actualiza tu contraseña de acceso
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Nueva contraseña</Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          disabled={changingPassword}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repite la contraseña"
                        disabled={changingPassword}
                      />
                    </div>
                    <Button type="submit" disabled={changingPassword || !newPassword || !confirmPassword}>
                      {changingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Cambiar contraseña
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
};

export default PanelSocios;
