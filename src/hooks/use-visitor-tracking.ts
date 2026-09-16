import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

import { pingPresence, recordPageView } from "@/lib/analytics-tracker";

const PING_MS = 45_000;

/** Records page views and keeps a live-visitor heartbeat while the tab is visible. */
export function useVisitorTracking() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname.startsWith("/admin")) return;

    let cancelled = false;
    const beat = () => {
      if (cancelled || document.visibilityState === "hidden") return;
      void pingPresence(pathname).catch(() => {});
    };

    void recordPageView(pathname).catch(() => {});
    beat();
    const timer = window.setInterval(beat, PING_MS);
    document.addEventListener("visibilitychange", beat);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", beat);
    };
  }, [pathname]);
}
