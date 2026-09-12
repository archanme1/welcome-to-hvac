import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { syncMySubscription } from "@/lib/payments.functions";
import { getStripeEnvironment, paymentsConfigured } from "@/lib/stripe";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } =>
    typeof search["session_id"] === "string" ? { session_id: search["session_id"] } : {},
  head: () => ({
    meta: [
      { title: "Checkout complete — Welcome to HVAC" },
      { name: "description", content: "Your HVAC Pro subscription is being confirmed." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  const { session_id: sessionId } = Route.useSearch();
  const { isPro, refreshEntitlements } = useAuth();
  const queryClient = useQueryClient();
  const [checking, setChecking] = useState(!!sessionId);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    const confirm = async () => {
      // The provider normally tells us within a second or two. Poll briefly,
      // then ask the provider directly if the notification never arrived.
      for (let attempt = 0; attempt < 6 && !cancelled; attempt += 1) {
        if (await refreshEntitlements()) break;
        if (attempt === 3 && paymentsConfigured()) {
          try {
            await syncMySubscription({ data: { environment: getStripeEnvironment() } });
          } catch {
            /* fall through to the next poll */
          }
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
      if (cancelled) return;
      await refreshEntitlements();
      void queryClient.invalidateQueries();
      setChecking(false);
    };

    void confirm();
    return () => {
      cancelled = true;
    };
  }, [sessionId, refreshEntitlements, queryClient]);

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16 text-center sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">
        {sessionId ? "Thank you — you're all set" : "Nothing to confirm"}
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {!sessionId
          ? "We could not find a completed checkout for this visit."
          : isPro
            ? "HVAC Pro is active. Practice, scenarios and the AI Tutor are unlocked."
            : checking
              ? "Confirming your payment…"
              : "Your payment went through. HVAC Pro can take a moment to switch on — open your account page and choose Re-check membership if it still looks locked."}
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Button asChild>
          <Link to="/practice">Start practising</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/account">Your account</Link>
        </Button>
      </div>
    </div>
  );
}
