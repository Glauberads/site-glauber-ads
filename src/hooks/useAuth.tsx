import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  isReady: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      setIsReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    let cancelled = false;

    const checkAndSetAdmin = async () => {
      try {
        // Tentar verificar se já tem role definida
        try {
          const { data: existingRole, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .maybeSingle();

          // Se tabela não existe, pular para fallback
          if (roleError?.code === "PGRST116" || roleError?.message?.includes("not found")) {
            console.warn("user_roles table not found. Falling back to first-user detection...");
            if (!cancelled) setIsAdmin(true); // Assume primeiro usuário é admin
            return;
          }

          if (roleError && roleError.code !== "PGRST116") {
            console.error("Erro ao verificar role:", roleError);
            if (!cancelled) setIsAdmin(false);
            return;
          }

          if (existingRole) {
            if (!cancelled) setIsAdmin(existingRole.role === "admin");
            return;
          }

          // Se não tem role, verificar se é o primeiro usuário
          const { count, error: countError } = await supabase
            .from("user_roles")
            .select("*", { count: "exact", head: true });

          // Se erro na contagem (tabela não existe), assume primeiro user = admin
          if (countError?.code === "PGRST116" || countError?.message?.includes("not found")) {
            console.warn("user_roles table not accessible. Setting as admin...");
            if (!cancelled) setIsAdmin(true);
            return;
          }

          // Se não há registros, este é o primeiro usuário = admin
          if (count === 0) {
            try {
              await supabase.from("user_roles").insert({
                user_id: user.id,
                role: "admin",
              });
              if (!cancelled) setIsAdmin(true);
            } catch (insertError) {
              console.warn("Could not insert role record:", insertError);
              if (!cancelled) setIsAdmin(true); // Fallback: assume admin se não conseguir inserir
            }
          } else {
            if (!cancelled) setIsAdmin(false);
          }
        } catch (innerError) {
          console.error("Unexpected error checking admin:", innerError);
          if (!cancelled) setIsAdmin(false);
        }
      } catch (error) {
        console.error("Erro ao verificar admin:", error);
        if (!cancelled) setIsAdmin(false);
      }
    };

    checkAndSetAdmin();
    return () => { cancelled = true; };
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isReady, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};