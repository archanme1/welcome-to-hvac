import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { progressQuery } from "@/lib/practice.functions";
import { createPortalSession } from "@/lib/payments.functions";
import { getStripeEnvironment, paymentsConfigured } from "@/lib/stripe";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Your account — Welcome to HVAC" },
      { name: "description", content: "Manage your Welcome to HVAC account and HVAC Pro plan." },
      { property: "og:title", content: "Your account — Welcome to HVAC" },
      {
        property: "og:description",
        content: "Manage your Welcome to HVAC account and HVAC Pro plan.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  const { user, loading, isPro, isStaff } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: progress } = useQuery(progressQuery(!!user));

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth", search: { next: "/account" } });
  }, [loading, user, navigate]);

  if (!user) return null;

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Your account</h1>
      <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>

      <div className="mt-8 rounded-lg border bg-card p-5">
        <p className="text-sm font-semibold">Plan</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {isPro ? "HVAC Pro — practice, scenarios and the AI Tutor are unlocked." : "Free — documentation and diagrams."}
        </p>
        {!isPro ? (
          <Button asChild size="sm" className="mt-4">
            <Link to="/pricing">Upgrade to HVAC Pro</Link>
          </Button>
        ) : null}
      </div>

      {progress ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Topics read" value={progress.topicsViewed} />
          <Stat label="Answered" value={progress.questionsAnswered} />
          <Stat label="Correct" value={progress.correct} />
          <Stat label="Accuracy" value={`${progress.accuracy}%`} />
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-2">
        {isPro ? (
          <Button variant="outline" size="sm" disabled={portalLoading} onClick={() => void openPortal()}>
            {portalLoading ? "Opening…" : "Manage billing"}
          </Button>
        ) : null}
        {isStaff ? (
          <Button asChild variant="outline" size="sm">
            <Link to="/admin">Admin</Link>
          </Button>
        ) : null}
        <Button variant="outline" size="sm" onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
