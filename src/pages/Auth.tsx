import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
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

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  
  // Use ref to track recovery mode across renders and in callbacks
  const isRecoveryModeRef = useRef(false);
  
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // FIRST: Check URL for recovery parameters BEFORE anything else
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");
    const accessToken = hashParams.get("access_token");
    
    const searchParams = new URLSearchParams(window.location.search);
    const searchType = searchParams.get("type");
    
    console.log("URL check - Hash type:", type, "Search type:", searchType, "Has token:", !!accessToken);
    
    // If recovery token detected, set mode immediately and don't redirect
    if (type === "recovery" || searchType === "recovery") {
      console.log("Recovery mode detected - showing password form");
      isRecoveryModeRef.current = true;
      setMode("set-password");
      setCheckingSession(false);
      return; // Don't do anything else
    }

    // Only check session if NOT in recovery mode
    const checkExistingSession = async () => {
      if (isRecoveryModeRef.current) {
        setCheckingSession(false);
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await redirectBasedOnRole(session.user.id);
      } else {
        setCheckingSession(false);
      }
    };

    checkExistingSession();

    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event, "Recovery mode:", isRecoveryModeRef.current);
      
      if (event === "PASSWORD_RECOVERY") {
        console.log("PASSWORD_RECOVERY event - showing password form");
        isRecoveryModeRef.current = true;
        setMode("set-password");
        setCheckingSession(false);
      } else if (event === "SIGNED_IN" && session?.user) {
        // Only auto-redirect if NOT in recovery mode
        if (!isRecoveryModeRef.current) {
          await redirectBasedOnRole(session.user.id);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const redirectBasedOnRole = async (userId: string) => {
    // Double check we're not in recovery mode
    if (isRecoveryModeRef.current) {
      console.log("Skipping redirect - in recovery mode");
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
      console.error("Error checking roles:", error);
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
        
        // Clear recovery mode and redirect
        isRecoveryModeRef.current = false;
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await redirectBasedOnRole(user.id);
        } else {
          setMode("login");
          setCheckingSession(false);
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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      setLoading(false);
      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      } else {
        toast({
          title: "Email enviado",
          description: "Revisa tu bandeja de entrada para restablecer tu contraseña",
        });
        setMode("login");
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

  if (checkingSession) {
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

  // Password setup form
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
