import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  type StripeEnv,
  createStripeClient,
  getStripeErrorMessage,
} from "@/lib/stripe.server";

type CheckoutSessionResult = { clientSecret: string } | { error: string };
type PortalSessionResult = { url: string } | { error: string };

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string | undefined; userId?: string | undefined },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length && found.data[0]) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    const customer = existing.data[0];
    if (customer) {
      if (options.userId && customer.metadata?.["userId"] !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

const TRIAL_DAYS = 7;

/** Starts an HVAC Pro checkout for the signed-in user. */
export const createProCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { priceId: string; returnUrl: string; environment: StripeEnv }) => {
      if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) throw new Error("Invalid priceId");
      return data;
    },
  )
  .handler(async ({ data, context }): Promise<CheckoutSessionResult> => {
    try {
      const { supabase, userId } = context;

      // Never let an existing member buy a second time.
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("status, current_period_end")
        .eq("user_id", userId)
        .in("status", ["active", "trialing"])
        .limit(5);
      const stillActive = (existing ?? []).some(
        (s: { status: string; current_period_end: string | null }) =>
          !s.current_period_end || new Date(s.current_period_end) > new Date(),
      );
      if (stillActive) {
        return { error: "You already have an active HVAC Pro membership." };
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const stripe = createStripeClient(data.environment);

      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      const stripePrice = prices.data[0];
      if (!stripePrice) throw new Error("Price not found");

      const customerId = await resolveOrCreateCustomer(stripe, {
        email: user?.email,
        userId,
      });

      // Only first-time subscribers get the free trial.
      const priorSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 1,
      });
      const trialEligible = priorSubs.data.length === 0;

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: stripePrice.id, quantity: 1 }],
        mode: "subscription",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer: customerId,
        metadata: { userId, managed_payments: "true" },
        subscription_data: {
          metadata: { userId },
          ...(trialEligible ? { trial_period_days: TRIAL_DAYS } : {}),
        },
        managed_payments: { enabled: true },
      } as any);

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });


/** Opens the billing portal so a subscriber can change or cancel their plan. */
export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl?: string; environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<PortalSessionResult> => {
    const { supabase, userId } = context;

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("provider_customer_id")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub?.provider_customer_id) return { error: "No subscription found" };

    try {
      const stripe = createStripeClient(data.environment);
      const portal = await stripe.billingPortal.sessions.create({
        customer: sub.provider_customer_id,
        ...(data.returnUrl && { return_url: data.returnUrl }),
      });
      return { url: portal.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

type SyncResult = { pro: boolean; synced: boolean; error?: string };

/**
 * Safety net: asks Stripe directly for this member's subscriptions and repairs
 * the local record when a webhook was missed or delayed.
 */
export const syncMySubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<SyncResult> => {
    const { supabase, userId } = context;
    try {
      const stripe = createStripeClient(data.environment);

      const found = await stripe.customers.search({
        query: `metadata['userId']:'${userId}'`,
        limit: 1,
      });
      const customerId = found.data[0]?.id;
      if (!customerId) {
        const { data: pro } = await supabase.rpc("is_pro", { _user_id: userId });
        return { pro: !!pro, synced: false };
      }

      const subs = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 10,
      });

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const db = supabaseAdmin as any;

      for (const sub of subs.data) {
        const item = (sub as any).items?.data?.[0];
        const periodStart = item?.current_period_start ?? (sub as any).current_period_start;
        const periodEnd = item?.current_period_end ?? (sub as any).current_period_end;
        const status = ["active", "trialing", "past_due", "canceled"].includes(sub.status)
          ? sub.status
          : "canceled";

        const row = {
          user_id: userId,
          status,
          plan_interval: item?.price?.recurring?.interval === "year" ? "annual" : "monthly",
          price_id:
            item?.price?.lookup_key ?? item?.price?.metadata?.["lovable_external_id"] ?? item?.price?.id ?? null,
          provider: "stripe",
          provider_customer_id: customerId,
          provider_subscription_id: sub.id,
          current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
          current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          cancel_at_period_end: (sub as any).cancel_at_period_end ?? false,
          environment: data.environment,
          updated_at: new Date().toISOString(),
        };

        const existing = await db
          .from("subscriptions")
          .select("id")
          .eq("provider_subscription_id", sub.id)
          .maybeSingle();

        if (existing.data?.id) {
          await db.from("subscriptions").update(row).eq("id", existing.data.id);
        } else {
          await db.from("subscriptions").insert(row);
        }
      }

      const { data: pro } = await supabase.rpc("is_pro", { _user_id: userId });
      return { pro: !!pro, synced: true };
    } catch (error) {
      return { pro: false, synced: false, error: getStripeErrorMessage(error) };
    }
  });

type BillingSummary = {
  pro: boolean;
  status: string | null;
  planInterval: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  provider: string | null;
  managed: boolean;
};

/** Everything the account page needs to describe the member's plan. */
export const getBillingSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BillingSummary> => {
    const { supabase, userId } = context;
    const [{ data: pro }, { data: rows }] = await Promise.all([
      supabase.rpc("is_pro", { _user_id: userId }),
      supabase
        .from("subscriptions")
        .select("status, plan_interval, current_period_end, cancel_at_period_end, provider")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);
    const sub = (rows ?? [])[0] as
      | {
          status: string;
          plan_interval: string;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          provider: string | null;
        }
      | undefined;

    return {
      pro: !!pro,
      status: sub?.status ?? null,
      planInterval: sub?.plan_interval ?? null,
      currentPeriodEnd: sub?.current_period_end ?? null,
      cancelAtPeriodEnd: sub?.cancel_at_period_end ?? false,
      provider: sub?.provider ?? null,
      managed: sub?.provider === "stripe",
    };
  });

export const billingSummaryQuery = (enabled: boolean) =>
  queryOptions({
    queryKey: ["billing", "summary"],
    queryFn: () => getBillingSummary(),
    enabled,
  });

