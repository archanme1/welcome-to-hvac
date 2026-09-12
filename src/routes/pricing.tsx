import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ProCheckout } from "@/components/payments/pro-checkout";
import { PaymentTestModeBanner } from "@/components/payments/test-mode-banner";
import { PRICE_MONTHLY, PRICE_YEARLY, paymentsConfigured } from "@/lib/stripe";

const DESC =
  "HVAC Pro is $5/month or $50/year — two months free on the annual plan. Includes practice, scenarios, quizzes, progress tracking and the AI Tutor.";

const FREE = [
  "All documentation and field reference",
  "Diagrams and basic visualizations",
  "Full search and command palette",
  "Symptom-based troubleshooting guides",
  "Dark mode and mobile reading",
];

const PRO = [
  "AI Tutor grounded in every topic",
  "Practice questions with explanations",
  "Quizzes by topic and difficulty",
  "Interactive troubleshooting scenarios",
  "Equipment scenarios and advanced interactions",
  "Progress tracking across the knowledge base",
];

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "HVAC Pro Pricing — Welcome to HVAC" },
      { name: "description", content: DESC },
      { property: "og:title", content: "HVAC Pro Pricing — Welcome to HVAC" },
      { property: "og:description", content: DESC },
    ],
  }),
  component: Page,
});

function Page() {
  const { user, isPro } = useAuth();
  const [plan, setPlan] = useState<"monthly" | "yearly" | null>(null);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:py-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">HVAC Pro</h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
        The documentation is free, forever. HVAC Pro adds the parts that build real skill:
        practice, scenarios and a tutor that knows the page you're on.
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Free
          </p>
          <p className="mt-3 text-3xl font-bold">$0</p>
          <ul className="mt-5 space-y-2">
            {FREE.map((f) => (
              <li key={f} className="flex gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                {f}
              </li>
            ))}
          </ul>
          <Button asChild variant="outline" className="mt-6 w-full">
            <Link to="/equipment">Browse the reference</Link>
          </Button>
        </div>

        <div className="rounded-xl border-2 border-foreground/20 bg-card p-6">
          <p className="text-sm font-semibold uppercase tracking-wide">HVAC Pro</p>
          <div className="mt-3 flex flex-wrap items-baseline gap-2">
            <p className="text-3xl font-bold">$5</p>
            <span className="text-sm text-muted-foreground">/ month</span>
            <span className="text-sm text-muted-foreground">or</span>
            <p className="text-3xl font-bold">$50</p>
            <span className="text-sm text-muted-foreground">/ year</span>
          </div>
          <p className="mt-2 text-sm font-medium">
            The annual plan saves you $10 a year — two months free.
          </p>
          <ul className="mt-5 space-y-2">
            {PRO.map((f) => (
              <li key={f} className="flex gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          {isPro ? (
            <p className="mt-6 rounded-md border bg-muted/40 px-3 py-2 text-sm">
              You have HVAC Pro. Everything is unlocked.
            </p>
          ) : !user ? (
            <div className="mt-6 space-y-2">
              <Button asChild className="w-full">
                <Link to="/auth" search={{ next: "/pricing" }}>Create an account to subscribe</Link>
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Your account keeps your progress and unlocks Pro the moment you subscribe.
              </p>
            </div>
          ) : !paymentsConfigured() ? (
            <p className="mt-6 rounded-md border bg-muted/40 px-3 py-2 text-sm">
              Checkout is being finalised. Please check back shortly.
            </p>
          ) : (
            <div className="mt-6 space-y-2">
              <Button className="w-full" onClick={() => setPlan("monthly")}>
                Subscribe monthly — $5
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setPlan("yearly")}>
                Subscribe yearly — $50 (save $10)
              </Button>
            </div>
          )}
        </div>
      </div>

      {plan ? (
        <div className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">
              Checkout — {plan === "monthly" ? "$5 per month" : "$50 per year"}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setPlan(null)}>
              Cancel
            </Button>
          </div>
          <div className="mt-3">
            <PaymentTestModeBanner />
          </div>
          <ProCheckout
            key={plan}
            priceId={plan === "monthly" ? PRICE_MONTHLY : PRICE_YEARLY}
            returnUrl={`${typeof window === "undefined" ? "" : window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
          />
        </div>
      ) : null}

      <p className="mt-10 text-xs leading-5 text-muted-foreground">
        Expert Help is not part of HVAC Pro today. It is coming soon as a separate feature.
      </p>
    </div>
  );
}
