import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

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
  const { isPro } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    void queryClient.invalidateQueries();
  }, [queryClient]);

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16 text-center sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">
        {sessionId ? "Thank you — you're all set" : "Nothing to confirm"}
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {sessionId
          ? isPro
            ? "HVAC Pro is active. Practice, scenarios and the AI Tutor are unlocked."
            : "Your payment went through. It can take a few seconds for HVAC Pro to switch on — refresh this page if it still looks locked."
          : "We could not find a completed checkout for this visit."}
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
