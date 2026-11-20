import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { UPGRADE_MESSAGE } from "@/lib/marketplace/shared";

export function UpgradeNotice({ message = UPGRADE_MESSAGE }: { message?: string }) {
  const { user } = useAuth();
  return (
    <div className="rounded-xl border bg-card p-6 text-center">
      <Lock className="mx-auto h-5 w-5 text-muted-foreground" />
      <p className="mx-auto mt-3 max-w-md text-sm leading-6">{message}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Button asChild size="sm"><Link to="/pricing">See HVAC Pro</Link></Button>
        {!user ? <Button asChild size="sm" variant="outline"><Link to="/auth">Sign in</Link></Button> : null}
      </div>
    </div>
  );
}

/** Renders children only for active Pro members. The database enforces the same rule. */
export function ProOnly({ children, message }: { children: React.ReactNode; message?: string }) {
  const { loading, isPro } = useAuth();
  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!isPro) return <UpgradeNotice {...(message ? { message } : {})} />;
  return <>{children}</>;
}
