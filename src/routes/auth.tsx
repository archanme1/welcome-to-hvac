import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { isUsernameAvailable, normalizeUsername, validateUsername } from "@/lib/username";

const DESC = "Sign in to Welcome to HVAC to track progress and unlock HVAC Pro.";

// Google sign-in stays configured but hidden for now.
const SHOW_GOOGLE_SIGN_IN = false;

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { next?: string } =>
    typeof search["next"] === "string" ? { next: search["next"] } : {},
  head: () => ({
    meta: [
      { title: "Sign in — Welcome to HVAC" },
      { name: "description", content: DESC },
      { property: "og:title", content: "Sign in — Welcome to HVAC" },
      { property: "og:description", content: DESC },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function safePath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function Page() {
  const { next } = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"credentials" | "forgot">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [usernameNote, setUsernameNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const destination = safePath(next);

  useEffect(() => {
    if (!loading && user) {
      window.location.replace(destination);
    }
  }, [loading, user, destination]);

  useEffect(() => {
    const value = normalizeUsername(username);
    if (!value) {
      setUsernameNote(null);
      return;
    }
    const problem = validateUsername(value);
    if (problem) {
      setUsernameNote({ ok: false, text: problem });
      return;
    }
    let active = true;
    const timer = window.setTimeout(async () => {
      const available = await isUsernameAvailable(value);
      if (!active || available === null) return;
      setUsernameNote(
        available
          ? { ok: true, text: `${value} is available.` }
          : { ok: false, text: "That username is already taken." },
      );
    }, 350);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [username]);

  const signIn = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    void navigate({ to: destination as string });
  };

  const signUp = async () => {
    const name = normalizeUsername(username);
    const problem = validateUsername(name);
    if (problem) {
      toast.error(problem);
      return;
    }
    if (password.length < 8) {
      toast.error("Use at least 8 characters for your password.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("The two passwords do not match.");
      return;
    }
    setBusy(true);
    const available = await isUsernameAvailable(name);
    if (available === false) {
      setBusy(false);
      setUsernameNote({ ok: false, text: "That username is already taken." });
      toast.error("That username is already taken.");
      return;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${destination}`,
        data: { username: name, display_name: name },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created. Check your email if confirmation is required.");
  };

  const sendReset = async () => {
    const address = resetEmail.trim();
    if (!address) {
      toast.error("Enter your email address.");
      return;
    }
    setBusy(true);
    await supabase.auth.resetPasswordForEmail(address, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    setResetSent(true);
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth${next ? `?next=${encodeURIComponent(destination)}` : ""}`,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: destination as string });
  };

  if (mode === "forgot") {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
        {resetSent ? (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              If an account exists for that address, we have sent a password reset link. It expires
              after a short time and can only be used once. Check your spam folder if it does not
              arrive.
            </p>
            <Button
              variant="outline"
              className="mt-6 w-full"
              onClick={() => {
                setResetSent(false);
                setMode("credentials");
              }}
            >
              Back to sign in
            </Button>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              Enter your email address and we will send you a secure link to set a new password.
            </p>
            <div className="mt-6 space-y-1.5">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                autoComplete="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>
            <Button className="mt-4 w-full" disabled={busy} onClick={() => void sendReset()}>
              {busy ? "Sending…" : "Send reset link"}
            </Button>
            <Button
              variant="ghost"
              className="mt-2 w-full"
              onClick={() => setMode("credentials")}
              disabled={busy}
            >
              Back to sign in
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Welcome to HVAC</h1>
      <p className="mt-2 text-sm text-muted-foreground">{DESC}</p>

      {SHOW_GOOGLE_SIGN_IN ? (
        <>
          <Button variant="outline" className="mt-6 w-full" onClick={() => void google()}>
            Continue with Google
          </Button>
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
        </>
      ) : (
        <div className="mt-6" />
      )}

      <Tabs defaultValue="signin">
        <TabsList className="w-full">
          <TabsTrigger value="signin" className="flex-1">
            Sign in
          </TabsTrigger>
          <TabsTrigger value="signup" className="flex-1">
            Create account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="signin">
          <div className="mt-5 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>
          <Button className="mt-4 w-full" disabled={busy} onClick={() => void signIn()}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
          <button
            type="button"
            className="mt-3 w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => {
              setResetEmail(email);
              setMode("forgot");
            }}
          >
            Forgot password?
          </button>
        </TabsContent>

        <TabsContent value="signup">
          <div className="mt-5 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="signup-username">Username</Label>
              <Input
                id="signup-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="e.g. cool_tech-42"
              />
              <p
                className={`text-xs ${usernameNote && !usernameNote.ok ? "text-destructive" : "text-muted-foreground"}`}
              >
                {usernameNote
                  ? usernameNote.text
                  : "3–24 characters. Letters, numbers, hyphens and underscores."}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signup-password">Password</Label>
              <PasswordInput
                id="signup-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signup-confirm">Confirm password</Label>
              <PasswordInput
                id="signup-confirm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>
          <Button className="mt-4 w-full" disabled={busy} onClick={() => void signUp()}>
            {busy ? "Creating account…" : "Create account"}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
