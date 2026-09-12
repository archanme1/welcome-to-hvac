import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

type AuthValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPro: boolean;
  isStaff: boolean;
  username: string | null;
  refreshProfile: () => Promise<void>;
  refreshEntitlements: () => Promise<boolean>;
};

const AuthContext = createContext<AuthValue>({
  user: null,
  session: null,
  loading: true,
  isPro: false,
  isStaff: false,
  username: null,
  refreshProfile: async () => {},
  refreshEntitlements: async () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadEntitlements = async (userId: string | undefined) => {
      if (!userId) {
        if (active) {
          setIsPro(false);
          setIsStaff(false);
          setUsername(null);
        }
        return;
      }
      const [roles, pro, profile] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.rpc("is_pro", { _user_id: userId }),
        supabase.from("profiles").select("username").eq("id", userId).maybeSingle(),
      ]);
      if (!active) return;
      setUsername(profile.data?.username ?? null);
      const staff = (roles.data ?? []).some((r) => r.role === "admin" || r.role === "editor");
      setIsStaff(staff);
      setIsPro(!!pro.data || staff);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
      void loadEntitlements(nextSession?.user?.id);
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
      void loadEntitlements(data.session?.user?.id);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  /** Re-reads membership from the database. Returns the fresh Pro state. */
  const refreshEntitlements = async (): Promise<boolean> => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return false;
    const { data } = await supabase.rpc("is_pro", { _user_id: userId });
    const pro = !!data;
    setIsPro(pro);
    return pro;
  };


  const refreshProfile = async () => {
    const userId = session?.user?.id;
    if (!userId) return;
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .maybeSingle();
    setUsername(data?.username ?? null);
  };

  const value = useMemo<AuthValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      isPro,
      isStaff,
      username,
      refreshProfile,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, loading, isPro, isStaff, username],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
