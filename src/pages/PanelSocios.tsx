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
  CalendarDays, 
  FileText, 
  User,
  Clock,
  MapPin,
  CheckCircle2,
  Download,
  Key,
  Eye,
  EyeOff,
  IdCard,
  Shield,
  Bell,
  Folder,
  ChevronRight,
  ArrowLeft,
  Home,
  ClipboardList,
  CreditCard,
  BookUser
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatInMadrid, toMadridTime } from "@/lib/timezone";
import logoWhite from "@/assets/logo-ahora-white.png";
import { AdminContactos } from "@/components/admin/AdminContactos";

type CargoJunta = 'presidente' | 'vicepresidente' | 'secretario' | 'tesorero' | 'vocal' | null;

interface Socio {
  id: string;
  user_id: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string | null;
  activo: boolean;
  tipo_cuota: string;
  tipo_pago: string;
  fecha_alta: string;
  numero_socio: string | null;
  dia_cobro: number | null;
  cargo_junta: CargoJunta;
}

interface SocioWithJunta extends Socio {
  es_junta: boolean;
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

interface VotoCount {
  opcion_id: string;
  count: number;
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

interface Notificacion {
  id: string;
  titulo: string;
  mensaje: string;
  solo_junta: boolean;
  created_at: string;
}

const PanelSocios = () => {
  const [socios, setSocios] = useState<SocioWithJunta[]>([]);
  const [miSocio, setMiSocio] = useState<Socio | null>(null);
  const [votaciones, setVotaciones] = useState<Votacion[]>([]);
  const [opciones, setOpciones] = useState<OpcionVotacion[]>([]);
  const [misVotos, setMisVotos] = useState<string[]>([]);
  const [votosCount, setVotosCount] = useState<VotoCount[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [notificacionesLeidas, setNotificacionesLeidas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [downloadingCert, setDownloadingCert] = useState<string | null>(null);
  const [currentDocPath, setCurrentDocPath] = useState<string[]>([]);
  
  // Profile edit states
  const [editNombre, setEditNombre] = useState("");
  const [editApellidos, setEditApellidos] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const { user, isSocio, isJunta, isAdmin, loading: authLoading, socioLoading, signOut } = useAuth();
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
      fetchNotificaciones(),
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
      // Populate edit fields
      setEditNombre(data.nombre);
      setEditApellidos(data.apellidos);
      setEditEmail(data.email);
      setEditTelefono(data.telefono || "");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !miSocio) return;
    
    if (!editNombre.trim() || !editApellidos.trim() || !editEmail.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Nombre, apellidos y email son obligatorios",
      });
      return;
    }
    
    setSavingProfile(true);
    
    try {
      const { error } = await supabase
        .from("socios")
        .update({
          nombre: editNombre.trim(),
          apellidos: editApellidos.trim(),
          email: editEmail.trim(),
          telefono: editTelefono.trim() || null,
        })
        .eq("id", miSocio.id);
      
      if (error) throw error;
      
      toast({ title: "Datos actualizados correctamente" });
      fetchMiSocio();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudieron actualizar los datos",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const fetchSocios = async () => {
    let data: Socio[] | null = null;
    let error: any = null;

    // Admin can access full table, junta uses secure RPC function that hides sensitive fields
    if (isAdmin) {
      const result = await supabase
        .from("socios")
        .select("*")
        .eq("activo", true)
        .order("apellidos");
      data = result.data;
      error = result.error;
    } else if (isJunta) {
      // Use secure RPC function that excludes IBAN and titular_cuenta
      const result = await supabase.rpc("get_socios_for_junta");
      if (!result.error && result.data) {
        data = (result.data as unknown as Socio[]).filter(s => s.activo).sort((a, b) => 
          a.apellidos.localeCompare(b.apellidos)
        );
      }
      error = result.error;
    }

    if (!error && data) {
      // Fetch junta roles for all socios
      const userIds = data.map(s => s.user_id);
      const { data: juntaRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "junta")
        .in("user_id", userIds);

      const juntaUserIds = new Set(juntaRoles?.map(r => r.user_id) || []);
      
      const sociosWithJunta: SocioWithJunta[] = data.map(s => ({
        ...s,
        es_junta: juntaUserIds.has(s.user_id)
      }));
      
      setSocios(sociosWithJunta);
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

      // Fetch vote counts for finished votaciones using RPC function (bypasses RLS for counts only)
      const finishedVotacionIds = votacionesData
        .filter(v => new Date(v.fecha_fin) < new Date())
        .map(v => v.id);

      if (finishedVotacionIds.length > 0) {
        const { data: voteCounts } = await supabase.rpc("get_vote_counts_for_votaciones", {
          votacion_ids: finishedVotacionIds
        });

        if (voteCounts) {
          const counts: VotoCount[] = voteCounts.map((vc: { opcion_id: string; vote_count: number }) => ({
            opcion_id: vc.opcion_id,
            count: vc.vote_count
          }));
          setVotosCount(counts);
        }
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

  const fetchNotificaciones = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("notificaciones")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setNotificaciones(data);
    }

    // Fetch read status
    const { data: leidas } = await supabase
      .from("notificaciones_leidas")
      .select("notificacion_id")
      .eq("user_id", user.id);

    if (leidas) {
      setNotificacionesLeidas(leidas.map(l => l.notificacion_id));
    }
  };

  const marcarLeida = async (notificacionId: string) => {
    if (!user || notificacionesLeidas.includes(notificacionId)) return;
    
    await supabase.from("notificaciones_leidas").insert({
      notificacion_id: notificacionId,
      user_id: user.id,
    });
    
    setNotificacionesLeidas([...notificacionesLeidas, notificacionId]);
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
      toast({ 
        title: "Voto registrado correctamente",
        description: "Puedes descargar tu certificado de voto"
      });
      setMisVotos([...misVotos, votacionId]);
      // Auto download certificate after voting
      handleDownloadCertificado(votacionId);
    }
    
    setVoting(null);
  };

  const handleDownloadCertificado = async (votacionId: string) => {
    if (!user) return;
    
    setDownloadingCert(votacionId);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No hay sesión activa");
      }

      const response = await supabase.functions.invoke("certificado-voto", {
        body: { votacion_id: votacionId },
      });

      if (response.error) {
        throw new Error(response.error.message || "Error al generar certificado");
      }

      const { html, certificado_id } = response.data;

      // Open certificate in new window for printing/saving
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        // Add print button functionality
        printWindow.document.body.insertAdjacentHTML(
          "beforeend",
          `<div style="position:fixed;bottom:20px;right:20px;display:flex;gap:10px;z-index:1000;">
            <button onclick="window.print()" style="padding:12px 24px;background:#1e3a8a;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;">
              Imprimir / Guardar PDF
            </button>
          </div>`
        );
      }

      toast({ title: "Certificado generado", description: `ID: ${certificado_id}` });
    } catch (error: any) {
      console.error("Error downloading certificate:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo generar el certificado",
      });
    } finally {
      setDownloadingCert(null);
    }
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
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-bold text-foreground">
                      ¡Hola, {miSocio?.nombre || "socio"}!
                    </h2>
                    {isJunta && (
                      <Badge variant="outline" className="border-primary text-primary">
                        <Shield className="h-3 w-3 mr-1" />
                        Junta Directiva
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">
                    Gracias por ser parte de AHORA. Aquí tienes acceso a toda la información y herramientas exclusivas para socios.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="carnet" className="w-full">
            <TabsList className="flex w-full justify-center mb-6 h-auto gap-1 p-1 flex-wrap">
              <TabsTrigger value="carnet" className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm shrink-0">
                <IdCard className="h-4 w-4 shrink-0" />
                <span>Carnet</span>
              </TabsTrigger>
              {(isJunta || isAdmin) && (
                <TabsTrigger value="socios" className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm shrink-0">
                  <Users className="h-4 w-4 shrink-0" />
                  <span>Socios</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="votaciones" className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm shrink-0">
                <ClipboardList className="h-4 w-4 shrink-0" />
                <span>Votaciones</span>
              </TabsTrigger>
              <TabsTrigger value="eventos" className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm shrink-0">
                <CalendarDays className="h-4 w-4 shrink-0" />
                <span>Eventos</span>
              </TabsTrigger>
              <TabsTrigger value="documentos" className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm shrink-0">
                <FileText className="h-4 w-4 shrink-0" />
                <span>Documentos</span>
              </TabsTrigger>
              {(isAdmin || miSocio?.cargo_junta === 'presidente' || miSocio?.cargo_junta === 'vicepresidente') && (
                <TabsTrigger value="contactos" className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm shrink-0">
                  <BookUser className="h-4 w-4 shrink-0" />
                  <span>Contactos</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="cuenta" className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm shrink-0">
                <User className="h-4 w-4 shrink-0" />
                <span>Mi cuenta</span>
              </TabsTrigger>
              <TabsTrigger value="avisos" className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm relative shrink-0">
                <Bell className="h-4 w-4 shrink-0" />
                <span>Avisos</span>
                {notificaciones.filter(n => !notificacionesLeidas.includes(n.id)).length > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-destructive rounded-full text-[10px] text-destructive-foreground flex items-center justify-center font-medium leading-none">
                    {notificaciones.filter(n => !notificacionesLeidas.includes(n.id)).length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Tab Carnet Digital */}
            <TabsContent value="carnet">
              <div className="flex justify-center">
                <div className="w-full max-w-md">
                  {/* Carnet Digital */}
                  <div className="relative aspect-[1.6/1] rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                    <div className="absolute top-4 right-4 w-16 h-16 bg-secondary/30 rounded-full opacity-50" />
                    
                    {/* Content */}
                    <div className="relative h-full p-6 flex flex-col justify-between">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <img src={logoWhite} alt="AHORA" className="h-10" />
                        <div className="text-right">
                          <p className="text-primary-foreground/70 text-xs uppercase tracking-wider">Carnet de Socio</p>
                          <p className="text-secondary font-bold text-lg font-mono">
                            {miSocio?.numero_socio || "---"}
                          </p>
                        </div>
                      </div>
                      
                      {/* Member Info */}
                      <div className="mt-auto">
                        <p className="text-primary-foreground text-xl font-bold tracking-wide">
                          {miSocio ? `${miSocio.nombre} ${miSocio.apellidos}` : "Cargando..."}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div>
                            <p className="text-primary-foreground/60 text-xs uppercase">Miembro desde</p>
                            <p className="text-primary-foreground/90 text-sm font-medium">
                              {miSocio ? formatInMadrid(miSocio.fecha_alta, "MMMM yyyy") : "---"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-primary-foreground/60 text-xs uppercase">Tipo</p>
                            <p className="text-secondary text-sm font-semibold">
                              {miSocio?.tipo_cuota === "reducida" ? "Reducida" : "Normal"}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Bottom decoration */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary" />
                    </div>
                  </div>
                  
                  {/* Card description */}
                  <p className="text-center text-muted-foreground text-sm mt-6">
                    Tu carnet digital de socio de AHORA
                  </p>
                  
                  {/* Payment Info Card */}
                  <Card className="mt-6 border-secondary/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Información de cuota
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(() => {
                        const socioData = miSocio as any;
                        const tipoPago = socioData?.tipo_pago || "mensual";
                        const diaCobro = socioData?.dia_cobro || 1;
                        const fechaAlta = socioData?.fecha_alta ? new Date(socioData.fecha_alta) : new Date();
                        const importe = tipoPago === "anual" ? 50 : 5;
                        
                        // Calculate next billing date
                        const calcularProximoCobro = () => {
                          const hoy = new Date();
                          
                          if (tipoPago === "anual") {
                            // For annual: next billing is the anniversary of fecha_alta
                            const mesAlta = fechaAlta.getMonth();
                            const anioActual = hoy.getFullYear();
                            let proximaFecha = new Date(anioActual, mesAlta, diaCobro);
                            
                            // If that date has passed this year, go to next year
                            if (proximaFecha <= hoy) {
                              proximaFecha = new Date(anioActual + 1, mesAlta, diaCobro);
                            }
                            return proximaFecha;
                          } else {
                            // For monthly: next billing is the dia_cobro of current or next month
                            const mesActual = hoy.getMonth();
                            const anioActual = hoy.getFullYear();
                            let proximaFecha = new Date(anioActual, mesActual, diaCobro);
                            
                            // If that date has passed this month, go to next month
                            if (proximaFecha <= hoy) {
                              proximaFecha = new Date(anioActual, mesActual + 1, diaCobro);
                            }
                            return proximaFecha;
                          }
                        };
                        
                        const proximoCobro = calcularProximoCobro();
                        const diasRestantes = Math.ceil((proximoCobro.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        
                        return (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground text-sm">Tipo de pago:</span>
                              <Badge variant="outline">
                                {tipoPago === "anual" ? "Anual" : "Mensual"}
                              </Badge>
                            </div>
                            
                            {/* Next billing highlight */}
                            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <CalendarDays className="h-4 w-4 text-primary" />
                                  <span className="font-medium">Próximo cobro</span>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {diasRestantes === 0 ? "Hoy" : diasRestantes === 1 ? "Mañana" : `En ${diasRestantes} días`}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-primary">
                                  {formatInMadrid(proximoCobro, "d 'de' MMMM yyyy")}
                                </span>
                                <span className="text-xl font-bold text-foreground">
                                  {importe.toFixed(2).replace(".", ",")} €
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-xs text-muted-foreground text-center">
                              {tipoPago === "anual" 
                                ? `Cobro anual el día ${diaCobro} del mes de ${formatInMadrid(fechaAlta, "MMMM")}`
                                : `Cobro mensual el día ${diaCobro} de cada mes`
                              }
                            </div>
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>


            {/* Tab Socios Activos - Solo visible para Junta y Admin */}
            {(isJunta || isAdmin) && (
              <TabsContent value="socios">
                <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Socios Activos
                  </CardTitle>
                  <CardDescription>
                    Comunidad de miembros de la asociación
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Stats */}
                      <div className="flex items-center justify-center gap-8 py-4 border-b">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-primary">{socios.length}</p>
                          <p className="text-sm text-muted-foreground">socios activos</p>
                        </div>
                        <div className="text-center">
                          <p className="text-3xl font-bold text-primary">{socios.filter(s => s.es_junta).length}</p>
                          <p className="text-sm text-muted-foreground">junta directiva</p>
                        </div>
                      </div>
                      
                      {/* List */}
                      <div className="grid gap-3">
                        {socios.map((socio) => (
                          <div key={socio.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{socio.nombre} {socio.apellidos}</p>
                                {socio.numero_socio && (
                                  <p className="text-xs text-muted-foreground">Nº {socio.numero_socio}</p>
                                )}
                              </div>
                            </div>
                            {socio.es_junta && (
                              <Badge variant="outline" className="border-primary text-primary">
                                <Shield className="h-3 w-3 mr-1" />
                                Junta
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              </TabsContent>
            )}

            {/* Tab Votaciones */}
            <TabsContent value="votaciones">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
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
                        const finalizada = new Date(votacion.fecha_fin) < new Date();
                        
                        // Calculate vote percentages for finished votaciones
                        const getVotePercentage = (opcionId: string) => {
                          const opcionIds = opcionesVotacion.map(o => o.id);
                          const totalVotos = votosCount
                            .filter(v => opcionIds.includes(v.opcion_id))
                            .reduce((sum, v) => sum + v.count, 0);
                          
                          if (totalVotos === 0) return 0;
                          
                          const opcionVotos = votosCount.find(v => v.opcion_id === opcionId)?.count || 0;
                          return Math.round((opcionVotos / totalVotos) * 100);
                        };

                        const getTotalVotos = () => {
                          const opcionIds = opcionesVotacion.map(o => o.id);
                          return votosCount
                            .filter(v => opcionIds.includes(v.opcion_id))
                            .reduce((sum, v) => sum + v.count, 0);
                        };
                        
                        return (
                          <div 
                            key={votacion.id} 
                            className={`p-4 rounded-lg border ${activa ? 'border-primary/30 bg-primary/5' : 'bg-muted/30'}`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg">{votacion.titulo}</h3>
                                {votacion.descripcion && (
                                  <p className="text-muted-foreground text-sm mt-1">
                                    {votacion.descripcion}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {activa ? (
                                  <Badge className="bg-green-500">Activa</Badge>
                                ) : finalizada ? (
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
                                {formatInMadrid(votacion.fecha_inicio, "d MMM")} - {formatInMadrid(votacion.fecha_fin, "d MMM yyyy")}
                              </span>
                            </div>

                            {/* Show voting buttons for active votaciones */}
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

                            {/* Show results for finished votaciones */}
                            {finalizada && opcionesVotacion.length > 0 && (
                              <div className="mt-3 pt-3 border-t space-y-3">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-muted-foreground">
                                    Resultados ({getTotalVotos()} votos totales)
                                  </p>
                                  <div className="flex gap-2">
                                    {yaVotado && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDownloadCertificado(votacion.id)}
                                        disabled={downloadingCert === votacion.id}
                                        title="Certificado de tu voto"
                                      >
                                        {downloadingCert === votacion.id ? (
                                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                          <Download className="h-4 w-4 mr-2" />
                                        )}
                                        Mi voto
                                      </Button>
                                    )}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={async () => {
                                        try {
                                          setDownloadingCert(votacion.id);
                                          const { data, error } = await supabase.functions.invoke("certificado-resultados", {
                                            body: { votacion_id: votacion.id }
                                          });
                                          
                                          if (error) throw error;
                                          
                                          const printWindow = window.open("", "_blank");
                                          if (printWindow) {
                                            printWindow.document.write(data.html);
                                            printWindow.document.close();
                                          }
                                        } catch (err: any) {
                                          console.error("Error generating results certificate:", err);
                                          toast({
                                            variant: "destructive",
                                            title: "Error",
                                            description: "No se pudo generar el certificado de resultados"
                                          });
                                        } finally {
                                          setDownloadingCert(null);
                                        }
                                      }}
                                      disabled={downloadingCert === votacion.id}
                                      title="Certificado de resultados de la votación"
                                    >
                                      {downloadingCert === votacion.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      ) : (
                                        <FileText className="h-4 w-4 mr-2" />
                                      )}
                                      Resultados
                                    </Button>
                                  </div>
                                </div>
                                {opcionesVotacion.map((opcion) => {
                                  const percentage = getVotePercentage(opcion.id);
                                  return (
                                    <div key={opcion.id} className="space-y-1">
                                      <div className="flex justify-between text-sm">
                                        <span>{opcion.texto}</span>
                                        <span className="font-semibold">{percentage}%</span>
                                      </div>
                                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-primary rounded-full transition-all duration-500"
                                          style={{ width: `${percentage}%` }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Show certificate button for voted but not yet finished */}
                            {yaVotado && !finalizada && (
                              <div className="mt-3 pt-3 border-t">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadCertificado(votacion.id)}
                                  disabled={downloadingCert === votacion.id}
                                >
                                  {downloadingCert === votacion.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : (
                                    <Download className="h-4 w-4 mr-2" />
                                  )}
                                  Descargar Certificado de Voto
                                </Button>
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
                    <CalendarDays className="h-5 w-5" />
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
                          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                            <div className="flex-shrink-0 w-14 h-14 bg-primary/10 rounded-lg flex flex-col items-center justify-center">
                              <span className="text-xl font-bold text-primary">
                                {formatInMadrid(evento.fecha, "d")}
                              </span>
                              <span className="text-xs text-primary uppercase">
                                {formatInMadrid(evento.fecha, "MMM")}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg">{evento.titulo}</h3>
                              {evento.descripcion && (
                                <p className="text-muted-foreground text-sm mt-1 whitespace-pre-line">
                                  {evento.descripcion}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {formatInMadrid(evento.fecha, "HH:mm")}
                                </span>
                                {evento.ubicacion && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4 shrink-0" />
                                    <span className="truncate">{evento.ubicacion}</span>
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
                  ) : (() => {
                    const currentPathString = currentDocPath.join("/");
                    
                    // Get all unique folder paths
                    const getAllFolderPaths = (): string[] => {
                      const paths = new Set<string>();
                      documentos.forEach(d => {
                        if (d.categoria) {
                          const parts = d.categoria.split("/");
                          let accumulated = "";
                          parts.forEach(part => {
                            accumulated = accumulated ? `${accumulated}/${part}` : part;
                            paths.add(accumulated);
                          });
                        }
                      });
                      return Array.from(paths).sort();
                    };

                    // Get subfolders at current level
                    const getSubfolders = (): string[] => {
                      const allPaths = getAllFolderPaths();
                      const prefix = currentPathString ? `${currentPathString}/` : "";
                      
                      const subfolders = new Set<string>();
                      allPaths.forEach(path => {
                        if (currentPathString === "") {
                          const firstPart = path.split("/")[0];
                          subfolders.add(firstPart);
                        } else if (path.startsWith(prefix) && path !== currentPathString) {
                          const remainder = path.slice(prefix.length);
                          const nextFolder = remainder.split("/")[0];
                          subfolders.add(nextFolder);
                        }
                      });
                      
                      return Array.from(subfolders).sort();
                    };

                    // Get documents at current level
                    const getCurrentDocs = (): typeof documentos => {
                      return documentos.filter(d => {
                        const docPath = d.categoria || "";
                        return docPath === currentPathString;
                      });
                    };

                    // Count documents in a folder (including subfolders)
                    const getDocCountInFolder = (folderName: string): number => {
                      const folderPath = currentPathString ? `${currentPathString}/${folderName}` : folderName;
                      return documentos.filter(d => {
                        const docPath = d.categoria || "";
                        return docPath === folderPath || docPath.startsWith(`${folderPath}/`);
                      }).length;
                    };

                    const subfolders = getSubfolders();
                    const currentDocs = getCurrentDocs();

                    const navigateToFolder = (folderName: string) => {
                      setCurrentDocPath([...currentDocPath, folderName]);
                    };

                    const navigateToPathIndex = (index: number) => {
                      setCurrentDocPath(currentDocPath.slice(0, index + 1));
                    };

                    return (
                      <div className="space-y-4">
                        {/* Breadcrumb navigation */}
                        <div className="flex items-center gap-1 pb-4 border-b flex-wrap">
                          <Button 
                            variant={currentDocPath.length === 0 ? "secondary" : "ghost"}
                            size="sm" 
                            onClick={() => setCurrentDocPath([])}
                            className="gap-1"
                          >
                            <Home className="h-4 w-4" />
                            Raíz
                          </Button>
                          {currentDocPath.map((folder, index) => (
                            <div key={index} className="flex items-center gap-1">
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              <Button 
                                variant={index === currentDocPath.length - 1 ? "secondary" : "ghost"}
                                size="sm" 
                                onClick={() => navigateToPathIndex(index)}
                              >
                                {folder}
                              </Button>
                            </div>
                          ))}
                        </div>

                        {/* Subfolders */}
                        {subfolders.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Carpetas</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {subfolders.map((folder) => (
                                <button
                                  key={folder}
                                  onClick={() => navigateToFolder(folder)}
                                  className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-left"
                                >
                                  <Folder className="h-8 w-8 text-secondary" />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{folder}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {getDocCountInFolder(folder)} docs
                                    </p>
                                  </div>
                                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Documents at current level */}
                        {currentDocs.length > 0 && (
                          <div className="space-y-2">
                            {subfolders.length > 0 && (
                              <p className="text-sm font-medium text-muted-foreground pt-2">Documentos</p>
                            )}
                            <div className="space-y-3">
                              {currentDocs.map((documento) => (
                                <div 
                                  key={documento.id} 
                                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                                >
                                  <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                                      <FileText className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className="font-medium truncate">{documento.titulo}</h3>
                                      {documento.descripcion && (
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                          {documento.descripcion}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    className="w-full sm:w-auto"
                                  >
                                    <a href={documento.archivo_url} target="_blank" rel="noopener noreferrer">
                                      <Download className="h-4 w-4 mr-2" />
                                      Descargar
                                    </a>
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Empty state */}
                        {subfolders.length === 0 && currentDocs.length === 0 && (
                          <p className="text-center text-muted-foreground py-8">
                            {currentDocPath.length > 0 
                              ? "Esta carpeta está vacía"
                              : "No hay documentos disponibles"}
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Mi Cuenta */}
            <TabsContent value="cuenta">
              <div className="space-y-6">
                {/* Editar Datos Personales */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Mis Datos
                    </CardTitle>
                    <CardDescription>
                      Actualiza tu información personal
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-nombre">Nombre</Label>
                          <Input
                            id="edit-nombre"
                            value={editNombre}
                            onChange={(e) => setEditNombre(e.target.value)}
                            disabled={savingProfile}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-apellidos">Apellidos</Label>
                          <Input
                            id="edit-apellidos"
                            value={editApellidos}
                            onChange={(e) => setEditApellidos(e.target.value)}
                            disabled={savingProfile}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-email">Email</Label>
                        <Input
                          id="edit-email"
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          disabled={savingProfile}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-telefono">Teléfono</Label>
                        <Input
                          id="edit-telefono"
                          type="tel"
                          value={editTelefono}
                          onChange={(e) => setEditTelefono(e.target.value)}
                          placeholder="Opcional"
                          disabled={savingProfile}
                        />
                      </div>
                      <Button type="submit" disabled={savingProfile}>
                        {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar cambios
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Cambiar Contraseña */}
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
              </div>
            </TabsContent>

            {/* Tab Contactos - Solo presidente/vicepresidente/admin */}
            {(isAdmin || miSocio?.cargo_junta === 'presidente' || miSocio?.cargo_junta === 'vicepresidente') && (
              <TabsContent value="contactos">
                <AdminContactos />
              </TabsContent>
            )}

            {/* Tab Avisos */}
            <TabsContent value="avisos">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Comunicados de la Junta
                  </CardTitle>
                  <CardDescription>
                    Avisos y comunicaciones oficiales de la Junta Directiva
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : notificaciones.filter(n => !notificacionesLeidas.includes(n.id)).length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No hay comunicados pendientes de leer
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {notificaciones
                        .filter(n => !notificacionesLeidas.includes(n.id))
                        .map((notificacion) => (
                          <Card 
                            key={notificacion.id} 
                            className="cursor-pointer transition-all border-primary/50 bg-primary/5 hover:bg-primary/10"
                            onClick={() => marcarLeida(notificacion.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="h-2 w-2 bg-primary rounded-full" />
                                    <h3 className="font-semibold">{notificacion.titulo}</h3>
                                    {notificacion.solo_junta && (
                                      <Badge variant="outline" className="border-primary text-primary text-xs">
                                        <Shield className="h-3 w-3 mr-1" />
                                        Junta
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                                    {notificacion.mensaje}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {formatInMadrid(notificacion.created_at, "d 'de' MMMM 'de' yyyy, HH:mm")}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  )}
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
