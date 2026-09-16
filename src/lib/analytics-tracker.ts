import { supabase } from "@/integrations/supabase/client";

const KEY = "wth_session_id";

/** Stable per-browser-session visitor id (not personal data). */
export function visitorSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = window.sessionStorage.getItem(KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `s-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    window.sessionStorage.setItem(KEY, id);
  }
  return id;
}

export async function pingPresence(path: string) {
  const sessionId = visitorSessionId();
  if (!sessionId) return;
  await supabase.rpc("presence_ping", { _session_id: sessionId, _path: path });
}

export async function recordPageView(path: string) {
  const sessionId = visitorSessionId();
  if (!sessionId) return;
  const { data } = await supabase.auth.getSession();
  await supabase.from("analytics_events").insert({
    event: "page_view",
    user_id: data.session?.user?.id ?? null,
    metadata: { path, session_id: sessionId },
  });
}
