import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  adminLoading: boolean;
  isSocio: boolean;
  socioLoading: boolean;
  isJunta: boolean;
  juntaLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);
  const [isSocio, setIsSocio] = useState(false);
  const [socioLoading, setSocioLoading] = useState(true);
  const [isJunta, setIsJunta] = useState(false);
  const [juntaLoading, setJuntaLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Set loading states BEFORE scheduling the check to prevent race condition
          setAdminLoading(true);
          setSocioLoading(true);
          setJuntaLoading(true);
          setTimeout(() => {
            checkAdminRole(session.user.id);
            checkSocioRole(session.user.id);
            checkJuntaRole(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setAdminLoading(false);
          setIsSocio(false);
          setSocioLoading(false);
          setIsJunta(false);
          setJuntaLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
        checkSocioRole(session.user.id);
        checkJuntaRole(session.user.id);
      } else {
        setAdminLoading(false);
        setSocioLoading(false);
        setJuntaLoading(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    setAdminLoading(true);
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    
    if (!error && data) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
    setAdminLoading(false);
  };

  const checkSocioRole = async (userId: string) => {
    setSocioLoading(true);
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "socio")
      .maybeSingle();
    
    if (!error && data) {
      setIsSocio(true);
    } else {
      setIsSocio(false);
    }
    setSocioLoading(false);
  };

  const checkJuntaRole = async (userId: string) => {
    setJuntaLoading(true);
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "junta")
      .maybeSingle();
    
    if (!error && data) {
      setIsJunta(true);
    } else {
      setIsJunta(false);
    }
    setJuntaLoading(false);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setIsSocio(false);
    setIsJunta(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, adminLoading, isSocio, socioLoading, isJunta, juntaLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
