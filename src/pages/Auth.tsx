import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { z } from "zod";

type AuthMode = "login" | "reset" | "set-password";

const authSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

// Helpers to detect password recovery flows
function getRecoveryParamsFromURL(): { tokenHash?: string; isRecovery: boolean } {
  const searchParams = new URLSearchParams(window.location.search);
  const searchType = searchParams.get("type");
  const tokenHash = searchParams.get("token_hash") || undefined;

  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const hashType = hashParams.get("type");
  const hasAccessToken = hashParams.has("access_token");

  const isRecovery =
    hashType === "recovery" ||
    searchType === "recovery" ||
    (hasAccessToken && hashType === "recovery") ||
    (!!tokenHash && searchType === "recovery");

  return { tokenHash, isRecovery };
}

function checkIsRecoveryFromURL(): boolean {
  return getRecoveryParamsFromURL().isRecovery;
}

const Auth = () => {
  const initialRecoveryParams = useMemo(() => getRecoveryParamsFromURL(), []);
  const initialRecoveryMode = initialRecoveryParams.isRecovery;
  const needsOtpVerification = !!initialRecoveryParams.tokenHash;

  // Use ref to persist recovery state across all callbacks
  const isRecoveryModeRef = useRef(initialRecoveryMode);

  const [mode, setMode] = useState<AuthMode>(initialRecoveryMode ? "set-password" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyingRecovery, setVerifyingRecovery] = useState(needsOtpVerification);
  const [checkingSession, setCheckingSession] = useState(!initialRecoveryMode); // Skip session check if recovery
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!needsOtpVerification) return;

    const { tokenHash } = initialRecoveryParams;
    if (!tokenHash) {
      setVerifyingRecovery(false);
      return;
    }

    let cancelled = false;

    const verify = async () => {
      try {
        const { error } = await supabase.auth.verifyOtp({
          type: "recovery",
          token_hash: tokenHash,
        });

        if (cancelled) return;

        if (error) {
          toast({
            variant: "destructive",
            title: "Enlace inválido",
            description: "El enlace de recuperación es inválido o ha caducado.",
          });
          isRecoveryModeRef.current = false;
          setMode("login");
          window.history.replaceState(null, "", window.location.pathname);
        } else {
          // Clear the query params (token_hash/type) from URL
          window.history.replaceState(null, "", window.location.pathname);
          isRecoveryModeRef.current = true;
          setMode("set-password");
        }
      } catch (err: any) {
        if (cancelled) return;
        toast({
          variant: "destructive",
          title: "Error",
          description: err.message || "Error al verificar el enlace de recuperación",
        });
        isRecoveryModeRef.current = false;
        setMode("login");
        window.history.replaceState(null, "", window.location.pathname);
      } finally {
        if (!cancelled) setVerifyingRecovery(false);
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [needsOtpVerification, initialRecoveryParams, toast]);

  useEffect(() => {
    // If already in recovery mode, don't do anything else
    if (isRecoveryModeRef.current) {
      setCheckingSession(false);
      return;
    }

    // Only check session if NOT in recovery mode
    const checkExistingSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && !isRecoveryModeRef.current) {
          await redirectBasedOnRole(session.user.id);
        } else {
          setCheckingSession(false);
        }
      } catch (error) {
        setCheckingSession(false);
      }
    };

    checkExistingSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        isRecoveryModeRef.current = true;
        setMode("set-password");
        setCheckingSession(false);
        return;
      }

      // For SIGNED_IN event, only redirect if NOT in recovery mode
      if (event === "SIGNED_IN" && session?.user) {
        if (checkIsRecoveryFromURL() || isRecoveryModeRef.current) {
          isRecoveryModeRef.current = true;
          setMode("set-password");
          setCheckingSession(false);
          return;
        }

        // Defer any async work to avoid auth callback deadlocks
        setTimeout(() => {
          void redirectBasedOnRole(session.user.id);
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const redirectBasedOnRole = async (userId: string) => {
    // Final safety check
    if (isRecoveryModeRef.current || checkIsRecoveryFromURL()) {
      return;
    }
    
    try {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (roles?.some(r => r.role === "admin")) {
        navigate("/admin/noticias");
      } else if (roles?.some(r => r.role === "socio")) {
        navigate("/socios");
      } else {
        navigate("/");
      }
    } catch (error) {
      navigate("/");
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (password.length < 6) {
      setErrors({ password: "La contraseña debe tener al menos 6 caracteres" });
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "Las contraseñas no coinciden" });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      } else {
        toast({
          title: "Contraseña configurada",
          description: "Tu contraseña ha sido configurada correctamente.",
        });
        
        // Clear recovery mode AFTER successful password update
        isRecoveryModeRef.current = false;
        
        // Clean up URL hash
        window.history.replaceState(null, '', window.location.pathname);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await redirectBasedOnRole(user.id);
        } else {
          setMode("login");
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Error al configurar la contraseña",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (mode === "reset") {
      if (!email) {
        setErrors({ email: "Email requerido" });
        return;
      }
      setLoading(true);
      
      try {
        // Use our custom edge function that sends branded emails via Resend
        const { data, error } = await supabase.functions.invoke("send-password-reset", {
          body: { email },
        });
        
        if (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo enviar el email de recuperación",
          });
        } else {
          toast({
            title: "Email enviado",
            description: "Revisa tu bandeja de entrada para restablecer tu contraseña",
          });
          setMode("login");
        }
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: err.message || "Error al procesar la solicitud",
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast({
          variant: "destructive",
          title: "Error al iniciar sesión",
          description: error.message === "Invalid login credentials" 
            ? "Credenciales inválidas" 
            : error.message,
        });
      } else {
        toast({ title: "Bienvenido" });
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await redirectBasedOnRole(user.id);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading while verifying recovery link OR checking existing session
  if (verifyingRecovery || (checkingSession && !isRecoveryModeRef.current)) {
    return (
      <Layout>
        <section className="py-16 md:py-24">
          <div className="container max-w-md flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </section>
      </Layout>
    );
  }

  // Password setup form - shown when in recovery mode
  if (mode === "set-password") {
    return (
      <Layout>
        <section className="py-16 md:py-24">
          <div className="container max-w-md">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Configura tu contraseña</CardTitle>
                <CardDescription>
                  Crea una contraseña segura para acceder a tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nueva contraseña</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={loading}
                      autoComplete="new-password"
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={loading}
                      autoComplete="new-password"
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar contraseña
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO title="Acceso" noindex />
      <section className="py-16 md:py-24">
        <div className="container max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {mode === "login" ? "Iniciar Sesión" : "Restablecer Contraseña"}
              </CardTitle>
              <CardDescription>
                {mode === "login" 
                  ? "Accede a tu cuenta" 
                  : "Te enviaremos un email para restablecer tu contraseña"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    disabled={loading}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
                {mode === "login" && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={loading}
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mode === "login" ? "Iniciar Sesión" : "Enviar Email"}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                {mode === "login" ? (
                  <button
                    type="button"
                    onClick={() => setMode("reset")}
                    className="text-muted-foreground hover:text-primary hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="text-primary hover:underline"
                  >
                    Volver a iniciar sesión
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default Auth;
