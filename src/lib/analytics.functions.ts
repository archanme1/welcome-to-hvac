import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { supabase: any; userId: string };

async function assertAdmin(context: Ctx) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Administrator access required.");
}

const LIVE_WINDOW_MINUTES = 5;

export type LiveVisitors = {
  live: number;
  signedIn: number;
  anonymous: number;
  pages: { path: string; count: number }[];
};

export const adminLiveVisitors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LiveVisitors> => {
    await assertAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - LIVE_WINDOW_MINUTES * 60_000).toISOString();

    const { data } = await (supabaseAdmin as any)
      .from("visitor_presence")
      .select("session_id, user_id, path")
      .gte("last_seen", since)
      .limit(5000);

    const rows = (data ?? []) as { session_id: string; user_id: string | null; path: string | null }[];
    const byPath = new Map<string, number>();
    let signedIn = 0;
    for (const r of rows) {
      if (r.user_id) signedIn += 1;
      const p = r.path || "/";
      byPath.set(p, (byPath.get(p) ?? 0) + 1);
    }

    return {
      live: rows.length,
      signedIn,
      anonymous: rows.length - signedIn,
      pages: [...byPath.entries()]
        .map(([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };
  });

export const liveVisitorsQuery = (enabled: boolean) =>
  queryOptions({
    queryKey: ["admin", "live-visitors"],
    queryFn: () => adminLiveVisitors(),
    enabled,
    refetchInterval: 20_000,
  });

export type AnalyticsSummary = {
  from: string;
  to: string;
  totals: {
    views: number;
    visitors: number;
    signups: number;
    searches: number;
    newMembers: number;
  };
  series: { day: string; views: number; visitors: number }[];
  topPages: { path: string; views: number }[];
  topSearches: { query: string; count: number }[];
  events: { event: string; count: number }[];
  signupSeries: { day: string; signups: number }[];
};

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

export const adminAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { from: string; to: string }) => data)
  .handler(async ({ data, context }): Promise<AnalyticsSummary> => {
    await assertAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;

    const from = new Date(`${data.from}T00:00:00.000Z`).toISOString();
    const to = new Date(`${data.to}T23:59:59.999Z`).toISOString();

    const [eventsRes, profilesRes, subsRes] = await Promise.all([
      db
        .from("analytics_events")
        .select("event, query, metadata, created_at")
        .gte("created_at", from)
        .lte("created_at", to)
        .order("created_at", { ascending: true })
        .limit(50000),
      db.from("profiles").select("created_at").gte("created_at", from).lte("created_at", to),
      db.from("subscriptions").select("created_at").gte("created_at", from).lte("created_at", to),
    ]);

    const rows = (eventsRes.data ?? []) as {
      event: string;
      query: string | null;
      metadata: any;
      created_at: string;
    }[];

    const days: string[] = [];
    for (
      let d = new Date(`${data.from}T00:00:00.000Z`);
      dayKey(d.toISOString()) <= data.to;
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      days.push(dayKey(d.toISOString()));
      if (days.length > 400) break;
    }

    const viewsByDay = new Map<string, number>();
    const visitorsByDay = new Map<string, Set<string>>();
    const pages = new Map<string, number>();
    const searches = new Map<string, number>();
    const events = new Map<string, number>();
    const allVisitors = new Set<string>();
    let views = 0;
    let searchCount = 0;

    for (const r of rows) {
      const day = dayKey(r.created_at);
      events.set(r.event, (events.get(r.event) ?? 0) + 1);
      const session = String(r.metadata?.session_id ?? "");
      if (session) {
        allVisitors.add(session);
        if (!visitorsByDay.has(day)) visitorsByDay.set(day, new Set());
        visitorsByDay.get(day)!.add(session);
      }
      if (r.event === "page_view") {
        views += 1;
        viewsByDay.set(day, (viewsByDay.get(day) ?? 0) + 1);
        const path = String(r.metadata?.path ?? "/");
        pages.set(path, (pages.get(path) ?? 0) + 1);
      }
      if (r.event === "search" && r.query) {
        searchCount += 1;
        const q = r.query.trim().toLowerCase();
        if (q) searches.set(q, (searches.get(q) ?? 0) + 1);
      }
    }

    const signupsByDay = new Map<string, number>();
    for (const p of (profilesRes.data ?? []) as { created_at: string }[]) {
      const day = dayKey(p.created_at);
      signupsByDay.set(day, (signupsByDay.get(day) ?? 0) + 1);
    }

    return {
      from: data.from,
      to: data.to,
      totals: {
        views,
        visitors: allVisitors.size,
        signups: (profilesRes.data ?? []).length,
        searches: searchCount,
        newMembers: (subsRes.data ?? []).length,
      },
      series: days.map((day) => ({
        day,
        views: viewsByDay.get(day) ?? 0,
        visitors: visitorsByDay.get(day)?.size ?? 0,
      })),
      signupSeries: days.map((day) => ({ day, signups: signupsByDay.get(day) ?? 0 })),
      topPages: [...pages.entries()]
        .map(([path, v]) => ({ path, views: v }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 15),
      topSearches: [...searches.entries()]
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15),
      events: [...events.entries()]
        .map(([event, count]) => ({ event, count }))
        .sort((a, b) => b.count - a.count),
    };
  });

export const analyticsQuery = (enabled: boolean, from: string, to: string) =>
  queryOptions({
    queryKey: ["admin", "analytics", from, to],
    queryFn: () => adminAnalytics({ data: { from, to } }),
    enabled,
  });
