import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { isCountryCode } from "@/lib/marketplace/locations";
import { COUNTRY_PREF_KEY } from "@/lib/marketplace/shared";

/** Preferred marketplace country: profile for signed-in users, browser storage otherwise. */
export function useCountryPref() {
  const { user, loading } = useAuth();
  const [country, setCountry] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    let active = true;
    const local = typeof window !== "undefined" ? window.localStorage.getItem(COUNTRY_PREF_KEY) : null;
    if (!user) {
      setCountry(isCountryCode(local) ? local : null);
      setReady(true);
      return;
    }
    void supabase.from("profiles").select("marketplace_country").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (!active) return;
      const saved = data?.marketplace_country ?? (isCountryCode(local) ? local : null);
      setCountry(saved);
      setReady(true);
    });
    return () => { active = false; };
  }, [user, loading]);

  const save = useCallback(async (code: string | null) => {
    setCountry(code);
    if (code) window.localStorage.setItem(COUNTRY_PREF_KEY, code);
    else window.localStorage.removeItem(COUNTRY_PREF_KEY);
    if (user) await supabase.from("profiles").update({ marketplace_country: code }).eq("id", user.id);
  }, [user]);

  return { country, ready, save };
}
