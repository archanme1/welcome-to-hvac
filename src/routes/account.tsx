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
  cancelMySubscription,
  createPortalSession,
  resumeMySubscription,
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
  const { data: billing } = useQuery(
    billingSummaryQuery(!!user, paymentsConfigured() ? getStripeEnvironment() : undefined),
  );
  const [portalLoading, setPortalLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const cancelMembership = async () => {
    setCancelBusy(true);
    try {
      const result = await cancelMySubscription({
        data: { environment: getStripeEnvironment() },
      });
      if ("error" in result) throw new Error(result.error);
      await refreshEntitlements();
      await queryClient.invalidateQueries({ queryKey: ["billing"] });
      setConfirmingCancel(false);
      toast.success(
        result.accessUntil
          ? `Cancelled. You keep HVAC Pro until ${formatDate(result.accessUntil)}.`
          : "Your membership has been cancelled.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not cancel your membership.");
    } finally {
      setCancelBusy(false);
    }
  };

  const resumeMembership = async () => {
    setCancelBusy(true);
    try {
      const result = await resumeMySubscription({
        data: { environment: getStripeEnvironment() },
      });
      if ("error" in result) throw new Error(result.error);
      await refreshEntitlements();
      await queryClient.invalidateQueries({ queryKey: ["billing"] });
      toast.success("Your HVAC Pro membership is active again.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not resume your membership.");
    } finally {
      setCancelBusy(false);
    }
  };

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
          <table className="mt-4 w-full text-sm">
            <tbody className="divide-y divide-border">
              <Row label="Plan" value="HVAC Pro" />
              {billing.planInterval ? (
                <>
                  <Row
                    label="Price"
                    value={billing.planInterval === "annual" ? "$50.00" : "$5.00"}
                  />
                  <Row
                    label="Billing period"
                    value={billing.planInterval === "annual" ? "Yearly" : "Monthly"}
                  />
                </>
              ) : null}
              <Row label="Status" value={statusLabel(billing.status, billing.cancelAtPeriodEnd)} />
              {billing.status === "trialing" && billing.currentPeriodEnd ? (
                <Row label="Free trial ends" value={formatDate(billing.currentPeriodEnd)} />
              ) : null}
              {billing.currentPeriodEnd && billing.status !== "trialing" ? (
                <Row
                  label={
                    billing.cancelAtPeriodEnd || billing.status === "canceled"
                      ? "Access ends"
                      : "Next renewal"
                  }
                  value={formatDate(billing.currentPeriodEnd)}
                />
              ) : null}
              {billing.paymentMethod ? (
                <Row
                  label="Payment method"
                  value={`${capitalize(billing.paymentMethod.brand)} ending ${billing.paymentMethod.last4}`}
                />
              ) : null}
              {billing.provider === "manual" ? (
                <Row label="Source" value="Granted by an administrator" />
              ) : null}
            </tbody>
          </table>
        ) : null}

        {billing && isPro && billing.payments.length ? (
          <div className="mt-6">
            <p className="text-sm font-semibold">Payment history</p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Description</th>
                    <th className="pb-2 text-right font-medium">Amount</th>
                    <th className="pb-2 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {billing.payments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2 whitespace-nowrap">{formatDate(p.date)}</td>
                      <td className="py-2">{p.description}</td>
                      <td className="py-2 text-right">
                        {new Intl.NumberFormat(undefined, {
                          style: "currency",
                          currency: (p.currency || "usd").toUpperCase(),
                        }).format(p.amount)}
                      </td>
                      <td className="py-2 text-right">{capitalize(p.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
        {isPro && billing?.managed ? (
          billing.cancelAtPeriodEnd || billing.status === "canceled" ? (
            <Button
              variant="outline"
              size="sm"
              disabled={cancelBusy}
              onClick={() => void resumeMembership()}
            >
              {cancelBusy ? "Working…" : "Resume membership"}
            </Button>
          ) : confirmingCancel ? (
            <>
              <Button
                variant="destructive"
                size="sm"
                disabled={cancelBusy}
                onClick={() => void cancelMembership()}
              >
                {cancelBusy ? "Cancelling…" : "Confirm cancellation"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={cancelBusy}
                onClick={() => setConfirmingCancel(false)}
              >
                Keep membership
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setConfirmingCancel(true)}>
              Cancel membership
            </Button>
          )
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
    <tr>
      <td className="py-2 pr-4 text-muted-foreground">{label}</td>
      <td className="py-2 text-right font-medium">{value}</td>
    </tr>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function statusLabel(status: string | null, cancelAtPeriodEnd: boolean): string {
  if (status === "trialing") return "Free trial";
  if (status === "past_due") return "Payment retrying";
  if (status === "canceled") return "Cancelled — access until period end";
  if (status === "active") return cancelAtPeriodEnd ? "Cancels at period end" : "Active";
  return "Active";
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
