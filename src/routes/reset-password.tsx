import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { supabase } from "@/integrations/supabase/client";

const DESC = "Choose a new password for your Welcome to HVAC account.";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — Welcome to HVAC" },
      { name: "description", content: DESC },
      { property: "og:title", content: "Reset your password — Welcome to HVAC" },
      { property: "og:description", content: DESC },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

type State = "checking" | "ready" | "invalid" | "done";

function Page() {
  const navigate = useNavigate();
  const [state, setState] = useState<State>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendEmail, setResendEmail] = useState("");

  useEffect(() => {
    let active = true;

    const hash = typeof window === "undefined" ? "" : window.location.hash;
    if (hash.includes("error")) {
      setState("invalid");
      return;
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || session) setState("ready");
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setState((current) =>
        current === "checking" ? (data.session ? "ready" : "invalid") : current,
      );
    });

    const timer = window.setTimeout(() => {
      if (active) setState((current) => (current === "checking" ? "invalid" : current));
    }, 4000);

    return () => {
      active = false;
      window.clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, []);

  const submit = async () => {
    if (password.length < 8) {
      toast.error("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("The two passwords do not match.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setState("done");
    toast.success("Your password has been updated.");
  };

  const resend = async () => {
    setBusy(true);
    await supabase.auth.resetPasswordForEmail(resendEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    toast.success("If that address has an account, a new reset link is on its way.");
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>

      {state === "checking" ? (
        <p className="mt-3 text-sm text-muted-foreground">Checking your reset link…</p>
      ) : null}

      {state === "invalid" ? (
        <div className="mt-3 space-y-4">
          <p className="text-sm text-muted-foreground">
            This reset link is invalid or has expired. Reset links can only be used once and are
            valid for a short time. Enter your email address to get a new one.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="resend-email">Email</Label>
            <Input
              id="resend-email"
              type="email"
              autoComplete="email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
            />
          </div>
          <Button className="w-full" disabled={busy} onClick={() => void resend()}>
            {busy ? "Sending…" : "Send a new link"}
          </Button>
        </div>
      ) : null}

      {state === "ready" ? (
        <div className="mt-3 space-y-4">
          <p className="text-sm text-muted-foreground">{DESC}</p>
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New password</Label>
            <PasswordInput
              id="new-password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <PasswordInput
              id="confirm-password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <Button className="w-full" disabled={busy} onClick={() => void submit()}>
            {busy ? "Saving…" : "Save new password"}
          </Button>
        </div>
      ) : null}

      {state === "done" ? (
        <div className="mt-3 space-y-4">
          <p className="text-sm text-muted-foreground">
            Your password has been updated and you are signed in.
          </p>
          <Button className="w-full" onClick={() => void navigate({ to: "/" })}>
            Continue to Welcome to HVAC
          </Button>
        </div>
      ) : null}
    </div>
  );
}
