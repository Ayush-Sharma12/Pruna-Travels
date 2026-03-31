/* eslint-disable react-refresh/only-export-components */
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

interface SignUpPayload {
  email: string;
  password: string;
  fullName: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  adminLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (payload: SignUpPayload) => Promise<{ error: Error | null; needsEmailConfirmation: boolean }>;
  claimAdminAccess: (signupCode: string) => Promise<{ error: Error | null; success: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminLoading, setAdminLoading] = useState(false);
  const adminCheckRef = useRef(0);

  const checkAdmin = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    return !!data;
  }, []);

  const syncAdminState = useCallback(async (currentUser: User | null) => {
    const requestId = ++adminCheckRef.current;

    if (!currentUser) {
      setIsAdmin(false);
      setAdminLoading(false);
      return;
    }

    setAdminLoading(true);
    const nextIsAdmin = await checkAdmin(currentUser.id);

    if (adminCheckRef.current !== requestId) {
      return;
    }

    setIsAdmin(nextIsAdmin);
    setAdminLoading(false);
  }, [checkAdmin]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);

      void syncAdminState(currentSession?.user ?? null);
    });

    void supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
      void syncAdminState(currentSession?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [syncAdminState]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async ({ email, password, fullName }: SignUpPayload) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    return {
      error: error as Error | null,
      needsEmailConfirmation: !data.session,
    };
  };

  const claimAdminAccess = async (signupCode: string) => {
    const { data, error } = await supabase.rpc("claim_admin_access", { signup_code: signupCode });

    if (error) {
      return { error: error as Error, success: false };
    }

    const { data: authData } = await supabase.auth.getUser();
    if (authData.user) {
      await syncAdminState(authData.user);
    }

    return { error: null, success: !!data };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setAdminLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, adminLoading, signIn, signUp, claimAdminAccess, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
