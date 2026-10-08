import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CALC_BY_SLUG } from "./calculators/registry";
import { PRO_COMPUTE } from "./calculators/compute-pro";
import { FREE_COMPUTE } from "./calculators/compute-free";
import { CalcError, type CalcResult } from "./calculators/types";

/** Pro calculation: verifies HVAC Pro entitlement before computing. */
export const computeProCalculator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ slug: z.string().max(80), values: z.record(z.string(), z.union([z.number(), z.string().max(500)])) }).parse(d),
  )
  .handler(async ({ data, context }): Promise<{ result?: CalcResult; error?: string; locked?: boolean }> => {
    const meta = CALC_BY_SLUG[data.slug];
    const fn = PRO_COMPUTE[data.slug] ?? FREE_COMPUTE[data.slug];
    if (!meta || !fn) return { error: "Unknown calculator." };
    if (meta.tier === "pro") {
      const { data: pro } = await context.supabase.rpc("is_pro", { _user_id: context.userId });
      if (!pro) return { locked: true };
    }
    try {
      return { result: fn(data.values) };
    } catch (e) {
      return { error: e instanceof CalcError ? e.message : "Check your inputs." };
    }
  });

export const liveLearnerCount = createServerFn({ method: "GET" }).handler(async () => {
  const { publicDb } = await import("./hvac.server");
  const { data, error } = await publicDb().rpc("live_learner_count");
  if (error) return { count: null as number | null };
  return { count: (data as number) ?? 0 };
});

export const liveLearnersQuery = queryOptions({
  queryKey: ["live-learners"],
  queryFn: () => liveLearnerCount(),
  refetchInterval: 60_000,
  staleTime: 30_000,
});

export type TradeFact = {
  id: string; headline: string; explanation: string; example: string | null; category: string;
  learn_more_href: string | null; learn_more_label: string | null;
};

export const getTodaysFact = createServerFn({ method: "GET" }).handler(async () => {
  const { publicDb } = await import("./hvac.server");
  const { data } = await publicDb().rpc("todays_trade_fact");
  const row = (Array.isArray(data) ? data[0] : data) as TradeFact | undefined;
  return row
    ? { id: row.id, headline: row.headline, explanation: row.explanation, example: row.example, category: row.category, learn_more_href: row.learn_more_href, learn_more_label: row.learn_more_label }
    : null;
});

export const todaysFactQuery = queryOptions({ queryKey: ["todays-fact"], queryFn: () => getTodaysFact(), staleTime: 60 * 60_000 });

export const getShopUrl = createServerFn({ method: "GET" }).handler(async () => {
  const { publicDb } = await import("./hvac.server");
  const { data } = await publicDb().rpc("shop_url");
  const url = typeof data === "string" && /^https:\/\//.test(data) ? data : "https://store.welcometohvac.com/";
  return { url };
});
export const shopUrlQuery = queryOptions({ queryKey: ["shop-url"], queryFn: () => getShopUrl(), staleTime: 10 * 60_000 });
