import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  type StripeEnv,
  createStripeClient,
  getStripeErrorMessage,
} from "@/lib/stripe.server";

const ZERO_DECIMAL = new Set(["bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf"]);

/** Converts a Stripe minor-unit amount into the currency's major unit. */
export function toMajor(amount: number | null | undefined, currency: string): number {
  const value = amount ?? 0;
  return ZERO_DECIMAL.has((currency ?? "").toLowerCase()) ? value : value / 100;
}

export type FinanceOverview = {
  currency: string;
  totalCollected: number;
  refunded: number;
  netCollected: number;
  thisMonth: number;
  lastMonth: number;
  last12Months: { month: string; amount: number }[];
  payments: { succeeded: number; failed: number; refunds: number };
  memberships: {
    active: number;
    trialing: number;
    canceled: number;
    pastDue: number;
    monthly: number;
    annual: number;
    manual: number;
  };
  recent: {
    id: string;
    created: string;
    email: string | null;
    description: string;
    amount: number;
    currency: string;
    status: string;
    refunded: boolean;
  }[];
  error?: string;
};

function monthKey(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Money and membership overview for administrators. */
export const adminFinanceOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<FinanceOverview> => {
    const { data: isAdmin } = await (context.supabase as any).rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Administrator access required.");

    const empty: FinanceOverview = {
      currency: "usd",
      totalCollected: 0,
      refunded: 0,
      netCollected: 0,
      thisMonth: 0,
      lastMonth: 0,
      last12Months: [],
      payments: { succeeded: 0, failed: 0, refunds: 0 },
      memberships: {
        active: 0,
        trialing: 0,
        canceled: 0,
        pastDue: 0,
        monthly: 0,
        annual: 0,
        manual: 0,
      },
      recent: [],
    };

    // Memberships come from our own records so manual grants are included.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: subs } = await (supabaseAdmin as any)
      .from("subscriptions")
      .select("status, plan_interval, provider, current_period_end");
    const now = Date.now();
    for (const s of subs ?? []) {
      const live = !s.current_period_end || new Date(s.current_period_end).getTime() > now;
      if (s.status === "active" && live) empty.memberships.active += 1;
      if (s.status === "trialing" && live) empty.memberships.trialing += 1;
      if (s.status === "canceled") empty.memberships.canceled += 1;
      if (s.status === "past_due") empty.memberships.pastDue += 1;
      if (s.plan_interval === "annual") empty.memberships.annual += 1;
      else empty.memberships.monthly += 1;
      if (s.provider === "manual") empty.memberships.manual += 1;
    }

    try {
      const stripe = createStripeClient(data.environment);

      const since = new Date();
      since.setUTCMonth(since.getUTCMonth() - 11, 1);
      since.setUTCHours(0, 0, 0, 0);

      const byMonth = new Map<string, number>();
      const thisKey = monthKey(new Date());
      const lastDate = new Date();
      lastDate.setUTCMonth(lastDate.getUTCMonth() - 1);
      const lastKey = monthKey(lastDate);

      let startingAfter: string | undefined;
      let pages = 0;
      const recent: FinanceOverview["recent"] = [];

      while (pages < 10) {
        const page = await stripe.charges.list({
          limit: 100,
          created: { gte: Math.floor(since.getTime() / 1000) },
          ...(startingAfter ? { starting_after: startingAfter } : {}),
        });
        for (const charge of page.data) {
          const currency = charge.currency ?? "usd";
          empty.currency = currency;
          const amount = toMajor(charge.amount, currency);
          const refunded = toMajor(charge.amount_refunded, currency);

          if (charge.status === "succeeded" && charge.paid) {
            empty.payments.succeeded += 1;
            empty.totalCollected += amount;
            const key = monthKey(new Date(charge.created * 1000));
            byMonth.set(key, (byMonth.get(key) ?? 0) + amount);
          } else if (charge.status === "failed") {
            empty.payments.failed += 1;
          }
          if (refunded > 0) {
            empty.refunded += refunded;
            empty.payments.refunds += 1;
          }

          if (recent.length < 25) {
            recent.push({
              id: charge.id,
              created: new Date(charge.created * 1000).toISOString(),
              email: charge.billing_details?.email ?? charge.receipt_email ?? null,
              description: charge.description ?? "HVAC Pro membership",
              amount,
              currency,
              status: charge.status ?? "unknown",
              refunded: refunded > 0,
            });
          }
        }
        if (!page.has_more) break;
        startingAfter = page.data[page.data.length - 1]?.id;
        if (!startingAfter) break;
        pages += 1;
      }

      empty.netCollected = empty.totalCollected - empty.refunded;
      empty.thisMonth = byMonth.get(thisKey) ?? 0;
      empty.lastMonth = byMonth.get(lastKey) ?? 0;
      empty.last12Months = [...byMonth.entries()]
        .sort((a, b) => (a[0] < b[0] ? 1 : -1))
        .slice(0, 12)
        .map(([month, amount]) => ({ month, amount }));
      empty.recent = recent;
      return empty;
    } catch (error) {
      return { ...empty, error: getStripeErrorMessage(error) };
    }
  });

export const adminFinanceQuery = (enabled: boolean, environment: StripeEnv) =>
  queryOptions({
    queryKey: ["admin", "finance", environment],
    queryFn: () => adminFinanceOverview({ data: { environment } }),
    enabled,
    staleTime: 60 * 1000,
  });
