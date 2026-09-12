import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { isUsernameAvailable, normalizeUsername, validateUsername } from "@/lib/username";
import { supabase } from "@/integrations/supabase/client";
import { progressQuery } from "@/lib/practice.functions";
import {
  billingSummaryQuery,
  createPortalSession,
  syncMySubscription,
} from "@/lib/payments.functions";
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
  const { user, loading, isPro, isStaff, username, refreshProfile, refreshEntitlements } =
    useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: progress } = useQuery(progressQuery(!!user));
  const { data: billing } = useQuery(billingSummaryQuery(!!user));
  const [portalLoading, setPortalLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const openPortal = async () => {
    if (!paymentsConfigured()) {
      toast.error("Billing is not available yet.");
      return;
    }
    setPortalLoading(true);
    try {
      const result = await createPortalSession({
        data: { returnUrl: window.location.href, environment: getStripeEnvironment() },
      });
      if ("error" in result) throw new Error(result.error);
      window.open(result.url, "_blank", "noopener");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open billing.");
    } finally {
      setPortalLoading(false);
    }
  };

  const recheck = async () => {
    setSyncing(true);
    try {
      if (paymentsConfigured()) {
        const result = await syncMySubscription({
          data: { environment: getStripeEnvironment() },
        });
        if (result.error) throw new Error(result.error);
      }
      const pro = await refreshEntitlements();
      await queryClient.invalidateQueries();
      toast.success(pro ? "HVAC Pro is active." : "No active membership found.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not check your membership.");
    } finally {
      setSyncing(false);
    }
  };


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
      <p className="mt-2 text-sm font-medium">{username ?? user.email}</p>
      {username ? <p className="text-xs text-muted-foreground">{user.email}</p> : null}

      {!username ? <UsernameCard onSaved={() => void refreshProfile()} /> : null}


      <div className="mt-8 rounded-lg border bg-card p-5">
        <p className="text-sm font-semibold">Plan</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {isPro ? "HVAC Pro — practice, scenarios and the AI Tutor are unlocked." : "Free — documentation and diagrams."}
        </p>
        {billing && isPro ? (
          <dl className="mt-4 space-y-1 text-sm">
            {billing.planInterval ? (
              <Row
                label="Billing"
                value={billing.planInterval === "annual" ? "$50 per year" : "$5 per month"}
              />
            ) : null}
            {billing.status === "trialing" && billing.currentPeriodEnd ? (
              <Row label="Free trial ends" value={formatDate(billing.currentPeriodEnd)} />
            ) : null}
            {billing.status === "past_due" ? (
              <Row
                label="Payment"
                value="Last payment failed — we're retrying your card. Access continues for now."
              />
            ) : null}
            {billing.currentPeriodEnd && billing.status !== "trialing" ? (
              <Row
                label={
                  billing.cancelAtPeriodEnd || billing.status === "canceled"
                    ? "Access ends"
                    : "Renews"
                }
                value={formatDate(billing.currentPeriodEnd)}
              />
            ) : null}
            {billing.provider === "manual" ? (
              <Row label="Source" value="Granted by an administrator" />
            ) : null}
          </dl>
        ) : null}
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
        {isPro && billing?.managed ? (
          <Button variant="outline" size="sm" disabled={portalLoading} onClick={() => void openPortal()}>
            {portalLoading ? "Opening…" : "Manage billing"}
          </Button>
        ) : null}
        <Button variant="outline" size="sm" disabled={syncing} onClick={() => void recheck()}>
          {syncing ? "Checking…" : "Re-check membership"}
        </Button>
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

function UsernameCard({ onSaved }: { onSaved: () => void }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const name = normalizeUsername(value);
    const problem = validateUsername(name);
    if (problem) {
      toast.error(problem);
      return;
    }
    setBusy(true);
    const available = await isUsernameAvailable(name);
    if (available === false) {
      setBusy(false);
      toast.error("That username is already taken.");
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    const id = userData.user?.id;
    if (!id) {
      setBusy(false);
      return;
    }
    const { error } = await supabase.from("profiles").update({ username: name }).eq("id", id);
    setBusy(false);
    if (error) {
      toast.error(
        error.code === "23505" ? "That username is already taken." : "Could not save your username.",
      );
      return;
    }
    toast.success("Username saved.");
    onSaved();
  };

  return (
    <div className="mt-6 rounded-lg border bg-card p-5">
      <p className="text-sm font-semibold">Choose your username</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Your username becomes your visible identity across Welcome to HVAC. It can only be set once.
      </p>
      <div className="mt-4 space-y-1.5">
        <Label htmlFor="account-username">Username</Label>
        <Input
          id="account-username"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="username"
        />
        <p className="text-xs text-muted-foreground">
          3–24 characters. Letters, numbers, hyphens and underscores.
        </p>
      </div>
      <Button size="sm" className="mt-4" disabled={busy} onClick={() => void save()}>
        {busy ? "Saving…" : "Save username"}
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
