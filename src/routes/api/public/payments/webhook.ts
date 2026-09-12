import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

// Typed loosely on purpose: the service-role client writes rows the generated
// database types do not model with the columns this webhook fills in.
let _supabase: any = null;
function getSupabase(): any {
  if (!_supabase) {
    _supabase = createClient(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
    );
  }
  return _supabase;
}

/** The app only stores the statuses its entitlement check understands. */
function mapStatus(status: string): string {
  switch (status) {
    case "active":
    case "trialing":
    case "past_due":
    case "canceled":
      return status;
    default:
      return "canceled";
  }
}

function mapInterval(interval: string | undefined): string {
  return interval === "year" ? "annual" : "monthly";
}

function isoFromUnix(seconds: number | null | undefined): string | null {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

async function upsertSubscription(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  const item = subscription.items?.data?.[0];
  const priceId =
    item?.price?.lookup_key || item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  const row = {
    status: mapStatus(subscription.status),
    plan_interval: mapInterval(item?.price?.recurring?.interval),
    price_id: priceId ?? null,
    provider: "stripe",
    provider_customer_id:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id,
    provider_subscription_id: subscription.id,
    current_period_start: isoFromUnix(periodStart),
    current_period_end: isoFromUnix(periodEnd),
    cancel_at_period_end: subscription.cancel_at_period_end ?? false,
    environment: env,
    updated_at: new Date().toISOString(),
  };

  const existing = await getSupabase()
    .from("subscriptions")
    .select("id")
    .eq("provider_subscription_id", subscription.id)
    .maybeSingle();

  if (existing.data?.["id"]) {
    await getSupabase().from("subscriptions").update(row).eq("id", existing.data["id"]);
    return;
  }

  if (!userId) {
    console.error("No userId in subscription metadata", subscription.id);
    return;
  }
  await getSupabase()
    .from("subscriptions")
    .insert({ ...row, user_id: userId });
}

async function cancelSubscription(subscription: any, env: StripeEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("provider_subscription_id", subscription.id)
    .eq("environment", env);
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await upsertSubscription(event.data.object, env);
      break;
    case "customer.subscription.deleted":
      await cancelSubscription(event.data.object, env);
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("Webhook received with invalid env:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
